import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Particle } from '../types';
import { useMineralStore } from '../store/mineralStore';
import { getParticleOpacity, updateParticles } from '../logic/particleSystem';

interface ParticlesRendererProps {}

const ParticlesRenderer: React.FC<ParticlesRendererProps> = () => {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorArray = useRef<Float32Array | null>(null);
  const { particles, removeParticles, updateParticle } = useMineralStore();

  const MAX_COUNT = 500;

  useFrame((_, delta) => {
    if (!instancedMeshRef.current) return;

    const result = updateParticles(particles, delta);
    if (result.toRemove.length > 0) {
      removeParticles(result.toRemove);
    }

    const mesh = instancedMeshRef.current;
    const displayParticles = result.particles.filter((p) => p.life > 0);

    for (let i = 0; i < MAX_COUNT; i++) {
      if (i < displayParticles.length) {
        const particle = displayParticles[i];
        dummy.position.copy(particle.position);
        const scale = 0.01;
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);

        const opacity = getParticleOpacity(particle);
        const color = new THREE.Color(particle.color);
        mesh.setColorAt(i, color);
      } else {
        dummy.position.set(0, -9999, 0);
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (colorArray.current) {
          colorArray.current[i * 3] = 0;
          colorArray.current[i * 3 + 1] = 0;
          colorArray.current[i * 3 + 2] = 0;
        }
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  const geometry = useMemo(() => {
    const geo = new THREE.SphereGeometry(1, 4, 4);
    return geo;
  }, []);

  return (
    <instancedMesh
      ref={instancedMeshRef}
      args={[geometry, undefined, MAX_COUNT]}
    >
      <meshBasicMaterial transparent opacity={1} vertexColors />
    </instancedMesh>
  );
};

export default ParticlesRenderer;
