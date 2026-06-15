import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { useGameStore } from '../stores/gameStore';
import { getRandomArtifactForSite, getArtifactById } from '../data/artifacts';
import { ArrowLeft, Hammer, Wrench, Archive } from 'lucide-react';
import * as THREE from 'three';
import type { SiteType, FragmentData } from '../types';

const CELL_SIZE = 58;
const GAP = 3;

const SITE_COLORS: Record<SiteType, {
  bg: string;
  stop1: string;
  stop2: string;
  dust: number[][];
}> = {
  desert: {
    bg: 'linear-gradient(135deg,#2a1810 0%,#3d2415 50%,#5a3620 100%)',
    stop1: '#f4a460',
    stop2: '#cd853f',
    dust: [
      [0.83, 0.65, 0.45],
      [0.91, 0.78, 0.6],
      [0.76, 0.58, 0.42],
      [0.72, 0.53, 0.36],
    ],
  },
  jungle: {
    bg: 'linear-gradient(135deg,#0f1e10 0%,#1a3320 50%,#2d4a2e 100%)',
    stop1: '#556b2f',
    stop2: '#2f4f2f',
    dust: [
      [0.42, 0.56, 0.31],
      [0.29, 0.4, 0.25],
      [0.36, 0.48, 0.32],
      [0.48, 0.61, 0.41],
    ],
  },
  ocean: {
    bg: 'linear-gradient(135deg,#0a1a2e 0%,#12294a 50%,#1e3a5f 100%)',
    stop1: '#4682b4',
    stop2: '#1e90ff',
    dust: [
      [0.37, 0.66, 0.83],
      [0.53, 0.81, 0.92],
      [0.29, 0.56, 0.72],
      [0.42, 0.68, 0.84],
    ],
  },
};

const getCellColor = (row: number, col: number, site: SiteType): string => {
  const conf = SITE_COLORS[site];
  const seed = (row * 13 + col * 7) % 100;
  const opacity = 0.5 + (seed % 50) / 100;
  const a = parseInt(conf.stop1.slice(1), 16);
  const b = parseInt(conf.stop2.slice(1), 16);
  const ar = (a >> 16) & 0xff;
  const ag = (a >> 8) & 0xff;
  const ab = a & 0xff;
  const br = (b >> 16) & 0xff;
  const bg = (b >> 8) & 0xff;
  const bb = b & 0xff;
  const r = Math.round(ar * (1 - opacity) + br * opacity);
  const g = Math.round(ag * (1 - opacity) + bg * opacity);
  const bl = Math.round(ab * (1 - opacity) + bb * opacity);
  return `rgb(${r},${g},${bl})`;
};

interface Burst {
  id: number;
  origin: THREE.Vector3;
  startTime: number;
  colors: number[][];
  count: number;
}

