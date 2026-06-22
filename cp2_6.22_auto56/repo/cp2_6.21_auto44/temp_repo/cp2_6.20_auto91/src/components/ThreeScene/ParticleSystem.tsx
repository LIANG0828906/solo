import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getElementParticleColors } from '../../utils/calculations';

interface ParticleSystemProps {
  active: boolean;
  intensity: number;
  element: string;
  type: 'burst' | 'vortex' | 'ambient';
}

const ParticleSystem = ({ active, intensity, element, type }: ParticleSystemProps) => {
  const particlesRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);

  const particleCount = 200;

  const { positions, colors, velocities } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const elementColors = getElementParticleColors(element);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      if (type === 'burst') {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        positions[i3] = 0;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = 0;

        const speed = 0.02 + Math.random() * 0.03;
        velocities[i3] = Math.sin(phi) * Math.cos(theta) * speed;
        velocities[i3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
        velocities[i3 + 2] = Math.cos(phi) * speed;
      } else if (type === 'vortex') {
        const radius = 0.3 + Math.random() * 0.5;
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 0.5;
        positions[i3] = Math.cos(angle) * radius;
        positions[i3 + 1] = height;
        positions[i3 + 2] = Math.sin(angle) * radius;

        velocities[i3] = 0;
        velocities[i3 + 1] = 0.01 + Math.random() * 0.02;
        velocities[i3 + 2] = 0;
      } else {
        positions[i3] = (Math.random() - 0.5) * 3;
        positions[i3 + 1] = (Math.random() - 0.5) * 3;
        positions[i3 + 2] = (Math.random() - 0.5) * 3;
        velocities[i3] = (Math.random() - 0.5) * 0.002;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.002;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.002;
      }

      const colorIndex = Math.floor(Math.random() * elementColors.length);
      const color = new THREE.Color(elementColors[colorIndex]);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    return { positions, colors, velocities };
  }, [element, type]);

  useEffect(() => {
    velocitiesRef.current = velocities;
  }, [velocities]);

  useFrame(() => {
    if (!particlesRef.current || !active) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const vel = velocitiesRef.current;
    if (!vel) return;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      if (type === 'vortex') {
        const x = positions[i3];
        const z = positions[i3 + 2];
        const angle = Math.atan2(z, x);
        const radius = Math.sqrt(x * x + z * z);
        const newAngle = angle + 0.05 * intensity;

        positions[i3] = Math.cos(newAngle) * radius;
        positions[i3 + 1] += vel[i3 + 1] * intensity;
        positions[i3 + 2] = Math.sin(newAngle) * radius;

        if (positions[i3 + 1] > 1.5) {
          positions[i3 + 1] = -1;
          const newRadius = 0.3 + Math.random() * 0.5;
          const newStartAngle = Math.random() * Math.PI * 2;
          positions[i3] = Math.cos(newStartAngle) * newRadius;
          positions[i3 + 2] = Math.sin(newStartAngle) * newRadius;
        }
      } else {
        positions[i3] += vel[i3] * intensity;
        positions[i3 + 1] += vel[i3 + 1] * intensity;
        positions[i3 + 2] += vel[i3 + 2] * intensity;

        if (type === 'burst') {
          const dist = Math.sqrt(
            positions[i3] ** 2 + positions[i3 + 1] ** 2 + positions[i3 + 2] ** 2
          );
          if (dist > 2) {
            positions[i3] = 0;
            positions[i3 + 1] = 0;
            positions[i3 + 2] = 0;
          }
        } else {
          if (Math.abs(positions[i3]) > 1.5) positions[i3] = -Math.sign(positions[i3]) * 1.5;
          if (Math.abs(positions[i3 + 1]) > 1.5) positions[i3 + 1] = -Math.sign(positions[i3 + 1]) * 1.5;
          if (Math.abs(positions[i3 + 2]) > 1.5) positions[i3 + 2] = -Math.sign(positions[i3 + 2]) * 1.5;
        }
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!active && type !== 'ambient') return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={type === 'ambient' ? 0.05 : 0.08}
        vertexColors
        transparent
        opacity={type === 'ambient' ? 0.4 : 0.8 * intensity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export default ParticleSystem;
