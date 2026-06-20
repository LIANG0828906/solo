import { useMemo, useRef, useEffect, useState } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { OrbitControls, Stars, Text } from "@react-three/drei";
import { scaleSequential } from "d3-scale";
import type { OceanCurrent } from "./oceanCurrents";
import { latLngToVec3 } from "./oceanCurrents";
import type { TemperaturePoint } from "./temperatureGrid";
import { GRID_LNG, GRID_LAT } from "./temperatureGrid";
import { useStore } from "./store";

const EARTH_RADIUS = 2;
const GRID_RADIUS = 2.01;
const CURRENT_RADIUS = 2.04;
const PARTICLE_RADIUS = 2.06;
const TEXT_RADIUS = 2.1;
const TRANSITION_MS = 2000;

const TEMP_COLOR_STOPS: string[] = [
  "#001f80",
  "#0066ff",
  "#00c8ff",
  "#7cf0a0",
  "#ffdd33",
  "#ff6a1f",
  "#b30000",
];

function hexToRgbTuple(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function tempInterpolator(t: number): string {
  const tt = Math.max(0, Math.min(1, t));
  const stops = TEMP_COLOR_STOPS;
  const scaledT = tt * (stops.length - 1);
  const i = Math.floor(scaledT);
  const frac = scaledT - i;
  const a = hexToRgbTuple(stops[i]);
  const b = hexToRgbTuple(stops[Math.min(i + 1, stops.length - 1)]);
  const r = Math.round(a[0] + (b[0] - a[0]) * frac);
  const g = Math.round(a[1] + (b[1] - a[1]) * frac);
  const bl = Math.round(a[2] + (b[2] - a[2]) * frac);
  return `rgb(${r},${g},${bl})`;
}

const tempColorScale = scaleSequential<string>()
  .domain([-10, 30])
  .interpolator(tempInterpolator);

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function clamp01(t: number): number {
  return Math.max(0, Math.min(1, t));
}

interface ParticleGroupInstance {
  update: (delta: number, time: number, speed: number) => void;
}

export default function Earth() {
  const earthTexture = useLoader(
    THREE.TextureLoader,
    "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg"
  );

  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  const {
    mainCurrents,
    seasonalCurrents,
    prevSeasonalCurrents,
    temperatureGrid,
    prevTemperatureGrid,
    seasonChangeAt,
    visibleCurrents,
    highlightCurrent,
    particleSpeed,
    setCameraZoom,
  } = useStore();

  const allCurrents = useMemo(
    () => [...mainCurrents, ...seasonalCurrents],
    [mainCurrents, seasonalCurrents]
  );

  const seasonalIdsPrev = useMemo(
    () => new Set(prevSeasonalCurrents.map((c) => c.id)),
    [prevSeasonalCurrents]
  );
  const seasonalIdsCurrent = useMemo(
    () => new Set(seasonalCurrents.map((c) => c.id)),
    [seasonalCurrents]
  );

  const particleGroupsRef = useRef<ParticleGroupInstance[]>([]);
  const starTwinkleRef = useRef<THREE.Points>(null);

  const starsData = useMemo(() => {
    const count = 600;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const r = 10 + Math.random() * 6;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
      sizes[i] = 0.05 + Math.random() * 0.1;
    }
    return { positions, sizes, count };
  }, []);

  useFrame((state, delta) => {
    if (controlsRef.current) {
      const dist = camera.position.length();
      const baseDist = EARTH_RADIUS * 2.5;
      const zoom = baseDist / dist;
      setCameraZoom(zoom);
    }
    if (starTwinkleRef.current) {
      const mat = starTwinkleRef.current.material as THREE.PointsMaterial;
      const pulse = (Math.sin(state.clock.elapsedTime * 1.5) + 1) * 0.5;
      mat.opacity = 0.3 + pulse * 0.5;
    }
    const pts = particleGroupsRef.current;
    if (pts.length > 0) {
      for (let i = 0; i < pts.length; i++) {
        pts[i].update(delta, state.clock.elapsedTime, particleSpeed);
      }
    }
  });

  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[5, 3, 5]} intensity={1.1} color="#ffffff" />
      <pointLight position={[-4, -2, -3]} intensity={0.25} color="#6fa8ff" />

      <Stars
        radius={100}
        depth={50}
        count={3000}
        factor={3}
        saturation={0}
        fade
        speed={0.5}
      />
      <TwinkleStars data={starsData} twinkleRef={starTwinkleRef} />

      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshStandardMaterial
          map={earthTexture}
          roughness={0.85}
          metalness={0.1}
        />
      </mesh>

      <TemperatureGridLayer
        currentGrid={temperatureGrid}
        prevGrid={prevTemperatureGrid}
        seasonChangeAt={seasonChangeAt}
      />

      {mainCurrents.map((c) => (
        <CurrentPath
          key={c.id}
          current={c}
          visible={!!visibleCurrents[c.id]}
          highlight={highlightCurrent === c.id}
        />
      ))}

      {seasonalCurrents.map((c) => {
        const isNew = !seasonalIdsPrev.has(c.id);
        return (
          <CurrentPath
            key={c.id}
            current={c}
            visible={!!visibleCurrents[c.id]}
            highlight={highlightCurrent === c.id}
            transitionStart={isNew ? seasonChangeAt : -1}
            fadeDirection="in"
          />
        );
      })}

      {prevSeasonalCurrents.map((c) =>
        !seasonalIdsCurrent.has(c.id) ? (
          <CurrentPath
            key={`prev-${c.id}`}
            current={c}
            visible={!!visibleCurrents[c.id]}
            highlight={false}
            transitionStart={seasonChangeAt}
            fadeDirection="out"
          />
        ) : null
      )}

      <CurrentParticles
        currents={allCurrents}
        visibleCurrents={visibleCurrents}
        particleGroupsRef={particleGroupsRef}
        seasonalFade={{
          changeAt: seasonChangeAt,
          prevIds: seasonalIdsPrev,
          currentIds: seasonalIdsCurrent,
        }}
      />

      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={0.08}
        minDistance={EARTH_RADIUS * 0.5 * 2.5}
        maxDistance={EARTH_RADIUS * 5 * 2.5}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
      />
    </>
  );
}

