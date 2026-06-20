import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SeedPoint } from '../types';
import { useMineralStore } from '../store/mineralStore';

interface SeedPointMeshProps {
  seed: SeedPoint;
}

const SeedPointMesh: React.FC<SeedPointMeshProps> = ({ seed }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const { visibleMinerals } = useMineralStore();
  const isVisible = visibleMinerals[seed.mineralType];

  if (!isVisible) return null;

  const scale = 0.05 / 0.5;

  return (
    <mesh
      ref={meshRef}
      position={seed.position}
      scale={[scale, scale, scale]}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial
        color={0xffffff}
        transparent
        opacity={0.6}
      />
    </mesh>
  );
};

interface SeedPointRendererProps {}

const SeedPointRenderer: React.FC<SeedPointRendererProps> = () => {
  const { seedPoints, crystals } = useMineralStore();

  const crystalSeedIds = useMemo(() => {
    return new Set();
  }, [crystals.length]);

  const displaySeeds = useMemo(() => {
    return seedPoints.filter((seed) => {
      return !crystals.some(
        (c) =>
          c.position.x === seed.position.x &&
          c.position.y === seed.position.y &&
          c.position.z === seed.position.z
      );
    });
  }, [seedPoints, crystals]);

  return (
    <group>
      {displaySeeds.map((seed) => (
        <SeedPointMesh key={seed.id} seed={seed} />
      ))}
    </group>
  );
};

export default SeedPointRenderer;
