import { useRef } from 'react';
import { usePlane } from '@react-three/cannon';
import * as THREE from 'three';

export function Ground() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -2, 0],
    type: 'Static',
    material: {
      friction: 0.4,
      restitution: 0.3,
    },
  }));

  const gridHelperRef = useRef<THREE.GridHelper>(null);
  const groundRef = useRef<THREE.Mesh>(null);

  return (
    <group>
      <mesh ref={groundRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial
          color="#0a0f25"
          transparent
          opacity={0.6}
          metalness={0.3}
          roughness={0.8}
        />
      </mesh>

      <gridHelper
        ref={gridHelperRef}
        args={[60, 60, '#00f5ff30', '#a855f715']}
        position={[0, -1.99, 0]}
      />

      <mesh ref={ref as React.RefObject<THREE.Mesh>} position={[0, -2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}
