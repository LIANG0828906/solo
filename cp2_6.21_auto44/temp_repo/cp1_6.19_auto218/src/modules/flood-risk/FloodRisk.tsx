import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useFloodStore } from '@/store/useFloodStore';
import {
  GRID_SIZE,
  CELL_SIZE,
  SCENE_HALF,
  waterDepthToColor,
} from '@/modules/flood-risk/floodCalculator';

export function FloodRisk() {
  const meshRef = useRef<THREE.Mesh>(null);
  const colorsRef = useRef<Float32Array | null>(null);

  const initialColors = useMemo(() => {
    const total = GRID_SIZE * GRID_SIZE;
    const c = new Float32Array(total * 4);
    for (let i = 0; i < total; i++) {
      c[i * 4 + 0] = 0.53;
      c[i * 4 + 1] = 0.81;
      c[i * 4 + 2] = 0.92;
      c[i * 4 + 3] = 0;
    }
    return c;
  }, []);

  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(
      GRID_SIZE * CELL_SIZE,
      GRID_SIZE * CELL_SIZE,
      GRID_SIZE - 1,
      GRID_SIZE - 1,
    );
    g.rotateX(-Math.PI / 2);
    const uvs = g.attributes.uv as THREE.BufferAttribute;
    const colors = new Float32Array(uvs.count * 4);
    for (let i = 0; i < uvs.count; i++) {
      colors[i * 4] = 0.53;
      colors[i * 4 + 1] = 0.81;
      colors[i * 4 + 2] = 0.92;
      colors[i * 4 + 3] = 0;
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 4));
    return g;
  }, []);

  useFrame(() => {
    const state = useFloodStore.getState();
    if (!meshRef.current || state.rainElapsedSeconds < 3) return;

    const geom = meshRef.current.geometry as THREE.BufferGeometry;
    const colorAttr = geom.attributes.color as THREE.BufferAttribute;
    if (!colorAttr) return;

    const grid = state.grid;
    const colorArr = colorAttr.array as Float32Array;

    for (let gy = 0; gy < GRID_SIZE; gy++) {
      for (let gx = 0; gx < GRID_SIZE; gx++) {
        const cell = grid[gy][gx];
        const { r, g, b, a } = waterDepthToColor(cell.waterDepth);
        const vi = gy * GRID_SIZE + gx;
        const idx = vi * 4;
        colorArr[idx] = r;
        colorArr[idx + 1] = g;
        colorArr[idx + 2] = b;
        colorArr[idx + 3] = a * 0.6;
      }
    }
    colorAttr.needsUpdate = true;
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={[0, 0.15, 0]}
      renderOrder={2}
    >
      <meshBasicMaterial
        vertexColors
        transparent
        opacity={0.6}
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
