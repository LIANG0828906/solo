import { useMemo } from 'react';
import * as THREE from 'three';

export function Ground() {
  const size = 40;
  const divisions = 80;

  const gridHelper = useMemo(() => {
    return new THREE.GridHelper(size, divisions, 0x333355, 0x222244);
  }, []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial color="#0a0a1a" transparent opacity={0.8} />
      </mesh>
      <primitive object={gridHelper} position={[0, 0, 0]} />
      
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[2, 2.2, 0.2, 32]} />
        <meshStandardMaterial color="#2a3a5a" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.1, 32]} />
        <meshStandardMaterial color="#3a4a6a" emissive="#1a2a4a" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}
