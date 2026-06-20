import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { CuttingPieceData, LeatherDefect } from '@/types';
import { getShapeGeometry, getShapeOutlinePoints } from '@/modules/leather/LeatherViewer';
import { isAnyCollision } from '@/utils/collision';

interface CuttingPieceProps {
  piece: CuttingPieceData;
  allPieces: CuttingPieceData[];
  defects: LeatherDefect[];
  isSelected: boolean;
  showPath: boolean;
  onDragStart: (id: string) => void;
  onDrag: (id: string, x: number, y: number) => void;
  onDragEnd: (id: string) => void;
  onSelect: (id: string | null) => void;
}

export function CuttingPiece3D({
  piece,
  allPieces,
  defects,
  isSelected,
  showPath,
  onDragStart,
  onDrag,
  onDragEnd,
  onSelect,
}: CuttingPieceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [dragging, setDragging] = useState(false);
  const glowRef = useRef(0);
  const collisionAlpha = useRef(0);
  const [outlineColor, setOutlineColor] = useState<string>(piece.color);
  const [outlineOpacity, setOutlineOpacity] = useState(0.4);

  const geometry = useMemo(
    () => getShapeGeometry(piece.shape, piece.width * piece.scale, piece.height * piece.scale),
    [piece.shape, piece.width, piece.height, piece.scale]
  );

  const outlinePoints = useMemo(() => {
    const pts = getShapeOutlinePoints(piece.shape, piece.width * piece.scale, piece.height * piece.scale);
    return pts.map(([x, y]): [number, number, number] => [x, 0.01, y]);
  }, [piece.shape, piece.width, piece.height, piece.scale]);

  const collisionDetected = useMemo(
    () => isAnyCollision(piece, allPieces, defects) || piece.isColliding,
    [piece, allPieces, defects]
  );

  useFrame((_, delta) => {
    if (collisionDetected) {
      collisionAlpha.current = Math.min(1, collisionAlpha.current + delta * 4);
    } else {
      collisionAlpha.current = Math.max(0, collisionAlpha.current - delta * 4);
    }

    if (isSelected) {
      glowRef.current = Math.min(1, glowRef.current + delta * 3);
    } else {
      glowRef.current = Math.max(0, glowRef.current - delta * 3);
    }

    if (meshRef.current) {
      const mat = meshRef.current.material as THREE.MeshStandardMaterial;
      const baseOpacity = 0.6;
      const selOpacity = 0.85;
      mat.opacity = baseOpacity + (selOpacity - baseOpacity) * glowRef.current;

      if (collisionAlpha.current > 0.01) {
        mat.emissive.setHex(0xff0000);
        mat.emissiveIntensity = collisionAlpha.current * 0.5;
      } else {
        mat.emissive.setHex(0x00ff88);
        mat.emissiveIntensity = glowRef.current * 0.15;
      }
    }

    if (collisionAlpha.current > 0.01) {
      setOutlineColor('#ff4444');
      setOutlineOpacity(0.6 + collisionAlpha.current * 0.4);
    } else if (isSelected) {
      setOutlineColor('#00ff88');
      setOutlineOpacity(0.8);
    } else {
      setOutlineColor(piece.color);
      setOutlineOpacity(0.4);
    }
  });

  const color = useMemo(() => new THREE.Color(piece.color), [piece.color]);

  return (
    <group
      position={[piece.position.x, 0.005, piece.position.y]}
      rotation={[0, -piece.rotation, 0]}
    >
      <mesh
        ref={meshRef}
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={(e) => {
          e.stopPropagation();
          setDragging(true);
          onDragStart(piece.id);
          onSelect(piece.id);
        }}
        onPointerUp={() => {
          if (dragging) {
            setDragging(false);
            onDragEnd(piece.id);
          }
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = 'grab';
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = 'default';
        }}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      <Line
        points={outlinePoints}
        color={outlineColor}
        lineWidth={1}
        transparent
        opacity={outlineOpacity}
      />
    </group>
  );
}
