import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BurstParticle } from '@/types';

interface SeedBurstProps {
  position: [number, number, number];
  onComplete: () => void;
}

const COLOR_PALETTE = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFEAA7'];

export default function SeedBurst({ position, onComplete }: SeedBurstProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const [particles, setParticles] = useState<BurstParticle[]>([]);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const newParticles: BurstParticle[] = [];
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = 1 + Math.random() * 1.5;

      const velocity: [number, number, number] = [
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed,
      ];

      newParticles.push({
        id: `burst-${i}`,
        position: [...position] as [number, number, number],
        velocity,
        color: COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)],
        life: 0,
        maxLife: 0.3,
      });
    }

    setParticles(newParticles);
    startTimeRef.current = null;
  }, [position]);

  useFrame((_, delta) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = 0;
    }

    const elapsed = startTimeRef.current + delta;
    startTimeRef.current = elapsed;

    const positions = new Float32Array(particles.length * 3);
    const colors = new Float32Array(particles.length * 3);
    const opacities = new Float32Array(particles.length);

    let allDead = true;

    particles.forEach((particle, i) => {
      const newLife = particle.life + delta;
      const t = newLife / particle.maxLife;

      if (t < 1) {
        allDead = false;
        const newPos: [number, number, number] = [
          particle.position[0] + particle.velocity[0] * delta,
          particle.position[1] + particle.velocity[1] * delta,
          particle.position[2] + particle.velocity[2] * delta,
        ];

        particle.position = newPos;
        particle.life = newLife;

        positions[i * 3] = newPos[0];
        positions[i * 3 + 1] = newPos[1];
        positions[i * 3 + 2] = newPos[2];

        const rgb = hexToRgb(particle.color);
        colors[i * 3] = rgb[0];
        colors[i * 3 + 1] = rgb[1];
        colors[i * 3 + 2] = rgb[2];

        opacities[i] = 1 - t;
      }
    });

    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      posAttr.array.set(positions);
      posAttr.needsUpdate = true;

      const colorAttr = geometry.attributes.color as THREE.BufferAttribute;
      colorAttr.array.set(colors);
      colorAttr.needsUpdate = true;

      (pointsRef.current.material as THREE.PointsMaterial).opacity = Math.max(
        0,
        1 - elapsed / 0.3
      );
    }

    if (allDead && elapsed > 0.3) {
      onComplete();
    }
  });

  if (particles.length === 0) return null;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.length * 3)}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particles.length}
          array={new Float32Array(particles.length * 3)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16) / 255,
        parseInt(result[2], 16) / 255,
        parseInt(result[3], 16) / 255,
      ]
    : [1, 1, 1];
}
