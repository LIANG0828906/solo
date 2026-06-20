import { useRef, useState, useEffect } from 'react';
import { useFrame, ThreeEvent } from '@react-three/fiber';
import { Edges, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSceneStore } from '../store/sceneStore';
import type { GeometryItemData } from '../types';

interface GeometryItemProps {
  data: GeometryItemData;
  isSelected: boolean;
}

const getComplementaryColor = (hex: string): string => {
  const hexColor = hex.replace('#', '');
  const r = 255 - parseInt(hexColor.slice(0, 2), 16);
  const g = 255 - parseInt(hexColor.slice(2, 4), 16);
  const b = 255 - parseInt(hexColor.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
};

const GeometryMesh = ({ type }: { type: GeometryItemData['type'] }) => {
  switch (type) {
    case 'box':
      return <boxGeometry args={[1, 1, 1]} />;
    case 'sphere':
      return <sphereGeometry args={[0.6, 32, 32]} />;
    case 'cylinder':
      return <cylinderGeometry args={[0.5, 0.5, 1.2, 32]} />;
    case 'torus':
      return <torusGeometry args={[0.5, 0.18, 16, 48]} />;
    case 'cone':
      return <coneGeometry args={[0.6, 1.2, 32]} />;
    default:
      return <boxGeometry args={[1, 1, 1]} />;
  }
};

function GeometryItem({ data, isSelected }: GeometryItemProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const [visible, setVisible] = useState(false);
  const { selectGeometry } = useSceneStore();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useFrame((_, delta) => {
    if (groupRef.current) {
      const targetScale = visible ? 1 : 0;
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 10
      );
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectGeometry(data.id);
  };

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  const position = new THREE.Vector3(data.position.x, data.position.y, data.position.z);
  const rotation = new THREE.Euler(
    THREE.MathUtils.degToRad(data.rotation.x),
    THREE.MathUtils.degToRad(data.rotation.y),
    THREE.MathUtils.degToRad(data.rotation.z)
  );
  const scale = new THREE.Vector3(data.scale.x, data.scale.y, data.scale.z);

  const edgeColor = hovered
    ? getComplementaryColor(data.material.color)
    : isSelected
    ? '#ffffff'
    : undefined;

  return (
    <group ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        name={data.id}
      >
        <GeometryMesh type={data.type} />
        <meshStandardMaterial
          color={data.material.color}
          roughness={data.material.roughness}
          metalness={data.material.metalness}
          emissive={hovered ? data.material.color : '#000000'}
          emissiveIntensity={hovered ? 0.15 : 0}
        />
        {(hovered || isSelected) && edgeColor && (
          <Edges color={edgeColor} threshold={15} linewidth={1} />
        )}
      </mesh>
      {hovered && (
        <Html position={[0, 1, 0]} center distanceFactor={10}>
          <div style={{
            background: 'rgba(0,0,0,0.8)',
            color: '#ffffff',
            padding: '4px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'nowrap',
            pointerEvents: 'none'
          }}>
            {data.name}
          </div>
        </Html>
      )}
    </group>
  );
}

export default GeometryItem;
