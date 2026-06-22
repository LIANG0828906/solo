import type { Building, CityData, WindParams } from '../types';

function generateGridBuildings(
  cols: number,
  rows: number,
  spacing: number,
  heightRange: [number, number],
  densityBias: number,
  seed: number
): Building[] {
  const buildings: Building[] = [];
  let s = seed;
  const rand = (): number => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const total = cols * rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const idx = i * rows + j;
      const dist = Math.sqrt(
        Math.pow(i - cols / 2, 2) + Math.pow(j - rows / 2, 2)
      );
      const centerFactor = 1 - Math.min(dist / (Math.max(cols, rows) / 2), 1);
      const density = Math.min(
        1,
        centerFactor * 0.9 + rand() * 0.3 + densityBias * 0.2
      );
      const skipProbability = 0.15 + (1 - density) * 0.5;
      if (rand() < skipProbability && density < 0.4) continue;
      const hMin = heightRange[0];
      const hMax = heightRange[1];
      const height =
        hMin + (hMax - hMin) * (centerFactor * 0.75 + rand() * 0.45);
      const wBase = spacing * 0.65;
      const dBase = spacing * 0.65;
      const width = wBase * (0.6 + rand() * 0.7);
      const depth = dBase * (0.6 + rand() * 0.7);
      const x = (i - cols / 2) * spacing + (rand() - 0.5) * spacing * 0.15;
      const z = (j - rows / 2) * spacing + (rand() - 0.5) * spacing * 0.15;
      buildings.push({
        x,
        z,
        width,
        depth,
        height,
        density,
      });
      void idx;
      void total;
    }
  }
  return buildings;
}

const defaultNYCWind: WindParams = {
  speed: 8,
  direction: 270,
  turbulence: 0.25,
};

const defaultTokyoWind: WindParams = {
  speed: 6,
  direction: 180,
  turbulence: 0.35,
};

const defaultShanghaiWind: WindParams = {
  speed: 10,
  direction: 315,
  turbulence: 0.3,
};

const newYorkBuildings: Building[] = generateGridBuildings(
  14,
  14,
  18,
  [15, 95],
  0.85,
  42
);

const tokyoBuildings: Building[] = generateGridBuildings(
  16,
  16,
  15,
  [12, 85],
  0.78,
  88
);

const shanghaiBuildings: Building[] = generateGridBuildings(
  15,
  15,
  17,
  [14, 110],
  0.82,
  17
);

export const NEW_YORK: CityData = {
  id: 'new-york',
  name: '纽约 New York',
  center: [0, 0],
  buildings: newYorkBuildings,
  defaultWind: defaultNYCWind,
};

export const TOKYO: CityData = {
  id: 'tokyo',
  name: '东京 Tokyo',
  center: [0, 0],
  buildings: tokyoBuildings,
  defaultWind: defaultTokyoWind,
};

export const SHANGHAI: CityData = {
  id: 'shanghai',
  name: '上海 Shanghai',
  center: [0, 0],
  buildings: shanghaiBuildings,
  defaultWind: defaultShanghaiWind,
};

export const CITIES: CityData[] = [NEW_YORK, TOKYO, SHANGHAI];

export function getCityById(id: string): CityData {
  return CITIES.find((c) => c.id === id) ?? NEW_YORK;
}
