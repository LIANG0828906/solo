import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { WaveData, Hypocenter } from '@/types';
import { WaveSimulator } from '@/simulation/WaveSimulator';

interface SurfaceWaveProps {
  waveData: WaveData;
  hypocenter: Hypocenter;
  waveSimulator: WaveSimulator | null;
  currentTime: number;
}

const GRID_SIZE = 20;
const GRID_DIVISIONS = 40;
const RING_COUNT = 3;

export const SurfaceWave: React.FC<SurfaceWaveProps> = ({
  waveData,
  hypocenter,
  waveSimulator,
  currentTime,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRefs = useRef<(THREE.Mesh | null)[]>([]);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, GRID_DIVISIONS, GRID_DIVISIONS);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  const basePositions = useMemo(() => {
    const positions = geometry.attributes.position;
    const arr = new Float32Array(positions.array);
    return arr;
  }, [geometry]);

  useFrame(({ clock }) => {
    if (meshRef.current && waveSimulator && currentTime > 0) {
      const positions = geometry.attributes.position;
      const array = positions.array as Float32Array;

      for (let i = 0; i < positions.count; i++) {
        const x = basePositions[i * 3];
        const z = basePositions[i * 3 + 2];
        const height = waveSimulator.getTopographyHeight(x, z, currentTime);
        array[i * 3 + 1] = 5 + height;
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    } else if (meshRef.current && currentTime === 0) {
      const positions = geometry.attributes.position;
      const array = positions.array as Float32Array;
      let changed = false;
      for (let i = 0; i < positions.count; i++) {
        if (Math.abs(array[i * 3 + 1] - 5) > 0.001) {
          array[i * 3 + 1] = 5;
          changed = true;
        }
      }
      if (changed) {
        positions.needsUpdate = true;
        geometry.computeVertexNormals();
      }
    }

    const elapsed = clock.getElapsedTime();
    const surfaceRadius = waveData.surfaceWaveRadius;

    for (let i = 0; i < RING_COUNT; i++) {
      const ring = ringRefs.current[i];
      if (!ring) continue;

      if (surfaceRadius <= 0) {
        ring.scale.setScalar(0);
        const mat = ring.material as THREE.MeshBasicMaterial;
        mat.opacity = 0;
        continue;
      }

      const ringOffset = i * 0.3;
      const ringRadius = Math.max(0, surfaceRadius - ringOffset);
      const ringScale = Math.min(ringRadius, 15);

      const fadeStart = 10;
      const baseOpacity = ringRadius > fadeStart
        ? Math.max(0, 0.7 * (1 - (ringRadius - fadeStart) / 10))
        : 0.7;

      const pulse = 1 + Math.sin(elapsed * 4 + i * 1.5) * 0.08;
      ring.scale.setScalar(ringScale * pulse);
      ring.position.y = 5.05 + Math.sin(elapsed * 3 + i) * 0.02;

      const mat = ring.material as THREE.MeshBasicMaterial;
      mat.opacity = baseOpacity * (0.8 + Math.sin(elapsed * 5 + i * 2) * 0.2);
    }

    if (materialRef.current && currentTime > 0) {
      const intensity = Math.min(1, currentTime * 2);
      const r = 0.545 + intensity * 0.1;
      const g = 0.451 + intensity * 0.05;
      const b = 0.333;
      materialRef.current.color.setRGB(r, g, b);
      materialRef.current.emissive.setRGB(
        intensity * 0.15,
        intensity * 0.08,
        0
      );
    } else if (materialRef.current) {
      materialRef.current.color.setHex(0x8B7355);
      materialRef.current.emissive.setHex(0x000000);
    }
  });

  const ringElements = useMemo(() => {
    const rings = [];
    const colors = ['#ffa726', '#ff9800', '#fb8c00'];
    const innerRatios = [0.92, 0.88, 0.84];
    const outerRatios = [0.96, 0.92, 0.88];

    for (let i = 0; i < RING_COUNT; i++) {
      rings.push(
        <mesh
          key={`surface-ring-${i}`}
          ref={(el) => { ringRefs.current[i] = el; }}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={0}
          position={[0, 5.05, 0]}
        >
          <ringGeometry args={[innerRatios[i], outerRatios[i], 64]} />
          <meshBasicMaterial
            color={colors[i]}
            transparent
            opacity={0}
            side={2}
            depthWrite={false}
          />
        </mesh>
      );
    }
    return rings;
  }, []);

  return (
    <group>
      <mesh
        ref={meshRef}
        geometry={geometry}
        position={[0, 0, 0]}
        receiveShadow
      >
        <meshStandardMaterial
          ref={materialRef}
          color="#8B7355"
          transparent
          opacity={0.85}
          side={2}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>

      <group position={[hypocenter.x, 0, hypocenter.z]}>
        {ringElements}
      </group>
    </group>
  );
};
