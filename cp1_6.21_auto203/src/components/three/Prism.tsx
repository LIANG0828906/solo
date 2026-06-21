import { useRef, useState, useMemo } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { MathUtils } from 'three';
import * as THREE from 'three';
import type { Mechanism } from '@/types/game';

interface PrismProps {
  mechanism: Mechanism;
  selected: boolean;
  onClick: () => void;
}

export function Prism({ mechanism, selected, onClick }: PrismProps) {
  const meshRef = useRef<THREE.Group>(null);
  const prismMeshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (meshRef.current) {
      const targetRotation = MathUtils.degToRad(mechanism.rotation);
      meshRef.current.rotation.y = MathUtils.lerp(
        meshRef.current.rotation.y,
        targetRotation,
        0.12
      );
    }

    if (prismMeshRef.current) {
      const material = prismMeshRef.current.material as THREE.MeshPhysicalMaterial;
      const t = state.clock.elapsedTime;
      material.emissiveIntensity = 0.3 + Math.sin(t * 2) * 0.1;
    }
  });

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onClick();
  };

  const scale = hovered ? 1.02 : 1;

  const colors = useMemo(() => {
    const c = new Float32Array(9 * 3);
    const rainbow = [
      new THREE.Color('#ff4444'),
      new THREE.Color('#ffaa00'),
      new THREE.Color('#ffff00'),
      new THREE.Color('#44ff44'),
      new THREE.Color('#4444ff'),
      new THREE.Color('#aa44ff'),
    ];
    for (let i = 0; i < 9; i++) {
      const color = rainbow[i % rainbow.length];
      c[i * 3] = color.r;
      c[i * 3 + 1] = color.g;
      c[i * 3 + 2] = color.b;
    }
    return c;
  }, []);

  return (
    <group
      ref={meshRef}
      position={[mechanism.position.x, mechanism.position.y, mechanism.position.z]}
      scale={[scale, scale, scale]}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onPointerDown={handlePointerDown}
    >
      <mesh ref={prismMeshRef} rotation={[0, Math.PI / 6, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 1.2, 3]}>
          <bufferAttribute
            attach="attributes-color"
            count={colors.length / 3}
            array={colors}
            itemSize={3}
          />
        </cylinderGeometry>
        <meshPhysicalMaterial
          color="#e0f0ff"
          transparent
          opacity={0.55}
          roughness={0.05}
          metalness={0.1}
          transmission={0.6}
          thickness={0.8}
          ior={1.5}
          vertexColors
          emissive="#aa88ff"
          emissiveIntensity={0.3}
          clearcoat={0.8}
          clearcoatRoughness={0.1}
        />
      </mesh>
      {selected && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.7, 0]}>
          <ringGeometry args={[0.75, 0.88, 32]} />
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
