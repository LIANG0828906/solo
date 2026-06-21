import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3 } from '@/types/game';

interface SelectionRingProps {
  visible: boolean;
  position: Vector3;
}

export function SelectionRing({ visible, position }: SelectionRingProps) {
  const innerRef = useRef<THREE.Mesh>(null);
  const outerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const pulseOpacity = 0.6 + Math.sin((t * Math.PI * 2) / 1.5) * 0.2;
    const rotation = t * 0.5;

    if (innerRef.current) {
      (innerRef.current.material as THREE.MeshBasicMaterial).opacity = pulseOpacity + 0.2;
      innerRef.current.rotation.z = rotation;
    }
    if (outerRef.current) {
      (outerRef.current.material as THREE.MeshBasicMaterial).opacity = (pulseOpacity + 0.1) * 0.5;
      outerRef.current.rotation.z = -rotation * 0.8;
    }
  });

  if (!visible) return null;

  return (
    <group position={[position.x, position.y + 1.2, position.z]}>
      <mesh ref={innerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.05, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={outerRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.25, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
