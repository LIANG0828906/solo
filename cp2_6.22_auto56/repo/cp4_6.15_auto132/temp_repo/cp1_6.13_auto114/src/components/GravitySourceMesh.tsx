import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { GravitySource } from '@/utils/physicsEngine';

interface GravitySourceMeshProps {
  source: GravitySource;
  isSelected: boolean;
  isFadingIn: boolean;
}

function getSourceColor(mass: number): string {
  if (mass > 0) return '#00d4ff';
  if (mass < 0) return '#ff3300';
  return '#888888';
}

export default function GravitySourceMesh({ source, isSelected, isFadingIn }: GravitySourceMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const fadeStartRef = useRef<number | null>(null);
  const color = getSourceColor(source.mass);
  const radius = 0.3 + Math.abs(source.mass) * 0.08;

  useFrame(() => {
    if (!isFadingIn || !meshRef.current) return;
    if (fadeStartRef.current === null) fadeStartRef.current = performance.now();
    const elapsed = performance.now() - fadeStartRef.current;
    const t = Math.min(elapsed / 300, 1);
    meshRef.current.scale.setScalar(t);
  });

  return (
    <group position={[source.position[0], radius, source.position[1]]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {isSelected && (
        <mesh>
          <sphereGeometry args={[radius * 1.2, 32, 32]} />
          <meshBasicMaterial color={color} wireframe transparent opacity={0.5} />
        </mesh>
      )}
      <pointLight color={color} intensity={Math.abs(source.mass) * 0.3} />
      <Html position={[0, radius + 0.5, 0]} center>
        <div style={{
          color: '#ffffff',
          fontSize: '12px',
          background: 'rgba(0,0,0,0.6)',
          padding: '2px 6px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}>
          m={source.mass}
        </div>
      </Html>
    </group>
  );
}
