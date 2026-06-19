import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';

interface ReceiverProps {
  index: number;
}

const Receiver = ({ index }: ReceiverProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const receiverPositions = useSceneStore((state) => state.receiverPositions);
  const position = receiverPositions[index];

  useFrame((state) => {
    if (pulseRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + index) * 0.3;
      pulseRef.current.scale.set(scale, scale, scale);
    }
  });

  if (!position) return null;

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.2, 24, 24]} />
        <meshStandardMaterial color="#32CD32" emissive="#32CD32" emissiveIntensity={0.5} />
      </mesh>
      <mesh ref={pulseRef}>
        <sphereGeometry args={[0.3, 24, 24]} />
        <meshBasicMaterial color="#32CD32" transparent opacity={0.3} />
      </mesh>
    </group>
  );
};

export default Receiver;
