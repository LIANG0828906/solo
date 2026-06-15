import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaterSurfaceProps {
  size: number;
  waterLevel: number;
}

export default function WaterSurface({ size, waterLevel }: WaterSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometryRef = useRef<THREE.PlaneGeometry>(null);
  const positionsRef = useRef<Float32Array | null>(null);

  const segments = 64;
  const worldSize = size + 24;

  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(worldSize, worldSize, segments, segments);
    geo.rotateX(-Math.PI / 2);
    positionsRef.current = geo.attributes.position.array as Float32Array;
    return geo;
  }, [worldSize]);

  useFrame(({ clock }) => {
    if (!meshRef.current || !positionsRef.current || !geometryRef.current) return;
    const t = clock.getElapsedTime();
    const positions = positionsRef.current;
    const yBase = waterLevel + 0.15;

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const wave1 = Math.sin(x * 0.32 + t * 1.2) * 0.18;
      const wave2 = Math.sin(z * 0.41 - t * 0.9 + x * 0.15) * 0.12;
      const wave3 = Math.sin((x + z) * 0.24 + t * 0.6) * 0.08;
      positions[i + 1] = yBase + wave1 + wave2 + wave3;
    }

    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} position={[0, 0, 0]} receiveShadow>
      <primitive object={geometry} ref={geometryRef} attach="geometry" />
      <meshStandardMaterial
        color="#2b7bc7"
        transparent
        opacity={0.72}
        roughness={0.18}
        metalness={0.35}
        side={THREE.DoubleSide}
        envMapIntensity={0.9}
      />
    </mesh>
  );
}
