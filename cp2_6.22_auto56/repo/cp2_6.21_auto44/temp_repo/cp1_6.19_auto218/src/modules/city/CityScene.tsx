import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { GRID_SIZE, CELL_SIZE, SCENE_HALF } from '@/modules/flood-risk/floodCalculator';

const BUILDING_COUNT = 50;
const TREE_COUNT = 24;

interface BuildingData {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  texture: THREE.CanvasTexture;
}

interface TreeData {
  x: number;
  z: number;
  scale: number;
}

function makeWindowTexture(seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#2C3548';
  ctx.fillRect(0, 0, 128, 256);

  const rand = (i: number) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 233280;
    return x - Math.floor(x);
  };

  const cols = 4;
  const rows = 10;
  const cw = 128 / cols;
  const rh = 256 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = rand(r * cols + c) > 0.45;
      ctx.fillStyle = lit
        ? `rgba(${200 + Math.floor(rand(c) * 55)}, ${200 + Math.floor(rand(r) * 40)}, ${120 + Math.floor(rand(r + c) * 80)}, 1)`
        : 'rgba(30, 40, 60, 1)';
      const pad = 4;
      ctx.fillRect(c * cw + pad, r * rh + pad, cw - pad * 2, rh - pad * 2);
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  return tex;
}

function useBuildings(): BuildingData[] {
  return useMemo(() => {
    const list: BuildingData[] = [];
    const occupied: Array<{ x: number; z: number; r: number }> = [];
    const tries = 600;
    for (let i = 0; i < tries && list.length < BUILDING_COUNT; i++) {
      const margin = SCENE_HALF * 0.15;
      const x = (Math.random() - 0.5) * (SCENE_HALF * 2 - margin * 2);
      const z = (Math.random() - 0.5) * (SCENE_HALF * 2 - margin * 2);
      const w = 3 + Math.random() * 5;
      const d = 3 + Math.random() * 5;
      const r = Math.max(w, d) / 2 + 1;
      let overlap = false;
      for (const o of occupied) {
        const dx = o.x - x;
        const dz = o.z - z;
        if (Math.sqrt(dx * dx + dz * dz) < o.r + r) {
          overlap = true;
          break;
        }
      }
      if (!overlap) {
        occupied.push({ x, z, r });
        list.push({
          x,
          z,
          w,
          d,
          h: 10 + Math.random() * 70,
          texture: makeWindowTexture(i + 1),
        });
      }
    }
    return list;
  }, []);
}

function useTrees(): TreeData[] {
  return useMemo(() => {
    const list: TreeData[] = [];
    const positions = new Set<string>();
    let tries = 0;
    while (list.length < TREE_COUNT && tries < 500) {
      tries++;
      const angle = Math.random() * Math.PI * 2;
      const radius = SCENE_HALF * (0.78 + Math.random() * 0.18);
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const key = `${Math.floor(x / 3)}_${Math.floor(z / 3)}`;
      if (positions.has(key)) continue;
      positions.add(key);
      list.push({ x, z, scale: 0.7 + Math.random() * 0.8 });
    }
    return list;
  }, []);
}

export function CityScene() {
  const buildings = useBuildings();
  const trees = useTrees();
  const groupRef = useRef<THREE.Group>(null);

  useFrame(() => {
    if (groupRef.current) {
    }
  });

  const groundSize = GRID_SIZE * CELL_SIZE;

  return (
    <group ref={groupRef}>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[groundSize, groundSize, 1, 1]} />
        <meshStandardMaterial color="#4A6572" roughness={0.9} metalness={0.05} />
      </mesh>

      <gridHelper
        args={[groundSize, GRID_SIZE, '#6B8CA3', '#546E7A']}
        position={[0, 0.01, 0]}
      />

      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial
              map={b.texture}
              color="#A0AEC0"
              roughness={0.7}
              metalness={0.15}
            />
          </mesh>
          <mesh position={[0, b.h / 2 + 0.2, 0]} castShadow>
            <boxGeometry args={[b.w * 0.9, 0.4, b.d * 0.9]} />
            <meshStandardMaterial color="#374151" roughness={0.8} />
          </mesh>
        </group>
      ))}

      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.scale}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.3, 3, 6]} />
            <meshStandardMaterial color="#5D4037" roughness={0.95} />
          </mesh>
          <mesh position={[0, 4.5, 0]} castShadow>
            <coneGeometry args={[2.2, 4, 6]} />
            <meshStandardMaterial color="#2E5D34" roughness={0.9} />
          </mesh>
          <mesh position={[0, 6.8, 0]} castShadow>
            <sphereGeometry args={[1.4, 8, 6]} />
            <meshStandardMaterial color="#3A6B3F" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
