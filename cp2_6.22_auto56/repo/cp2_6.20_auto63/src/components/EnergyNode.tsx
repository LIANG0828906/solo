import { useRef, useMemo, useState, useCallback } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
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
  const [hovered, setHovered] = useState(false);

  const hexColor = useMemo(() => new THREE.Color(color), [color]);
  const errorColor = useMemo(() => new THREE.Color('#ff3355'), []);
  const litColor = useMemo(() => new THREE.Color('#ffd700'), []);

  const handlePointerOver = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!isLit) {
      setHovered(true);
      document.body.style.cursor = 'pointer';
    }
  }, [isLit]);

  const handlePointerOut = useCallback((_e: ThreeEvent<PointerEvent>) => {
    setHovered(false);
    document.body.style.cursor = 'default';
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.3;
    }

    if (outerRingRef.current) {
      const basePulse = 1 + Math.sin(t * (Math.PI / 0.8)) * 0.15;
      const hoverScale = hovered && !isLit ? 1.1 : 1;
      outerRingRef.current.scale.setScalar(basePulse * hoverScale);
      const mat = outerRingRef.current.material as THREE.MeshBasicMaterial;
      if (isError) {
        const flash = 0.5 + Math.sin(t * 20) * 0.5;
        mat.opacity = flash;
      } else if (isLit) {
        mat.opacity = 0.9 + Math.sin(t * 3) * 0.1;
      } else {
        mat.opacity = (hovered ? 0.7 : 0.5) + Math.sin(t * (Math.PI / 0.8)) * 0.2;
      }
    }

    if (innerCoreRef.current) {
      const breathe = 1 + Math.sin(t * 2) * 0.1;
      const hoverBoost = hovered && !isLit ? 1.1 : 1;
      innerCoreRef.current.scale.setScalar(breathe * hoverBoost);
      innerCoreRef.current.rotation.x = t * 0.5;
      innerCoreRef.current.rotation.z = t * 0.3;
    }

    if (burstRingRef.current && burstActive) {
      const progress = nodeSystem.getBurstProgress(nodeId);
      burstRingRef.current.visible = true;
      burstRingRef.current.scale.setScalar(1 + progress * 8);
      const mat = burstRingRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = (1 - progress) * 0.9;
    } else if (burstRingRef.current) {
      burstRingRef.current.visible = false;
    }
  });

  const displayColor = isError ? errorColor : isLit ? litColor : hexColor;
  const emissiveIntensity = isLit ? 2 : isError ? 2.5 : hovered ? 1.2 : 0.8;
  const lightIntensity = isLit ? 3 : isError ? 1.5 : hovered ? 1.2 : 0.8;

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

      <mesh
        ref={innerCoreRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
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
        intensity={lightIntensity}
        distance={isLit ? 12 : 8}
        decay={2}
      />

      <mesh ref={burstRingRef} visible={false}>
        <ringGeometry args={[0.4, 0.8, 64]} />
        <meshBasicMaterial
          color="#ffd700"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
};

export default EnergyNode;
