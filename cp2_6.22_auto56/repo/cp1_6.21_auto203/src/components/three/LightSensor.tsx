import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3 } from '@/types/game';

interface LightSensorProps {
  position: Vector3;
  radius: number;
  activated: boolean;
}

export function LightSensor({ position, radius, activated }: LightSensorProps) {
  const discRef = useRef<THREE.Mesh>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloRef2 = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (discRef.current) {
      const material = discRef.current.material as THREE.MeshBasicMaterial;
      if (activated) {
        material.emissiveIntensity = 1.5 + Math.sin(t * 3) * 0.5;
      }
    }

    if (activated && haloRef.current && haloRef2.current) {
      const phase1 = (t * 0.8) % 1;
      const phase2 = ((t * 0.8) + 0.5) % 1;

      haloRef.current.scale.setScalar(1 + phase1 * 1.2);
      (haloRef.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase1) * 0.7;

      haloRef2.current.scale.setScalar(1 + phase2 * 1.2);
      (haloRef2.current.material as THREE.MeshBasicMaterial).opacity = (1 - phase2) * 0.7;
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh position={[0, -0.075, 0]}>
        <cylinderGeometry args={[radius + 0.1, radius + 0.15, 0.15, 24]} />
        <meshStandardMaterial
          color="#1f2937"
          roughness={0.8}
          metalness={0.3}
        />
      </mesh>
      <mesh ref={discRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <circleGeometry args={[radius, 32]} />
        <meshBasicMaterial
          color={activated ? '#FBBF24' : '#3B82F6'}
          emissive={activated ? '#FBBF24' : '#3B82F6'}
          emissiveIntensity={activated ? 2.0 : 0.6}
          transparent
          opacity={0.9}
        />
      </mesh>
      {activated && (
        <>
          <mesh ref={haloRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <torusGeometry args={[radius + 0.2, 0.03, 16, 48]} />
            <meshBasicMaterial
              color="#FBBF24"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          <mesh ref={haloRef2} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
            <torusGeometry args={[radius + 0.2, 0.03, 16, 48]} />
            <meshBasicMaterial
              color="#FDE68A"
              transparent
              opacity={0.7}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight
            position={[0, 0.3, 0]}
            color="#FBBF24"
            intensity={2}
            distance={6}
            decay={2}
          />
        </>
      )}
    </group>
  );
}
