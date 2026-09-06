"""Check actual browser geometry against the PDF. Run after web/smoke.mjs.

uv run --with shapely python tests/test_layout.py
"""
import json
import math
from pathlib import Path
import subprocess
from shapely.geometry import Polygon
from shapely.ops import unary_union

root = Path(__file__).resolve().parents[1]
plan_url = (root / 'web/src/plan.ts').as_uri()
plan = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', f'import * as p from {plan_url!r};console.log(JSON.stringify(p))']))
report = json.loads((root / 'output/layout.json').read_text())
fixtures = report['fixtures']
scale = math.sqrt(157.25 / Polygon(plan['outline']).area)
walls = unary_union([Polygon(p) for p in plan['wallPolygons']])
# One connected wall network once the intentional openings are included.
network = unary_union([walls] + [Polygon(p['outline']) for p in plan['doors'] + plan['windows']]).buffer(.001 / scale)
assert network.geom_type == 'Polygon', 'Disconnected wall junction'
errors = []
contacts = 0
chairs = 0
for f in fixtures:
    footprint = Polygon(f['footprint'])
    room = Polygon(plan['roomOutlines'][f['room']]).buffer(.01 / scale)
    outside = footprint.difference(room).area * scale**2
    if outside > .001:
        errors.append(f"{f['name']}: {outside:.4f} m² outside its room")
    for part in f['parts']:
        overlap = Polygon(part['footprint']).intersection(walls).area * scale**2
        if overlap > .0001:
            errors.append(f"{f['name']}: wall collision ({overlap:.4f} m²)")
            break
    if 'wallReference' in f:
        contacts += 1
        a, b = f['wallReference']
        dx, dz = b[0]-a[0], b[1]-a[1]
        length = math.hypot(dx, dz)
        distances = [abs((p[0]-a[0])*dz - (p[1]-a[1])*dx)/length*scale for p in f['footprint']]
        if min(distances) > .004:
            errors.append(f"{f['name']}: rear is {min(distances)*1000:.1f} mm from wall")
    if 'faces' in f:
        chairs += 1
        dx, dz = f['faces'][0]-f['center'][0], f['faces'][1]-f['center'][1]
        alignment = (dx*f['front'][0] + dz*f['front'][1])/math.hypot(dx,dz)
        if alignment < .999:
            errors.append(f"{f['name']}: chair faces away from its table")
    # Cabinet fronts must sit in front of the carcass, not on the same face.
    if f['name'].startswith('Küchenzeile'):
        carcass = f['parts'][0]
        fronts = [p for p in f['parts'][2:] if .70 < p['max'][1]-p['min'][1] < .74]
        assert fronts, 'No kitchen cabinet fronts were checked'
        for front in fronts:
            if front['max'][2] - carcass['max'][2] < .02:
                errors.append(f"{f['name']}: coplanar cabinet front")
# Test real component bounds at overlapping heights, rather than treating the
# whole footprint of a table, its vase and its handles as one solid obstacle.
for i, f in enumerate(fixtures):
    for g in fixtures[i+1:]:
        if not Polygon(f['footprint']).intersects(Polygon(g['footprint'])):
            continue
        found = False
        for a in f['parts']:
            for b in g['parts']:
                height = min(a['max'][1], b['max'][1]) - max(a['min'][1], b['min'][1])
                if height <= .002:
                    continue
                area = Polygon(a['footprint']).intersection(Polygon(b['footprint'])).area * scale**2
                if area > .0001:
                    errors.append(f"{f['name']} intersects {g['name']}")
                    found = True
                    break
            if found:
                break
for door in report['doorLeaves']:
    p = Polygon(door['footprint'])
    if p.intersection(walls).area * scale**2 > .0001:
        errors.append(f"{door['name']}: open leaf intersects wall")
    for f in fixtures:
        if p.intersection(Polygon(f['footprint'])).area * scale**2 > .0001:
            errors.append(f"{door['name']}: open leaf intersects {f['name']}")
for opening in plan['doors']:
    for f in fixtures:
        if Polygon(opening['outline']).intersection(Polygon(f['footprint'])).area * scale**2 > .001:
            errors.append(f"{f['name']}: blocks doorway {opening['id']}")
assert contacts >= 18, 'Missing wall attachment checks'
assert chairs == 8, 'Missing chair direction checks'
assert not errors, '\n'.join(errors)
print(f'Layout passed: {len(fixtures)} fixtures, {contacts} wall contacts, {chairs} chairs, {len(report["doorLeaves"])} doors; no wall/furniture collisions or coplanar kitchen fronts.')
