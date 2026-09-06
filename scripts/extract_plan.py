"""Extract reviewed wall and opening polygons from the architect's vector PDF.

Run: uv run --with shapely python scripts/extract_plan.py
Requires pdftocairo. Indices refer to paths in the supplied, unchanged PDF.
The browser consumes the generated TypeScript; no PDF parser runs in production.
"""
from pathlib import Path
import json
import re
import subprocess
import tempfile
import xml.etree.ElementTree as ET
from shapely.geometry import Polygon
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory() as temp:
    svg = Path(temp) / 'plan.svg'
    subprocess.run(['pdftocairo', '-svg', str(ROOT / 'Buko Bungalow_GR.pdf'), str(svg)], check=True)
    paths = ET.parse(svg).getroot().findall('{http://www.w3.org/2000/svg}path')

FACTOR = 1800 / 841.89

def polygon(index):
    path = paths[index]
    assert path.get('transform') is None
    assert not re.search('[CHQVSA]', path.get('d'))
    numbers = list(map(float, re.findall(r'-?\d+\.?\d*', path.get('d'))))
    return list(zip(numbers[::2], numbers[1::2]))[:-1]

def scaled(points):
    return [[round(x * FACTOR, 6), round(y * FACTOR, 6)] for x, y in points]

# Wall infills are distinct from window symbols and furniture in the PDF.
external = [86,87,88,89,90,96,97,98,99,100,101,102,267,268,269,270,271,272,379,380,381,382,383,457,458,459,460,478,479,480,481]
internal = [i for i in range(575,749) if paths[i].get('fill-opacity') == '1']
solid = unary_union([Polygon(polygon(i)) for i in external + internal])
assert solid.is_valid
polygons = list(solid.geoms) if hasattr(solid, 'geoms') else [solid]
wall_polygons = [scaled(list(p.exterior.coords)[:-1]) for p in polygons]

windows = []
for i in [103,104,105,273,274,275,384,385]:
    windows.append({'id':f'window-{i}', 'outline':scaled(polygon(i)), 'sill':.95 if i!=384 else 1.2})
# Floor-to-ceiling windows are left unfilled in the vector drawing.
for a,b in [(829.7,981.0),(1067.4,1218.7),(1303.9,1455.2)]:
    windows.append({'id':f'garden-window-{a}', 'outline':[[702.532, a],[726.743,a],[726.743,b],[702.532,b]], 'sill':.04})

# Every opening is a quadrilateral through the wall, in PDF page coordinates.
# The first two points are opposite jambs on one face; the others are on the other face.
doors = [
 ('eingang', [[138.894531,267.15625],[138.894531,318.117188],[150.21875,318.117188],[150.21875,267.15625]], 0, 80),
 ('arbeiten', [[257.761719,257.886719],[281.964844,251.402344],[283.066406,255.503906],[258.863281,261.988281]], 1, -80),
 ('gast', [[310.414062,248.175781],[334.613281,241.691406],[333.515625,237.589844],[309.3125,244.074219]], 0, 80),
 ('gaestebad', [[338.492188,243.582031],[344.0625,264.367188],[348.164062,263.269531],[342.597656,242.484375]], 0, 80),
 ('hwr', [[320.304688,285.09375],[344.507812,278.609375],[345.605469,282.710938],[321.402344,289.195312]], 0, -80),
 ('hwr-aussen', [[342.992,345.012],[367.609,338.415],[370.54,349.35],[345.923,355.95]], 0, -80),
 ('abstell', [[178.53125,369.078125],[200.050781,369.078125],[200.050781,373.324219],[178.53125,373.324219]], 0, 80),
 ('bad', [[184.195312,588.003906],[184.195312,616.601562],[188.441406,616.601562],[188.441406,588.003906]], 0, -80),
 ('schlafen', [[216.753906,588.003906],[216.753906,616.601562],[221,616.601562],[221,588.003906]], 0, 80),
]
# Use the actual outer jamb coordinates for the HWR door.
p=polygon(459);q=polygon(460)
doors[5]=('hwr-aussen',[p[2],q[3],q[2],p[3]],0,80)
rooms = {name:scaled(polygon(i)) for name,i in [('hwr',30),('gast',31),('arbeiten',32),('gaestebad',33),('bad',34),('schlafen',35),('kueche',36),('wohnen',37),('eingang',38),('abstell',63),('flur',74)]}
outer = scaled(polygon(80))
# Keep clockwise winding in the plan's x/z coordinate system.
if Polygon(outer).exterior.is_ccw is False: outer.reverse()
result = {
 'outline':outer,
 'wallPolygons':wall_polygons,
 'windows':windows,
 'doors':[{'id':name,'outline':scaled(poly),'hinge':hinge,'swing':swing} for name,poly,hinge,swing in doors],
 'roomOutlines':rooms,
}
text = '// Generated from Buko Bungalow_GR.pdf by scripts/extract_plan.py.\n'
for name,value in result.items():
    text += f'export const {name} = '+json.dumps(value,ensure_ascii=False,separators=(',',':'))+';\n'
(ROOT / 'web/src/plan.ts').write_text(text)
print(f'Extracted {len(wall_polygons)} wall polygons, {len(windows)} windows and {len(doors)} doors.')
