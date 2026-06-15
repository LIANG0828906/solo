import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import type { ParticleData } from '@/types';

interface ParticleSystemProps {
  particles: ParticleData[];
  onParticleUpdate: (particles: ParticleData[]) => void;
}

const MAX_PARTICLES = 200;

export function ParticleSystem({ particles, onParticleUpdate }: ParticleSystemProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colors = useMemo(() => new Float32Array(MAX_PARTICLES * 3), []);

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const updatedParticles: ParticleData[] = [];

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      const newLife = p.life - delta;

      if (newLife > 0) {
        const alpha = newLife / p.maxLife;
        const gravity = delta * 9.8;

        const newParticle: ParticleData = {
          ...p,
          position: [
            p.position[0] + p.velocity[0] * delta,
            p.position[1] + p.velocity[1] * delta - gravity * 0.5,
            p.position[2] + p.velocity[2] * delta,
          ],
          velocity: [
            p.velocity[0] * 0.98,
            p.velocity[1] - gravity,
            p.velocity[2] * 0.98,
          ],
          life: newLife,
        };

        updatedParticles.push(newParticle);

        dummy.position.set(...newParticle.position);
        const scale = p.size * alpha;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        meshRef.current.setMatrixAt(i, dummy.matrix);

        const color = new THREE.Color(p.color);
        colors[i * 3] = color.r;
        colors[i * 3 + 1] = color.g;
        colors[i * 3 + 2] = color.b;
      }
    }

    meshRef.current.count = updatedParticles.length;
    meshRef.current.instanceMatrix.needsUpdate = true;

    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }

    if (updatedParticles.length !== particles.length) {
      onParticleUpdate(updatedParticles);
    }
  });

  useEffect(() => {
    if (meshRef.current) {
      const colorArray = new Float32Array(MAX_PARTICLES * 3);
      for (let i = 0; i < particles.length && i < MAX_PARTICLES; i++) {
        const color = new THREE.Color(particles[i].color);
        colorArray[i * 3] = color.r;
        colorArray[i * 3 + 1] = color.g;
        colorArray[i * 3 + 2] = color.b;
      }
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colorArray, 3);
    }
  }, [particles]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial transparent opacity={0.9} />
    </instancedMesh>
  );
}

export function createCollisionParticles(
  position: [number, number, number],
  color: string,
  count: number = 8
): ParticleData[] {
  const newParticles: ParticleData[] = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    const vy = Math.random() * 4 + 1;

    newParticles.push({
      id: uuidv4(),
      position: [...position] as [number, number, number],
      velocity: [
        Math.cos(angle) * speed,
        vy,
        Math.sin(angle) * speed,
      ],
      color,
      life: 0.8 + Math.random() * 0.4,
      maxLife: 1.2,
      size: 0.05 + Math.random() * 0.1,
    });
  }
  return newParticles;
}

export function createExplosionParticles(
  center: [number, number, number],
  count: number = 40
): ParticleData[] {
  const newParticles: ParticleData[] = [];
  const explosionColors = ['#ff6b35', '#f97316', '#fbbf24', '#ef4444', '#a855f7'];

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;
    const speed = 8 + Math.random() * 12;

    newParticles.push({
      id: uuidv4(),
      position: [...center] as [number, number, number],
      velocity: [
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.abs(Math.cos(phi)) * speed + 2,
        Math.sin(phi) * Math.sin(theta) * speed,
      ],
      color: explosionColors[Math.floor(Math.random() * explosionColors.length)],
      life: 1.0 + Math.random() * 1.0,
      maxLife: 2.0,
      size: 0.1 + Math.random() * 0.15,
    });
  }
  return newParticles;
}

export function createFluidParticles(
  position: [number, number, number],
  count: number = 5
): ParticleData[] {
  const newParticles: ParticleData[] = [];
  const fluidColors = ['#00f5ff', '#06b6d4', '#22d3ee', '#38bdf8'];

  for (let i = 0; i < count; i++) {
    newParticles.push({
      id: uuidv4(),
      position: [
        position[0] + (Math.random() - 0.5) * 2,
        position[1],
        position[2] + (Math.random() - 0.5) * 2,
      ],
      velocity: [
        (Math.random() - 0.5) * 0.5,
        -2 - Math.random() * 2,
        (Math.random() - 0.5) * 0.5,
      ],
      color: fluidColors[Math.floor(Math.random() * fluidColors.length)],
      life: 2.0 + Math.random() * 1.0,
      maxLife: 3.0,
      size: 0.08 + Math.random() * 0.06,
    });
  }
  return newParticles;
}
