import { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Brick, BrickType, BRICK_COLORS } from '../store/useAppStore';

const GRID_UNIT = 16;

interface BrickMeshProps {
  brick: Brick;
  brickType: BrickType | undefined;
  isSelected: boolean;
  onClick: (e: any) => void;
  onPointerOver: (e: any) => void;
  onPointerOut: (e: any) => void;
}

export default function BrickMesh({ brick, brickType, isSelected, onClick, onPointerOver, onPointerOut }: BrickMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);
  const [hovered, setHovered] = useState(false);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);

  const geometry = useMemo(() => {
    if (!brickType) return null;

    const w = brickType.width * GRID_UNIT;
    const h = brickType.height * GRID_UNIT;
    const d = brickType.depth * GRID_UNIT;

    if (brickType.shape === 'cube') {
      return new THREE.BoxGeometry(w, h, d);
    } else if (brickType.shape === 'cylinder') {
      const radius = w / 2;
      return new THREE.CylinderGeometry(radius, radius, h, 32);
    } else if (brickType.shape === 'slope') {
      const geo = new THREE.BoxGeometry(w, h, d);
      const pos = geo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = pos.getZ(i);
        if (z > 0 && y > 0) {
          const ratio = (z + d / 2) / d;
          pos.setY(i, y * ratio);
        }
      }
      geo.computeVertexNormals();
      return geo;
    }
    return new THREE.BoxGeometry(w, h, d);
  }, [brickType]);

  const edgesGeometry = useMemo(() => {
    if (!geometry) return null;
    return new THREE.EdgesGeometry(geometry);
  }, [geometry]);

  const position = useMemo(() => {
    if (!brickType) return [0, 0, 0];
    const h = brickType.height * GRID_UNIT;
    return [
      brick.position.x * GRID_UNIT,
      brick.position.y * GRID_UNIT + h / 2,
      brick.position.z * GRID_UNIT,
    ];
  }, [brick.position, brickType]);

  useFrame(() => {
    if (meshRef.current) {
      const targetScale = opacity === 0 ? 0.01 : 1;
      const currentScale = meshRef.current.scale.x;
      const newScale = currentScale + (targetScale - currentScale) * 0.2;
      meshRef.current.scale.setScalar(newScale);
      setScale(newScale);
    }
  });

  if (!geometry || !brickType) return null;

  return (
    <group position={position as [number, number, number]}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={onClick}
        onPointerOver={(e) => {
          setHovered(true);
          onPointerOver(e);
        }}
        onPointerOut={(e) => {
          setHovered(false);
          onPointerOut(e);
        }}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={brick.color}
          roughness={0.6}
          metalness={0.1}
          transparent
          opacity={opacity}
          emissive={hovered ? '#ffffff' : '#000000'}
          emissiveIntensity={hovered ? 0.1 : 0}
        />
      </mesh>

      {hovered && edgesGeometry && (
        <lineSegments ref={edgesRef} geometry={edgesGeometry}>
          <lineBasicMaterial color="#ffffff" linewidth={2} />
        </lineSegments>
      )}

      {isSelected && (
        <mesh position={[0, 0, 0]}>
          <boxGeometry
            args={[
              brickType.width * GRID_UNIT * 1.02,
              brickType.height * GRID_UNIT * 1.02,
              brickType.depth * GRID_UNIT * 1.02,
            ]}
          />
          <meshBasicMaterial
            color="#3B82F6"
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
            wireframe
          />
        </mesh>
      )}
    </group>
  );
}

export { GRID_UNIT };
