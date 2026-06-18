import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GoldParticlesProps {
  active: boolean;
  count?: number;
}

export function GoldParticles({ active, count = 200 }: GoldParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, speeds, sizes } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    const sz = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = -5 + Math.random() * 3;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 8;
      spd[i] = 0.01 + Math.random() * 0.03;
      sz[i] = 2 + Math.random() * 2;
    }
    return { positions: pos, speeds: spd, sizes: sz };
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [positions, sizes]);

  useFrame(() => {
    if (!active || !pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const positions = posAttr.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += speeds[i];
      positions[i * 3] += Math.sin(positions[i * 3 + 1] * 2) * 0.01;
      if (positions[i * 3 + 1] > 8) {
        positions[i * 3] = (Math.random() - 0.5) * 8;
        positions[i * 3 + 1] = -5 + Math.random() * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
      }
    }
    posAttr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        color="#FFD700"
        size={0.08}
        sizeAttenuation
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
