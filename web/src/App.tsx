import { useCallback, useRef, useState } from 'react'
import { HouseScene, type SceneActions, type ViewMode } from './HouseScene'
import { places } from './house'

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    house: <><path d="m3 10 9-7 9 7v10H3Z"/><path d="M9 20v-7h6v7M2 10l10-8 10 8"/></>,
    plan: <path d="M3 3h18v18H3zM3 12h10V3m0 9v9m0-6h8"/>,
    leaf: <><path d="M20 3C9 1 2 7 5 15c7 6 16 0 15-12Z"/><path d="M4 21 15 9M9 16v-6m0 6h6"/></>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></>,
    reset: <path d="M4 10a8 8 0 1 1 1 7M4 4v6h6"/>,
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>,
    chevron: <path d="m9 5 7 7-7 7"/>,
    eye: <><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export function App() {
  const [placeId, setPlaceId] = useState('garten')
  const [mode, setMode] = useState<ViewMode>('outside')
  const [ready, setReady] = useState(false)
  const [tour, setTour] = useState(false)
  const actions = useRef<SceneActions | null>(null)
  const viewer = useRef<HTMLElement>(null)
  const place = places.find(p => p.id === placeId)!
  const choose = useCallback((id: string) => {
    const p = places.find(p => p.id === id)!
    const next = p.inside ? 'inside' : 'outside'
    setPlaceId(id)
    setMode(next)
    actions.current?.go(p, next)
  }, [])
  const onReady = useCallback((value: SceneActions) => {
    actions.current = value
    setReady(true)
  }, [])
  const setView = (next: ViewMode) => {
    if (next === 'inside') choose('wohnen')
    else {
      setMode(next)
      setPlaceId('garten')
      actions.current?.go(places[0], next)
    }
  }
  const tourStops = ['garten', 'terrasse', 'wohnen', 'kueche', 'schlafen', 'bad', 'eingang', 'arbeiten', 'gast']
  const stop = Math.max(0, tourStops.indexOf(placeId))
  const next = () => {
    if (stop === tourStops.length - 1) {
      setTour(false)
      choose('garten')
    } else choose(tourStops[stop + 1])
  }

  return <main className="workspace">
    <aside className="sidebar">
      <h1>Äckerchenhaus</h1>
      <nav className="room-list" aria-label="Orte im Haus">
        {places.map(p => <button disabled={!ready} key={p.id} className={placeId === p.id && mode !== 'plan' ? 'room active' : 'room'} aria-current={placeId === p.id && mode !== 'plan' ? 'location' : undefined} onClick={() => { setTour(false); choose(p.id) }}>
          <Icon name={p.id === 'garten' ? 'leaf' : p.id === 'terrasse' ? 'sun' : 'house'} size={18}/>
          <span>{p.short}</span><Icon name="chevron" size={15}/>
        </button>)}
      </nav>
      <button disabled={!ready} className="tour-start" onClick={() => { setTour(true); choose('terrasse') }}>Rundgang starten<Icon name="arrow"/></button>
    </aside>
    <section className="viewer" ref={viewer} aria-label="Hausbesichtigung">
      <HouseScene onReady={onReady} onChoose={choose}/>
      <div className="viewer-top">
        <div className="view-tabs" role="group" aria-label="Ansicht wählen">
          <button disabled={!ready} aria-pressed={mode === 'outside'} onClick={() => setView('outside')}><Icon name="leaf" size={17}/><span>Von außen</span></button>
          <button disabled={!ready} aria-pressed={mode === 'inside'} onClick={() => setView('inside')}><Icon name="eye" size={18}/><span>Im Haus</span></button>
          <button disabled={!ready} aria-pressed={mode === 'plan'} onClick={() => setView('plan')}><Icon name="plan" size={17}/><span>Von oben</span></button>
        </div>
        <button className="icon-button fullscreen" aria-label="Vollbild umschalten" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void viewer.current?.requestFullscreen?.().catch(() => {}) }}><Icon name="expand"/></button>
      </div>
      {!ready && <div className="loading" role="status">Das Haus wird geladen …</div>}
      <div className="viewer-bottom">
        <div className="view-caption" aria-live="polite"><h2>{mode === 'plan' ? 'Von oben' : place.short}</h2>{mode !== 'plan' && place.area && <span>{place.area}</span>}</div>
        <div className="controls" aria-label="Kamera steuern">
          <button aria-label="Nach links schauen" onClick={() => actions.current?.turn(1)}>←</button>
          <button aria-label="Nach rechts schauen" onClick={() => actions.current?.turn(-1)}>→</button><span/>
          {mode !== 'inside' && placeId !== 'terrasse' && <><button aria-label="Vergrößern" onClick={() => actions.current?.zoom(1)}>+</button><button aria-label="Verkleinern" onClick={() => actions.current?.zoom(-1)}>−</button><span/></>}
          <button aria-label="Ansicht zurücksetzen" onClick={() => actions.current?.reset()}><Icon name="reset" size={18}/></button>
        </div>
      </div>
      {tour && <div className="tour-bar"><button onClick={() => choose(tourStops[Math.max(0, stop - 1)])} disabled={stop === 0} aria-label="Vorheriger Ort">←</button><span>Rundgang <b>{stop + 1} / {tourStops.length}</b></span><button onClick={next}>{stop === tourStops.length - 1 ? 'Abschließen' : 'Weiter'}<Icon name="arrow" size={17}/></button><button onClick={() => setTour(false)} aria-label="Rundgang beenden"><Icon name="close" size={17}/></button></div>}
    </section>
  </main>
}
