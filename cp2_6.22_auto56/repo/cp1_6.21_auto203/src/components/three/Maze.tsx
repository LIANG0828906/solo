import { useMemo } from 'react';
import type { Wall } from '@/types/game';

interface MazeProps {
  walls: Wall[];
  mazeSize: { width: number; depth: number };
  showGrid?: boolean;
}

export function Maze({ walls, mazeSize, showGrid = true }: MazeProps) {
  const groundWidth = mazeSize.width + 2;
  const groundDepth = mazeSize.depth + 2;

  const { innerWalls, boundaryWalls } = useMemo(() => {
    const halfW = mazeSize.width / 2;
    const halfD = mazeSize.depth / 2;
    const inner: Wall[] = [];
    const boundary: Wall[] = [];

    for (const wall of walls) {
      const px = wall.position.x;
      const pz = wall.position.z;
      const isBoundary =
        Math.abs(px) >= halfW - 0.6 ||
        Math.abs(pz) >= halfD - 0.6;
      if (isBoundary) {
        boundary.push(wall);
      } else {
        inner.push(wall);
      }
    }

    return { innerWalls: inner, boundaryWalls: boundary };
  }, [walls, mazeSize]);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[groundWidth, groundDepth]} />
        <meshStandardMaterial
          color="#1a1530"
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>

      {showGrid && (
        <gridHelper
          args={[
            Math.max(mazeSize.width, mazeSize.depth),
            Math.max(mazeSize.width, mazeSize.depth),
            '#3b3b6e',
            '#3b3b6e',
          ]}
          position={[0, 0.01, 0]}
        >
          <meshBasicMaterial
            attach="material"
            color="#3b3b6e"
            transparent
            opacity={0.3}
          />
        </gridHelper>
      )}

      {innerWalls.map((wall, index) => (
        <mesh
          key={`inner-${index}`}
          position={[wall.position.x, wall.position.y, wall.position.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[wall.size.x, wall.size.y, wall.size.z]} />
          <meshStandardMaterial
            color="#2d2855"
            roughness={0.6}
            metalness={0.25}
          />
        </mesh>
      ))}

      {boundaryWalls.map((wall, index) => (
        <mesh
          key={`boundary-${index}`}
          position={[wall.position.x, wall.position.y, wall.position.z]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[wall.size.x, wall.size.y, wall.size.z]} />
          <meshStandardMaterial
            color="#1e1a40"
            roughness={0.5}
            metalness={0.35}
          />
        </mesh>
      ))}
    </group>
  );
}
