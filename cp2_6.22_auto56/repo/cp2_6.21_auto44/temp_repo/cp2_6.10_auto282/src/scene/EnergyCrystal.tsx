import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Mesh, Group } from 'three';
import { COLORS } from '@/utils/colors';
import type { Crystal } from '@/types/game';

interface EnergyCrystalProps {
  crystal: Crystal;
  onCollect: (id: string, position: [number, number, number]) => void;
  playerPosition: [number, number, number];
}

export const EnergyCrystal = ({ crystal, onCollect, playerPosition }: EnergyCrystalProps) => {
  const meshRef = useRef<Mesh>(null);
  const glowRef = useRef<Mesh>(null);
  const groupRef = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current || !meshRef.current || !glowRef.current) return;
    if (crystal.collected) return;

    const time = performance.now() * 0.001;
    groupRef.current.rotation.y += delta * 1.5;
    groupRef.current.position.y = crystal.position[1] + Math.sin(time * 2) * 0.15;

    const glowIntensity = 0.5 + Math.sin(time * 3) * 0.3;
    (glowRef.current.material as THREE.MeshBasicMaterial).opacity = glowIntensity;

    const dx = playerPosition[0] - crystal.position[0];
    const dy = playerPosition[1] - crystal.position[1];
    const dz = playerPosition[2] - crystal.position[2];
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (distance < 0.6) {
      onCollect(crystal.id, crystal.position);
    }
  });

  if (crystal.collected) return null;

  return (
    <group ref={groupRef} position={crystal.position}>
      <mesh ref={meshRef}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshStandardMaterial
          color={COLORS.crystal}
          emissive={COLORS.crystal}
          emissiveIntensity={1.5}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      <mesh ref={glowRef} scale={1.5}>
        <octahedronGeometry args={[0.25, 0]} />
        <meshBasicMaterial
          color={COLORS.crystal}
          transparent
          opacity={0.5}
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight color={COLORS.crystal} intensity={0.5} distance={3} />
    </group>
  );
};

interface CollectPulseProps {
  position: [number, number, number];
  active: boolean;
}

export const CollectPulse = ({ position, active }: CollectPulseProps) => {
  const pulseRef = useRef<Mesh>(null);
  const scaleRef = useRef(0);

  useFrame((_, delta) => {
    if (!pulseRef.current) return;

    if (active && scaleRef.current < 3) {
      scaleRef.current += delta * 8;
      pulseRef.current.scale.setScalar(scaleRef.current);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(
        0,
        1 - scaleRef.current / 3
      );
    } else if (!active) {
      scaleRef.current = 0;
      pulseRef.current.scale.setScalar(0);
      (pulseRef.current.material as THREE.MeshBasicMaterial).opacity = 1;
    }
  });

  return (
    <mesh ref={pulseRef} position={position}>
      <sphereGeometry args={[1, 16, 16]} />
      <meshBasicMaterial
        color={COLORS.crystal}
        transparent
        opacity={1}
        side={THREE.BackSide}
      />
    </mesh>
  );
};
