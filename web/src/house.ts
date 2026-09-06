import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

import { outline, wallPolygons, windows, doors, roomOutlines } from "./plan";
export { outline } from "./plan";
// The plan's vector coordinates are scaled uniformly to the stated gross area.
const area =
  Math.abs(
    outline.reduce((a, p, i) => {
      const q = outline[(i + 1) % outline.length];
      return a + p[0] * q[1] - q[0] * p[1];
    }, 0),
  ) / 2;
export const scale = Math.sqrt(157.25 / area);
export const point = (x: number, z: number, y = 0) =>
  new T.Vector3((x - 550) * scale, y, (z - 900) * scale);
export const places = [
  {
    id: "garten",
    name: "Im Garten",
    short: "Garten",
    area: "",
    description: "Ein Blick auf das Haus, zwischen Stauden und Obstbäumen.",
    position: [26, 18, 28],
    target: [1, 1, 0],
    inside: false,
  },
  {
    id: "terrasse",
    name: "Auf der Terrasse",
    short: "Terrasse",
    area: "",
    description: "Ein sonniger Platz direkt vor dem Wohnzimmer.",
    position: [1060, 1240],
    target: [610, 1080],
    inside: false,
  },
  {
    id: "wohnen",
    name: "Wohnen & Essen",
    short: "Wohnen",
    area: "42,37 m²",
    description: "Am Kamin sitzen, gemeinsam essen und in den Garten schauen.",
    position: [658, 1197],
    target: [422, 1105],
    inside: true,
  },
  {
    id: "kueche",
    name: "In der Küche",
    short: "Küche",
    area: "11,03 m²",
    description: "Helles Holz, offene Regale und Kräuter am Fenster.",
    position: [585, 950],
    target: [350, 905],
    inside: true,
  },
  {
    id: "schlafen",
    name: "Das Schlafzimmer",
    short: "Schlafen",
    area: "15,39 m²",
    description: "Leinen, warme Farben und der Blick ins Grüne.",
    position: [670, 1325],
    target: [585, 1450],
    inside: true,
  },
  {
    id: "arbeiten",
    name: "Das Arbeitszimmer",
    short: "Arbeiten",
    area: "11,95 m²",
    description: "Ein ruhiger Platz zum Lesen, Schreiben und Malen.",
    position: [525, 510],
    target: [365, 490],
    inside: true,
  },
  {
    id: "gast",
    name: "Das Gästezimmer",
    short: "Gast",
    area: "10,24 m²",
    description: "Ein gemütlicher Rückzugsort für lieben Besuch.",
    position: [780, 440],
    target: [785, 335],
    inside: true,
  },
  {
    id: "bad",
    name: "Das Badezimmer",
    short: "Bad",
    area: "7,91 m²",
    description: "Naturstein, Holz und ein helles Fenster am Waschplatz.",
    position: [390, 1360],
    target: [405, 1465],
    inside: true,
  },
  {
    id: "eingang",
    name: "Willkommen zuhause",
    short: "Eingang",
    area: "7,95 m²",
    description: "Jacke aufhängen, Schuhe ausziehen, ankommen.",
    position: [380, 610],
    target: [465, 690],
    inside: true,
  },
  {
    id: "gaestebad",
    name: "Das kleine Bad",
    short: "Gästebad",
    area: "3,67 m²",
    description: "Ein kleines Bad neben dem Gästezimmer.",
    position: [812, 557],
    target: [837, 510],
    inside: true,
  },
  {
    id: "hwr",
    name: "Der Hauswirtschaftsraum",
    short: "Hauswirtschaft",
    area: "8,45 m²",
    description: "Platz für Wäsche, Vorräte und alles für den Alltag.",
    position: [794, 664],
    target: [865, 615],
    inside: true,
  },
  {
    id: "abstell",
    name: "Die Speisekammer",
    short: "Vorräte",
    area: "4,20 m²",
    description: "Regale für Eingemachtes und die Ernte aus dem Garten.",
    position: [437, 751],
    target: [350, 751],
    inside: true,
  },
];
export type Place = (typeof places)[number];

