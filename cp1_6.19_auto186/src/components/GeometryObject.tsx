import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GeometryObject as GeometryObjectType } from '../types';
import { getMaterialColor } from '../utils/materials';
import { useSceneStore } from '../store/useSceneStore';

interface GeometryObjectProps {
  geometry: GeometryObjectType;
}

const GeometryObjectComponent = ({ geometry }: GeometryObjectProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const selectedId = useSceneStore((state) => state.selectedId);
  const selectGeometry = useSceneStore((state) => state.selectGeometry);
  const isSelected = selectedId === geometry.id;

  const color = useMemo(() => {
    return getMaterialColor(geometry.material);
  }, [geometry.material]);

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectGeometry(geometry.id);
  };

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = 'default';
  };

  const renderGeometry = () => {
    switch (geometry.type) {
      case 'wall':
        return (
          <boxGeometry args={[geometry.size.x, geometry.size.y, geometry.size.z]} />
        );
      case 'cylinder':
        return (
          <cylinderGeometry
            args={[geometry.size.x / 2, geometry.size.x / 2, geometry.size.y, 32]}
          />
        );
      case 'wedge':
        return (
          <coneGeometry args={[geometry.size.x / 2, geometry.size.y, 4]} />
        );
      default:
        return (
          <boxGeometry args={[geometry.size.x, geometry.size.y, geometry.size.z]} />
        );
    }
  };

  return (
    <group
      position={[geometry.position.x, geometry.position.y, geometry.position.z]}
      rotation={[geometry.rotation.x, geometry.rotation.y, geometry.rotation.z]}
    >
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={color}
          transparent={geometry.material === 'glass'}
          opacity={geometry.material === 'glass' ? 0.6 : 1}
          roughness={geometry.material === 'marble' ? 0.3 : 0.8}
          metalness={geometry.material === 'marble' ? 0.2 : 0}
        />
      </mesh>
      {isSelected && (
        <mesh>
          {renderGeometry()}
          <meshBasicMaterial
            color="#00ff00"
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
      )}
    </group>
  );
};

export default GeometryObjectComponent;
