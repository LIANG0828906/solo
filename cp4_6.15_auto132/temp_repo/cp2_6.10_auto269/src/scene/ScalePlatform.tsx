import React, { useMemo } from 'react';
import { ScaleNote } from '@/types';
import { SCALE_POSITIONS, COLORS, PARTICLE_COLORS, SCALE_NAMES } from '@/utils/constants';
import * as THREE from 'three';

interface ScalePlatformProps {
  note: ScaleNote;
  onBellDrop?: (pos: [number, number, number]) => void;
}

export const ScalePlatform: React.FC<ScalePlatformProps> = ({ note }) => {
  const position = SCALE_POSITIONS[note];
  const glowColor = PARTICLE_COLORS[note];

  const geometry = useMemo(() => new THREE.CylinderGeometry(0.8, 1, 0.2, 32), []);
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COLORS.cloud,
        transparent: true,
        opacity: 0.6,
        roughness: 0.3,
        metalness: 0.1,
        emissive: new THREE.Color(glowColor),
        emissiveIntensity: 0.2,
      }),
    [glowColor]
  );

  const ringGeometry = useMemo(() => new THREE.TorusGeometry(0.9, 0.05, 16, 32), []);
  const ringMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: glowColor,
        transparent: true,
        opacity: 0.5,
      }),
    [glowColor]
  );

  return (
    <group position={position}>
      <mesh geometry={geometry} material={material} receiveShadow />
      <mesh
        geometry={ringGeometry}
        material={ringMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.11, 0]}
      />
      <mesh position={[0, 0.5, 0]}>
        <textGeometry args={[SCALE_NAMES[note], { size: 0.4, height: 0.05 }]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.8} />
      </mesh>
    </group>
  );
};

interface ScalePlatformsProps {
  onBellDrop?: (note: ScaleNote, pos: [number, number, number]) => void;
}

export const ScalePlatforms: React.FC<ScalePlatformsProps> = () => {
  const notes: ScaleNote[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  return (
    <group>
      {notes.map((note) => (
        <ScalePlatform key={note} note={note} />
      ))}
    </group>
  );
};
