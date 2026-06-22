import { TerrainData, GridPoint } from './dataLoader';

const regions = [
  '东城区', '西城区', '朝阳区', '海淀区', '丰台区',
  '石景山区', '通州区', '顺义区', '大兴区', '昌平区',
  '房山区', '门头沟区', '怀柔区', '平谷区', '密云区',
  '延庆区', '亦庄开发区', '中关村', 'CBD商圈', '奥体中心'
];

function noise2D(x: number, y: number, seed: number = 0): number {
  const n = Math.sin(x * 12.9898 + y * 78.233 + seed * 37.719) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number, scale: number, seed: number = 0): number {
  const sx = x / scale;
  const sy = y / scale;
  
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = x0 + 1;
  const y1 = y0 + 1;
  
  const fx = sx - x0;
  const fy = sy - y0;
  
  const v00 = noise2D(x0, y0, seed);
  const v10 = noise2D(x1, y0, seed);
  const v01 = noise2D(x0, y1, seed);
  const v11 = noise2D(x1, y1, seed);
  
  const i1 = v00 * (1 - fx) + v10 * fx;
  const i2 = v01 * (1 - fx) + v11 * fx;
  
  return i1 * (1 - fy) + i2 * fy;
}

function fbm(x: number, y: number, seed: number = 0): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  
  for (let i = 0; i < 4; i++) {
    value += amplitude * smoothNoise(x, y, 4 / frequency, seed + i * 100);
    amplitude *= 0.5;
    frequency *= 2;
  }
  
  return value;
}

export function generateTerrainData(): TerrainData {
  const gridSize = 20;
  const points: GridPoint[] = [];
  const yearCount = 11;
  
  let minDensity = Infinity;
  let maxDensity = -Infinity;
  let minHeight = Infinity;
  let maxHeight = -Infinity;
  
  const centerX = gridSize / 2;
  const centerY = gridSize / 2;
  
  for (let zi = 0; zi < gridSize; zi++) {
    for (let xi = 0; xi < gridSize; xi++) {
      const id = zi * gridSize + xi;
      
      const lng = 116.0 + xi * 0.1;
      const lat = 39.5 + zi * 0.1;
      
      const distFromCenter = Math.sqrt(
        Math.pow((xi - centerX) / (gridSize / 2), 2) +
        Math.pow((zi - centerY) / (gridSize / 2), 2)
      );
      
      const baseHeight = 1 + fbm(xi * 2, zi * 2, 42) * 3;
      const height = Math.max(0, Math.min(5, baseHeight + (1 - distFromCenter) * 0.5));
      
      const baseDensity = 500 + Math.pow(1 - distFromCenter * 0.8, 1.5) * 6000;
      const noiseDensity = fbm(xi * 3, zi * 3, 123) * 1000;
      
      const densities: number[] = [];
      for (let y = 0; y < yearCount; y++) {
        const growthFactor = 1 + y * 0.035 + fbm(xi + y * 0.5, zi + y * 0.3, 200 + y) * 0.1;
        const density = Math.round((baseDensity + noiseDensity) * growthFactor);
        densities.push(density);
        
        if (density < minDensity) minDensity = density;
        if (density > maxDensity) maxDensity = density;
      }
      
      if (height < minHeight) minHeight = height;
      if (height > maxHeight) maxHeight = height;
      
      const regionIndex = Math.floor(
        (fbm(xi * 0.5, zi * 0.5, 555) * regions.length) % regions.length
      );
      const region = regions[Math.abs(regionIndex)];
      
      points.push({
        id,
        lat,
        lng,
        height,
        densities,
        region
      });
    }
  }
  
  return {
    gridSize,
    points,
    minDensity: Math.floor(minDensity / 100) * 100,
    maxDensity: Math.ceil(maxDensity / 100) * 100,
    minHeight,
    maxHeight,
    yearRange: [2013, 2023]
  };
}
