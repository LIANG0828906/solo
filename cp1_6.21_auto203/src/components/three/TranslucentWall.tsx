import { useRef, useState } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { MathUtils } from 'three';
import * as THREE from 'three';
import type { Mechanism } from '@/types/game';

interface TranslucentWallProps {
  mechanism: Mechanism;
  selected: boolean;
  onClick: () => void;
}

export function TranslucentWall({ mechanism, selected, onClick }: TranslucentWallProps) {
  const meshRef = useRef<THREE.Group>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const [hovered, setHovered] = useState(false);

  useFrame(() => {
    if (meshRef.current) {
      const targetRotation = MathUtils.degToRad(mechanism.rotation);
      meshRef.current.rotation.y = MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation,
        0.12
      );
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onClick();
  };

  const scale = hovered ? 1.02 : 1;

  return (
    <group
      ref={meshRef}
      position={[mechanism.position.x, mechanism.position.y, mechanism.position.z]}
      scale={[scale, scale, scale]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={handlePointerDown}
    >
      <mesh>
        <boxGeometry args={[mechanism.size.x, mechanism.size.y, mechanism.size.z]} />
        <meshPhysicalMaterial
          color="#f0f4ff"
          transparent
          opacity={0.45}
          roughness={0.3}
          metalness={0.0}
          transmission={0.5}
          thickness={0.5}
          clearcoat={0.3}
          clearcoatRoughness={0.2}
        />
      </mesh>
      <lineSegments ref={edgesRef}>
        <edgesGeometry
          args={[new THREE.BoxGeometry(mechanism.size.x, mechanism.size.y, mechanism.size.z)]}
        />
        <lineBasicMaterial color="#8888aa" linewidth={1} />
      </lineSegments>
      {selected && (
        <mesh position={[0, mechanism.size.y / 2 + 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[
              Math.max(mechanism.size.x, mechanism.size.z) * 0.55,
              Math.max(mechanism.size.x, mechanism.size.z) * 0.7,
              32,
            ]}
          />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.8}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
}
