import type { OceanDataPoint, OceanDataset, GridCell, DepthLayer, ColorScheme, WorkerMessage, WorkerResult } from '../types';
import { DEPTH_LEVELS, GRID_SIZE, TEMP_MIN, TEMP_MAX } from '../types';

const ctx: Worker = self as any;

ctx.addEventListener('message', (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'parse':
      handleParse(payload.csvText);
      break;
    case 'ping':
      ctx.postMessage({ type: 'pong' } as WorkerResult);
      break;
  }
});

function handleParse(csvText: string) {
  try {
    const dataPoints = parseCSV(csvText);
    const dataset = buildDataset(dataPoints);
    ctx.postMessage({
      type: 'parseComplete',
      payload: { dataset }
    } as WorkerResult);
  } catch (error: any) {
    ctx.postMessage({
      type: 'parseComplete',
      error: error.message || '数据解析失败'
    } as WorkerResult);
  }
}

function parseCSV(csvText: string): OceanDataPoint[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) {
    throw new Error('CSV文件数据不足');
  }

  const headers = parseCSVLine(lines[0]);
  const headerMap = new Map<string, number>();
  headers.forEach((h, i) => headerMap.set(h.toLowerCase().trim(), i));

  const points: OceanDataPoint[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 5) continue;

    const point = parseDataPoint(values, headerMap);
    if (point) {
      points.push(point);
    }
  }

  if (points.length === 0) {
    throw new Error('未解析到有效数据点');
  }

  return points;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseDataPoint(values: string[], headerMap: Map<string, number>): OceanDataPoint | null {
  const getVal = (names: string[]): string => {
    for (const name of names) {
      const idx = headerMap.get(name);
      if (idx !== undefined && values[idx] !== undefined) {
        return values[idx];
      }
    }
    return '';
  };

  const longitude = parseFloat(getVal(['longitude', 'lon', '经度']));
  const latitude = parseFloat(getVal(['latitude', 'lat', '纬度']));
  const depth = parseFloat(getVal(['depth', 'dep', '深度']));
  const temperature = parseFloat(getVal(['temperature', 'temp', '温度']));
  const salinity = parseFloat(getVal(['salinity', 'sal', '盐度']));
  const velocity = parseFloat(getVal(['velocity', 'vel', 'speed', '流速']));
  const velocityDir = parseFloat(getVal(['direction', 'dir', 'vel_dir', '流向'])) || Math.random() * Math.PI * 2;
  const timePoint = getVal(['time', 'timestamp', 'date', '时间']) || undefined;

  if (isNaN(longitude) || isNaN(latitude) || isNaN(depth) ||
      isNaN(temperature) || isNaN(salinity) || isNaN(velocity)) {
    return null;
  }

  return {
    longitude,
    latitude,
    depth,
    temperature,
    salinity,
    velocity,
    velocityDir: velocityDir * Math.PI / 180,
    timePoint
  };
}

function buildDataset(points: OceanDataPoint[]): OceanDataset {
  const timePoints = extractTimePoints(points);
  const hasMultipleTime = timePoints.length > 1;

  const longitudeRange: [number, number] = [
    Math.min(...points.map(p => p.longitude)),
    Math.max(...points.map(p => p.longitude))
  ];
  const latitudeRange: [number, number] = [
    Math.min(...points.map(p => p.latitude)),
    Math.max(...points.map(p => p.latitude))
  ];

  if (longitudeRange[0] === longitudeRange[1]) {
    longitudeRange[0] -= 1;
    longitudeRange[1] += 1;
  }
  if (latitudeRange[0] === latitudeRange[1]) {
    latitudeRange[0] -= 1;
    latitudeRange[1] += 1;
  }

  const layers: DepthLayer[] = DEPTH_LEVELS.map(depth => ({
    depth,
    grid: createEmptyGrid()
  }));

  const pointsByDepth: number[][] = DEPTH_LEVELS.map(() => []);
  points.forEach((p, idx) => {
    const depthIdx = findClosestDepthIndex(p.depth);
    if (depthIdx >= 0) {
      pointsByDepth[depthIdx].push(idx);
    }
  });

  layers.forEach((layer, layerIdx) => {
    const layerPoints = pointsByDepth[layerIdx].map(idx => points[idx]);
    if (layerPoints.length > 0) {
      fillGrid(layer.grid, layerPoints, longitudeRange, latitudeRange);
    } else {
      fillDefaultGrid(layer.grid, layerIdx);
    }
  });

  return {
    layers,
    timePoints,
    currentTimeIndex: 0,
    longitudeRange,
    latitudeRange
  };
}

