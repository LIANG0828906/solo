import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { createNoise2D } from 'simplex-noise';
import { useFrame } from '@react-three/fiber';

interface TerrainGeneratorProps {
  heightScale: number;
  frequency: number;
  vegetationDensity: number;
  seed: number;
}

const SEGMENTS = 128;
const SIZE = 100;

const COLOR_LOW = new THREE.Color('#1e5631');
const COLOR_MID = new THREE.Color('#3d8b40');
const COLOR_HIGH = new THREE.Color('#b08968');
const COLOR_PEAK = new THREE.Color('#6b6b6b');

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
}

function interpolateColor(heightNorm: number): THREE.Color {
  if (heightNorm < 0.33) {
    const t = heightNorm / 0.33;
    return COLOR_LOW.clone().lerp(COLOR_MID, t);
  } else if (heightNorm < 0.66) {
    const t = (heightNorm - 0.33) / 0.33;
    return COLOR_MID.clone().lerp(COLOR_HIGH, t);
  } else {
    const t = (heightNorm - 0.66) / 0.34;
    return COLOR_HIGH.clone().lerp(COLOR_PEAK, t);
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

const Vegetation: React.FC<{
  heights: Float32Array;
  density: number;
  seed: number;
  heightScale: number;
  frequency: number;
}> = ({ heights, density, seed, heightScale, frequency }) => {
  const treesRef = useRef<THREE.InstancedMesh>(null);
  const trunksRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const noise2D = useMemo(() => createNoise2D(() => seed / 1000000), [seed]);

  const treeCount = useMemo(() => {
    return Math.floor(Math.min(density, 1) * 800);
  }, [density]);

  const treeData = useMemo(() => {
    const rand = seededRandom(seed * 7919);
    const data: Array<{ x: number; z: number; scale: number; rotation: number }> = [];
    const halfSize = SIZE / 2;

    for (let i = 0; i < treeCount; i++) {
      const x = rand() * SIZE - halfSize;
      const z = rand() * SIZE - halfSize;
      const scale = 0.7 + rand() * 0.6;
      const rotation = rand() * Math.PI * 2;
      data.push({ x, z, scale, rotation });
    }
    return data;
  }, [treeCount, seed]);

  useMemo(() => {
    if (!treesRef.current || !trunksRef.current) return;

    const halfSize = SIZE / 2;
    const segStep = SIZE / SEGMENTS;

    for (let i = 0; i < treeData.length; i++) {
      const { x, z, scale, rotation } = treeData[i];

      const gx = (x + halfSize) / segStep;
      const gz = (z + halfSize) / segStep;
      const ix = Math.floor(gx);
      const iz = Math.floor(gz);
      const fx = gx - ix;
      const fz = gz - iz;

      const clampedIx = Math.max(0, Math.min(SEGMENTS, ix));
      const clampedIz = Math.max(0, Math.min(SEGMENTS, iz));
      const ix1 = Math.min(clampedIx + 1, SEGMENTS);
      const iz1 = Math.min(clampedIz + 1, SEGMENTS);

      const idx00 = clampedIz * (SEGMENTS + 1) + clampedIx;
      const idx10 = clampedIz * (SEGMENTS + 1) + ix1;
      const idx01 = iz1 * (SEGMENTS + 1) + clampedIx;
      const idx11 = iz1 * (SEGMENTS + 1) + ix1;

      const h00 = heights[idx00] * heightScale;
      const h10 = heights[idx10] * heightScale;
      const h01 = heights[idx01] * heightScale;
      const h11 = heights[idx11] * heightScale;

      const hx0 = lerp(h00, h10, fx);
      const hx1 = lerp(h01, h11, fx);
      const terrainY = lerp(hx0, hx1, fz);

      const treeHeight = 4 * scale;
      const trunkHeight = 1.5 * scale;

      dummy.position.set(x, terrainY + trunkHeight / 2, z);
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      trunksRef.current!.setMatrixAt(i, dummy.matrix);

      dummy.position.set(x, terrainY + trunkHeight + treeHeight * 0.3, z);
      dummy.rotation.set(0, rotation, 0);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      treesRef.current!.setMatrixAt(i, dummy.matrix);
    }

    treesRef.current.instanceMatrix.needsUpdate = true;
    trunksRef.current.instanceMatrix.needsUpdate = true;
  }, [treeData, heights, heightScale, dummy]);

  if (treeCount === 0) return null;

  return (
    <group>
      <instancedMesh ref={treesRef} args={[undefined, undefined, treeCount]} castShadow>
        <coneGeometry args={[1.5, 4, 6]} />
        <meshStandardMaterial color="#2d5a27" flatShading />
      </instancedMesh>
      <instancedMesh ref={trunksRef} args={[undefined, undefined, treeCount]} castShadow>
        <cylinderGeometry args={[0.2, 0.3, 1.5, 6]} />
        <meshStandardMaterial color="#4a3728" flatShading />
      </instancedMesh>
    </group>
  );
};

const TerrainGenerator: React.FC<TerrainGeneratorProps> = ({
  heightScale,
  frequency,
  vegetationDensity,
  seed,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SIZE, SIZE, SEGMENTS, SEGMENTS);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const { heights, colors } = useMemo(() => {
    const noise2D = createNoise2D(() => seed / 1000000);
    const positions = geometry.attributes.position;
    const heightsArray = new Float32Array(positions.count);
    const colorsArray = new Float32Array(positions.count * 3);

    let minH = Infinity;
    let maxH = -Infinity;

    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);

      let height = 0;
      let amp = 1;
      let freq = frequency;

      for (let octave = 0; octave < 4; octave++) {
        height += noise2D(x * freq, z * freq) * amp;
        amp *= 0.5;
        freq *= 2;
      }

      heightsArray[i] = height;
      if (height < minH) minH = height;
      if (height > maxH) maxH = height;
    }

    const range = maxH - minH || 1;

    for (let i = 0; i < positions.count; i++) {
      const normalizedHeight = (heightsArray[i] - minH) / range;
      const finalY = heightsArray[i] * heightScale;

      positions.setY(i, finalY);

      const color = interpolateColor(normalizedHeight);
      colorsArray[i * 3] = color.r;
      colorsArray[i * 3 + 1] = color.g;
      colorsArray[i * 3 + 2] = color.b;
    }

    positions.needsUpdate = true;
    geometry.computeVertexNormals();

    return { heights: heightsArray, colors: colorsArray };
  }, [geometry, seed, frequency, heightScale]);

  useMemo(() => {
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }, [geometry, colors]);

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.geometry.computeVertexNormals();
    }
  });

  return (
    <group>
      <mesh ref={meshRef} geometry={geometry} receiveShadow>
        <meshStandardMaterial
          vertexColors
          flatShading
          side={THREE.DoubleSide}
        />
      </mesh>
      <Vegetation
        heights={heights}
        density={vegetationDensity}
        seed={seed}
        heightScale={heightScale}
        frequency={frequency}
      />
    </group>
  );
};

export default TerrainGenerator;
