import { scaleSequential } from 'd3-scale';
import { interpolateRainbow, interpolateViridis, interpolateGreys } from 'd3-scale-chromatic';
import { ColorMode } from '@/store/useGeoStore';

export const generateCylindricalData = (size: number = 16): number[][][] => {
  const data: number[][][] = [];
  const center = size / 2;
  const radius = size * 0.4;

  const oreBodies = [
    { cx: size * 0.35, cy: size * 0.4, cz: size * 0.5, r: size * 0.15, density: 0.85 },
    { cx: size * 0.6, cy: size * 0.55, cz: size * 0.4, r: size * 0.12, density: 0.75 },
    { cx: size * 0.5, cy: size * 0.3, cz: size * 0.65, r: size * 0.1, density: 0.9 },
  ];

  const crackStart = { x: size * 0.2, y: size * 0.5, z: size * 0.3 };
  const crackEnd = { x: size * 0.8, y: size * 0.5, z: size * 0.7 };
  const crackWidth = 1.5;

  for (let x = 0; x < size; x++) {
    data[x] = [];
    for (let y = 0; y < size; y++) {
      data[x][y] = [];
      for (let z = 0; z < size; z++) {
        const distFromCenter = Math.sqrt(
          Math.pow(x - center, 2) + Math.pow(z - center, 2)
        );

        let density = 0;

        if (distFromCenter <= radius) {
          const normalizedY = y / size;
          density = 0.25 + normalizedY * 0.2 + Math.sin(y * 0.5) * 0.05;

          for (const ore of oreBodies) {
            const dist = Math.sqrt(
              Math.pow(x - ore.cx, 2) +
              Math.pow(y - ore.cy, 2) +
              Math.pow(z - ore.cz, 2)
            );
            if (dist < ore.r) {
              const t = 1 - dist / ore.r;
              density = density * (1 - t) + ore.density * t;
            }
          }

          const dx = crackEnd.x - crackStart.x;
          const dy = crackEnd.y - crackStart.y;
          const dz = crackEnd.z - crackStart.z;
          const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
          
          const t = Math.max(0, Math.min(1, 
            ((x - crackStart.x) * dx + (y - crackStart.y) * dy + (z - crackStart.z) * dz) / (len * len)
          ));
          
          const closestX = crackStart.x + t * dx;
          const closestY = crackStart.y + t * dy;
          const closestZ = crackStart.z + t * dz;
          
          const distToCrack = Math.sqrt(
            Math.pow(x - closestX, 2) +
            Math.pow(y - closestY, 2) +
            Math.pow(z - closestZ, 2)
          );

          if (distToCrack < crackWidth) {
            const crackFactor = 1 - distToCrack / crackWidth;
            density *= (1 - crackFactor * 0.6);
          }

          density = Math.max(0.05, Math.min(0.95, density));
        }

        data[x][y][z] = density;
      }
    }
  }

  return data;
};

export const generateCuboidData = (size: number = 16): number[][][] => {
  const data: number[][][] = [];

  for (let x = 0; x < size; x++) {
    data[x] = [];
    for (let y = 0; y < size; y++) {
      data[x][y] = [];
      for (let z = 0; z < size; z++) {
        const nx = x / size;
        const ny = y / size;
        const nz = z / size;

        let density = 0.3 + ny * 0.3;

        const veinX = Math.sin(ny * Math.PI * 2) * 0.3 + 0.5;
        const veinZ = Math.cos(ny * Math.PI * 1.5) * 0.2 + 0.5;
        const distToVein = Math.sqrt(Math.pow(nx - veinX, 2) + Math.pow(nz - veinZ, 2));
        
        if (distToVein < 0.15) {
          const t = 1 - distToVein / 0.15;
          density = density * (1 - t) + 0.85 * t;
        }

        density += (Math.random() - 0.5) * 0.05;
        density = Math.max(0.1, Math.min(0.9, density));

        data[x][y][z] = density;
      }
    }
  }

  return data;
};

