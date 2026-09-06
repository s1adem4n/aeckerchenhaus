import { useEffect, useRef, useState } from "react";
import * as T from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { buildHouse, places, point, scale, type Place } from "./house";

export type ViewMode = "outside" | "inside" | "plan";
export type SceneActions = {
  go: (place: Place, mode: ViewMode) => void;
  turn: (direction: number) => void;
  zoom: (direction: number) => void;
  reset: () => void;
  exportModel: () => Promise<ArrayBuffer>;
  inspect: () => unknown;
};
export function HouseScene({
  onReady,
  onChoose,
}: {
  onReady: (actions: SceneActions) => void;
  onChoose: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const markerRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [error, setError] = useState(false);
  const onChooseRef = useRef(onChoose);
  const onReadyRef = useRef(onReady);
  useEffect(() => {
    onChooseRef.current = onChoose;
    onReadyRef.current = onReady;
  }, [onChoose, onReady]);
  useEffect(() => {
    const container = containerRef.current!;
    let renderer: T.WebGLRenderer;
    try {
      renderer = new T.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      const frame = requestAnimationFrame(() => setError(true));
      return () => cancelAnimationFrame(frame);
    }
    renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = T.PCFSoftShadowMap;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.95;
    renderer.domElement.setAttribute(
      "aria-label",
      "Hausansicht. Mit den Pfeiltasten umsehen, mit Plus und Minus vergrößern.",
    );
    renderer.domElement.tabIndex = 0;
    container.prepend(renderer.domElement);
    const scene = new T.Scene();
    scene.background = new T.Color("#e5e5d9");
    scene.fog = new T.Fog("#e5e5d9", 55, 110);
    const camera = new T.PerspectiveCamera(43, 1, 0.025, 160);
    camera.position.set(24, 16, 25);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI / 2 - 0.035;
    controls.minDistance = 12;
    controls.maxDistance = 55;
    controls.target.set(1, 1.5, 0);
    const env = new RoomEnvironment();
    const pmrem = new T.PMREMGenerator(renderer);
    const environment = pmrem.fromScene(env, 0.04);
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.28;
    env.dispose();
    pmrem.dispose();
    const hemi = new T.HemisphereLight("#fff5df", "#8b9876", 1.5);
    scene.add(hemi);
    const sun = new T.DirectionalLight("#fff1e2", 2.7);
    sun.position.set(-12, 23, 16);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, {
      left: -26,
      right: 26,
      top: 26,
      bottom: -26,
      near: 1,
      far: 70,
    });
    sun.shadow.normalBias = 0.025;
    sun.shadow.bias = -0.00015;
    sun.shadow.radius = 3;
    scene.add(sun);
    const model = buildHouse();
    scene.add(model.root);
    for(const [x,z] of [[600,1110],[590,1400],[780,410],[460,500]]){
      const light = new T.PointLight('#fff4df', 7, 7, 2);
      light.position.copy(point(x,z,2.35));scene.add(light);
    }
    const ground = new T.Mesh(new T.PlaneGeometry(240, 240), model.lawn);
    const groundUV = ground.geometry.getAttribute("uv");
    for (let i = 0; i < groundUV.count; i++)
      groundUV.setXY(i, groundUV.getX(i) * 240, groundUV.getY(i) * 240);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.075;
    ground.receiveShadow = true;
    scene.add(ground);
    let mode: ViewMode = "outside",
      current = places[0],
      transition = 0;
    const fromEye = new T.Vector3(),
      fromTarget = new T.Vector3(),
      toEye = camera.position.clone(),
      toTarget = controls.target.clone();
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const setLimits = () => {
      const inside = mode === "inside" || current.id === "terrasse";
      controls.minDistance = inside ? 0.025 : mode === "plan" ? 15 : 12;
      controls.maxDistance = inside ? 0.025 : 55;
      controls.enableZoom = !inside;
      controls.rotateSpeed = inside ? -0.42 : 0.65;
      controls.minPolarAngle = 0.04;
      controls.maxPolarAngle = inside ? Math.PI - 0.05 : Math.PI / 2 - 0.035;
      controls.enabled = true;
    };
    const go = (place: Place, nextMode: ViewMode) => {
      current = place;
      mode = nextMode;
      camera.fov = mode === "inside" || place.id === "terrasse" ? 72 : camera.aspect < 1 ? 70 : 43;
      camera.updateProjectionMatrix();
      model.roof.visible = mode !== "plan";
      controls.enabled = false;
      fromEye.copy(camera.position);
      fromTarget.copy(controls.target);
      if (mode === "plan") {
        toEye.set(0, 35, 0.3);
        toTarget.set(0, 0, 0);
      } else if (place.id === "garten") {
        toEye.set(24, 16, 25);
        toTarget.set(1, 1.5, 0);
      } else {
        toEye.copy(point(place.position[0], place.position[1], 1.62));
        const look = point(place.target[0], place.target[1], 1.1)
          .sub(toEye)
          .normalize();
        toTarget.copy(toEye).addScaledVector(look, 0.025);
      }
      transition = reduced ? performance.now() - 1200 : performance.now();
    };
    const turn = (direction: number) => {
      if (transition) return;
      const inside = mode === "inside" || current.id === "terrasse";
      const pivot = inside ? camera.position : controls.target;
      const moving = inside ? controls.target : camera.position;
      moving
        .sub(pivot)
        .applyAxisAngle(new T.Vector3(0, 1, 0), direction * 0.22)
        .add(pivot);
      controls.update();
    };
    const zoom = (direction: number) => {
      if (transition || mode === "inside" || current.id === "terrasse") return;
      const v = camera.position.clone().sub(controls.target);
      v.setLength(
        T.MathUtils.clamp(
          v.length() * (direction > 0 ? 0.85 : 1.18),
          controls.minDistance,
          controls.maxDistance,
        ),
      );
      camera.position.copy(controls.target).add(v);
      controls.update();
    };
    const actions: SceneActions = {
      inspect: () => {
        model.root.updateMatrixWorld(true);
        const fixtures:unknown[]=[],doorLeaves:unknown[]=[];
        model.root.traverse(o=>{
          if(o.userData.kind==='door'){
            const leaf=o.getObjectByName('Türblatt mit Beschlägen')!;
            const {direction,leafWidth}=leaf.userData;
            const footprint=[[0,-.0175],[direction*leafWidth,-.0175],[direction*leafWidth,.0175],[0,.0175]].map(([x,z])=>{const p=leaf.localToWorld(new T.Vector3(x,0,z));return [p.x/scale+550,p.z/scale+900]});
            doorLeaves.push({name:o.name,footprint});
          }
          if(o.userData.kind!=='furniture')return;
          const bounds=new T.Box3();
          o.children.forEach(child=>{if(child instanceof T.Mesh){child.geometry.computeBoundingBox();bounds.union(child.geometry.boundingBox!)}});
          const footprint=[[bounds.min.x,bounds.min.z],[bounds.max.x,bounds.min.z],[bounds.max.x,bounds.max.z],[bounds.min.x,bounds.max.z]].map(([x,z])=>{const p=o.localToWorld(new T.Vector3(x,0,z));return [p.x/scale+550,p.z/scale+900]});
          const front=new T.Vector3(0,0,-1).applyQuaternion(o.getWorldQuaternion(new T.Quaternion()));
          const parts=(o.userData.parts as {min:number[],max:number[]}[]).map(part=>({...part,footprint:[[part.min[0],part.min[2]],[part.max[0],part.min[2]],[part.max[0],part.max[2]],[part.min[0],part.max[2]]].map(([x,z])=>{const p=o.localToWorld(new T.Vector3(x,0,z));return [p.x/scale+550,p.z/scale+900]})}));
          fixtures.push({name:o.name,...o.userData,parts,footprint,front:[front.x,front.z],center:[o.position.x/scale+550,o.position.z/scale+900]});
        });
        return {fixtures,doorLeaves};
      },
      go,
      turn,
      zoom,
      reset: () => go(current, mode),
      exportModel: async () => {
        const { GLTFExporter } =
          await import("three/addons/exporters/GLTFExporter.js");
        const visible = model.roof.visible;
        model.roof.visible = true;
        try {
          return (await new GLTFExporter().parseAsync(model.root, {
            binary: true,
          })) as ArrayBuffer;
        } finally {
          model.roof.visible = visible;
        }
      },
    };
    onReadyRef.current(actions);
    // Available in development for reproducible Blender export and browser checks.
    if (import.meta.env.DEV) Object.assign(window, { houseActions: actions });
    const key = (e: KeyboardEvent) => {
      if (["ArrowLeft", "ArrowRight", "+", "-", "Home"].includes(e.key)) {
        e.preventDefault();
        if (e.key === "Home") actions.reset();
        else if (e.key === "+" || e.key === "-") zoom(e.key === "+" ? 1 : -1);
        else turn(e.key === "ArrowLeft" ? 1 : -1);
      }
    };
    renderer.domElement.addEventListener("keydown", key);
    const resize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.fov = mode === "inside" || current.id === "terrasse" ? 72 : camera.aspect < 1 ? 70 : 43;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight, false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    const markerPositions = [point(818, 1190, 0.8), point(709, 1080, 1.45)];
    renderer.setAnimationLoop((time) => {
      if (transition) {
        const t = Math.min((time - transition) / 1100, 1);
        const ease = t * t * (3 - 2 * t);
        camera.position.lerpVectors(fromEye, toEye, ease);
        controls.target.lerpVectors(fromTarget, toTarget, ease);
        camera.lookAt(controls.target);
        if (t >= 1) {
          transition = 0;
          setLimits();
        }
      } else controls.update();
      markerRefs.current.forEach((el, i) => {
        if (!el) return;
        const p = markerPositions[i].clone().project(camera);
        const visible =
          mode === "outside" &&
          current.id === "garten" &&
          p.z < 1 &&
          Math.abs(p.x) < 0.9 &&
          Math.abs(p.y) < 0.85 &&
          !transition;
        el.style.display = visible ? "flex" : "none";
        el.style.left = `${(p.x * 0.5 + 0.5) * 100}%`;
        el.style.top = `${(-p.y * 0.5 + 0.5) * 100}%`;
      });
      renderer.render(scene, camera);
    });
    return () => {
      observer.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      environment.dispose();
      const materials = new Set<T.Material>(),
        textures = new Set<T.Texture>();
      scene.traverse((o) => {
        if (o instanceof T.Mesh) {
          o.geometry.dispose();
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            materials.add(m);
        }
      });
      materials.forEach((m) => {
        Object.values(m).forEach((v) => {
          if (v instanceof T.Texture) textures.add(v);
        });
        m.dispose();
      });
      textures.forEach((t) => t.dispose());
      renderer.dispose();
      renderer.domElement.removeEventListener("keydown", key);
      renderer.domElement.remove();
      if (import.meta.env.DEV)
        delete (window as Window & { houseActions?: SceneActions })
          .houseActions;
    };
  }, []);
  return (
    <div className="scene" ref={containerRef}>
      {error && (
        <div className="scene-error">
          <img
            src={`${import.meta.env.BASE_URL}reference/architektur.jpg`}
            alt="Architektenbild des Hauses mit Terrasse und Naturgarten"
          />
          <p>
            Die 3D-Ansicht ist auf diesem Gerät nicht verfügbar. Den Grundriss
            und das Architektenbild kannst du weiterhin ansehen.
          </p>
        </div>
      )}
      {["terrasse", "wohnen"].map((id, i) => (
        <button
          key={id}
          ref={(el) => {
            markerRefs.current[i] = el;
          }}
          className="scene-marker"
          onClick={() => onChooseRef.current(id)}
        >
          <span>↗</span>
          {i === 0 ? "Zur Terrasse" : "Ins Wohnzimmer"}
        </button>
      ))}
    </div>
  );
}