export function buildHouse() {
  const root = new T.Group();
  root.name = "Äckerchenhaus";
  const roof = new T.Group();
  roof.name = "Dach";
  root.add(roof);
  const building = new T.Group();
  building.name = "Haus und Einrichtung";
  root.add(building);
  const garden = new T.Group();
  garden.name = "Naturgarten";
  root.add(garden);
  let seed = 42;
  const rand = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const mat = (color: string, roughness = 0.8) =>
    new T.MeshStandardMaterial({ color, roughness });
  function texture(kind: "brick" | "wood" | "roof" | "grass" | "gravel") {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = {
      brick: "#bba98e",
      wood: "#bba17e",
      roof: "#64635a",
      grass: "#737e53",
      gravel: "#c7bea9",
    }[kind];
    ctx.fillRect(0, 0, 512, 512);
    if (kind === "brick")
      for (let y = 0; y < 512; y += 32)
        for (let x = -64; x < 512; x += 128) {
          const xx = x + (y % 64 ? 64 : 0);
          ctx.fillStyle = `hsl(35 24% ${56 + rand() * 12}%)`;
          ctx.fillRect(xx + 2, y + 2, 124, 28);
          for (let j = 0; j < 90; j++) {
            ctx.fillStyle = `rgba(73,55,30,${rand() * 0.14})`;
            ctx.fillRect(xx + rand() * 124, y + rand() * 28, rand() * 8 + 1, 1);
          }
        }
    if (kind === "roof")
      for (let y = 0; y < 512; y += 64)
        for (let x = 0; x < 512; x += 64) {
          ctx.fillStyle = `hsl(45 5% ${34 + rand() * 5}%)`;
          ctx.fillRect(x + 1, y + 1, 62, 62);
          ctx.fillStyle = "#47473f";
          ctx.fillRect(x, y + 61, 64, 3);
          ctx.fillStyle = "#8b8879";
          ctx.fillRect(x + 2, y + 2, 1, 58);
        }
    if (kind === "wood") {
      for (let i = 0; i < 1700; i++) {
        ctx.fillStyle = `rgba(${rand() > 0.5 ? "65,44,25" : "231,211,167"},${rand() * 0.15})`;
        ctx.fillRect(
          rand() * 512,
          rand() * 512,
          rand() * 170 + 20,
          0.5 + rand(),
        );
      }
      for (let y = 0; y < 512; y += 128) {
        ctx.fillStyle = "#8e765b";
        ctx.fillRect(0, y, 512, 2);
      }
    }
    if (kind === "grass" || kind === "gravel")
      for (let i = 0; i < 26000; i++) {
        ctx.fillStyle = `rgba(${rand() > 0.5 ? "255,246,211" : "38,42,22"},${rand() * 0.17})`;
        ctx.fillRect(
          rand() * 512,
          rand() * 512,
          1 + rand() * 3,
          1 + rand() * 3,
        );
      }
    const t = new T.CanvasTexture(c);
    t.wrapS = t.wrapT = T.RepeatWrapping;
    t.colorSpace = T.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }
  const brick = mat("#ffffff");
  brick.map = texture("brick");
  brick.bumpMap = brick.map;
  brick.bumpScale = 0.035;
  const wood = mat("#ffffff");
  wood.map = texture("wood");
  wood.bumpMap = wood.map;
  wood.bumpScale = 0.015;
  const tile = mat("#ffffff");
  tile.map = texture("roof");
  tile.bumpMap = tile.map;
  tile.bumpScale = 0.07;
  tile.side = T.DoubleSide;
  const lawn = mat("#ffffff");
  lawn.map = texture("grass");
  const gravel = mat("#ffffff");
  gravel.map = texture("gravel");
  const plaster = mat("#efe6d3"),
    stone = mat("#c2b9a4"),
    dark = mat("#423e33"),
    linen = mat("#e5dac1"),
    sage = mat("#8b9777"),
    terra = mat("#ac7354"),
    soil = mat("#514633"),
    metal = mat("#514f46"),
    white = mat("#f1eee1");
  const leaves = [
    mat("#52663b"),
    mat("#72804b"),
    mat("#89915a"),
    mat("#465c36"),
    mat("#9ca267"),
  ];
  const purple = mat("#9381ac"),
    yellow = mat("#d9ba55"),
    flowerWhite = mat("#eee4c9");
  const glass = new T.MeshPhysicalMaterial({
    color: "#bed7ce",
    transparent: true,
    opacity: 0.22,
    roughness: 0.12,
    metalness: 0.1,
    side: T.DoubleSide,
    depthWrite: false,
  });
  const batches = new Map<T.Group, Map<T.Material, T.BufferGeometry[]>>();
  function mesh(
    g: T.BufferGeometry,
    m: T.Material,
    pos: T.Vector3,
    rotation = 0,
    parent = building,
    stretch?: T.Vector3,
  ) {
    if (g.index) {
      const indexed = g;
      g = g.toNonIndexed();
      indexed.dispose();
    }
    const transform = new T.Matrix4().compose(
      pos,
      new T.Quaternion().setFromEuler(new T.Euler(0, rotation, 0)),
      stretch ?? new T.Vector3(1, 1, 1),
    );
    g.applyMatrix4(transform);
    if(parent.userData.kind==='furniture'){
      g.computeBoundingBox();const b=g.boundingBox!;
      (parent.userData.parts??=[]).push({min:b.min.toArray(),max:b.max.toArray()});
    }
    if (!batches.has(parent)) batches.set(parent, new Map());
    const b = batches.get(parent)!;
    if (!b.has(m)) b.set(m, []);
    b.get(m)!.push(g);
  }
  function box(
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    y: number,
    m: T.Material = wood,
    r = 0,
    parent = building,
    rounded = false,
  ) {
    const g = rounded
      ? new RoundedBoxGeometry(w, h, d, 2, Math.min(0.065, w / 4, d / 4, h / 4))
      : new T.BoxGeometry(w, h, d);
    if (m === wood || m === brick || m === gravel || m === lawn) {
      const uv = g.getAttribute("uv"),
        n = g.getAttribute("normal");
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(
          i,
          uv.getX(i) * (Math.abs(n.getX(i)) > 0.5 ? d : w),
          uv.getY(i) * (Math.abs(n.getY(i)) > 0.5 ? d : h),
        );
      }
    }
    mesh(g, m, point(x, z, y), r, parent);
  }
  function cylinder(
    x: number,
    z: number,
    r: number,
    h: number,
    y: number,
    m: T.Material,
    parent = building,
    top = r,
  ) {
    mesh(new T.CylinderGeometry(top, r, h, 16), m, point(x, z, y), 0, parent);
  }
  function ball(
    x: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
    y: number,
    m: T.Material,
    parent = building,
  ) {
    mesh(
      new T.SphereGeometry(1, 8, 6),
      m,
      point(x, z, y),
      0,
      parent,
      new T.Vector3(sx, sy, sz),
    );
  }
  function segment(
    a: number[],
    b: number[],
    h: number,
    y: number,
    m: T.Material,
    thickness = 0.18,
    parent = building,
  ) {
    const dx = (b[0] - a[0]) * scale,
      dz = (b[1] - a[1]) * scale;
    box(
      (a[0] + b[0]) / 2,
      (a[1] + b[1]) / 2,
      Math.hypot(dx, dz),
      thickness,
      h,
      y,
      m,
      -Math.atan2(dz, dx),
      parent,
    );
  }
  function slab(poly: number[][], y: number, m: T.Material, parent = building) {
    const s = new T.Shape(
      poly.map(
        (p) => new T.Vector2((p[0] - 550) * scale, -(p[1] - 900) * scale),
      ),
    );
    const g = new T.ShapeGeometry(s);
    g.rotateX(-Math.PI / 2);
    const uv = g.getAttribute("uv"),
      p = g.getAttribute("position");
    for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i), p.getZ(i));
    mesh(g, m, new T.Vector3(0, y, 0), 0, parent);
  }
  slab(outline, 0.015, wood);
  // Geometry is extruded from the actual PDF wall footprints, not centered on
  // lines traced from their faces. This preserves every junction and door reveal.
  const walls = new T.Group(); walls.name="Wände"; building.add(walls);
  function onExterior(p:number[]) {
    return outline.some((a,i)=>{
      const b=outline[(i+1)%outline.length],dx=b[0]-a[0],dz=b[1]-a[1];
      const t=((p[0]-a[0])*dx+(p[1]-a[1])*dz)/(dx*dx+dz*dz);
      return t>=-.001&&t<=1.001&&Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dz)<.06;
    });
  }
  function prism(poly:number[][],bottom:number,height:number,parent:T.Group=walls) {
    slab(poly,bottom+height,plaster,parent);
    for(let i=0;i<poly.length;i++) {
      const a=poly[i],b=poly[(i+1)%poly.length];
      const pa=point(a[0],a[1],bottom),pb=point(b[0],b[1],bottom);
      const positions=[pa.x,bottom,pa.z,pb.x,bottom,pb.z,pb.x,bottom+height,pb.z,pa.x,bottom,pa.z,pb.x,bottom+height,pb.z,pa.x,bottom+height,pa.z];
      const length=pa.distanceTo(pb),g=new T.BufferGeometry();
      g.setAttribute('position',new T.Float32BufferAttribute(positions,3));
      g.setAttribute('uv',new T.Float32BufferAttribute([0,0,length,0,length,height,0,0,length,height,0,height],2));
      g.computeVertexNormals();
      // Both sides are visible regardless of a polygon's winding from the PDF.
      const material=onExterior([(a[0]+b[0])/2,(a[1]+b[1])/2])?brick:plaster;
      material.side=T.DoubleSide;mesh(g,material,new T.Vector3(),0,parent);
    }
  }
  wallPolygons.forEach(poly=>prism(poly,0,2.75));

  // All multipart objects are built in metres around a single native Three.Group.
  // Positions and orientations of children therefore cannot drift apart.
  function assembly(name:string,x:number,z:number,yaw:number,parent=building) {
    const group=new T.Group();group.name=name;group.position.copy(point(x,z));group.rotation.y=yaw;parent.add(group);
    const B=(x:number,z:number,w:number,d:number,h:number,y:number,m:T.Material=wood,rounded=false)=>box(550+x/scale,900+z/scale,w,d,h,y,m,0,group,rounded);
    const C=(x:number,z:number,r:number,h:number,y:number,m:T.Material=wood,top=r)=>cylinder(550+x/scale,900+z/scale,r,h,y,m,group,top);
    const E=(x:number,z:number,sx:number,sy:number,sz:number,y:number,m:T.Material)=>ball(550+x/scale,900+z/scale,sx,sy,sz,y,m,group);
    return {group,B,C,E};
  }
  const aperture=(poly:number[][])=>{
    const a=[(poly[0][0]+poly[3][0])/2,(poly[0][1]+poly[3][1])/2];
    const b=[(poly[1][0]+poly[2][0])/2,(poly[1][1]+poly[2][1])/2];
    return {a,b,width:Math.hypot(b[0]-a[0],b[1]-a[1])*scale,depth:Math.hypot(poly[0][0]-poly[3][0],poly[0][1]-poly[3][1])*scale,yaw:-Math.atan2(b[1]-a[1],b[0]-a[0])};
  };
  for(const opening of windows) {
    const poly=opening.outline;
    // Start at the longest edge so that the same frame works on every facade.
    let edge=0;for(let i=1;i<4;i++)if(Math.hypot(poly[(i+1)%4][0]-poly[i][0],poly[(i+1)%4][1]-poly[i][1])>Math.hypot(poly[(edge+1)%4][0]-poly[edge][0],poly[(edge+1)%4][1]-poly[edge][1]))edge=i;
    const ordered=[0,1,2,3].map(i=>poly[(edge+i)%4]);
    const {a,b,width,depth,yaw}=aperture(ordered),bottom=opening.sill,top=2.38;
    if(bottom)prism(poly,0,bottom);
    prism(poly,top,2.75-top,roof);
    const {B,group}=assembly(opening.id,(a[0]+b[0])/2,(a[1]+b[1])/2,yaw);
    group.userData.kind='window';
    for(const x of [-width/2+.035,0,width/2-.035])B(x,0,.07,.10,top-bottom,(top+bottom)/2,wood);
    for(const y of [bottom+.035,top-.035])B(0,0,width,.10,.07,y,wood);
    B(0,0,width-.12,.018,top-bottom-.12,(top+bottom)/2,glass);
    B(0,0,width+.025,depth+.025,.04,bottom,stone);
  }
  for(const door of doors) {
    const {a,b,width,depth,yaw}=aperture(door.outline);
    prism(door.outline,2.30,.45,roof);
    const {B,group}=assembly(`Tür ${door.id}`,(a[0]+b[0])/2,(a[1]+b[1])/2,yaw);
    group.userData={kind:'door',opening:door.outline,width};
    for(const x of [-width/2+.018,width/2-.018])B(x,0,.036,depth+.025,2.3,1.15,wood);
    B(0,0,width,depth+.025,.04,2.28,wood);
    const hinge=new T.Group();hinge.name='Türblatt mit Beschlägen';hinge.position.x=(door.hinge===0?-1:1)*(width/2-.04);hinge.rotation.y=door.swing*Math.PI/180;group.add(hinge);
    const direction=door.hinge===0?1:-1,leafWidth=width-.085;
    hinge.userData={leafWidth,direction};
    box(550+direction*leafWidth/2/scale,900,leafWidth,.035,2.23,1.135,wood,0,hinge);
    for(const side of [-1,1])box(550+direction*(leafWidth-.12)/scale,900+side*.055/scale,.13,.025,.025,1.02,metal,0,hinge);
  }
  const curtain = new T.MeshStandardMaterial({
    color: "#e5dec9",
    roughness: 1,
    transparent: true,
    opacity: 0.85,
  });
  for (const z of [839, 972, 1077, 1209, 1314, 1447])
    for (let i = 0; i < 6; i++)
      cylinder(711, z + i * 1.6, 0.022, 2.28, 1.22, curtain);
  slab(
    outline,
    2.73,
    new T.MeshStandardMaterial({
      color: "#f0e9d9",
      roughness: 1,
      side: T.DoubleSide,
    }),
    roof,
  );
  // Roof planes follow the angled junction of the two wings.
  function roofFace(vertices: number[][]) {
    const g = new T.BufferGeometry();
    const p: number[] = [],
      uv: number[] = [];
    for (let i = 1; i < vertices.length - 1; i++)
      for (const v of [vertices[0], vertices[i], vertices[i + 1]]) {
        const q = point(v[0], v[1], v[2]);
        p.push(q.x, q.y, q.z);
        uv.push(q.x / 1.5, q.z / 1.5);
      }
    g.setAttribute("position", new T.Float32BufferAttribute(p, 3));
    g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    mesh(g, tile, new T.Vector3(), 0, roof);
  }
  roofFace([
    [287, 428, 2.84],
    [512, 600, 4.5],
    [512, 1528, 4.5],
    [287, 1528, 2.84],
  ]);
  roofFace([
    [512, 600, 4.5],
    [738, 765, 2.84],
    [738, 1528, 2.84],
    [512, 1528, 4.5],
  ]);
  roofFace([
    [287, 428, 2.84],
    [872, 270, 2.84],
    [928, 490, 4.5],
    [512, 600, 4.5],
  ]);
  roofFace([
    [512, 600, 4.5],
    [928, 490, 4.5],
    [989, 705, 2.84],
    [738, 776, 2.84],
  ]);
  function gable(a: number[], b: number[], peak: number[]) {
    const pts = [
      point(...(a as [number, number]), 2.75),
      point(...(b as [number, number]), 2.75),
      point(...(peak as [number, number]), 4.5),
    ];
    const g = new T.BufferGeometry().setFromPoints(pts);
    g.setAttribute("uv", new T.Float32BufferAttribute([0, 0, 5, 0, 2.5, 2], 2));
    g.computeVertexNormals();
    const m = brick.clone();
    m.side = T.DoubleSide;
    mesh(g, m, new T.Vector3(), 0, roof);
  }
  gable([297, 1518], [728, 1518], [512, 1518]);
  gable([866, 282], [977, 698], [922, 490]);
  for (let i = 0; i < outline.length; i++)
    segment(
      outline[i],
      outline[(i + 1) % outline.length],
      0.12,
      2.77,
      dark,
      0.1,
      roof,
    );
  segment([512, 600], [512, 1528], 0.1, 4.51, tile, 0.15, roof);
  segment([512, 600], [928, 490], 0.1, 4.51, tile, 0.15, roof);
  for (const p of [
    [732, 1515],
    [979, 697],
    [295, 440],
  ])
    cylinder(p[0], p[1], 0.04, 2.7, 1.35, metal);
  box(492, 1043, 0.55, 0.5, 1.85, 3.68, brick, 0, roof);
  box(492, 1043, 0.65, 0.6, 0.09, 4.64, metal, 0, roof);
  // Each fixture has one frame. Local -Z is its back; chairs face -Z.
  // Furniture footprints are kept for geometric clearance checks.
  function fixture(name:string,room:string,x:number,z:number,yaw:number,w:number,d:number,wallEdge?:number) {
    let wallReference:number[][]|undefined;
    if(wallEdge!==undefined) {
      const poly=roomOutlines[room as keyof typeof roomOutlines];
      const a=poly[wallEdge],b=poly[(wallEdge+1)%poly.length],dx=b[0]-a[0],dz=b[1]-a[1],length=Math.hypot(dx,dz);
      let nx=-dz/length,nz=dx/length;
      const center=poly.reduce((c,p)=>[c[0]+p[0]/poly.length,c[1]+p[1]/poly.length],[0,0]);
      if((center[0]-a[0])*nx+(center[1]-a[1])*nz<0){nx=-nx;nz=-nz}
      const margin=(w/2+.01)/scale/length;
      const t=T.MathUtils.clamp(((x-a[0])*dx+(z-a[1])*dz)/(length*length),margin,1-margin);
      // Room area fills in the PDF can extend slightly under wall faces.
      // Snap the datum to the nearest parallel physical face at this location.
      const q=[a[0]+t*dx,a[1]+t*dz];
      let shift=0,best=.10/scale;
      wallReference=[a,b];
      for(const contour of [...wallPolygons,...windows.map(w=>w.outline)])for(let i=0;i<contour.length;i++){
        const c=contour[i],e=contour[(i+1)%contour.length],ex=e[0]-c[0],ez=e[1]-c[1],el=Math.hypot(ex,ez);
        if(el<1||Math.abs((ex*dx+ez*dz)/(el*length))<.9999)continue;
        const along=((q[0]-c[0])*ex+(q[1]-c[1])*ez)/(el*el),offset=(c[0]-q[0])*nx+(c[1]-q[1])*nz;
        if(along>=0&&along<=1&&Math.abs(offset)<best){best=Math.abs(offset);shift=offset;wallReference=[c,e]}
      }
      x=q[0]+nx*((d/2+.002)/scale+shift);
      z=q[1]+nz*((d/2+.002)/scale+shift);
      yaw=Math.atan2(nx,nz);
    }
    const parts=assembly(name,x,z,yaw);
    parts.group.userData={kind:'furniture',room,footprint:[w,d],wallReference};
    return parts;
  }
  // The actual facade direction is +X/-Z, corresponding to a positive Y rotation.
  const facade=windows.find(w=>w.id==='window-275')!.outline;
  const wingAngle=-Math.atan2(facade[0][1]-facade[3][1],facade[0][0]-facade[3][0]);
  const facing=(x:number,z:number,tx:number,tz:number)=>Math.atan2(x-tx,z-tz);
  function makeTable(name:string,room:string,x:number,z:number,w:number,d:number,yaw=0,h=.75,wallEdge?:number) {
    const p=fixture(name,room,x,z,yaw,w,d,wallEdge);
    p.B(0,0,w,d,.08,h,wood,true);
    for(const dx of [-w/2+.10,w/2-.10])for(const dz of [-d/2+.10,d/2-.10])p.B(dx,dz,.055,.055,h-.04,(h-.04)/2,wood);
    return p;
  }
  function makeChair(name:string,room:string,x:number,z:number,tx:number,tz:number) {
    const yaw=facing(x,z,tx,tz),p=fixture(name,room,x,z,yaw,.46,.50);
    p.group.userData.faces=[tx,tz];
    p.B(0,0,.46,.46,.09,.46,sage,true);
    p.B(0,.21,.46,.055,.40,.73,wood,true);
    for(const dx of [-.17,.17])for(const dz of [-.17,.17])p.B(dx,dz,.045,.045,.43,.215,wood);
    return p;
  }
  function makeBed(name:string,room:string,x:number,z:number,w:number,d:number,yaw:number,wallEdge:number) {
    const p=fixture(name,room,x,z,yaw,w+.10,d+.08,wallEdge);
    p.group.userData.headDirection=[-Math.sin(p.group.rotation.y),-Math.cos(p.group.rotation.y)];
    p.B(0,0,w+.10,d+.08,.25,.23,wood,true);
    p.B(0,0,w,d,.24,.47,linen,true);
    p.B(0,.29,w,d*.64,.06,.62,sage,true);
    p.B(0,-d/2,w+.10,.07,.90,.57,wood,true);
    for(const dx of [-w/4,w/4])p.B(dx,-d*.32,w*.4,.41,.12,.65,white,true);
    return p;
  }
  function makeRug(x:number,z:number,w:number,d:number,yaw=0) {
    const p=assembly('Teppich',x,z,yaw);
    p.B(0,0,w,d,.016,.035,linen,true);
    for(let i=0;i<16;i++)p.B((i/15-.5)*w,0,.01,d,.003,.045,white);
  }
  function vaseAt(p:ReturnType<typeof assembly>,x:number,z:number,y:number) {
    p.C(x,z,.085,.20,y+.1,terra,.06);
    for(let i=0;i<5;i++){p.C(x+(i-2)*.012,z,.004,.31,y+.34,leaves[0]);p.E(x+(i-2)*.012,z,.025,.06,.025,y+.52,purple)}
  }
  function plant(x:number,z:number,size=.6,parent=building) {
    const p=assembly('Topfpflanze',x,z,0,parent);
    p.C(0,0,size*.25,size*.5,size*.25,terra,size*.33);
    p.C(0,0,size*.29,.02,size*.51,soil);
    for(let i=0;i<10;i++) {const a=i*2.4,r=size*(.15+rand()*.2);p.E(Math.cos(a)*r,Math.sin(a)*r,size*.12,size*(.25+rand()*.12),size*.09,size*(.7+rand()*.3),leaves[i%5])}
  }
  makeRug(480,1138,3.5,2.8);
  const sofa=fixture('Sofa','wohnen',365,1140,Math.PI/2,2.65,.95,14);
  sofa.B(0,0,2.65,.90,.25,.30,wood,true);
  sofa.B(0,-.36,2.65,.16,.69,.63,linen,true);
  for(const dx of [-.83,0,.83]) {sofa.B(dx,.07,.79,.72,.19,.53,linen,true);sofa.B(dx,-.25,.73,.13,.40,.84,linen,true)}
  for(const dx of [-1.26,1.26])sofa.B(dx,0,.13,.95,.52,.53,wood,true);
  sofa.B(-.82,.02,.4,.4,.13,.68,sage,true);sofa.B(.84,.01,.4,.4,.13,.68,terra,true);
  const coffee=fixture('Couchtisch','wohnen',466,1147,0,1.0,1.0);
  coffee.C(0,0,.5,.065,.44,wood);coffee.C(0,0,.20,.40,.21,wood);vaseAt(coffee,0,0,.4725);
  const armchair=fixture('Lesesessel','wohnen',535,1180,facing(535,1180,466,1147),.88,.91);
  armchair.group.userData.faces=[466,1147];
  for(const x of [-.30,.30])for(const z of [-.29,.29])armchair.B(x,z,.055,.055,.27,.135,wood);
  armchair.B(0,0,.82,.80,.14,.33,wood,true);
  armchair.B(0,-.04,.68,.65,.18,.45,sage,true);
  armchair.B(0,.33,.74,.18,.66,.72,sage,true);
  for(const x of [-.36,.36])armchair.B(x,0,.15,.82,.35,.56,sage,true);
  armchair.B(0,.20,.43,.13,.34,.74,linen,true);
  plant(677,1190,.8);
  const stove=fixture('Kaminofen','wohnen',492,1043,0,.6,.6);
  stove.B(0,0,.6,.6,1.06,.56,dark,true);stove.B(0,.305,.43,.012,.43,.61,mat('#b47a40'));stove.C(0,0,.08,1.65,1.915,metal);
  const dining=makeTable('Esstisch','wohnen',619,906,1.0,1.85);
  for(const [i,z] of [876,936].entries())for(const x of [568,670])makeChair(`Esszimmerstuhl ${i}-${x}`,'wohnen',x,z,619,z);
  makeChair('Esszimmerstuhl Nord','wohnen',619,824,619,906);
  makeChair('Esszimmerstuhl Süd','wohnen',619,988,619,906);
  vaseAt(dining,0,0,.79);
  for(const z of [-.5,.5])for(const x of [-.28,.28])dining.C(x,z,.13,.012,.80,white);
  for(const z of [875,941]){const lamp=assembly('Pendelleuchte',619,z,0);lamp.C(0,0,.007,.60,2.43,dark);lamp.C(0,0,.25,.22,2.02,linen,.12)}
  // Locate both kitchen runs from the clear room faces, rather than freehand
  // center positions. Countertops meet at the corner without a gap or overlap.
  const kitchenX=roomOutlines.kueche.map(p=>p[0]),kitchenZ=roomOutlines.kueche.map(p=>p[1]);
  const left=Math.min(...kitchenX),right=Math.max(...kitchenX),north=Math.min(...kitchenZ),south=Math.max(...kitchenZ);
  const counterDepth=.62,westLength=(south-north)*scale-.006;
  const kitchen=fixture('Küchenzeile Fenster','kueche',left+counterDepth/2/scale,(north+south)/2,Math.PI/2,westLength,counterDepth);
  kitchen.group.userData.wallReference=[roomOutlines.kueche[0],roomOutlines.kueche[1]];
  kitchen.B(0,-.015,westLength,counterDepth-.03,.85,.45,wood);kitchen.B(0,0,westLength,counterDepth,.05,.90,stone);
  for(let i=0;i<5;i++){const width=(westLength-counterDepth)/5,x=-westLength/2+counterDepth+(i+.5)*width;kitchen.B(x,.295,width-.015,.03,.72,.47,plaster);kitchen.B(x,.321,.16,.025,.025,.76,dark)}
  kitchen.B(0,0,.56,.43,.018,.935,metal);for(const dx of [-.15,.15])for(const dz of [-.10,.10])kitchen.C(dx,dz,.075,.005,.947,dark);
  const returnStart=left+counterDepth/scale,returnWidth=(right-returnStart)*scale-.006;
  const sinkRun=fixture('Küchenzeile Spüle','kueche',(returnStart+right)/2,south-counterDepth/2/scale,Math.PI,returnWidth,counterDepth);
  sinkRun.group.userData.wallReference=[roomOutlines.kueche[3],roomOutlines.kueche[0]];
  sinkRun.B(0,-.015,returnWidth,counterDepth-.03,.85,.45,wood);sinkRun.B(0,0,returnWidth,counterDepth,.05,.90,stone);
  for(const x of [-returnWidth/3,0,returnWidth/3]){sinkRun.B(x,.295,returnWidth/3-.015,.03,.73,.47,plaster);sinkRun.B(x,.321,.16,.025,.025,.76,dark)}
  sinkRun.B(0,0,.52,.39,.02,.936,metal);sinkRun.C(0,-.22,.018,.24,1.04,metal);
  const island=fixture('Kücheninsel','kueche',442,885,0,1.06,1.04);
  island.B(0,0,1.0,1.0,.85,.45,wood);island.B(0,0,1.06,1.04,.05,.90,stone);vaseAt(island,0,0,.93);
  // Shelves stay on the solid pantry wall, leaving the window clear.
  const shelves=fixture('Küchenregal','kueche',473,north+.122/scale,0,.90,.24,1);
  for(const y of [1.50,1.95]){shelves.B(0,0,.9,.24,.04,y,wood);for(const x of [-.3,0,.3])shelves.C(x,0,.065,.15,y+.095,terra)}
  makeRug(590,1410,2.7,2.6);
  makeBed('Doppelbett','schlafen',592,1428,1.8,2.02,Math.PI,3);
  for(const x of [513,674]){const p=makeTable(`Nachttisch ${x}`,'schlafen',x,1470,.42,.4,0,.43,3);p.C(0,0,.11,.20,.57,linen)}
  const wardrobe=fixture('Kleiderschrank','schlafen',622,1268,0,2.35,.55,1);
  wardrobe.B(0,0,2.35,.55,1.95,1.0,wood);
  for(const x of [-.78,0,.78]){wardrobe.B(x,.285,.76,.025,1.9,1.0,wood);wardrobe.B(x+.28,.315,.025,.035,.40,1.05,dark)}
  plant(677,1322,.6);
  const desk=makeTable('Schreibtisch','arbeiten',419,452,1.45,.65,wingAngle,.75,3);
  desk.B(0,0,.38,.27,.018,.80,plaster);vaseAt(desk,-.48,0,.80);
  const deskCenter=[desk.group.position.x/scale+550,desk.group.position.z/scale+900];
  const deskChair=[deskCenter[0]+Math.sin(desk.group.rotation.y)*.85/scale,deskCenter[1]+Math.cos(desk.group.rotation.y)*.85/scale];
  makeChair('Schreibtischstuhl','arbeiten',deskChair[0],deskChair[1],deskCenter[0],deskCenter[1]);
  const bookcase=fixture('Bücherregal','arbeiten',611,453,-Math.PI/2+wingAngle,1.55,.32,4);
  for(const y of [.30,.80,1.30,1.80]){bookcase.B(0,0,1.55,.32,.045,y,wood);for(let i=0;i<16;i++){const height=.22+(i%3)*.03;bookcase.B(-.68+i*.087,0,.055,.22,height,y+.0225+height/2,[sage,terra,linen][i%3])}}
  for(const x of [-.76,.76])bookcase.B(x,0,.035,.32,1.88,.95,wood);
  plant(345,535,.6);
  makeBed('Gästebett','gast',789,365,.95,2.0,-Math.PI/2+wingAngle,1);
  const guestTable=makeTable('Gästenachttisch','gast',853,404,.42,.42,wingAngle,.45,1);vaseAt(guestTable,0,0,.49);
  makeRug(775,438,1.8,1.0,wingAngle);
  const laundry=fixture('Waschmaschinenzeile','hwr',839,611,wingAngle,2.0,.64,0);
  laundry.B(0,0,2.0,.64,.85,.45,plaster);laundry.B(0,0,2.0,.64,.05,.91,stone);
  for(const x of [-.62,0]){laundry.B(x,.316,.57,.027,.75,.46,white);laundry.E(x,.34,.19,.19,.024,.47,metal)}
  // Vanities face the room. Basin, tap and mirror share the cabinet's frame.
  function vanity(name:string,room:string,x:number,z:number,yaw:number,w=.85) {
    const p=fixture(name,room,x,z,yaw,w,.48,room==='bad'?1:0);
    p.B(0,0,w,.48,.60,.48,wood);p.B(0,0,w,.48,.055,.82,white);
    p.E(0,.03,w*.28,.06,.16,.88,white);p.C(.12,-.15,.016,.21,.98,metal);
    p.B(0,-.225,w*.85,.03,.73,1.48,wood);
    p.B(0,-.206,w*.85-.045,.009,.68,1.48,new T.MeshStandardMaterial({color:'#b1c3ba',metalness:.85,roughness:.12}));
    p.group.userData.backDirection=[-Math.sin(p.group.rotation.y),-Math.cos(p.group.rotation.y)];
    return p;
  }
  function toilet(name:string,room:string,x:number,z:number,yaw:number) {
    const p=fixture(name,room,x,z,yaw,.40,.61,room==='bad'?1:0);
    p.B(0,-.22,.36,.17,.69,.38,white,true);p.C(0,.03,.15,.35,.215,white);
    p.E(0,.10,.19,.065,.235,.43,white);p.E(0,.10,.12,.012,.15,.487,linen);
  }
  slab(roomOutlines.bad,.04,stone);slab(roomOutlines.gaestebad,.04,stone);slab(roomOutlines.hwr,.025,stone);
  vanity('Waschtisch Bad','bad',380,1475,Math.PI);
  toilet('WC Bad','bad',437,1469,Math.PI);
  const shower=fixture('Dusche','bad',351,1371,0,.91,.91);
  shower.B(0,0,.91,.91,.055,.075,white);shower.B(.445,0,.012,.91,1.90,1.05,glass);shower.C(-.40,0,.017,1.7,1.17,metal);shower.E(-.30,0,.11,.018,.11,2.03,metal);
  vanity('Waschtisch Gästebad','gaestebad',823,512,wingAngle,.72);
  toilet('WC Gästebad','gaestebad',879,510,wingAngle);
  const bench=makeTable('Sitzbank','eingang',490,694,1.10,.40,0,.43,3);bench.B(0,0,1.07,.38,.07,.51,linen,true);
  const coats=fixture('Garderobe','eingang',402,701,0,1.5,.08,3);
  for(const x of [-.6,-.2,.2,.6]){coats.B(x,0,.025,.08,.07,1.66,wood);coats.B(x,.04,.25,.08,.56,1.28,[sage,linen,terra][Math.round((x+.6)*5)%3],true)}
  const pantry=fixture('Vorratsregal','abstell',334,754,Math.PI/2,.94,.33,3);
  for(const y of [.4,.9,1.4,1.9]){pantry.B(0,0,.94,.33,.04,y,wood);for(const x of [-.32,0,.32])pantry.C(x,0,.075,.18,y+.11,terra)}
  // Timber terrace, curved gravel path, planted borders and kitchen garden.
  slab(
    [
      [740, 789],
      [933, 785],
      [962, 1320],
      [910, 1520],
      [740, 1520],
    ],
    0.06,
    wood,
    garden,
  );
  for (let z = 790; z < 1520; z += 9)
    segment(
      [744, z],
      [z < 1320 ? 937 : 917, z],
      0.012,
      0.067,
      dark,
      0.008,
      garden,
    );
  function gardenBox(
    x: number,
    z: number,
    w: number,
    d: number,
    h: number,
    y: number,
    m: T.Material,
  ) {
    box(x, z, w, d, h, y, m, 0, garden, true);
  }
  for (const z of [1090, 1270]) {
    gardenBox(800, z, 0.9, 1.4, 0.32, 0.27, wood);
    gardenBox(800, z, 0.83, 1.33, 0.16, 0.5, linen);
    gardenBox(775, z, 0.12, 1.4, 0.6, 0.63, wood);
    for (const dz of [-44, 44])
      gardenBox(800, z + dz, 0.93, 0.08, 0.44, 0.55, wood);
  }
  cylinder(832, 1180, 0.44, 0.055, 0.52, wood, garden);
  cylinder(832, 1180, 0.12, 0.48, 0.26, wood, garden);
  plant(775, 809, 1, garden);
  plant(771, 1478, 0.9, garden);
  slab(
    [
      [-380, -130],
      [1390, -130],
      [1570, 1610],
      [1110, 1980],
      [-340, 1830],
    ],
    -0.055,
    lawn,
    garden,
  );
  const curve = new T.CatmullRomCurve3(
    [
      [940, 1650],
      [1050, 1400],
      [1010, 1150],
      [1050, 875],
      [1130, 650],
      [1040, 335],
    ].map((p) => point(p[0], p[1], 0)),
  );
  const pathPts = curve.getPoints(90),
    pathPoly: number[][] = [];
  for (const side of [-1, 1]) {
    const pts = side === -1 ? pathPts : [...pathPts].reverse();
    for (let i = 0; i < pts.length; i++) {
      const prev = pts[Math.max(0, i - 1)],
        next = pts[Math.min(i + 1, pts.length - 1)];
      const dir = next.clone().sub(prev).normalize();
      const normal = new T.Vector3(-dir.z, 0, dir.x);
      const p = pts[i].clone().addScaledVector(normal, 0.62);
      pathPoly.push([p.x / scale + 550, p.z / scale + 900]);
    }
  }
  slab(pathPoly, -0.012, gravel, garden);
  for (let i = 0; i < 18; i++) {
    const x = 330 - i * 18,
      z = 615 + i * 2;
    const s = 0.36 + rand() * 0.1;
    cylinder(x, z, s, 0.065, 0.005, stone, garden, s * 0.95);
  }
  // Leaf cards give trees a fine silhouette without thousands of individual meshes.
  const leafCanvas = document.createElement("canvas");
  leafCanvas.width = leafCanvas.height = 256;
  const lc = leafCanvas.getContext("2d")!;
  for (let i = 0; i < 36; i++) {
    const x = 22 + rand() * 212,
      y = 22 + rand() * 212,
      a = rand() * 6.28;
    lc.save();
    lc.translate(x, y);
    lc.rotate(a);
    lc.fillStyle = `hsl(${72 + rand() * 20} ${24 + rand() * 16}% ${36 + rand() * 23}%)`;
    lc.beginPath();
    lc.moveTo(0, -22);
    lc.bezierCurveTo(18, -10, 18, 11, 0, 23);
    lc.bezierCurveTo(-16, 10, -15, -10, 0, -22);
    lc.fill();
    lc.strokeStyle = "#c5c89966";
    lc.lineWidth = 0.7;
    lc.beginPath();
    lc.moveTo(0, -19);
    lc.lineTo(0, 21);
    lc.stroke();
    lc.restore();
  }
  const leafTexture = new T.CanvasTexture(leafCanvas);
  leafTexture.colorSpace = T.SRGBColorSpace;
  const foliage = new T.MeshStandardMaterial({
    map: leafTexture,
    alphaTest: 0.48,
    side: T.DoubleSide,
    roughness: 0.95,
    color: "#c4ceac",
  });
  function leafCard(x: number, z: number, y: number, size: number) {
    const g = new T.PlaneGeometry(size, size);
    g.rotateX(rand() * Math.PI);
    g.rotateZ(rand() * Math.PI);
    mesh(g, foliage, point(x, z, y), rand() * 6.28, garden);
  }
  function shrub(x: number, z: number, size: number) {
    for (let i = 0; i < 34; i++) {
      const a = rand() * 6.28,
        r = Math.sqrt(rand()) * size * 0.7;
      leafCard(
        x + (Math.cos(a) * r) / scale,
        z + (Math.sin(a) * r) / scale,
        0.13 + rand() * size * 0.85,
        size * 0.65,
      );
    }
  }
  function flowers(x: number, z: number, size: number, color: T.Material) {
    ball(x, z, size * 0.56, 0.14, size * 0.5, 0.1, leaves[0], garden);
    for (let j = 0; j < 10; j++) {
      const dx = x + ((rand() - 0.5) * size) / scale,
        dz = z + ((rand() - 0.5) * size) / scale,
        h = 0.24 + rand() * 0.4;
      cylinder(dx, dz, 0.008, h, h / 2, leaves[1], garden);
      ball(
        dx,
        dz,
        0.035,
        color === purple ? 0.11 : 0.035,
        0.035,
        h,
        color,
        garden,
      );
    }
  }
  for (let i = 0; i < 75; i++) {
    const z = 790 + rand() * 830,
      x = 1070 + Math.sin(z * 0.013) * 45 + rand() * 65;
    flowers(x, z, 0.35 + rand() * 0.3, [purple, yellow, flowerWhite][i % 3]);
  }
  for (let i = 0; i < 28; i++) {
    const x = 770 + rand() * 170,
      z = 1535 + rand() * 80;
    flowers(x, z, 0.5, [purple, flowerWhite][i % 2]);
  }
  for (let i = 0; i < 23; i++) {
    const z = 797 + i * 31;
    shrub(950, z, 0.38);
  }
  for (let i = 0; i < 18; i++) {
    const z = 330 + i * 24;
    shrub(1013, z, 0.45);
  }
  for (let i = 0; i < 24; i++) {
    const x = 1020 + rand() * 180,
      z = 840 + rand() * 820;
    ball(
      x,
      z,
      0.18 + rand() * 0.17,
      0.16 + rand() * 0.15,
      0.25,
      0.12,
      stone,
      garden,
    );
  }
  // Raised beds, vegetables, small orchard and a bench.
  for (const x of [12, 125])
    for (const z of [1000, 1170]) {
      gardenBox(x, z, 1.4, 2.1, 0.35, 0.15, wood);
      gardenBox(x, z, 1.28, 1.98, 0.025, 0.34, soil);
      for (let i = 0; i < 4; i++)
        for (let j = 0; j < 6; j++)
          ball(
            x - 27 + i * 18,
            z - 44 + j * 18,
            0.12,
            0.14,
            0.12,
            0.43,
            leaves[(i + j) % 5],
            garden,
          );
    }
  function tree(x: number, z: number, height: number) {
    cylinder(x, z, 0.13, height * 0.59, height * 0.295, wood, garden, 0.045);
    for (let i = 0; i < 8; i++) {
      const a = i * 2.4,
        r = height * (0.17 + rand() * 0.1),
        tip = point(
          x + (Math.cos(a) * r) / scale,
          z + (Math.sin(a) * r) / scale,
          height * (0.62 + rand() * 0.22),
        ),
        base = point(x, z, height * 0.4);
      const direction = tip.clone().sub(base),
        g = new T.CylinderGeometry(0.025, 0.065, direction.length(), 7);
      g.applyQuaternion(
        new T.Quaternion().setFromUnitVectors(
          new T.Vector3(0, 1, 0),
          direction.clone().normalize(),
        ),
      );
      mesh(g, wood, base.add(tip).multiplyScalar(0.5), 0, garden);
    }
    for (let i = 0; i < 460; i++) {
      const a = rand() * Math.PI * 2,
        r = Math.sqrt(rand()) * height * 0.34,
        dy = (rand() - 0.5) * height * 0.44;
      if (
        (r * r) / (height * 0.34) ** 2 + (dy * dy) / (height * 0.3) ** 2 >
        1.25
      )
        continue;
      leafCard(
        x + (Math.cos(a) * r) / scale,
        z + (Math.sin(a) * r) / scale,
        height * 0.73 + dy,
        0.65 + rand() * 0.6,
      );
    }
    for (let i = 0; i < 18; i++) {
      const a = rand() * 6.28;
      ball(
        x + (Math.cos(a) * height * 0.23) / scale,
        z + (Math.sin(a) * height * 0.23) / scale,
        0.055,
        0.06,
        0.055,
        height * 0.64 + rand() * 0.6,
        terra,
        garden,
      );
    }
  }
  for (const [x, z, h] of [
    [40, 440, 5.5],
    [-70, 790, 4.8],
    [-10, 1510, 5.2],
    [350, 1720, 4.5],
    [1240, 340, 5.3],
    [1190, 710, 4.3],
    [1350, 1490, 4.6],
    [700, 60, 5.2],
    [230, 145, 5.8],
  ])
    tree(x, z, h);
  for (let i = 0; i < 45; i++) {
    const a = rand() * 6.28;
    const x = 550 + Math.cos(a) * 900,
      z = 900 + Math.sin(a) * 1030;
    shrub(x, z, 0.7 + rand() * 0.5);
  }
  gardenBox(1140, 1020, 0.48, 1.65, 0.09, 0.46, wood);
  for (const z of [980, 1060])
    gardenBox(1140, z, 0.35, 0.08, 0.45, 0.23, metal);
  // Merge static parts by material, keeping the roof independently removable.
  for (const [parent, materials] of batches)
    for (const [material, geometries] of materials) {
      const merged = mergeGeometries(geometries, false);
      if (!merged)
        throw Error("Die Modellgeometrie konnte nicht verbunden werden.");
      const object = new T.Mesh(merged, material);
      object.castShadow = material !== glass;
      object.receiveShadow = true;
      parent.add(object);
      for (const g of geometries) g.dispose();
    }
  return { root, roof, building, garden, lawn };
}
