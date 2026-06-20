import { Building, CELL_SIZE } from './BuildingGenerator';

export interface CityStats {
  totalBuildings: number;
  maxHeight: number;
  avgHeight: number;
  floorAreaRatio: number;
  shadowCoverage: number;
}

export function calculateStats(buildings: Building[], gridSize: number): CityStats {
  const totalBuildings = buildings.length;

  if (totalBuildings === 0) {
    return {
      totalBuildings: 0,
      maxHeight: 0,
      avgHeight: 0,
      floorAreaRatio: 0,
      shadowCoverage: 0,
    };
  }

  const heights = buildings.map((b) => b.height);
  const maxHeight = Math.max(...heights);
  const avgHeight = heights.reduce((a, b) => a + b, 0) / totalBuildings;

  const totalVolume = buildings.reduce((sum, b) => sum + b.width * b.depth * b.height, 0);
  const groundArea = gridSize * gridSize * CELL_SIZE * CELL_SIZE;
  const floorAreaRatio = totalVolume / groundArea;

  const shadowArea = calculateShadowCoverage(buildings, gridSize);
  const shadowCoverage = shadowArea / groundArea;

  return {
    totalBuildings,
    maxHeight: Math.round(maxHeight * 10) / 10,
    avgHeight: Math.round(avgHeight * 10) / 10,
    floorAreaRatio: Math.round(floorAreaRatio * 100) / 100,
    shadowCoverage: Math.round(shadowCoverage * 1000) / 10,
  };
}

function calculateShadowCoverage(buildings: Building[], gridSize: number): number {
  const sunAngle = 45 * (Math.PI / 180);
  const totalSize = gridSize * CELL_SIZE;
  const gridResolution = 2;
  const cells = Math.floor(totalSize / gridResolution);
  const shadowGrid: boolean[][] = [];

  for (let i = 0; i < cells; i++) {
    shadowGrid[i] = [];
    for (let j = 0; j < cells; j++) {
      shadowGrid[i][j] = false;
    }
  }

  for (const building of buildings) {
    const shadowLength = building.height / Math.tan(sunAngle);
    const halfW = building.width / 2;
    const halfD = building.depth / 2;

    const startX = building.x - halfW;
    const endX = building.x + halfW + shadowLength * 0.5;
    const startZ = building.z - halfD;
    const endZ = building.z + halfD;

    const startGridX = Math.max(0, Math.floor((startX + totalSize / 2) / gridResolution));
    const endGridX = Math.min(cells - 1, Math.floor((endX + totalSize / 2) / gridResolution));
    const startGridZ = Math.max(0, Math.floor((startZ + totalSize / 2) / gridResolution));
    const endGridZ = Math.min(cells - 1, Math.floor((endZ + totalSize / 2) / gridResolution));

    for (let gx = startGridX; gx <= endGridX; gx++) {
      for (let gz = startGridZ; gz <= endGridZ; gz++) {
        shadowGrid[gx][gz] = true;
      }
    }
  }

  let shadowCells = 0;
  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      if (shadowGrid[i][j]) shadowCells++;
    }
  }

  return shadowCells * gridResolution * gridResolution;
}

export function calculateDensityHeatmap(
  buildings: Building[],
  gridSize: number
): { x: number; z: number; density: number }[] {
  const heatmapData: { x: number; z: number; density: number }[] = [];
  const cellSize = CELL_SIZE;
  const halfSize = (gridSize * cellSize) / 2;

  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      const cellCenterX = x * cellSize + cellSize / 2 - halfSize;
      const cellCenterZ = z * cellSize + cellSize / 2 - halfSize;

      let nearbyBuildings = 0;
      const searchRadius = cellSize * 1.5;

      for (const building of buildings) {
        const dist = Math.sqrt(
          (building.x - cellCenterX) ** 2 + (building.z - cellCenterZ) ** 2
        );
        if (dist < searchRadius) {
          nearbyBuildings++;
        }
      }

      heatmapData.push({
        x: cellCenterX,
        z: cellCenterZ,
        density: Math.min(1, nearbyBuildings / 4),
      });
    }
  }

  return heatmapData;
}