function ThreeParticleField({ burstsRef, colors }: { burstsRef: React.MutableRefObject<Burst[]>; colors: number[][] }) {
  const MAX_PARTICLES = 60;
  const pointsRef = useRef<THREE.Points>(null);
  const { scene } = useThree();
  const velocities = useRef<Float32Array | null>(null);
  const lifetimes = useRef<Float32Array | null>(null);
  void scene;
  useEffect(() => {
    if (!pointsRef.current) return;
    const geom = pointsRef.current.geometry as THREE.BufferGeometry;
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const col = new Float32Array(MAX_PARTICLES * 3);
    const size = new Float32Array(MAX_PARTICLES);
    velocities.current = new Float32Array(MAX_PARTICLES * 3);
    lifetimes.current = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      pos[i * 3] = -1000;
      pos[i * 3 + 1] = -1000;
      pos[i * 3 + 2] = -1000;
      lifetimes.current[i] = 0;
      size[i] = 0;
      col[i * 3] = 1;
      col[i * 3 + 1] = 1;
      col[i * 3 + 2] = 1;
    }
    geom.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geom.setAttribute('size', new THREE.BufferAttribute(size, 1));
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current || !velocities.current || !lifetimes.current) return;
    const geom = pointsRef.current.geometry as THREE.BufferGeometry;
    const posAttr = geom.attributes.position as THREE.BufferAttribute;
    const colAttr = geom.attributes.color as THREE.BufferAttribute;
    const sizeAttr = geom.attributes.size as THREE.BufferAttribute;
    const pos = posAttr.array as Float32Array;
    const col = colAttr.array as Float32Array;
    const size = sizeAttr.array as Float32Array;
    const vel = velocities.current;
    const life = lifetimes.current;

    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (life[i] > 0) {
        life[i] -= delta * 60;
        if (life[i] <= 0) {
          pos[i * 3] = -1000;
          pos[i * 3 + 1] = -1000;
          pos[i * 3 + 2] = -1000;
          size[i] = 0;
        } else {
            pos[i * 3] += vel[i * 3] * delta * 60;
            pos[i * 3 + 1] += vel[i * 3 + 1] * delta * 60;
            pos[i * 3 + 2] += vel[i * 3 + 2] * delta * 60;
            vel[i * 3 + 1] -= delta * 4;
            const alpha = Math.max(0, life[i] / 60);
          size[i] = 0.22 * alpha + 0.05;
          col[i * 3 + 3] = alpha;
        }
      }
    }

    while (burstsRef.current.length > 0) {
      const burst = burstsRef.current.shift()!;
      let cursor = 0;
      for (let attempt = 0; attempt < MAX_PARTICLES * 3 && cursor < burst.count; attempt++) {
        const idx = attempt % MAX_PARTICLES;
        if (life[idx] <= 0) {
          const angle = Math.random() * Math.PI * 2;
          const zenith = Math.random() * Math.PI * 0.45;
          const speed = 0.06 + Math.random() * 0.07;
          const vx = Math.cos(angle) * Math.sin(zenith) * speed;
          const vy = Math.cos(zenith) * speed + 0.05;
          const vz = Math.sin(angle) * Math.sin(zenith) * speed;
          pos[idx * 3] = burst.origin.x;
          pos[idx * 3 + 1] = burst.origin.y + 0.02;
          pos[idx * 3 + 2] = burst.origin.z;
          vel[idx * 3] = vx;
          vel[idx * 3 + 1] = vy;
          vel[idx * 3 + 2] = vz;
          life[idx] = 45 + Math.random() * 25;
          const ci = cursor % burst.colors.length;
          const c = burst.colors[ci];
          col[idx * 3] = c[0];
          col[idx * 3 + 1] = c[1];
          col[idx * 3 + 2] = c[2];
          size[idx] = 0.25;
          cursor++;
        }
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
    void state;
  });

  const mat = useMemo(() => {
    const m = new THREE.PointsMaterial({
      size: 0.25,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    return m;
  }, []);
  void colors;
  return <points ref={pointsRef} material={mat} />;
}

function FloatFragment({
  frag,
  r,
  c,
  gridSize,
}: {
  frag: FragmentData;
  r: number;
  c: number;
  gridSize: { rows: number; cols: number };
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    ref.current.position.y = 0.55 + Math.sin(t * 2.2 + c * 0.5) * 0.12;
    ref.current.rotation.y = t * 0.7 + c * 0.5;
    ref.current.rotation.z = Math.sin(t * 1.4 + r * 0.6) * 0.2;
  });
  const x = (c - gridSize.cols / 2) * (CELL_SIZE / 100);
  const z = (r - gridSize.rows / 2) * (CELL_SIZE / 100);
  return (
    <group ref={ref} position={[x, 0.55, z]}>
      <mesh>
        <icosahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial color={frag.color} flatShading roughness={0.7} metalness={0.15} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.1} />
      </mesh>
      <pointLight color="#fde68a" intensity={1.5} distance={1.5} />
    </group>
  );
}

interface ThreeGridProps {
  gridRef: React.MutableRefObject<ReturnType<typeof useGameStore.getState>['grid']>;
  onCellClick: (r: number, c: number, p: THREE.Vector3) => void;
  flareRef: React.MutableRefObject<Array<{ r: number; c: number; time: number }>>;
  floatingRef: React.MutableRefObject<
    Array<{ r: number; c: number; time: number; id: string; frag: FragmentData }>
  >;
  site: SiteType;
  gridSize: { rows: number; cols: number };
}

