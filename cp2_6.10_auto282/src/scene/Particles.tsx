import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Particle } from '@/types/game';

interface ParticlesProps {
  particles: Particle[];
}

export const Particles = ({ particles }: ParticlesProps) => {
  const meshRef = useRef<THREE.Points>(null);
  const geometryRef = useRef<THREE.BufferGeometry>(null);

  const { positions, colors, sizes } = useMemo(() => {
    const pos = new Float32Array(particles.length * 3);
    const col = new Float32Array(particles.length * 3);
    const siz = new Float32Array(particles.length);

    particles.forEach((p, i) => {
      pos[i * 3] = p.position[0];
      pos[i * 3 + 1] = p.position[1];
      pos[i * 3 + 2] = p.position[2];

      const color = new THREE.Color(p.color);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      siz[i] = p.size * (p.life / p.maxLife);
    });

    return { positions: pos, colors: col, sizes: siz };
  }, [particles]);

  useFrame(() => {
    if (geometryRef.current) {
      const posAttr = geometryRef.current.attributes.position as THREE.BufferAttribute;
      const colAttr = geometryRef.current.attributes.color as THREE.BufferAttribute;
      const sizeAttr = geometryRef.current.attributes.size as THREE.BufferAttribute;

      particles.forEach((p, i) => {
        posAttr.array[i * 3] = p.position[0];
        posAttr.array[i * 3 + 1] = p.position[1];
        posAttr.array[i * 3 + 2] = p.position[2];

        const alpha = p.life / p.maxLife;
        const color = new THREE.Color(p.color);
        colAttr.array[i * 3] = color.r * alpha;
        colAttr.array[i * 3 + 1] = color.g * alpha;
        colAttr.array[i * 3 + 2] = color.b * alpha;

        sizeAttr.array[i] = p.size * alpha;
      });

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  });

  if (particles.length === 0) return null;

  return (
    <points ref={meshRef}>
      <bufferGeometry ref={geometryRef}>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.length}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.9}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};

export const createExplosionParticles = (
  position: [number, number, number],
  color: string,
  count = 20
): Particle[] => {
  const particles: Particle[] = [];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 2 + Math.random() * 3;

    particles.push({
      id: Math.random().toString(36).substring(2, 11),
      position: [...position],
      velocity: [
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
      ],
      color,
      life: 1,
      maxLife: 1,
      size: 0.1 + Math.random() * 0.1,
    });
  }

  return particles;
};

export const createCollectParticles = (
  position: [number, number, number]
): Particle[] => {
  const particles: Particle[] = [];

  for (let i = 0; i < 15; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI * 0.5;
    const speed = 1.5 + Math.random() * 2;

    particles.push({
      id: Math.random().toString(36).substring(2, 11),
      position: [...position],
      velocity: [
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.cos(phi) * speed + 1,
        Math.sin(phi) * Math.sin(theta) * speed,
      ],
      color: '#00ffaa',
      life: 1.2,
      maxLife: 1.2,
      size: 0.12 + Math.random() * 0.08,
    });
  }

  return particles;
};
