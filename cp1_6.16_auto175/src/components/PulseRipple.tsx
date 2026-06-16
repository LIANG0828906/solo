import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PulseRippleProps {
  position: [number, number, number];
  createdAt: number;
}

export const PulseRipple: React.FC<PulseRippleProps> = ({ position, createdAt }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const DURATION = 0.4;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const elapsed = (clock.getElapsedTime() * 1000 - createdAt) / 1000;
    const progress = Math.min(elapsed / DURATION, 1);
    const scale = 0.5 + progress * 1.0;
    const opacity = 1 - progress;
    meshRef.current.scale.setScalar(scale);
    const mat = meshRef.current.material as THREE.MeshBasicMaterial;
    mat.opacity = opacity;
  });

  const normal = new THREE.Vector3(...position).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);

  return (
    <mesh ref={meshRef} position={position} quaternion={quaternion}>
      <ringGeometry args={[0.45, 0.5, 32]} />
      <meshBasicMaterial
        color="#00E5FF"
        transparent
        opacity={1}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
};
