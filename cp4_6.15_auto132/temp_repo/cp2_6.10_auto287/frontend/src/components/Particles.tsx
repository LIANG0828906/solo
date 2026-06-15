import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ParticleEffect } from '@/types';

interface ParticlesProps {
  effects: ParticleEffect[];
}

export function Particles({ effects }: ParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const velocities = useRef<Float32Array>(new Float32Array());

  const { positions, colors, sizes } = useMemo(() => {
    const maxParticles = 200;
    const positions = new Float32Array(maxParticles * 3);
    const colors = new Float32Array(maxParticles * 3);
    const sizes = new Float32Array(maxParticles);
    const velocities = new Float32Array(maxParticles * 3);

    effects.forEach((effect, effectIndex) => {
      const particleCount = effect.type === 'place' ? 15 : 30;
      const startIdx = effectIndex * 50;

      for (let i = 0; i < particleCount && startIdx + i < maxParticles; i++) {
        const idx = startIdx + i;
        const color = new THREE.Color(effect.color);
        
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.5;
        const height = Math.random() * 1;

        positions[idx * 3] = effect.position.x + Math.cos(angle) * radius;
        positions[idx * 3 + 1] = effect.position.y + height;
        positions[idx * 3 + 2] = effect.position.z + Math.sin(angle) * radius;

        colors[idx * 3] = color.r;
        colors[idx * 3 + 1] = color.g;
        colors[idx * 3 + 2] = color.b;

        sizes[idx] = effect.type === 'generate' ? 0.1 : 0.08;

        velocities[idx * 3] = (Math.random() - 0.5) * 0.02;
        velocities[idx * 3 + 1] = Math.random() * 0.03 + 0.01;
        velocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.02;
      }
    });

    velocities.current = velocities;
    return { positions, colors, sizes };
  }, [effects]);

  useFrame((state) => {
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const time = state.clock.elapsedTime;

      for (let i = 0; i < effects.length; i++) {
        const effect = effects[i];
        const age = (time * 1000 - effect.createdAt) / 2000;
        
        if (age < 1) {
          const startIdx = i * 50;
          const particleCount = effect.type === 'place' ? 15 : 30;

          for (let j = 0; j < particleCount; j++) {
            const idx = startIdx + j;
            positions[idx * 3] += velocities.current[idx * 3];
            positions[idx * 3 + 1] += velocities.current[idx * 3 + 1] - age * 0.01;
            positions[idx * 3 + 2] += velocities.current[idx * 3 + 2];
          }
        }
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={sizes.length}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
