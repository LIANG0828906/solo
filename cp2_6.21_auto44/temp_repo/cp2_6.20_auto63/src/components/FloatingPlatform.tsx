import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface FloatingPlatformProps {
  position: [number, number, number];
  scale?: [number, number, number];
  index: number;
}

const FloatingPlatform: React.FC<FloatingPlatformProps> = ({ position, scale = [2.8, 0.6, 2.8], index }) => {
  const groupRef = useRef<THREE.Group>(null);

  const geometry = useMemo(() => {
    const geo = new THREE.DodecahedronGeometry(1, 0);
    geo.scale(1, 0.35, 1);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      pos.setX(i, x + (Math.random() - 0.5) * 0.15);
      pos.setY(i, y + (Math.random() - 0.5) * 0.1);
      pos.setZ(i, z + (Math.random() - 0.5) * 0.15);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime + index * 0.7;
    groupRef.current.position.y = position[1] + Math.sin(t * 0.6) * 0.15;
    groupRef.current.rotation.y = Math.sin(t * 0.2) * 0.03;
  });

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={geometry} scale={scale} castShadow receiveShadow>
        <meshStandardMaterial
          color="#2a1f4a"
          roughness={0.85}
          metalness={0.15}
          flatShading
        />
      </mesh>
      <mesh position={[0, scale[1] * 0.55, 0]} scale={[scale[0] * 0.8, 0.05, scale[2] * 0.8]}>
        <cylinderGeometry args={[1, 1, 1, 12]} />
        <meshStandardMaterial
          color="#4a3a7a"
          emissive="#8844ff"
          emissiveIntensity={0.15}
          roughness={0.4}
          metalness={0.3}
        />
      </mesh>
    </group>
  );
};

export default FloatingPlatform;
