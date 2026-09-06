import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'
import { fileURLToPath } from 'node:url'

const output = new URL('../output/browser/', import.meta.url)
await mkdir(output, { recursive: true })
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
})
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()) })
  await page.goto(process.env.TEST_URL || 'http://localhost:5173')
  await page.waitForFunction(() => !!window.houseActions)
  const report = await page.evaluate(() => window.houseActions.inspect())
  await writeFile(new URL('../layout.json', output), JSON.stringify(report))
  const root = fileURLToPath(new URL('../', import.meta.url))
  console.log(execFileSync('uv', ['run', '--with', 'shapely', 'python', 'tests/test_layout.py'], { cwd: root, encoding: 'utf8' }))
  await page.screenshot({ path: fileURLToPath(new URL('garten.png', output)) })
  for (const name of ['Terrasse', 'Wohnen', 'Küche', 'Schlafen', 'Arbeiten', 'Gast', 'Bad', 'Eingang', 'Gästebad', 'Hauswirtschaft', 'Vorräte']) {
    await page.getByRole('navigation', { name: 'Orte im Haus' }).getByRole('button', { name, exact: true }).click()
    await page.waitForTimeout(250)
    assert.equal(await page.locator('.room.active').textContent(), name)
    await page.screenshot({ path: fileURLToPath(new URL(`${name}.png`, output)) })
  }
  await page.getByRole('button', { name: 'Von oben', exact: true }).click()
  await page.waitForTimeout(250)
  assert.equal(await page.getByRole('button', { name: 'Von oben', exact: true }).getAttribute('aria-pressed'), 'true')
  await page.screenshot({ path: fileURLToPath(new URL('oben.png', output)) })
  await page.getByRole('button', { name: 'Rundgang starten', exact: true }).click()
  await page.getByRole('button', { name: 'Weiter', exact: true }).click()
  assert.equal(await page.locator('.room.active').textContent(), 'Wohnen')
  await page.getByRole('button', { name: 'Rundgang beenden', exact: true }).click()
  await page.getByRole('button', { name: 'Von außen', exact: true }).click()
  await page.setViewportSize({ width: 390, height: 844 })
  await page.waitForTimeout(250)
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'No horizontal page overflow')
  await page.screenshot({ path: fileURLToPath(new URL('mobil.png', output)), fullPage: true })
  const base64 = await page.evaluate(async () => {
    const data = new Uint8Array(await window.houseActions.exportModel())
    let binary = ''
    for (let i = 0; i < data.length; i += 8192) binary += String.fromCharCode(...data.subarray(i, i + 8192))
    return btoa(binary)
  })
  const glb = Buffer.from(base64, 'base64')
  assert.equal(glb.subarray(0, 4).toString(), 'glTF')
  await writeFile(new URL('../haus.glb', output), glb)
  assert.deepEqual(errors, [], 'No browser or WebGL errors')
  console.log(`Browser passed: all rooms, roof, navigation, tour, mobile, GLB export (${Math.round(glb.length / 1024 / 1024)} MB).`)
} finally { await browser.close() }
