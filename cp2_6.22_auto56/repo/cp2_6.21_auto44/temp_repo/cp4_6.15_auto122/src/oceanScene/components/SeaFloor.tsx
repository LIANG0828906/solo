import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function generateTerrainGeometry(): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(85, 85, 64, 64);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r = Math.sqrt(x * x + y * y);
    const edgeFactor = Math.max(0, (r - 22) / 20);
    const edgeDrop = -edgeFactor * edgeFactor * 40;
    const h =
      Math.sin(x * 0.32) * 1.8 +
      Math.cos(y * 0.26) * 1.4 +
      Math.sin((x + y) * 0.16) * 2.2 +
      Math.sin((x * 0.6 - y * 0.4)) * 0.9 +
      Math.random() * 0.8 +
      edgeDrop;
    pos.setZ(i, h);
  }
  geo.computeVertexNormals();
  return geo;
}

const CORAL_COLORS = [
  '#ff6b6b',
  '#ffa07a',
  '#ff8c42',
  '#e056a0',
  '#c44dff',
  '#ffb347',
  '#ee6c4d',
];

interface CoralProps {
  position: [number, number, number];
  color: string;
  seed: number;
}

function Coral({ position, color, seed }: CoralProps) {
  const rand = (n: number) => {
    const s = Math.sin(seed * 9999 + n * 137.5) * 10000;
    return s - Math.floor(s);
  };

  const segments = 2 + Math.floor(rand(1) * 3);
  const totalHeight = 0.8 + rand(2) * 2.0;
  const topRadius = 0.12 + rand(3) * 0.22;

  const segs: {
    h: number;
    y: number;
    rTop: number;
    rBot: number;
    color: string;
  }[] = [];

  let cumY = 0;
  let botR = 0.32;
  for (let s = 0; s < segments; s++) {
    const segH = totalHeight / segments;
    const topR = botR * (0.65 + rand(s + 10) * 0.15);
    segs.push({
      h: segH,
      y: cumY + segH / 2,
      rTop: topR,
      rBot: botR,
      color,
    });
    cumY += segH;
    botR = topR;
  }

  return (
    <group position={position} rotation={[0, rand(99) * Math.PI * 2, 0]}>
      {segs.map((seg, idx) => (
        <mesh key={idx} position={[0, seg.y, 0]}>
          <cylinderGeometry args={[seg.rTop, seg.rBot, seg.h, 5, 1, false]} />
          <meshStandardMaterial color={seg.color} flatShading roughness={0.65} metalness={0.05} />
        </mesh>
      ))}
      <mesh position={[0, totalHeight + topRadius, 0]}>
        <sphereGeometry args={[topRadius + 0.1, 7, 5]} />
        <meshStandardMaterial
          color={color}
          flatShading
          emissive={color}
          emissiveIntensity={0.22}
          roughness={0.55}
        />
      </mesh>
    </group>
  );
}

interface RockProps {
  position: [number, number, number];
  scale: number;
  rot: [number, number, number];
  variant: number;
}

function Rock({ position, scale, rot, variant }: RockProps) {
  return (
    <mesh
      position={position}
      scale={[scale, scale * 0.55, scale]}
      rotation={rot}
    >
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color={variant % 2 === 0 ? '#3a3a3a' : '#2f2f2f'}
        flatShading
        roughness={0.95}
        metalness={0.03}
      />
    </mesh>
  );
}

interface SandProps {
  position: [number, number, number];
  color: string;
  scale: number;
}

function SandGrain({ position, color, scale }: SandProps) {
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry args={[1, 0.25, 1]} />
      <meshStandardMaterial color={color} flatShading roughness={1} metalness={0} />
    </mesh>
  );
}

const SAND_COLORS = ['#e6c384', '#d4a855', '#c4915a', '#a87a44', '#b8915e'];

export default function SeaFloor() {
  const terrain = useMemo(() => generateTerrainGeometry(), []);

  const corals = useMemo(() => {
    const items: { position: [number, number, number]; color: string; seed: number }[] = [];
    const rand = seeded(12345);
    for (let i = 0; i < 32; i++) {
      const x = (rand() - 0.5) * 55;
      const z = (rand() - 0.5) * 55;
      const r = Math.sqrt(x * x + z * z);
      if (r > 30) continue;
      items.push({
        position: [x, -25 + Math.sin(x * 0.32) * 1.8 + Math.cos(z * 0.26) * 1.4, z],
        color: CORAL_COLORS[Math.floor(rand() * CORAL_COLORS.length)],
        seed: Math.floor(rand() * 9999),
      });
    }
    return items;
  }, []);

  const rocks = useMemo(() => {
    const items: { position: [number, number, number]; scale: number; rot: [number, number, number]; variant: number }[] = [];
    const rand = seeded(54321);
    for (let i = 0; i < 20; i++) {
      const x = (rand() - 0.5) * 65;
      const z = (rand() - 0.5) * 65;
      items.push({
        position: [x, -24.6 + Math.sin(x * 0.32) * 1.8, z],
        scale: 0.6 + rand() * 1.8,
        rot: [rand() * Math.PI * 0.4 - 0.2, rand() * Math.PI * 2, rand() * Math.PI * 0.3 - 0.15],
        variant: Math.floor(rand() * 100),
      });
    }
    return items;
  }, []);

  const sands = useMemo(() => {
    const items: { position: [number, number, number]; color: string; scale: number }[] = [];
    const rand = seeded(99999);
    for (let i = 0; i < 55; i++) {
      const x = (rand() - 0.5) * 60;
      const z = (rand() - 0.5) * 60;
      items.push({
        position: [x, -25 + 0.05 + Math.sin(x * 0.32) * 1.8, z],
        color: SAND_COLORS[Math.floor(rand() * SAND_COLORS.length)],
        scale: 0.25 + rand() * 0.6,
      });
    }
    return items;
  }, []);

  const terrainRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      <mesh
        ref={terrainRef}
        geometry={terrain}
        position={[0, -25, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshStandardMaterial
          color="#2a1f0e"
          flatShading
          roughness={1}
          metalness={0}
        />
      </mesh>

      {corals.map((c, i) => (
        <Coral key={`coral-${i}`} position={c.position} color={c.color} seed={c.seed} />
      ))}
      {rocks.map((r, i) => (
        <Rock key={`rock-${i}`} position={r.position} scale={r.scale} rot={r.rot} variant={r.variant} />
      ))}
      {sands.map((s, i) => (
        <SandGrain key={`sand-${i}`} position={s.position} color={s.color} scale={s.scale} />
      ))}
    </group>
  );
}

function seeded(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}
