import { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { WindState } from '../hooks/useWind';

interface SandParticlesProps {
  count?: number;
  wind: WindState;
}

export function SandParticles({ count = 4000, wind }: SandParticlesProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const { camera } = useThree();

  const { geometry, velocities, sizes } = useMemo(() => {
    const particleCount = Math.min(count, 5000);
    const geo = new THREE.BufferGeometry();

    const positions = new Float32Array(particleCount * 3);
    const vels = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);

    const sandColor = new THREE.Color('#e8d5a3');

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200;
      positions[i * 3 + 1] = Math.random() * 30;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200;

      vels[i * 3] = (Math.random() - 0.5) * 0.1;
      vels[i * 3 + 1] = (Math.random() - 0.5) * 0.05;
      vels[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

      sz[i] = 0.05 + Math.random() * 0.15;

      const colorVariation = 0.85 + Math.random() * 0.3;
      colors[i * 3] = sandColor.r * colorVariation;
      colors[i * 3 + 1] = sandColor.g * colorVariation;
      colors[i * 3 + 2] = sandColor.b * colorVariation;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    return { geometry: geo, velocities: vels, sizes: sz };
  }, [count]);

  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthWrite: false,
    });
  }, []);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const positions = geometry.attributes.position.array as Float32Array;
    const windDir = wind.direction;
    const windStrength = wind.strength;

    const cameraPos = camera.position;
    const particleCount = Math.min(count, 5000);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      velocities[i3] += windDir.x * windStrength * delta * 0.3;
      velocities[i3 + 1] += windDir.y * windStrength * delta * 0.2;
      velocities[i3 + 2] += windDir.z * windStrength * delta * 0.3;

      velocities[i3] *= 0.98;
      velocities[i3 + 1] *= 0.98;
      velocities[i3 + 2] *= 0.98;

      positions[i3] += velocities[i3] * delta * 60;
      positions[i3 + 1] += velocities[i3 + 1] * delta * 60;
      positions[i3 + 2] += velocities[i3 + 2] * delta * 60;

      const dist = Math.sqrt(
        Math.pow(positions[i3] - cameraPos.x, 2) +
        Math.pow(positions[i3 + 1] - cameraPos.y, 2) +
        Math.pow(positions[i3 + 2] - cameraPos.z, 2)
      );

      if (dist > 120 || positions[i3 + 1] < 0 || positions[i3 + 1] > 50) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 80 + Math.random() * 30;
        positions[i3] = cameraPos.x + Math.cos(angle) * radius;
        positions[i3 + 1] = Math.random() * 25;
        positions[i3 + 2] = cameraPos.z + Math.sin(angle) * radius;

        velocities[i3] = (Math.random() - 0.5) * 0.1;
        velocities[i3 + 1] = (Math.random() - 0.5) * 0.05;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.1;
      }
    }

    geometry.attributes.position.needsUpdate = true;

    const distance = camera.position.length();
    const baseSize = 0.08;
    const distanceFactor = Math.min(1, distance / 50);
    material.size = baseSize * (0.5 + distanceFactor * 1.5) * (0.5 + windStrength * 0.5);
    material.opacity = 0.4 + windStrength * 0.4;
  });

  return (
    <points ref={pointsRef} geometry={geometry} material={material}>
      <primitive object={geometry} attach="geometry" />
      <primitive object={material} attach="material" />
    </points>
  );
}
