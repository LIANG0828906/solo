import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function LoadingSpinner() {
  const ringRef = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);

  useFrame((_, delta) => {
    const rotationSpeed = (Math.PI * 2) / 0.5;
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * rotationSpeed;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * rotationSpeed * 1.5;
    }
  });

  return (
    <group>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.45, 64]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, Math.PI / 4]}>
        <ringGeometry args={[0.25, 0.3, 48]} />
        <meshBasicMaterial
          color="#7c4dff"
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
