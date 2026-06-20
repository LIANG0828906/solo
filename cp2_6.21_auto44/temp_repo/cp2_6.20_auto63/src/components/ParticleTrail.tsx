import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, type TrailPoint } from '@/store/useGameStore';

const ParticleTrail: React.FC = () => {
  const trailPoints = useGameStore((s) => s.trailPoints);

  const { geometry, material } = useMemo(() => {
    const MAX_POINTS = 100;
    const positions = new Float32Array(MAX_POINTS * 3);
    const colors = new Float32Array(MAX_POINTS * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.18,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    return { geometry: geo, material: mat };
  }, []);

  useFrame(() => {
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;
    const colAttr = geometry.attributes.color as THREE.BufferAttribute;
    const posArr = posAttr.array as Float32Array;
    const colArr = colAttr.array as Float32Array;

    const MAX = 100;
    const count = Math.min(trailPoints.length, MAX);
    const startIdx = Math.max(0, trailPoints.length - MAX);

    for (let i = 0; i < MAX; i++) {
      if (i < count) {
        const tp: TrailPoint = trailPoints[startIdx + i];
        const idx = (count - 1 - i) * 3;
        posArr[idx] = tp.position[0];
        posArr[idx + 1] = tp.position[1];
        posArr[idx + 2] = tp.position[2];
        const c = new THREE.Color(tp.color);
        const alpha = tp.life;
        colArr[idx] = c.r;
        colArr[idx + 1] = c.g;
        colArr[idx + 2] = c.b;
        material.opacity = Math.max(0, alpha * 0.9);
      } else {
        const idx = i * 3;
        posArr[idx] = 0;
        posArr[idx + 1] = -1000;
        posArr[idx + 2] = 0;
        colArr[idx] = 0;
        colArr[idx + 1] = 0;
        colArr[idx + 2] = 0;
      }
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geometry.setDrawRange(0, count);
  });

  return <points geometry={geometry} material={material} />;
};

export default ParticleTrail;
