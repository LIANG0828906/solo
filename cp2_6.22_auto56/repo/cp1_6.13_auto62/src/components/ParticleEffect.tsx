import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ParticleEffectProps {
  active: boolean;
  geometry: THREE.BufferGeometry | null;
  onComplete: () => void;
}

const PARTICLE_COUNT = 350;

export default function ParticleEffect({ active, geometry, onComplete }: ParticleEffectProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const elapsedRef = useRef(0);
  const hasStarted = useRef(false);

  const { positions, velocities, origins } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const velocities = new Float32Array(PARTICLE_COUNT * 3);
    const origins = new Float32Array(PARTICLE_COUNT * 3);

    if (geometry) {
      const posAttr = geometry.getAttribute('position');
      const count = posAttr.count;

      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const idx = Math.floor(Math.random() * count);
        const ox = posAttr.getX(idx);
        const oy = posAttr.getY(idx);
        const oz = posAttr.getZ(idx);
        origins[i * 3] = ox;
        origins[i * 3 + 1] = oy;
        origins[i * 3 + 2] = oz;
        positions[i * 3] = ox;
        positions[i * 3 + 1] = oy;
        positions[i * 3 + 2] = oz;

        const dir = new THREE.Vector3(
          Math.random() - 0.5,
          Math.random() - 0.5,
          Math.random() - 0.5
        ).normalize();
        const speed = 1.5 + Math.random() * 3.0;
        velocities[i * 3] = dir.x * speed;
        velocities[i * 3 + 1] = dir.y * speed;
        velocities[i * 3 + 2] = dir.z * speed;
      }
    }

    return { positions, velocities, origins };
  }, [geometry]);

  useFrame((_, delta) => {
    if (!active || !pointsRef.current) {
      if (!active) {
        hasStarted.current = false;
        elapsedRef.current = 0;
      }
      return;
    }

    if (!hasStarted.current) {
      hasStarted.current = true;
      elapsedRef.current = 0;
      const posArray = pointsRef.current.geometry.getAttribute('position');
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        posArray.setXYZ(i, origins[i * 3], origins[i * 3 + 1], origins[i * 3 + 2]);
      }
      posArray.needsUpdate = true;
    }

    elapsedRef.current += delta;
    const t = elapsedRef.current;

    const posAttr = pointsRef.current.geometry.getAttribute('position');

    if (t < 0.5) {
      const progress = t / 0.5;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ox = origins[i * 3];
        const oy = origins[i * 3 + 1];
        const oz = origins[i * 3 + 2];
        posAttr.setXYZ(
          i,
          ox + velocities[i * 3] * progress,
          oy + velocities[i * 3 + 1] * progress,
          oz + velocities[i * 3 + 2] * progress
        );
      }
    } else if (t < 1.0) {
      const progress = (t - 0.5) / 0.5;
      const expandedX = origins[i * 3] + velocities[0] * 1.0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        const ox = origins[i * 3];
        const oy = origins[i * 3 + 1];
        const oz = origins[i * 3 + 2];
        const ex = ox + velocities[i * 3] * 1.0;
        const ey = oy + velocities[i * 3 + 1] * 1.0;
        const ez = oz + velocities[i * 3 + 2] * 1.0;
        posAttr.setXYZ(
          i,
          ex + (ox - ex) * progress,
          ey + (oy - ey) * progress,
          ez + (oz - ez) * progress
        );
      }
    } else {
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        posAttr.setXYZ(i, origins[i * 3], origins[i * 3 + 1], origins[i * 3 + 2]);
      }
      hasStarted.current = false;
      elapsedRef.current = 0;
      onComplete();
      return;
    }

    posAttr.needsUpdate = true;

    const material = pointsRef.current.material as THREE.PointsMaterial;
    if (t < 0.5) {
      material.opacity = Math.min(t * 4, 0.8);
    } else if (t < 1.0) {
      material.opacity = 0.8 * (1.0 - (t - 0.5) / 0.5);
    } else {
      material.opacity = 0;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={positions}
          count={PARTICLE_COUNT}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        color="#ffffff"
        transparent
        opacity={0}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}