function ThreeGrid({ gridRef, onCellClick, flareRef, floatingRef, site, gridSize }: ThreeGridProps) {
  const cells = useMemo(() => {
    const all: { r: number; c: number; x: number; z: number }[] = [];
    const { rows, cols } = gridSize;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = (c - cols / 2) * (CELL_SIZE / 100);
        const z = (r - rows / 2) * (CELL_SIZE / 100);
        all.push({ r, c, x, z });
      }
    }
    return all;
  }, [gridSize]);

  const groupRef = useRef<THREE.Group>(null);
  const meshMap = useRef<Map<string, THREE.Mesh>>(new Map());

  const [, forceTick] = useState(0);
  useFrame((_, delta) => {
    const now = Date.now();
    let changed = false;
    flareRef.current.forEach((f) => {
      if (now - f.time > 500) {
        flareRef.current = flareRef.current.filter((x) => x !== f);
        changed = true;
      }
    });
    if (changed) forceTick((v) => v + 1);

    meshMap.current.forEach((mesh, key) => {
      const mat = mesh.material as THREE.MeshStandardMaterial;
      const [r, c] = key.split('_').map(Number);
      const st = flareRef.current.find((f) => f.r === r && f.c === c);
      if (st) {
        const t = (now - st.time) / 500;
        const emissive = Math.sin(t * Math.PI);
        mat.emissiveIntensity = emissive * 3;
        mat.opacity = 0.6 + Math.sin(now / 80 + r * 0.3 + c * 0.4) * 0.02;
      } else {
        mat.emissiveIntensity = 0;
      }
    });
    void delta;
  });

  return (
    <group ref={groupRef}>
      {cells.map(({ r, c, x, z }) => {
        const color = getCellColor(r, c, site);
        const key = `${r}_${c}`;
        return (
          <mesh
            key={key}
            ref={(el) => {
              if (el) meshMap.current.set(key, el);
              else meshMap.current.delete(key);
            }}
            position={[x, 0, z]}
            onPointerDown={(ev) => {
              ev.stopPropagation();
              const gridStoreState = useGameStore.getState();
              const cell = gridRef.current[r]?.[c];
              if (!cell || cell.excavated) return;
              const gridCopy = gridRef.current.map((row) => row.map((cc) => ({ ...cc })));
              gridCopy[r][c].excavated = true;
              gridRef.current = gridCopy;
              onCellClick(r, c, new THREE.Vector3(x, 0.1, z));
            }}
          >
            <boxGeometry args={[CELL_SIZE / 100 - 0.02, 0.04, CELL_SIZE / 100 - 0.02]} />
            <meshStandardMaterial
              color={color}
              metalness={0.08}
              roughness={0.85}
              transparent
              emissive={'#ffffff'}
              emissiveIntensity={0}
            />
          </mesh>
        );
      })}
      {floatingRef.current.map((f, i) => (
        <FloatFragment key={`float-${f.id}-${i}`} frag={f.frag} r={f.r} c={f.c} gridSize={gridSize} />
      ))}
    </group>
  );
}