export const generateCaveData = (size: number = 16): number[][][] => {
  const data: number[][][] = [];
  const center = size / 2;

  for (let x = 0; x < size; x++) {
    data[x] = [];
    for (let y = 0; y < size; y++) {
      data[x][y] = [];
      for (let z = 0; z < size; z++) {
        const nx = x / size;
        const ny = y / size;
        const nz = z / size;

        const distFromCenter = Math.sqrt(
          Math.pow(nx - 0.5, 2) + Math.pow(ny - 0.5, 2) + Math.pow(nz - 0.5, 2)
        );

        let density = 0.5 + (distFromCenter - 0.3) * 0.8;

        const cave1Dist = Math.sqrt(
          Math.pow(x - size * 0.4, 2) +
          Math.pow(y - size * 0.5, 2) +
          Math.pow(z - size * 0.5, 2)
        );
        if (cave1Dist < size * 0.2) {
          const t = 1 - cave1Dist / (size * 0.2);
          density *= (1 - t * 0.9);
        }

        const cave2Dist = Math.sqrt(
          Math.pow(x - size * 0.65, 2) +
          Math.pow(y - size * 0.35, 2) +
          Math.pow(z - size * 0.45, 2)
        );
        if (cave2Dist < size * 0.15) {
          const t = 1 - cave2Dist / (size * 0.15);
          density *= (1 - t * 0.85);
        }

        density = Math.max(0.02, Math.min(0.95, density));
        data[x][y][z] = density;
      }
    }
  }

  return data;
};

export const presets = [
  { id: 'cylindrical', name: '圆柱形岩层', generator: generateCylindricalData },
  { id: 'cuboid', name: '长方体矿脉', generator: generateCuboidData },
  { id: 'cave', name: '溶洞结构', generator: generateCaveData },
];

export const getColorScale = (mode: ColorMode): ((t: number) => string) => {
  switch (mode) {
    case 'rainbow':
      return (t: number) => scaleSequential(interpolateRainbow).domain([0, 1])(t) as string;
    case 'heat':
      return (t: number) => scaleSequential(interpolateViridis).domain([0, 1])(t) as string;
    case 'grayscale':
      return (t: number) => scaleSequential(interpolateGreys).domain([0, 1])(t) as string;
    default:
      return (t: number) => scaleSequential(interpolateRainbow).domain([0, 1])(t) as string;
  }
};

export const getDensityAtSlice = (
  data: number[][][],
  axis: 'x' | 'y' | 'z',
  position: number,
  gridSize: { x: number; y: number; z: number }
): { densities: number[][]; avgDensity: number } => {
  const index = Math.floor((position / 100) * (
    axis === 'x' ? gridSize.x - 1 : axis === 'y' ? gridSize.y - 1 : gridSize.z - 1
  ));
  
  const clampedIndex = Math.max(0, Math.min(
    axis === 'x' ? gridSize.x - 1 : axis === 'y' ? gridSize.y - 1 : gridSize.z - 1,
    index
  ));

  let densities: number[][] = [];
  let total = 0;
  let count = 0;

  if (axis === 'x') {
    for (let y = 0; y < gridSize.y; y++) {
      densities[y] = [];
      for (let z = 0; z < gridSize.z; z++) {
        const d = data[clampedIndex][y][z];
        densities[y][z] = d;
        total += d;
        count++;
      }
    }
  } else if (axis === 'y') {
    for (let x = 0; x < gridSize.x; x++) {
      densities[x] = [];
      for (let z = 0; z < gridSize.z; z++) {
        const d = data[x][clampedIndex][z];
        densities[x][z] = d;
        total += d;
        count++;
      }
    }
  } else {
    for (let x = 0; x < gridSize.x; x++) {
      densities[x] = [];
      for (let y = 0; y < gridSize.y; y++) {
        const d = data[x][y][clampedIndex];
        densities[x][y] = d;
        total += d;
        count++;
      }
    }
  }

  return {
    densities,
    avgDensity: count > 0 ? total / count : 0
  };
};
