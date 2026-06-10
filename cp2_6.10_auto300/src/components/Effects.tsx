import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing';
import { useGameState } from '../hooks/useGameState';

function Particles() {
  const { particles, updateParticles, isPaused, levelTransition } = useGameState();
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((_, delta) => {
    if (!isPaused && !levelTransition.active) {
      updateParticles(delta);
    }

    if (meshRef.current) {
      particles.forEach((particle, i) => {
        if (particle.life > 0) {
          dummy.position.set(
            particle.position[0],
            particle.position[1],
            particle.position[2]
          );
          dummy.scale.setScalar(particle.size * particle.life);
          dummy.updateMatrix();
          meshRef.current!.setMatrixAt(i, dummy.matrix);
        }
      });
      meshRef.current.count = particles.filter((p) => p.life > 0).length;
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 500]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.8}
      />
    </instancedMesh>
  );
}

function AmbientParticles() {
  const count = 200;
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const positions = useMemo(() => {
    const pos: [number, number, number][] = [];
    for (let i = 0; i < count; i++) {
      pos.push([
        (Math.random() - 0.5) * 40,
        Math.random() * 5,
        (Math.random() - 0.5) * 40,
      ]);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.getElapsedTime();

    for (let i = 0; i < count; i++) {
      const basePos = positions[i];
      dummy.position.set(
        basePos[0] + Math.sin(time * 0.5 + i) * 0.5,
        basePos[1] + Math.sin(time * 0.3 + i * 0.7) * 0.3,
        basePos[2] + Math.cos(time * 0.5 + i) * 0.5
      );
      const scale = 0.03 + Math.sin(time + i) * 0.01;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color="#00e5ff"
        transparent
        opacity={0.3}
      />
    </instancedMesh>
  );
}

export function Effects() {
  return (
    <>
      <fog attach="fog" args={['#0a0a0f', 10, 35]} />

      <ambientLight intensity={0.3} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={0.5}
        color="#9b59b6"
        castShadow
      />
      <pointLight
        position={[0, 15, 0]}
        intensity={1}
        color="#00e5ff"
        distance={30}
      />

      <Particles />
      <AmbientParticles />

      <EffectComposer>
        <Bloom
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          intensity={1.5}
          mipmapBlur
        />
        <ChromaticAberration
          offset={[0.001, 0.001]}
        />
      </EffectComposer>
    </>
  );
}