function TwinkleStars({
  data,
  twinkleRef,
}: {
  data: { positions: Float32Array; sizes: Float32Array; count: number };
  twinkleRef: React.RefObject<THREE.Points>;
}) {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(data.positions, 3));
    return g;
  }, [data]);

  return (
    <points ref={twinkleRef} geometry={geometry}>
      <pointsMaterial
        size={0.08}
        sizeAttenuation
        transparent
        opacity={0.55}
        color="#ffffff"
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function CurrentPath({
  current,
  visible,
  highlight,
  transitionStart = -1,
  fadeDirection = "in",
}: {
  current: OceanCurrent;
  visible: boolean;
  highlight: boolean;
  transitionStart?: number;
  fadeDirection?: "in" | "out";
}) {
  const lineRef = useRef<THREE.Line>(null);
  const cameraZoom = useStore((s) => s.cameraZoom);
  const tubeRef = useRef<THREE.Mesh>(null);

  const pathPoints = useMemo(() => {
    const arr: THREE.Vector3[] = [];
    current.points.forEach((p) => {
      const [x, y, z] = latLngToVec3(p.lat, p.lng, CURRENT_RADIUS);
      arr.push(new THREE.Vector3(x, y, z));
    });
    return arr;
  }, [current]);

  const tube = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3(pathPoints, false, "catmullrom", 0.1);
    return new THREE.TubeGeometry(curve, Math.max(80, pathPoints.length * 4), 0.015, 8, false);
  }, [pathPoints]);

  const lineWidth = useMemo(() => {
    return Math.max(0.2, 0.45 / Math.max(0.3, cameraZoom));
  }, [cameraZoom]);

  useFrame(() => {
    if (tubeRef.current) {
      const mat = tubeRef.current.material as THREE.MeshBasicMaterial;
      const baseOpacity = highlight ? 0.95 : visible ? 0.7 : 0;
      let targetOpacity = baseOpacity;
      if (transitionStart > 0) {
        const t = clamp01((performance.now() - transitionStart) / TRANSITION_MS);
        targetOpacity = baseOpacity * (fadeDirection === "in" ? t : 1 - t);
      }
      mat.opacity += (targetOpacity - mat.opacity) * 0.18;
      const dynamicRadius = Math.max(0.012, (lineWidth - 0.2) * 0.04 + 0.012);
      (tubeRef.current.geometry as any).parameters &&
        ((tubeRef.current.geometry as any).parameters.radius = dynamicRadius);
    }
  });

  const colorTexture = useMemo(() => {
    const cStart = new THREE.Color(current.colorStart);
    const cEnd = new THREE.Color(current.colorEnd);
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, size, 0);
    grad.addColorStop(0, `#${cStart.getHexString()}`);
    grad.addColorStop(1, `#${cEnd.getHexString()}`);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, 1);
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }, [current]);

  return (
    <mesh ref={tubeRef} geometry={tube}>
      <meshBasicMaterial
        map={colorTexture}
        transparent
        opacity={visible ? 0.7 : 0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function CurrentParticles({
  currents,
  visibleCurrents,
  particleGroupsRef,
  seasonalFade,
}: {
  currents: OceanCurrent[];
  visibleCurrents: Record<string, boolean>;
  particleGroupsRef: React.MutableRefObject<ParticleGroupInstance[]>;
  seasonalFade: {
    changeAt: number;
    prevIds: Set<string>;
    currentIds: Set<string>;
  };
}) {
  useEffect(() => {
    particleGroupsRef.current = [];
  }, [currents, particleGroupsRef]);

  return (
    <>
      {currents.map((c) => (
        <ParticleStream
          key={c.id}
          current={c}
          visible={!!visibleCurrents[c.id]}
          registerInstance={(inst) => {
            particleGroupsRef.current.push(inst);
          }}
          seasonalFade={seasonalFade}
        />
      ))}
    </>
  );
}

function ParticleStream({
  current,
  visible,
  registerInstance,
  seasonalFade,
}: {
  current: OceanCurrent;
  visible: boolean;
  registerInstance: (inst: ParticleGroupInstance) => void;
  seasonalFade: {
    changeAt: number;
    prevIds: Set<string>;
    currentIds: Set<string>;
  };
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = 40;
  const dataRef = useRef<{
    offsets: number[];
    speeds: number[];
  } | null>(null);

  const positionsRef = useMemo(() => {
    const pts = current.points;
    const arr: THREE.Vector3[] = [];
    for (let i = 0; i < pts.length; i++) {
      const [x, y, z] = latLngToVec3(pts[i].lat, pts[i].lng, PARTICLE_RADIUS);
      arr.push(new THREE.Vector3(x, y, z));
    }
    return arr;
  }, [current]);

  const geom = useMemo(() => {
    dataRef.current = {
      offsets: Array.from({ length: particleCount }, (_, i) => i / particleCount),
      speeds: Array.from({ length: particleCount }, () => 0.6 + Math.random() * 0.8),
    };
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      colors[i * 3] = 1;
      colors[i * 3 + 1] = 1;
      colors[i * 3 + 2] = 1;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return g;
  }, [particleCount]);

  useEffect(() => {
    const inst: ParticleGroupInstance = {
      update: (delta: number, _time: number, speedMul: number) => {
        if (!pointsRef.current || !dataRef.current) return;
        const data = dataRef.current;
        const posAttr = geom.getAttribute("position") as THREE.BufferAttribute;
        const colAttr = geom.getAttribute("color") as THREE.BufferAttribute;
        const totalSegments = positionsRef.length - 1;
        if (totalSegments < 1) return;
        const cStart = new THREE.Color(current.colorStart);
        const cEnd = new THREE.Color(current.colorEnd);
        const tmpCol = new THREE.Color();

        for (let i = 0; i < particleCount; i++) {
          const step = (delta * 0.08 * data.speeds[i] * speedMul) / (totalSegments + 1);
          data.offsets[i] = (data.offsets[i] + step) % 1;
          const t = data.offsets[i] * totalSegments;
          const seg = Math.floor(t);
          const frac = t - seg;
          const a = positionsRef[seg];
          const b = positionsRef[Math.min(seg + 1, totalSegments)];
          const x = a.x + (b.x - a.x) * frac;
          const y = a.y + (b.y - a.y) * frac;
          const z = a.z + (b.z - a.z) * frac;
          (posAttr.array as Float32Array)[i * 3] = x;
          (posAttr.array as Float32Array)[i * 3 + 1] = y;
          (posAttr.array as Float32Array)[i * 3 + 2] = z;

          tmpCol.r = cStart.r + (cEnd.r - cStart.r) * data.offsets[i];
          tmpCol.g = cStart.g + (cEnd.g - cStart.g) * data.offsets[i];
          tmpCol.b = cStart.b + (cEnd.b - cStart.b) * data.offsets[i];
          (colAttr.array as Float32Array)[i * 3] = tmpCol.r;
          (colAttr.array as Float32Array)[i * 3 + 1] = tmpCol.g;
          (colAttr.array as Float32Array)[i * 3 + 2] = tmpCol.b;
        }
        posAttr.needsUpdate = true;
        colAttr.needsUpdate = true;

        const mat = pointsRef.current.material as THREE.PointsMaterial;
        let target = visible ? 0.9 : 0.0;
        if (seasonalFade.changeAt > 0) {
          const t = clamp01((performance.now() - seasonalFade.changeAt) / TRANSITION_MS);
          const wasPrev = seasonalFade.prevIds.has(current.id);
          const isCurrent = seasonalFade.currentIds.has(current.id);
          if (!wasPrev && isCurrent) target *= t;
          else if (wasPrev && !isCurrent) target *= 1 - t;
        }
        mat.opacity += (target - mat.opacity) * 0.12;
      },
    };
    registerInstance(inst);
  }, [geom, positionsRef, current, visible, registerInstance, particleCount, seasonalFade]);

  return (
    <points ref={pointsRef} geometry={geom}>
      <pointsMaterial
        size={0.06}
        sizeAttenuation
        transparent
        opacity={visible ? 0.9 : 0}
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function TemperatureGridLayer({
  currentGrid,
  prevGrid,
  seasonChangeAt,
}: {
  currentGrid: TemperaturePoint[];
  prevGrid: TemperaturePoint[];
  seasonChangeAt: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [, setTick] = useState(0);

  const { positions, colorBase, quadToGridIndex } = useMemo(() => {
    const verts: number[] = [];
    const colors: number[] = [];
    const map: number[] = [];
    for (let i = 0; i < GRID_LAT - 1; i++) {
      for (let j = 0; j < GRID_LNG - 1; j++) {
        const idxA = i * GRID_LNG + j;
        const idxB = i * GRID_LNG + j + 1;
        const idxC = (i + 1) * GRID_LNG + j;
        const idxD = (i + 1) * GRID_LNG + j + 1;
        const indices = [idxA, idxB, idxD, idxA, idxD, idxC];
        indices.forEach((idx) => {
          const p = currentGrid[idx];
          const [x, y, z] = latLngToVec3(p.lat, p.lng, GRID_RADIUS);
          verts.push(x, y, z);
          const col = new THREE.Color(tempColorScale(p.temp));
          colors.push(col.r, col.g, col.b);
          map.push(idx);
        });
      }
    }
    return { positions: verts, colorBase: colors, quadToGridIndex: map };
  }, [currentGrid]);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.Float32BufferAttribute(colorBase, 3));
    return g;
  }, [positions, colorBase]);

  useFrame(() => {
    if (!meshRef.current) return;
    const colAttr = geometry.getAttribute("color") as THREE.BufferAttribute;
    let needsUpdate = false;
    const t = clamp01((performance.now() - Math.max(0, seasonChangeAt)) / TRANSITION_MS);
    for (let vi = 0; vi < quadToGridIndex.length; vi++) {
      const idx = quadToGridIndex[vi];
      const cur = currentGrid[idx];
      const prev = prevGrid[idx] || cur;
      const tCur = seasonChangeAt > 0 ? lerp(prev.temp, cur.temp, t) : cur.temp;
      const col = new THREE.Color(tempColorScale(tCur));
      colAttr.setXYZ(vi, col.r, col.g, col.b);
      needsUpdate = true;
    }
    if (needsUpdate) colAttr.needsUpdate = true;
    if (seasonChangeAt > 0 && t < 1) setTick((x) => x + 1);
  });

  const tForText = clamp01(
    (performance.now() - Math.max(0, seasonChangeAt)) / TRANSITION_MS
  );

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial
          vertexColors
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      {currentGrid.map((p, idx) => {
        const prev = prevGrid[idx] || p;
        const displayTemp = seasonChangeAt > 0 ? lerp(prev.temp, p.temp, tForText) : p.temp;
        const [x, y, z] = latLngToVec3(p.lat, p.lng, TEXT_RADIUS);
        const col = tempColorScale(displayTemp);
        return (
          <TemperatureText
            key={idx}
            position={[x, y, z]}
            value={displayTemp}
            color={col}
          />
        );
      })}
    </group>
  );
}

function TemperatureText({
  position,
  value,
  color,
}: {
  position: [number, number, number];
  value: number;
  color: string;
}) {
  const ref = useRef<any>(null);
  const dirVec = useMemo(
    () => new THREE.Vector3(position[0], position[1], position[2]).normalize(),
    [position]
  );

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={0.05}
      color={color}
      anchorX="center"
      anchorY="middle"
      outlineWidth={0.004}
      outlineColor="#000814"
      textAlign="center"
    >
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
      {`${value.toFixed(1)}°`}
      {dirVec && null}
    </Text>
  );
}
