import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RippleData } from '@/types/dream';

interface RippleEffectProps {
  ripple: RippleData;
}

const PARTICLE_COUNT = 50;
const RIPPLE_DURATION = 2000;

export function RippleEffect({ ripple }: RippleEffectProps) {
  const pointsRef = useRef<THREE.Points>(null);
  const startTime = useRef(ripple.startTime);

  const { positions, sizes, colors } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    const colors = new Float32Array(PARTICLE_COUNT * 3);

    const color = new THREE.Color(ripple.color);

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.5;

      positions[i * 3] = ripple.position[0] + Math.cos(angle) * radius;
      positions[i * 3 + 1] = ripple.position[1] + Math.sin(angle) * radius;
      positions[i * 3 + 2] = ripple.position[2] + (Math.random() - 0.5) * 0.5;

      sizes[i] = 0.1 + Math.random() * 0.1;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, sizes, colors };
  }, [ripple]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions, sizes, colors]);

  useFrame(() => {
    if (!pointsRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / RIPPLE_DURATION, 1);

    const positionsAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const sizesAttr = pointsRef.current.geometry.getAttribute('size') as THREE.BufferAttribute;

    const expandRadius = progress * 5;
    const fadeOut = 1 - progress;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (i / PARTICLE_COUNT) * Math.PI * 2;

      positionsAttr.setX(i, ripple.position[0] + Math.cos(angle) * expandRadius);
      positionsAttr.setY(i, ripple.position[1] + Math.sin(angle) * expandRadius);
      positionsAttr.setZ(i, ripple.position[2] + Math.sin(progress * Math.PI) * 2);

      sizesAttr.setX(i, (0.1 + progress * 0.3) * fadeOut);
    }

    positionsAttr.needsUpdate = true;
    sizesAttr.needsUpdate = true;

    const material = pointsRef.current.material as THREE.PointsMaterial;
    material.opacity = fadeOut * 0.8;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.2}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
