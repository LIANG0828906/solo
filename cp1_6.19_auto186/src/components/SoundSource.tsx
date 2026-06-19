import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../store/useSceneStore';

const SoundSource = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const sourcePosition = useSceneStore((state) => state.sourcePosition);
  const setSourcePosition = useSceneStore((state) => state.setSourcePosition);
  const [isDragging, setIsDragging] = useState(false);

  useFrame((state, delta) => {
    if (glowRef.current) {
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
      glowRef.current.scale.set(scale, scale, scale);
      const material = glowRef.current.material as THREE.MeshBasicMaterial;
      material.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
    }
  });

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
  };

  const handlePointerUp = (e: any) => {
    e.stopPropagation();
    setIsDragging(false);
  };

  return (
    <group position={[sourcePosition.x, sourcePosition.y, sourcePosition.z]}>
      <mesh ref={meshRef} onPointerDown={handlePointerDown} onPointerUp={handlePointerUp}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshBasicMaterial color="#FFD700" />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial 
          color="#FFD700" 
          transparent 
          opacity={0.3} 
          side={THREE.BackSide}
        />
      </mesh>
      <pointLight color="#FFD700" intensity={1} distance={5} />
    </group>
  );
};

export default SoundSource;
