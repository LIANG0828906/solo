export interface Building {
  id: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  color: string;
  selected: boolean;
}

export type HeightDistributionMode = 'uniform' | 'gradient' | 'centerHigh' | 'random';

export interface CityParams {
  gridSize: number;
  density: number;
  minHeight: number;
  maxHeight: number;
  heightMode: HeightDistributionMode;
}

const CELL_SIZE = 10;

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function calculateHeightFactor(
  gridX: number,
  gridZ: number,
  gridSize: number,
  mode: HeightDistributionMode
): number {
  const centerX = (gridSize - 1) / 2;
  const centerZ = (gridSize - 1) / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerZ * centerZ);
  const dist = Math.sqrt((gridX - centerX) ** 2 + (gridZ - centerZ) ** 2);

  switch (mode) {
    case 'uniform':
      return 0.5 + Math.random() * 0.5;
    case 'gradient':
      return (gridZ / (gridSize - 1)) * 0.7 + 0.3 + (Math.random() - 0.5) * 0.2;
    case 'centerHigh': {
      const normalizedDist = dist / maxDist;
      return (1 - normalizedDist * 0.8) * 0.7 + 0.3 + (Math.random() - 0.5) * 0.15;
    }
    case 'random':
      return Math.random();
    default:
      return Math.random();
  }
}

export function generateBuildings(params: CityParams): Building[] {
  const { gridSize, density, minHeight, maxHeight, heightMode } = params;
  const buildings: Building[] = [];
  const heightRange = maxHeight - minHeight;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      if (Math.random() * 100 > density) continue;

      const heightFactor = calculateHeightFactor(x, z, gridSize, heightMode);
      const clampedFactor = Math.max(0, Math.min(1, heightFactor));
      const height = minHeight + clampedFactor * heightRange;

      const widthVariation = 0.8 + Math.random() * 0.4;
      const depthVariation = 0.8 + Math.random() * 0.4;

      buildings.push({
        id: generateId(),
        x: x * CELL_SIZE + CELL_SIZE / 2 - (gridSize * CELL_SIZE) / 2,
        z: z * CELL_SIZE + CELL_SIZE / 2 - (gridSize * CELL_SIZE) / 2,
        width: CELL_SIZE * widthVariation * 0.85,
        depth: CELL_SIZE * depthVariation * 0.85,
        height: Math.max(minHeight, Math.min(maxHeight, height)),
        color: '#4a90d9',
        selected: false,
      });
    }
  }

  return buildings;
}

export function getCitySize(gridSize: number): number {
  return gridSize * CELL_SIZE;
}

export { CELL_SIZE };
