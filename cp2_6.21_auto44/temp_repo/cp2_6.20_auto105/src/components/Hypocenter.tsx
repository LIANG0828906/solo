import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Hypocenter as HypocenterType } from '@/types';

interface HypocenterProps {
  position: HypocenterType;
  magnitude: number;
}

export const Hypocenter: React.FC<HypocenterProps> = ({ position, magnitude }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  const baseScale = 0.5 + (magnitude - 5) * 0.08;

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const pulse = 1 + Math.sin(time * Math.PI * 2) * 0.2;

    if (meshRef.current) {
      meshRef.current.scale.setScalar(baseScale * pulse);
    }

    if (glowRef.current) {
      const glowScale = baseScale * (1.5 + Math.sin(time * Math.PI * 2 + 0.5) * 0.3);
      glowRef.current.scale.setScalar(glowScale);
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      if (material.opacity !== undefined) {
        material.opacity = 0.3 + Math.sin(time * Math.PI * 2) * 0.15;
      }
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#ff6b6b"
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={meshRef}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#ef5350"
          emissive="#ff0000"
          emissiveIntensity={0.5}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <ringGeometry args={[1.2, 1.5, 32]} />
        <meshBasicMaterial
          color="#ff4444"
          transparent
          opacity={0.4}
          side={2}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
