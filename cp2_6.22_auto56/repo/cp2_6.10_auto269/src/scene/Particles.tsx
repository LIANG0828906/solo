import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '@/store/useGameStore';

export const Particles: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const { particles, updateParticles } = useGameStore();

  const maxParticles = 500;

  const positions = useMemo(() => new Float32Array(maxParticles * 3), []);
  const colors = useMemo(() => new Float32Array(maxParticles * 3), []);
  const sizes = useMemo(() => new Float32Array(maxParticles), []);

  useFrame((_, delta) => {
    updateParticles(delta);

    if (pointsRef.current) {
      const geometry = pointsRef.current.geometry;
      const posAttr = geometry.attributes.position as THREE.BufferAttribute;
      const colAttr = geometry.attributes.color as THREE.BufferAttribute;
      const sizeAttr = geometry.attributes.size as THREE.BufferAttribute;

      for (let i = 0; i < maxParticles; i++) {
        if (i < particles.length) {
          const p = particles[i];
          posAttr.setXYZ(i, p.position[0], p.position[1], p.position[2]);

          const color = new THREE.Color(p.color);
          colAttr.setXYZ(i, color.r, color.g, color.b);

          sizeAttr.setX(i, p.size * p.life);
        } else {
          posAttr.setXYZ(i, 0, -1000, 0);
          colAttr.setXYZ(i, 0, 0, 0);
          sizeAttr.setX(i, 0);
        }
      }

      posAttr.needsUpdate = true;
      colAttr.needsUpdate = true;
      sizeAttr.needsUpdate = true;
    }
  });

  const material = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.1,
        vertexColors: true,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    []
  );

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={maxParticles}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={maxParticles}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={maxParticles}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
};
