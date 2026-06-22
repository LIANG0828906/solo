export interface BuildingData {
  id: number;
  position: [number, number, number];
  height: number;
  width: number;
  depth: number;
  color: string;
  animationDelay: number;
}

export interface TreeData {
  id: number;
  position: [number, number, number];
  height: number;
}

export interface CityParams {
  density: number;
  maxHeight: number;
  greenCoverage: number;
  eraStyle: number;
  sunAngle: number;
}

const GRID_SIZE = 100;
const GRID_SPACING = 10;
const MAX_BUILDINGS = 200;

const CLASSIC_COLORS = ['#F5DEB3', '#A0522D'];
const MODERN_COLORS = ['#C0C0C0', '#4682B4'];
const FUTURE_COLORS = ['#F0F8FF', '#8A2BE2'];

export const easeOutCubic = (t: number): number => {
  return 1 - Math.pow(1 - t, 3);
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const getColorByEra = (eraStyle: number, random: number): string => {
  let colors: string[];
  if (eraStyle < 33) {
    colors = CLASSIC_COLORS;
  } else if (eraStyle < 66) {
    colors = MODERN_COLORS;
  } else {
    colors = FUTURE_COLORS;
  }
  return colors[Math.floor(random * colors.length)];
};

export const generateBuildings = (params: CityParams): BuildingData[] => {
  const buildings: BuildingData[] = [];
  const { density, maxHeight, eraStyle } = params;
  
  const gridCells = Math.floor(GRID_SIZE / GRID_SPACING);
  const halfGrid = (gridCells * GRID_SPACING) / 2;
  
  const probability = density / 100;
  let id = 0;
  
  const positions: [number, number][] = [];
  
  for (let i = 0; i < gridCells; i++) {
    for (let j = 0; j < gridCells; j++) {
      if (Math.random() < probability && buildings.length < MAX_BUILDINGS) {
        positions.push([
          i * GRID_SPACING - halfGrid + GRID_SPACING / 2,
          j * GRID_SPACING - halfGrid + GRID_SPACING / 2
        ]);
      }
    }
  }
  
  positions.sort(() => Math.random() - 0.5);
  
  for (let idx = 0; idx < Math.min(positions.length, MAX_BUILDINGS); idx++) {
    const [x, z] = positions[idx];
    const heightRandom = Math.random();
    const height = Math.max(5, heightRandom * maxHeight);
    const width = lerp(3, 8, Math.random());
    const depth = lerp(3, 8, Math.random());
    const color = getColorByEra(eraStyle, Math.random());
    const animationDelay = idx * 0.02;
    
    buildings.push({
      id,
      position: [x, 0, z],
      height,
      width,
      depth,
      color,
      animationDelay
    });
    id++;
  }
  
  return buildings;
};

export const generateTrees = (params: CityParams, buildings: BuildingData[]): TreeData[] => {
  const trees: TreeData[] = [];
  const { greenCoverage } = params;
  
  const gridCells = Math.floor(GRID_SIZE / GRID_SPACING);
  const halfGrid = (gridCells * GRID_SPACING) / 2;
  
  const occupiedPositions = new Set(
    buildings.map(b => `${Math.round(b.position[0] / GRID_SPACING)},${Math.round(b.position[2] / GRID_SPACING)}`)
  );
  
  const treeProbability = greenCoverage / 100;
  let id = 0;
  
  for (let i = 0; i < gridCells; i++) {
    for (let j = 0; j < gridCells; j++) {
      const key = `${i - Math.floor(gridCells / 2)},${j - Math.floor(gridCells / 2)}`;
      if (!occupiedPositions.has(key) && Math.random() < treeProbability * 0.3) {
        const baseX = i * GRID_SPACING - halfGrid + GRID_SPACING / 2;
        const baseZ = j * GRID_SPACING - halfGrid + GRID_SPACING / 2;
        
        const offsetX = (Math.random() - 0.5) * GRID_SPACING * 0.6;
        const offsetZ = (Math.random() - 0.5) * GRID_SPACING * 0.6;
        
        trees.push({
          id,
          position: [baseX + offsetX, 0, baseZ + offsetZ],
          height: 5 + Math.random() * 5
        });
        id++;
      }
    }
  }
  
  return trees;
};

export const animateBuildingRise = (
  building: BuildingData,
  elapsedTime: number,
  animationDuration: number = 1.5
): { scaleY: number; y: number } => {
  const effectiveTime = Math.max(0, elapsedTime - building.animationDelay);
  const rawProgress = Math.min(1, effectiveTime / animationDuration);
  const easedProgress = easeOutCubic(rawProgress);
  
  return {
    scaleY: easedProgress,
    y: (building.height * easedProgress) / 2
  };
};
