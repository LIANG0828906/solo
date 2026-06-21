import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { MathUtils } from 'three';
import type { Mechanism } from '@/types/game';

interface MirrorProps {
  mechanism: Mechanism;
  selected: boolean;
  onClick: () => void;
}

export function Mirror({ mechanism, selected, onClick }: MirrorProps) {
  const meshRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      const targetRotation = MathUtils.degToRad(mechanism.rotation);
      meshRef.current.rotation.y = MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation,
        0.12
      );
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onClick();
  };

  const scale = hovered ? 1.02 : 1;
  const framePadding = 0.08;

  return (
    <group
      ref={meshRef}
      position={[mechanism.position.x, mechanism.position.y, mechanism.position.z]}
      scale={[scale, scale, scale]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={handlePointerDown}
    >
      <mesh>
        <boxGeometry
          args={[
            mechanism.size.x + framePadding * 2,
            mechanism.size.y + framePadding * 2,
            mechanism.size.z + framePadding,
          ]}
        />
        <meshStandardMaterial
          color="#4a4570"
          roughness={0.7}
          metalness={0.15}
        />
      </mesh>
      <mesh position={[0, 0, mechanism.size.z / 2 + 0.01]}>
        <boxGeometry args={[mechanism.size.x, mechanism.size.y, 0.04]} />
        <meshPhysicalMaterial
          color="#c8c8d8"
          metalness={0.95}
          roughness={0.05}
          envMapIntensity={1.5}
          clearcoat={0.2}
          clearcoatRoughness={0.1}
        />
      </mesh>
      {selected && (
        <mesh position={[0, 0, mechanism.size.z / 2 + 0.03]}>
          <ringGeometry args={[Math.max(mechanism.size.x, mechanism.size.y) * 0.6, Math.max(mechanism.size.x, mechanism.size.y) * 0.7, 32]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
