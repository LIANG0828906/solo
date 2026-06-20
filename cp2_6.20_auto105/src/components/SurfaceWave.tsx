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

export const SurfaceWave: React.FC<SurfaceWaveProps> = ({
  waveData,
  hypocenter,
  waveSimulator,
  currentTime,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(GRID_SIZE, GRID_SIZE, GRID_DIVISIONS, GRID_DIVISIONS);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  useFrame(() => {
    if (meshRef.current && waveSimulator) {
      const positions = geometry.attributes.position;
      const array = positions.array as Float32Array;

      for (let i = 0; i < positions.count; i++) {
        const x = array[i * 3];
        const z = array[i * 3 + 2];
        const height = waveSimulator.getTopographyHeight(x, z, currentTime);
        array[i * 3 + 1] = 5 + height;
      }

      positions.needsUpdate = true;
      geometry.computeVertexNormals();
    }

    const surfaceScale = Math.min(waveData.surfaceWaveRadius, 15);
    const surfaceOpacity = waveData.surfaceWaveRadius > 0
      ? Math.max(0, Math.min(0.6, 0.6 - waveData.surfaceWaveRadius / 30))
      : 0;

    if (ringRef.current) {
      ringRef.current.scale.setScalar(surfaceScale);
      ringRef.current.position.y = 5.01;
      const material = ringRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = surfaceOpacity;
    }

    if (outerRingRef.current) {
      outerRingRef.current.scale.setScalar(surfaceScale * 1.1);
      outerRingRef.current.position.y = 5.01;
      const material = outerRingRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = surfaceOpacity * 0.5;
    }
  });

  return (
    <group position={[hypocenter.x, 0, hypocenter.z]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        position={[-hypocenter.x, 0, -hypocenter.z]}
        receiveShadow
      >
        <meshStandardMaterial
          color="#8B7355"
          transparent
          opacity={0.8}
          side={2}
          roughness={0.9}
          metalness={0.1}
          wireframe={false}
        />
      </mesh>

      <mesh ref={outerRingRef} rotation={[-Math.PI / 2, 0, 0]} scale={0}>
        <ringGeometry args={[0.95, 1, 64]} />
        <meshBasicMaterial
          color="#ffb74d"
          transparent
          opacity={0}
          side={2}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} scale={0}>
        <ringGeometry args={[0.9, 0.95, 64]} />
        <meshBasicMaterial
          color="#ffa726"
          transparent
          opacity={0}
          side={2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
