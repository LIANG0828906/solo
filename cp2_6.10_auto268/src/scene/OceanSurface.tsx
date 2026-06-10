import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface OceanSurfaceProps {
  particleCount?: number;
  size?: number;
}

export const OceanSurface = ({ particleCount = 3000, size = 40 }: OceanSurfaceProps) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  const { positions, originalPositions } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = (Math.random() - 0.5) * size * 2;
      const z = (Math.random() - 0.5) * size * 2;
      const y = Math.random() * 0.5 - 0.25;
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      originalPositions[i3] = x;
      originalPositions[i3 + 1] = y;
      originalPositions[i3 + 2] = z;
    }
    
    return { positions, originalPositions };
  }, [particleCount, size]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    
    const positions = pointsRef.current.geometry.attributes.position.array as Float32Array;
    const time = state.clock.elapsedTime;
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const x = originalPositions[i3];
      const z = originalPositions[i3 + 2];
      
      const wave1 = Math.sin(x * 0.3 + time * 0.8) * 0.3;
      const wave2 = Math.cos(z * 0.25 + time * 0.6) * 0.2;
      const wave3 = Math.sin((x + z) * 0.15 + time * 0.4) * 0.15;
      
      positions[i3 + 1] = originalPositions[i3 + 1] + wave1 + wave2 + wave3;
    }
    
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        color="#4ecdc4"
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
