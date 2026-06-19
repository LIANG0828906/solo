import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useRainStore } from '@/store/useRainStore';
import { useFloodStore } from '@/store/useFloodStore';
import { SCENE_HALF } from '@/modules/flood-risk/floodCalculator';

const MAX_PARTICLES = 7000;
const FALL_HEIGHT = 120;

export function RainSimulator() {
  const pointsRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array | null>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);
  const materialRef = useRef<THREE.PointsMaterial | null>(null);
  const prevTypeRef = useRef(useRainStore.getState().currentType);

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const vel = new Float32Array(MAX_PARTICLES);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      pos[i * 3 + 0] = (Math.random() - 0.5) * SCENE_HALF * 2.2;
      pos[i * 3 + 1] = Math.random() * FALL_HEIGHT;
      pos[i * 3 + 2] = (Math.random() - 0.5) * SCENE_HALF * 2.2;
      vel[i] = 0.8 + Math.random() * 0.4;
    }
    return { positions: pos, velocities: vel };
  }, []);

  useEffect(() => {
    positionsRef.current = positions;
    velocitiesRef.current = velocities;
  }, [positions, velocities]);

  useFrame((_, delta) => {
    const rainState = useRainStore.getState();
    const floodState = useFloodStore.getState();
    rainState.updateTransition(delta);

    const { currentConfig, intensity } = rainState;
    const activeCount = Math.min(MAX_PARTICLES, currentConfig.count);

    const pts = positionsRef.current;
    const vels = velocitiesRef.current;
    if (pts && vels && pointsRef.current) {
      const angleRad = (currentConfig.angle * Math.PI) / 180;
      const xDrift = Math.sin(angleRad) * currentConfig.speed * 0.012;
      const fallSpeed = currentConfig.speed * intensity * delta * 0.12;

      for (let i = 0; i < activeCount; i++) {
        const idx = i * 3;
        pts[idx + 1] -= fallSpeed * vels[i];
        pts[idx + 0] += xDrift * vels[i];
        if (pts[idx + 1] < 0) {
          pts[idx + 0] = (Math.random() - 0.5) * SCENE_HALF * 2.2;
          pts[idx + 1] = FALL_HEIGHT + Math.random() * 20;
          pts[idx + 2] = (Math.random() - 0.5) * SCENE_HALF * 2.2;
        }
        if (pts[idx + 0] > SCENE_HALF * 1.2) pts[idx + 0] = -SCENE_HALF * 1.2;
        if (pts[idx + 0] < -SCENE_HALF * 1.2) pts[idx + 0] = SCENE_HALF * 1.2;
      }

      const geom = pointsRef.current.geometry as THREE.BufferGeometry;
      const posAttr = geom.attributes.position as THREE.BufferAttribute;
      posAttr.needsUpdate = true;
      geom.setDrawRange(0, activeCount);

      if (materialRef.current) {
        materialRef.current.size = currentConfig.size;
        materialRef.current.color.set(currentConfig.color);
        materialRef.current.opacity = 0.6 + rainState.transitionProgress * 0.3;
      }
    }

    if (prevTypeRef.current !== rainState.currentType) {
      useFloodStore.getState().reset();
      prevTypeRef.current = rainState.currentType;
    }
    floodState.updateGrid(currentConfig.rainfallMmPerHour, intensity, delta);
  });

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    g.setDrawRange(0, useRainStore.getState().currentConfig.count);
    return g;
  }, [positions]);

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        ref={(m) => {
          materialRef.current = m;
        }}
        size={0.15}
        color="#A0B8FF"
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
