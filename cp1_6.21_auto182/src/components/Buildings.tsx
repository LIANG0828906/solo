import { useMemo } from 'react';
import * as THREE from 'three';

interface BuildingData {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

const WARM_COLORS = ['#E2C9A0', '#C29B62'];
const COOL_COLORS = ['#7BB3D9', '#4A7C9B'];

function generateBuildings(): BuildingData[] {
  const buildings: BuildingData[] = [];
  const count = 14;

  for (let i = 0; i < count; i++) {
    const gridSize = 5;
    const row = Math.floor(i / 4);
    const col = i % 4;
    const offsetX = (col - 1.5) * gridSize + (Math.random() - 0.5) * 1.5;
    const offsetZ = (row - 1.5) * gridSize + (Math.random() - 0.5) * 1.5;
    const height = 2 + Math.random() * 8;
    const width = 1.2 + Math.random() * 1.5;
    const depth = 1.2 + Math.random() * 1.5;
    const colorArray = i % 2 === 0 ? WARM_COLORS : COOL_COLORS;
    const color = colorArray[Math.floor(Math.random() * colorArray.length)];

    buildings.push({
      position: [offsetX, height / 2, offsetZ],
      size: [width, height, depth],
      color
    });
  }

  return buildings;
}

export function Buildings() {
  const buildings = useMemo(() => generateBuildings(), []);

  return (
    <group>
      {buildings.map((b, idx) => (
        <mesh
          key={idx}
          position={b.position}
          castShadow
          receiveShadow
        >
          <boxGeometry args={b.size} />
          <meshStandardMaterial
            color={b.color}
            roughness={0.8}
            metalness={0.1}
            flatShading
          />
          {b.size[1] > 4 && (
            <mesh position={[0, -b.size[1] / 2 + 0.1, 0]}>
              <boxGeometry args={[b.size[0] + 0.2, 0.2, b.size[2] + 0.2]} />
              <meshStandardMaterial
                color={new THREE.Color(b.color).multiplyScalar(0.7).getHexString()}
                flatShading
              />
            </mesh>
          )}
        </mesh>
      ))}
    </group>
  );
}
