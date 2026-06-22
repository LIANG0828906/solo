import { useMemo } from 'react';
import * as THREE from 'three';

interface BuildingData {
  position: [number, number, number];
  size: [number, number, number];
  color: string;
}

function generateBuildings(): BuildingData[] {
  const buildings: BuildingData[] = [];
  const gridSize = 10;
  const spacing = 20;

  for (let x = -gridSize; x <= gridSize; x++) {
    for (let z = -gridSize; z <= gridSize; z++) {
      if (Math.abs(x) % 3 === 0 || Math.abs(z) % 3 === 0) continue;
      if (Math.random() > 0.7) continue;

      const height = 3 + Math.random() * 15;
      const width = 5 + Math.random() * 8;
      const depth = 5 + Math.random() * 8;
      const hue = 210 + Math.random() * 30;
      const lightness = 20 + Math.random() * 15;

      buildings.push({
        position: [
          x * spacing + (Math.random() - 0.5) * 4,
          height / 2,
          z * spacing + (Math.random() - 0.5) * 4
        ],
        size: [width, height, depth],
        color: `hsl(${hue}, 15%, ${lightness}%)`
      });
    }
  }

  return buildings;
}

export default function CityBuildings() {
  const buildings = useMemo(() => generateBuildings(), []);

  return (
    <group>
      {buildings.map((building, index) => (
        <mesh key={index} position={building.position}>
          <boxGeometry args={building.size} />
          <meshStandardMaterial
            color={building.color}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}
