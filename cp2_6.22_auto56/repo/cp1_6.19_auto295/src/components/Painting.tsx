import { useRef, useMemo } from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import type { Artwork } from '../types';

interface PaintingProps {
  artwork: Artwork;
  onSelect?: (id: string) => void;
}

const FRAME_THICKNESS = 0.05;
const FRAME_WIDTH = 2;
const FRAME_HEIGHT = 1.5;
const FRAME_COLOR = '#5D4037';

export function Painting({ artwork, onSelect }: PaintingProps) {
  const groupRef = useRef<THREE.Group>(null);

  const texture = useTexture(artwork.imageUrl || '');

  const frameParts = useMemo(() => {
    const border = 0.08;
    return [
      { pos: [0, FRAME_HEIGHT / 2 + border / 2, 0] as [number, number, number], size: [FRAME_WIDTH + border * 2, border, FRAME_THICKNESS] as [number, number, number] },
      { pos: [0, -FRAME_HEIGHT / 2 - border / 2, 0] as [number, number, number], size: [FRAME_WIDTH + border * 2, border, FRAME_THICKNESS] as [number, number, number] },
      { pos: [-FRAME_WIDTH / 2 - border / 2, 0, 0] as [number, number, number], size: [border, FRAME_HEIGHT, FRAME_THICKNESS] as [number, number, number] },
      { pos: [FRAME_WIDTH / 2 + border / 2, 0, 0] as [number, number, number], size: [border, FRAME_HEIGHT, FRAME_THICKNESS] as [number, number, number] },
    ];
  }, []);

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
      {frameParts.map((part, i) => (
        <mesh key={i} position={part.pos} castShadow receiveShadow>
          <boxGeometry args={part.size} />
          <meshStandardMaterial color={FRAME_COLOR} roughness={0.7} metalness={0.1} />
        </mesh>
      ))}
      <mesh position={[0, 0, FRAME_THICKNESS / 2 + 0.001]} castShadow receiveShadow>
        <planeGeometry args={[FRAME_WIDTH, FRAME_HEIGHT]} />
        {artwork.imageUrl ? (
          <meshStandardMaterial map={texture} />
        ) : (
          <meshStandardMaterial color="#888888" />
        )}
      </mesh>
    </group>
  );
}
