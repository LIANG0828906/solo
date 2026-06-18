import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const BUILDING_HEIGHT = 8;
const FLOOR_HEIGHT = 3;
const WALL_COLOR = '#C0C0C0';
const ROOF_COLOR = '#4A90D9';
const ROOF_OPACITY = 0.3;

const PRISM_DIMENSIONS = [
  { width: 6, depth: 4, x: 0, z: 0 },
  { width: 4, depth: 6, x: 4, z: 0 },
  { width: 4, depth: 4, x: 2, z: 2 },
];

export function BuildingModel() {
  const groupRef = useRef<THREE.Group>(null);

  const roofHeight = BUILDING_HEIGHT - FLOOR_HEIGHT;

  return (
    <group ref={groupRef} name="building">
      {PRISM_DIMENSIONS.map((dim, index) => (
        <group key={index} position={[dim.x - 3, 0, dim.z - 2]}>
          <mesh castShadow receiveShadow name={`wall-${index}`}>
            <boxGeometry args={[dim.width, FLOOR_HEIGHT, dim.depth]} />
            <meshStandardMaterial color={WALL_COLOR} roughness={0.8} metalness={0.1} />
          </mesh>

          <mesh position={[0, FLOOR_HEIGHT / 2 + roofHeight / 2, 0]} name={`roof-${index}`}>
            <boxGeometry args={[dim.width * 1.02, roofHeight, dim.depth * 1.02]} />
            <meshStandardMaterial
              color={ROOF_COLOR}
              transparent
              opacity={ROOF_OPACITY}
              side={THREE.DoubleSide}
              roughness={0.3}
              metalness={0.5}
            />
          </mesh>

          <mesh position={[0, FLOOR_HEIGHT + roofHeight + 0.05, 0]} name={`roof-top-${index}`}>
            <boxGeometry args={[dim.width * 1.1, 0.1, dim.depth * 1.1]} />
            <meshStandardMaterial
              color={ROOF_COLOR}
              transparent
              opacity={ROOF_OPACITY * 1.5}
              roughness={0.2}
              metalness={0.6}
            />
          </mesh>
        </group>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#1A1A2E" />
      </mesh>
    </group>
  );
}

export function useBuildingMeshes(): THREE.Mesh[] {
  return useMemo(() => [], []);
}
