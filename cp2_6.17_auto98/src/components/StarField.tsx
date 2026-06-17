import React, { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

const STAR_COUNT = 600;

export const StarField: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const { camera } = useThree();
  const lastCameraPos = useRef(new THREE.Vector3());

  const { positions: posArr, colors } = useMemo(() => {
    const initPositions = new Float32Array(STAR_COUNT * 3);
    const initColors = new Float32Array(STAR_COUNT * 3);
    const initVelocities = new Float32Array(STAR_COUNT * 3);

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      const radius = 30 + Math.random() * 20;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);

      initPositions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      initPositions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      initPositions[i3 + 2] = radius * Math.cos(phi);

      const color = new THREE.Color('#8888FF');
      const alpha = 0.2 + Math.random() * 0.3;
      initColors[i3] = color.r * alpha;
      initColors[i3 + 1] = color.g * alpha;
      initColors[i3 + 2] = color.b * alpha;

      initVelocities[i3] = (Math.random() - 0.5) * 0.002;
      initVelocities[i3 + 1] = (Math.random() - 0.5) * 0.002;
      initVelocities[i3 + 2] = (Math.random() - 0.5) * 0.002;
    }

    positionsRef.current = initPositions;
    velocitiesRef.current = initVelocities;

    return { positions: initPositions, colors: initColors };
  }, []);

  useFrame(() => {
    if (!pointsRef.current || !positionsRef.current || !velocitiesRef.current) return;

    const geometry = pointsRef.current.geometry;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const posArrFrame = posAttr.array as Float32Array;
    const velocities = velocitiesRef.current;

    const cameraDelta = new THREE.Vector3().subVectors(camera.position, lastCameraPos.current);
    lastCameraPos.current.copy(camera.position);

    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3;
      posArrFrame[i3] += velocities[i3] - cameraDelta.x * 0.02;
      posArrFrame[i3 + 1] += velocities[i3 + 1] - cameraDelta.y * 0.02;
      posArrFrame[i3 + 2] += velocities[i3 + 2] - cameraDelta.z * 0.02;

      const dx = posArrFrame[i3] - camera.position.x;
      const dy = posArrFrame[i3 + 1] - camera.position.y;
      const dz = posArrFrame[i3 + 2] - camera.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist > 60) {
        const norm = 35 / dist;
        posArrFrame[i3] = camera.position.x + dx * norm + (Math.random() - 0.5) * 5;
        posArrFrame[i3 + 1] = camera.position.y + dy * norm + (Math.random() - 0.5) * 5;
        posArrFrame[i3 + 2] = camera.position.z + dz * norm + (Math.random() - 0.5) * 5;
      }
    }

    posAttr.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={STAR_COUNT}
          array={posArr}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={STAR_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};
