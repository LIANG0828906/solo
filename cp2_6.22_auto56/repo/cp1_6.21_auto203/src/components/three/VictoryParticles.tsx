import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3 } from '@/types/game';

interface VictoryParticlesProps {
  trigger: boolean;
  position: Vector3;
  onComplete?: () => void;
}

interface ParticleData {
  velocity: THREE.Vector3;
  startSize: number;
  color: THREE.Color;
}

const PARTICLE_COUNT = 300;
const PARTICLE_LIFETIME = 2;
const COLOR_PALETTE = [
  '#FF6B6B',
  '#48DBFB',
  '#FFD93D',
  '#FBBF24',
  '#4ECDC4',
];

export function VictoryParticles({ trigger, position, onComplete }: VictoryParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const [isActive, setIsActive] = useState(false);
  const particlesRef = useRef<ParticleData[]>([]);
  const startTimeRef = useRef<number>(0);
  const completedRef = useRef<boolean>(false);

  const { initialPositions, colors } = useMemo(() => {
    const pos = new Float32Array(PARTICLE_COUNT * 3);
    const col = new Float32Array(PARTICLE_COUNT * 3);
    const particles: ParticleData[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const speed = 1.5 + Math.random() * 1.5;

      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.sin(phi) * Math.sin(theta) * speed;
      const vz = Math.cos(phi) * speed;

      const colorHex = COLOR_PALETTE[Math.floor(Math.random() * COLOR_PALETTE.length)];
      const color = new THREE.Color(colorHex);
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;

      const size = 0.05 + Math.random() * 0.05;

      particles.push({
        velocity: new THREE.Vector3(vx, vy, vz),
        startSize: size,
        color: color.clone(),
      });
    }

    particlesRef.current = particles;

    return { initialPositions: pos, colors: col };
  }, []);

  useEffect(() => {
    if (trigger && !isActive) {
      setIsActive(true);
      startTimeRef.current = performance.now();
      completedRef.current = false;

      if (pointsRef.current) {
        const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < PARTICLE_COUNT; i++) {
          posAttr.setXYZ(i, 0, 0, 0);
        }
        posAttr.needsUpdate = true;
      }
    }
  }, [trigger, isActive]);

  useFrame(() => {
    if (!isActive || !pointsRef.current) return;

    const elapsed = (performance.now() - startTimeRef.current) / 1000;
    const progress = Math.min(elapsed / PARTICLE_LIFETIME, 1);

    if (progress >= 1 && !completedRef.current) {
      completedRef.current = true;
      setIsActive(false);
      onComplete?.();
      return;
    }

    const posAttr = pointsRef.current.geometry.attributes.position as THREE.BufferAttribute;
    const opacity = 1 - progress;
    const gravity = -0.5;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const particle = particlesRef.current[i];
      const x = particle.velocity.x * elapsed;
      const y = particle.velocity.y * elapsed + 0.5 * gravity * elapsed * elapsed;
      const z = particle.velocity.z * elapsed;
      posAttr.setXYZ(i, x, y, z);
    }

    posAttr.needsUpdate = true;

    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = opacity;
  });

  if (!trigger && !isActive) return null;

  return (
    <group position={[position.x, position.y, position.z]}>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={PARTICLE_COUNT}
            array={initialPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={PARTICLE_COUNT}
            array={colors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          vertexColors
          transparent
          opacity={1}
          depthWrite={false}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
      <pointLight
        position={[0, 0, 0]}
        color="#FFD93D"
        intensity={isActive ? 3 * (1 - Math.min((performance.now() - startTimeRef.current) / 1000 / PARTICLE_LIFETIME, 1)) : 0}
        distance={10}
        decay={2}
      />
    </group>
  );
}
