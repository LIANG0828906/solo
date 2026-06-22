import { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import type { FragmentData } from '@/types';

interface FragmentsProps {
  fragments: FragmentData[];
}

interface FragmentState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  size: number;
  color: THREE.Color;
  life: number;
}

export function Fragments({ fragments }: FragmentsProps) {
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const fragmentStatesRef = useRef<FragmentState[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (fragments.length === 0) {
      fragmentStatesRef.current = [];
      initializedRef.current = false;
      return;
    }

    if (initializedRef.current) return;
    initializedRef.current = true;

    const states: FragmentState[] = fragments.slice(0, 5000).map((f) => ({
      position: new THREE.Vector3(...f.position),
      velocity: new THREE.Vector3(...f.velocity),
      size: f.size,
      color: new THREE.Color(f.color),
      life: 2 + Math.random() * 1,
    }));

    fragmentStatesRef.current = states;
  }, [fragments]);

  useFrame((_, delta) => {
    const mesh = instancedMeshRef.current;
    if (!mesh) return;

    const states = fragmentStatesRef.current;
    if (states.length === 0) {
      mesh.count = 0;
      return;
    }

    const gravity = -9.8;
    const dt = Math.min(delta, 0.05);
    let activeCount = 0;

    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      if (s.life <= 0) continue;

      s.velocity.y += gravity * dt;
      s.position.addScaledVector(s.velocity, dt);

      if (s.position.y - s.size * 0.5 < 0) {
        s.position.y = s.size * 0.5;
        if (s.velocity.y < 0) {
          s.velocity.y = -s.velocity.y * 0.2;
        }
      }

      s.life -= dt;
      if (s.life <= 0) continue;

      const opacity = Math.min(1, s.life / 2);

      dummy.position.copy(s.position);
      dummy.scale.setScalar(s.size * 2);
      dummy.updateMatrix();
      mesh.setMatrixAt(activeCount, dummy.matrix);
      mesh.setColorAt(activeCount, s.color);

      activeCount++;
    }

    mesh.count = activeCount;
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <instancedMesh ref={instancedMeshRef} args={[undefined, undefined, 5000]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial transparent opacity={0.8} />
    </instancedMesh>
  );
}