export default function DigSite() {
  const { site } = useParams<{ site: string }>();
  const navigate = useNavigate();
  const gridSize = useGameStore((s) => s.gridSize);
  const excavatedFragments = useGameStore((s) => s.excavatedFragments);
  const addFragment = useGameStore((s) => s.addFragment);
  const initGrid = useGameStore((s) => s.initGrid);
  const currentArtifactId = useGameStore((s) => s.currentArtifactId);
  const setCurrentArtifactId = useGameStore((s) => s.setCurrentArtifactId);
  const startDigTimer = useGameStore((s) => s.startDigTimer);
  const digStartTime = useGameStore((s) => s.digStartTime);
  const [elapsed, setElapsed] = useState(0);
  const [initialized, setInitialized] = useState(false);

  const burstsRef = useRef<Burst[]>([]);
  const flareRef = useRef<{ r: number; c: number; time: number }[]>([]);
  const floatingRef = useRef<Array<{ r: number; c: number; time: number; id: string; frag: FragmentData }>>([]);
  const gridStoreRef = useRef<ReturnType<typeof useGameStore.getState>['grid']>(useGameStore.getState().grid);
  const [tick, setTick] = useState(0);

  const siteType = (site as SiteType) ?? 'desert';
  const conf = SITE_COLORS[siteType];

  useEffect(() => {
    if (initialized) return;
    if (!site) return;
    const artifact = getRandomArtifactForSite(site as SiteType);
    setCurrentArtifactId(artifact.id);
    initGrid(artifact.fragments);
    startDigTimer();
    gridStoreRef.current = useGameStore.getState().grid;
    setInitialized(true);
  }, [site, initialized, initGrid, setCurrentArtifactId, startDigTimer]);

  useEffect(() => {
    const t = setInterval(() => {
      setTick((v) => v + 1);
      if (digStartTime) setElapsed(Math.floor((Date.now() - digStartTime) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [digStartTime]);

  const onCellClick = (r: number, c: number, worldPos: THREE.Vector3) => {
    const cell = gridStoreRef.current[r][c];
    const burstCount = 10 + Math.floor(Math.random() * 6);
    burstsRef.current.push({
      id: Date.now() + Math.random(),
      origin: worldPos.clone().setY(0.12),
      startTime: performance.now() / 1000,
      colors: conf.dust,
      count: burstCount,
    });

    if (cell.hasFragment && cell.fragmentId) {
      flareRef.current.push({ r, c, time: Date.now() });
      const art = currentArtifactId ? getArtifactById(currentArtifactId) : null;
      const frag = art?.fragments.find((f) => f.id === cell.fragmentId);
      if (frag) {
        addFragment(frag);
        floatingRef.current.push({ r, c, time: Date.now(), id: frag.id, frag });
      }
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const ss = s % 60;
    return `${m.toString().padStart(2, '0')}:${ss.toString().padStart(2, '0')}`;
  };
  void tick;

  const digProgress = useMemo(() => {
    const total = gridSize.rows * gridSize.cols;
    let done = 0;
    const g = gridStoreRef.current;
    for (const row of g) for (const c of row) if (c.excavated) done++;
    return Math.round((done / total) * 100);
  }, [gridSize, tick]);

  const camPos: [number, number, number] = [0, 8.5, 9.2];

  return (
    <div className="min-h-screen w-full relative overflow-hidden" style={{ background: conf.bg }}>
      <header className="relative z-10 max-w-7xl mx-auto px-5 py-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 h-10 rounded-xl bg-black/30 backdrop-blur hover:bg-black/50 text-amber-100 transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-[Lora] text-sm">返回</span>
        </button>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 backdrop-blur">
            <Hammer className="w-4 h-4 text-amber-300" />
            <span className="font-[Cinzel] text-sm text-amber-100">
              {siteType === 'desert' ? '金沙大漠' : siteType === 'jungle' ? '密境丛林' : '深蓝秘境'}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black/30 backdrop-blur">
            <Wrench className="w-4 h-4 text-amber-300" />
            <span className="font-[Cinzel] text-sm text-amber-100">挖掘进度 {digProgress}%</span>
          </div>
          <div className="px-4 py-2 rounded-xl bg-black/30 backdrop-blur font-[Cinzel] text-amber-100 tracking-wider text-lg">
            ⏱ {formatTime(elapsed)}
          </div>
        </div>
        <button
          onClick={() => navigate('/workbench')}
          disabled={excavatedFragments.length === 0}
          className="group flex items-center gap-2 px-5 h-11 rounded-xl text-white transition-all duration-200 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg,#b45309,#d97706)',
            boxShadow: excavatedFragments.length > 0 ? '0 10px 30px -8px rgba(217,119,6,0.5)' : 'none',
          }}
        >
          <Archive className="w-5 h-5" />
          <span className="font-[Cinzel] font-semibold">修复工作台 ({excavatedFragments.length})</span>
        </button>
      </header>

      <div className="relative max-w-6xl mx-auto px-5" style={{ height: '70vh' }}>
        <Canvas camera={{ position: camPos, fov: 45 }} shadows dpr={[1, 1.6]} gl={{ alpha: true }}>
          <ambientLight intensity={0.55} />
          <directionalLight castShadow position={[4, 10, 5]} intensity={0.9} />
          <pointLight position={[-5, 4, 3]} intensity={0.5} color={siteType === 'ocean' ? '#93c5fd' : '#fde68a'} />
          <fog attach="fog" args={[new THREE.Color(0, 0, 0.02), 14, 30]} />
          <ThreeGrid
            gridRef={gridStoreRef}
            onCellClick={onCellClick}
            flareRef={flareRef}
            floatingRef={floatingRef}
            site={siteType}
            gridSize={gridSize}
          />
          <ThreeParticleField burstsRef={burstsRef} colors={conf.dust} />
          <OrbitControls
            enablePan={false} minDistance={4} maxDistance={18} minPolarAngle={0.3} maxPolarAngle={Math.PI / 2.2}
          />
          {excavatedFragments.length > 0 && (
            <Text
              position={[0, 4, 0]}
              fontSize={0.25}
              color="#fde68a"
              anchorX="center"
              anchorY="middle"
            >
              ✦ 发现碎片 ✦
            </Text>
          )}
        </Canvas>
      </div>

      <div className="relative z-10 mt-4 text-center max-w-xl mx-auto px-5">
        <p className="font-[Lora] text-amber-100/70 text-base leading-relaxed">
          点击土层方块进行挖掘 · Three.js 粒子系统模拟碎土飞溅 · 发现碎片后将金色浮动在网格上方
        </p>
      </div>
    </div>
  );
}
