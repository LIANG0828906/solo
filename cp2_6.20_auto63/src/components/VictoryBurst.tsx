import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore, type BurstParticle } from '@/store/useGameStore';

const VictoryBurst: React.FC = () => {
  const particles = useGameStore((s) => s.burstParticles);
  const active = useGameStore((s) => s.victoryBurstActive);

  const { geometry, material } = useMemo(() => {
    const MAX = 300;
    const positions = new Float32Array(MAX * 3);
    const colors = new Float32Array(MAX * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const mat = new THREE.PointsMaterial({
      size: 0.22,
      vertexColors: true,
      transparent: true,
      opacity: 1,
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

    const MAX = 300;
    const count = Math.min(particles.length, MAX);

    for (let i = 0; i < MAX; i++) {
      if (i < count) {
      const p: BurstParticle = particles[i];
        const idx = i * 3;
        posArr[idx] = p.position[0];
        posArr[idx + 1] = p.position[1];
        posArr[idx + 2] = p.position[2];
        const c = new THREE.Color(p.color);
        colArr[idx] = c.r;
        colArr[idx + 1] = c.g;
        colArr[idx + 2] = c.b;
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

    material.opacity = active ? 1 : 0;
    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
    geometry.setDrawRange(0, count);
  });

  return <points geometry={geometry} material={material} />;
};

export default VictoryBurst;
