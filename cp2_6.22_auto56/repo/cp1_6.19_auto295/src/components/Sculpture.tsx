import { useRef } from 'react';
import * as THREE from 'three';
import type { Artwork } from '../types';

interface SculptureProps {
  artwork: Artwork;
  onSelect?: (id: string) => void;
}

const PEDESTAL_RADIUS = 0.4;
const PEDESTAL_HEIGHT = 0.6;

export function Sculpture({ artwork, onSelect }: SculptureProps) {
  const groupRef = useRef<THREE.Group>(null);
  const segments = artwork.polygonDetail;

  const renderSculpture = () => {
    const color = artwork.color || '#A0A0A0';
    const materialProps = { roughness: 0.6, metalness: 0.1 };

    switch (artwork.sculptureType) {
      case 'sphere':
        return (
          <mesh position={[0, PEDESTAL_HEIGHT + 0.4, 0]} castShadow receiveShadow>
            <sphereGeometry args={[0.4, segments, segments]} />
            <meshStandardMaterial color={color} {...materialProps} />
          </mesh>
        );
      case 'cube':
        return (
          <mesh position={[0, PEDESTAL_HEIGHT + 0.4, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.7, 0.7, 0.7]} />
            <meshStandardMaterial color={color} {...materialProps} />
          </mesh>
        );
      case 'cone':
        return (
          <mesh position={[0, PEDESTAL_HEIGHT + 0.45, 0]} castShadow receiveShadow>
            <coneGeometry args={[0.4, 0.9, segments]} />
            <meshStandardMaterial color={color} {...materialProps} />
          </mesh>
        );
      case 'spiral':
        return (
          <mesh position={[0, PEDESTAL_HEIGHT + 0.4, 0]} castShadow receiveShadow rotation={[0, 0, 0]}>
            <torusKnotGeometry args={[0.3, 0.08, segments * 4, segments]} />
            <meshStandardMaterial color={color} {...materialProps} />
          </mesh>
        );
      default:
        return null;
    }
  };

  return (
    <group
      ref={groupRef}
      position={[artwork.position.x, artwork.position.y, artwork.position.z]}
      rotation={[artwork.rotation.x, artwork.rotation.y, artwork.rotation.z]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(artwork.id);
      }}
    >
      <mesh position={[0, PEDESTAL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[PEDESTAL_RADIUS, PEDESTAL_RADIUS, PEDESTAL_HEIGHT, 32]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.3} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.01, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[PEDESTAL_RADIUS + 0.05, 32]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.5} />
      </mesh>
      {renderSculpture()}
    </group>
  );
}
