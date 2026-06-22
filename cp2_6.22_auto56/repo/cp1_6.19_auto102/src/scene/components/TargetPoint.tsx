import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSceneStore } from '../../store/sceneStore';

const TargetPoint: React.FC = () => {
  const targetPoint = useSceneStore((s) => s.targetPoint);
  const ringRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!targetPoint) return;
    const t = state.clock.elapsedTime - targetPoint.createdAt;
    const pulse = 1 + Math.sin(t * Math.PI * 2 / 0.5) * 0.15;

    if (ringRef.current) {
      ringRef.current.scale.setScalar(pulse);
      const mat = ringRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.3 + Math.sin(t * Math.PI * 2 / 0.5) * 0.15;
    }
    if (innerRef.current) {
      innerRef.current.scale.setScalar(1 + Math.sin(t * Math.PI * 2 / 0.5) * 0.1);
    }
  });

  if (!targetPoint) return null;

  return (
    <group position={[targetPoint.position.x, 0.02, targetPoint.position.z]}>
      <mesh ref={ringRef} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.2, 0.25, 32]} />
        <meshBasicMaterial
          color="#2ECC71"
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh ref={innerRef} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[0.1, 24]} />
        <meshBasicMaterial
          color="#2ECC71"
          transparent
          opacity={0.5}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};

export default TargetPoint;
