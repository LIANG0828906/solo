import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomComponent as RoomComponentType } from '../../types';
import { useParamStore } from '../params/useParamStore';

interface RoomComponentProps {
  component: RoomComponentType;
  isSelected: boolean;
  floorReflectivity: number;
  wallRoughness: number;
}

const springEase = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

export function RoomMesh({ component, isSelected, floorReflectivity, wallRoughness }: RoomComponentProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const [animProgress, setAnimProgress] = useState(0);
  const [startY] = useState(component.position[1] + 8);
  const setSelected = useParamStore((state) => state.setSelectedComponent);

  useFrame((_, delta) => {
    if (animProgress < 1) {
      setAnimProgress((prev) => Math.min(prev + delta / 0.4, 1));
    }
    if (edgesRef.current && isSelected) {
      const geo = edgesRef.current.geometry as THREE.BufferGeometry;
      const posAttr = geo.attributes.position as THREE.BufferAttribute;
      const offsets = new Float32Array(posAttr.count);
      for (let i = 0; i < posAttr.count; i++) {
        offsets[i] = (Date.now() / 1000 * 10) % 20;
      }
    }
  });

  const easedProgress = springEase(animProgress);
  const currentY = startY + (component.position[1] - startY) * easedProgress;

  const getMaterial = () => {
    switch (component.type) {
      case 'floor':
        return (
          <meshStandardMaterial
            color="#D2B48C"
            roughness={1 - floorReflectivity * 0.8}
            metalness={floorReflectivity * 0.3}
          />
        );
      case 'wall':
        return (
          <meshStandardMaterial
            color="#F5F5DC"
            roughness={wallRoughness}
            metalness={0.05}
          />
        );
      case 'ceiling':
        return (
          <meshStandardMaterial
            color="#FAEBD7"
            roughness={wallRoughness}
            metalness={0.02}
          />
        );
      case 'window':
        return (
          <meshPhysicalMaterial
            color="#E8F4FF"
            transparent
            opacity={0.15}
            roughness={0.05}
            metalness={0.9}
            transmission={0.9}
            thickness={0.5}
          />
        );
      default:
        return <meshStandardMaterial color="#ffffff" />;
    }
  };

  const castShadow = component.type !== 'window';
  const receiveShadow = component.type === 'floor' || component.type === 'wall';

  return (
    <group position={[component.position[0], currentY, component.position[2]]}>
      <mesh
        ref={meshRef}
        castShadow={castShadow}
        receiveShadow={receiveShadow}
        onClick={(e) => {
          e.stopPropagation();
          setSelected(component.id);
        }}
      >
        <boxGeometry args={component.size} />
        {getMaterial()}
      </mesh>
      {isSelected && (
        <lineSegments ref={edgesRef}>
          <edgesGeometry args={[new THREE.BoxGeometry(...component.size)]} />
          <lineBasicMaterial color="#FFFFFF" transparent opacity={0.8} />
        </lineSegments>
      )}
    </group>
  );
}
