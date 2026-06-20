import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NodeSystem } from '@/game/NodeSystem';

interface EnergyNodeProps {
  nodeId: string;
  position: [number, number, number];
  color: string;
  isLit: boolean;
  isError: boolean;
  nodeSystem: NodeSystem;
  burstActive: boolean;
}

const EnergyNode: React.FC<EnergyNodeProps> = ({
  nodeId,
  position,
  color,
  isLit,
  isError,
  nodeSystem,
  burstActive,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerCoreRef = useRef<THREE.Mesh>(null);
  const burstRingRef = useRef<THREE.Mesh>(null);

  const hexColor = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.3;
    }

    if (outerRingRef.current) {
      const pulse = 1 + Math.sin(t * (Math.PI / 0.8)) * 0.15;
      outerRingRef.current.scale.setScalar(pulse);
      const mat = outerRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = isLit ? 0.9 : 0.5 + Math.sin(t * (Math.PI / 0.8)) * 0.2;
    }

    if (innerCoreRef.current) {
      const breathe = 1 + Math.sin(t * 2) * 0.1;
      innerCoreRef.current.scale.setScalar(breathe);
      innerCoreRef.current.rotation.x = t * 0.5;
      innerCoreRef.current.rotation.z = t * 0.3;
    }

    if (burstRingRef.current && burstActive) {
      const progress = nodeSystem.getBurstProgress(nodeId);
      burstRingRef.current.visible = true;
      burstRingRef.current.scale.setScalar(1 + progress * 6);
      const mat = burstRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - progress) * 0.8;
    } else if (burstRingRef.current) {
      burstRingRef.current.visible = false;
    }
  });

  const displayColor = isError ? '#ff3355' : isLit ? '#ffd700' : color;
  const emissiveIntensity = isLit ? 1.5 : isError ? 2 : 0.8;

  return (
    <group ref={groupRef} position={position}>
      <mesh ref={outerRingRef}>
        <torusGeometry args={[0.7, 0.04, 16, 48]} />
        <meshBasicMaterial
          color={displayColor}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.7, 0.04, 16, 48]} />
        <meshBasicMaterial
          color={displayColor}
          transparent
          opacity={0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={innerCoreRef}>
        <octahedronGeometry args={[0.35, 0]} />
        <meshStandardMaterial
          color={displayColor}
          emissive={displayColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.5}
          roughness={0.2}
          transparent
          opacity={isError ? 0.9 : 1}
        />
      </mesh>

      <pointLight
        color={displayColor}
        intensity={isLit ? 2.5 : 0.8}
        distance={8}
        decay={2}
      />

      <mesh ref={burstRingRef} visible={false}>
        <ringGeometry args={[0.5, 0.7, 64]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default EnergyNode;