function extractTimePoints(points: OceanDataPoint[]): string[] {
  const timeSet = new Set<string>();
  points.forEach(p => {
    if (p.timePoint) {
      timeSet.add(p.timePoint);
    }
  });
  return Array.from(timeSet).sort();
}

function findClosestDepthIndex(depth: number): number {
  let closestIdx = -1;
  let minDiff = Infinity;

  DEPTH_LEVELS.forEach((d, idx) => {
    const diff = Math.abs(d - depth);
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = idx;
    }
  });

  const threshold = Math.max(...DEPTH_LEVELS) * 0.2;
  return minDiff <= threshold ? closestIdx : -1;
}

function createEmptyGrid(): GridCell[][] {
  const grid: GridCell[][] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    grid[i] = [];
    for (let j = 0; j < GRID_SIZE; j++) {
      grid[i][j] = {
        temperature: 0,
        salinity: 0,
        velocity: 0,
        velocityDir: 0
      };
    }
  }
  return grid;
}

function fillGrid(
  grid: GridCell[][],
  points: OceanDataPoint[],
  lonRange: [number, number],
  latRange: [number, number]
) {
  const countGrid: number[][] = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    countGrid[i] = new Array(GRID_SIZE).fill(0);
  }

  points.forEach(point => {
    const gridX = Math.floor(
      ((point.longitude - lonRange[0]) / (lonRange[1] - lonRange[0])) * GRID_SIZE
    );
    const gridZ = Math.floor(
      ((point.latitude - latRange[0]) / (latRange[1] - latRange[0])) * GRID_SIZE
    );

    const gx = Math.max(0, Math.min(GRID_SIZE - 1, gridX));
    const gz = Math.max(0, Math.min(GRID_SIZE - 1, gridZ));

    grid[gz][gx].temperature += point.temperature;
    grid[gz][gx].salinity += point.salinity;
    grid[gz][gx].velocity += point.velocity;
    grid[gz][gx].velocityDir += point.velocityDir;
    countGrid[gz][gx]++;
  });

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (countGrid[i][j] > 0) {
        grid[i][j].temperature /= countGrid[i][j];
        grid[i][j].salinity /= countGrid[i][j];
        grid[i][j].velocity /= countGrid[i][j];
        grid[i][j].velocityDir /= countGrid[i][j];
      }
    }
  }

  interpolateGrid(grid, countGrid);
}

function interpolateGrid(grid: GridCell[][], countGrid: number[][]) {
  const hasData = (i: number, j: number) => countGrid[i]?.[j] > 0;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (countGrid[i][j] === 0) {
        let totalTemp = 0;
        let totalSal = 0;
        let totalVel = 0;
        let totalDir = 0;
        let neighbors = 0;

        const directions = [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]];
        for (const [di, dj] of directions) {
          const ni = i + di;
          const nj = j + dj;
          if (hasData(ni, nj)) {
            totalTemp += grid[ni][nj].temperature;
            totalSal += grid[ni][nj].salinity;
            totalVel += grid[ni][nj].velocity;
            totalDir += grid[ni][nj].velocityDir;
            neighbors++;
          }
        }

        if (neighbors > 0) {
          grid[i][j].temperature = totalTemp / neighbors;
          grid[i][j].salinity = totalSal / neighbors;
          grid[i][j].velocity = totalVel / neighbors;
          grid[i][j].velocityDir = totalDir / neighbors;
        }
      }
    }
  }
}

function fillDefaultGrid(grid: GridCell[][], layerIdx: number) {
  const baseTemp = (1 - layerIdx / (DEPTH_LEVELS.length - 1)) * (TEMP_MAX - TEMP_MIN) + TEMP_MIN;
  const baseSal = 34 + layerIdx * 0.5;
  const baseVel = 0.2 + Math.random() * 0.3;

  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const noise = (Math.random() - 0.5) * 4;
      grid[i][j].temperature = Math.max(TEMP_MIN, Math.min(TEMP_MAX, baseTemp + noise));
      grid[i][j].salinity = baseSal + (Math.random() - 0.5) * 2;
      grid[i][j].velocity = baseVel * (0.5 + Math.random());
      grid[i][j].velocityDir = Math.random() * Math.PI * 2;
    }
  }
}

export {};
