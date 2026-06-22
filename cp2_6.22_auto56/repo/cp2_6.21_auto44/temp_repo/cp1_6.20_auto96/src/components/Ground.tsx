import { useMemo } from 'react';
import * as THREE from 'three';
import { GRID_SIZE, CABINET_SPACING, COLORS } from '../utils/constants';

export function Ground() {
  const size = useMemo(() => {
    return (GRID_SIZE + 2) * CABINET_SPACING;
  }, []);

  const gridDivisions = GRID_SIZE + 2;

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[size, size]} />
        <meshStandardMaterial
          color={COLORS.bg}
          transparent
          opacity={0.9}
          metalness={0.1}
          roughness={0.8}
        />
      </mesh>

      <gridHelper
        args={[size, gridDivisions, COLORS.gridLine, COLORS.gridLine]}
        position={[0, 0.01, 0]}
      />

      {Array.from({ length: GRID_SIZE }).map((_, row) =>
        Array.from({ length: GRID_SIZE }).map((_, col) => {
          const totalWidth = (GRID_SIZE - 1) * CABINET_SPACING;
          const x = -totalWidth / 2 + col * CABINET_SPACING;
          const z = -totalWidth / 2 + row * CABINET_SPACING;
          const idx = row * GRID_SIZE + col;

          return (
            <mesh
              key={`tile-${idx}`}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[x, 0.02, z]}
            >
              <planeGeometry args={[1.0, 1.0]} />
              <meshStandardMaterial
                color={COLORS.ground}
                transparent
                opacity={0.6}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}
