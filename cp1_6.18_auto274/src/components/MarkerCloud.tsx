import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Marker } from '../types';

interface MarkerCloudProps {
  markers: Marker[];
  isPlayback?: boolean;
}

export function MarkerCloud({ markers, isPlayback = false }: MarkerCloudProps) {
  const pointsRef = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(markers.length * 3);
    const col = new Float32Array(markers.length * 3);
    const color = new THREE.Color('#FFD700');

    markers.forEach((marker, i) => {
      pos[i * 3] = marker.position.x;
      pos[i * 3 + 1] = marker.position.y;
      pos[i * 3 + 2] = marker.position.z;
      col[i * 3] = color.r;
      col[i * 3 + 1] = color.g;
      col[i * 3 + 2] = color.b;
    });

    return { positions: pos, colors: col };
  }, [markers]);

  useFrame((state) => {
    if (pointsRef.current) {
      const size = 0.3 + 0.1 * Math.sin(state.clock.elapsedTime * 2);
      const mat = pointsRef.current.material as THREE.PointsMaterial;
      mat.size = size;
    }
  });

  const opacity = isPlayback ? 0.3 : 0.8;

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={markers.length}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={markers.length}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.3}
        vertexColors
        transparent
        opacity={opacity}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}
