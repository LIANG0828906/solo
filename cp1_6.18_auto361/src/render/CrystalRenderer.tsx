import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Crystal, MineralType } from '../types';
import { getCrystalDisplayColor } from '../logic/crystalGrowth';
import { getMineralById } from '../data/oreData';
import { useMineralStore } from '../store/mineralStore';

interface CrystalMeshProps {
  crystalId: string;
  onClick?: (crystal: Crystal, event: any) => void;
}

const CrystalMesh: React.FC<CrystalMeshProps> = ({ crystalId, onClick }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const edgesGeometry = useMemo(() => {
    const edges = new THREE.EdgesGeometry(geometry);
    return edges;
  }, [geometry]);

  useFrame(() => {
    const store = useMineralStore.getState();
    const crystal = store.crystals.find((c) => c.id === crystalId);
    if (!crystal || !meshRef.current || !edgesRef.current || !groupRef.current) return;

    const mineral = getMineralById(crystal.mineralType);
    const isVisible = mineral && store.visibleMinerals[crystal.mineralType];
    if (!isVisible) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    const size = crystal.size * 2.5;
    meshRef.current.scale.set(size, size, size);
    edgesRef.current.scale.set(size, size, size);

    groupRef.current.position.copy(crystal.position);
    groupRef.current.rotation.set(
      crystal.rotation.x + performance.now() * 0.0002,
      crystal.rotation.y + performance.now() * 0.0003,
      crystal.rotation.z
    );

    const { color, opacity } = getCrystalDisplayColor(crystal);
    const material = meshRef.current.material as THREE.MeshStandardMaterial;
    material.color.copy(color);
    material.opacity = Math.max(opacity, 0.7);
    material.emissive.copy(color).multiplyScalar(store.selectedCrystalId === crystalId ? 0.4 : 0.2);
  });

  const handleClick = (e: any) => {
    e.stopPropagation();
    const store = useMineralStore.getState();
    const crystal = store.crystals.find((c) => c.id === crystalId);
    store.selectCrystal(crystalId);
    if (onClick && crystal) onClick(crystal, e);
  };

  return (
    <group ref={groupRef}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        geometry={geometry}
      >
        <meshStandardMaterial
          transparent
          metalness={0.6}
          roughness={0.2}
          emissiveIntensity={1}
          flatShading
        />
      </mesh>
      <lineSegments
        ref={edgesRef}
        geometry={edgesGeometry}
        onClick={handleClick}
      >
        <lineBasicMaterial
          color={0xffffff}
          transparent
          opacity={0.8}
        />
      </lineSegments>
    </group>
  );
};

interface CrystalRendererProps {
  onCrystalClick?: (crystal: Crystal, event: any) => void;
}

const CrystalRenderer: React.FC<CrystalRendererProps> = ({ onCrystalClick }) => {
  const crystalIds = useMineralStore((state) => state.crystals.map((c) => c.id));

  return (
    <group>
      {crystalIds.map((id) => (
        <CrystalMesh
          key={id}
          crystalId={id}
          onClick={onCrystalClick}
        />
      ))}
    </group>
  );
};

export default CrystalRenderer;
