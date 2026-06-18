import {
  Building,
  SimulationParams,
  EnvironmentResult,
  WindField,
  WindPoint,
  Streamline,
  TemperatureField,
  BuildingInfo,
} from '../utils/dataTypes';

export function generateBuildings(layout: 'enclosed' | 'row' | 'cluster'): Building[] {
  const buildings: Building[] = [];
  const worldSize = 120;
  const rand = (min: number, max: number) => Math.random() * (max - min) + min;
  const h = () => Math.floor(rand(8, 40));
  let id = 0;

  if (layout === 'enclosed') {
    const offsets = [
      { x: -40, z: -40, w: 80, d: 10 },
      { x: -40, z: 40, w: 80, d: 10 },
      { x: -40, z: 0, w: 10, d: 80 },
      { x: 40, z: 0, w: 10, d: 80 },
    ];
    offsets.forEach((o) => {
      const count = Math.max(2, Math.floor(o.w / 15));
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count;
        const bx = o.w > o.d ? o.x - o.w / 2 + t * o.w : o.x;
        const bz = o.w > o.d ? o.z : o.z - o.d / 2 + t * o.d;
        const bw = o.w > o.d ? o.w / count - 2 : 8;
        const bd = o.w > o.d ? 8 : o.d / count - 2;
        buildings.push({
          id: `b${id++}`,
          x: bx,
          z: bz,
          width: bw,
          depth: bd,
          height: h(),
        });
      }
    });
    for (let i = 0; i < 5; i++) {
      buildings.push({
        id: `b${id++}`,
        x: rand(-20, 20),
        z: rand(-20, 20),
        width: rand(6, 10),
        depth: rand(6, 10),
        height: h(),
      });
    }
  } else if (layout === 'row') {
    const rows = 4;
    const cols = 6;
    const spacingX = worldSize / (cols + 1);
    const spacingZ = worldSize / (rows + 1);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        buildings.push({
          id: `b${id++}`,
          x: -worldSize / 2 + (c + 1) * spacingX,
          z: -worldSize / 2 + (r + 1) * spacingZ,
          width: rand(8, 12),
          depth: rand(8, 12),
          height: h(),
        });
      }
    }
  } else {
    const count = 22;
    const centers = [
      { x: -30, z: -20 },
      { x: 25, z: 15 },
      { x: 0, z: 30 },
    ];
    centers.forEach((center) => {
      for (let i = 0; i < Math.floor(count / 3); i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 30;
        buildings.push({
          id: `b${id++}`,
          x: center.x + Math.cos(angle) * dist,
          z: center.z + Math.sin(angle) * dist,
          width: rand(5, 10),
          depth: rand(5, 10),
          height: h(),
        });
      }
    });
  }
  return buildings;
}

function isInsideBuilding(x: number, z: number, buildings: Building[], margin = 0): boolean {
  return buildings.some(
    (b) =>
      x >= b.x - b.width / 2 - margin &&
      x <= b.x + b.width / 2 + margin &&
      z >= b.z - b.depth / 2 - margin &&
      z <= b.z + b.depth / 2 + margin
  );
}

function buildingHeightAt(x: number, z: number, buildings: Building[]): number {
  for (const b of buildings) {
    if (
      x >= b.x - b.width / 2 &&
      x <= b.x + b.width / 2 &&
      z >= b.z - b.depth / 2 &&
      z <= b.z + b.depth / 2
    ) {
      return b.height;
    }
  }
  return 0;
}

export function computeEnvironment(
  buildings: Building[], params: SimulationParams): EnvironmentResult {
  const worldSize = 120;
  const half = worldSize / 2;
  const grid2D = 30;
  const yLevels = [2, 6, 12, 20, 30];

  const windRad = (params.windAngle * Math.PI) / 180;
  const baseSpeed = params.windSpeed;

  const points: WindPoint[] = [];
  const step = worldSize / grid2D;
  for (let xi = 0; xi <= grid2D; xi++) {
    for (let zi = 0; zi <= grid2D; zi++) {
      for (const y of yLevels) {
        const x = -half + xi * step;
        const z = -half + zi * step;
        const bh = buildingHeightAt(x, z, buildings);
        const localH = Math.max(y, bh + 1);
        const heightFactor = 0.5 + (localH / 40) * 0.8;
        let shelterFactor = 1.0;
        for (const b of buildings) {
          const dx = x - b.x;
          const dz = z - b.z;
          const dist = Math.sqrt(dx * dx + dz * dz);
          if (dist < 25 && y < b.height) {
            shelterFactor = Math.min(shelterFactor, 0.3 + (dist / 25) * 0.7);
          }
        }
        const upwindDist = 30;
        for (const b of buildings) {
          const proj =
            Math.cos(windRad) * (b.x - x) + Math.sin(windRad) * (b.z - z);
          if (proj > 0 && proj < upwindDist && y < b.height) {
            const perp =
              -Math.sin(windRad) * (b.x - x) + Math.cos(windRad) * (b.z - z);
            if (Math.abs(perp) < Math.max(b.width, b.depth)) {
              shelterFactor *= 0.6;
            }
          }
        }
        if (y <= bh + 0.5) {
          shelterFactor *= 0.1;
        }
        const speed = baseSpeed * heightFactor * shelterFactor;
        points.push({
          x,
          y,
          z,
          vx: Math.cos(windRad) * speed,
          vy: 0,
          vz: Math.sin(windRad) * speed,
          speed,
        });
      }
    }
  }

  const streamlines: Streamline[] = [];
  const numLines = 35;
  for (let i = 0; i < numLines; i++) {
    const startZ = -half + (i / (numLines - 1)) * worldSize;
    const startY = 3 + (i % 5) * 6;
    const pt: { x: number; y: number; z: number }[] = [];
    let cx = -half - 2;
    let cy = startY;
    let cz = startZ;
    let valid = true;
    for (let s = 0; s < 100; s++) {
      if (cx > half || cx < -half - 5 || cz > half + 5 || cz < -half - 5) break;
      if (cy < 0.5) {
        cy = 0.5;
      }
      const sampleY = Math.min(40, cy);
      const bhAt = buildingHeightAt(cx, cz, buildings);
      if (sampleY < bhAt) {
        cy = bhAt + 2;
      }
      pt.push({ x: cx, y: sampleY, z: cz });
      const hf = 0.5 + (sampleY / 40) * 0.8;
      let sf = 1.0;
      for (const b of buildings) {
        const dx = cx - b.x;
        const dz = cz - b.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < 20 && sampleY < b.height) {
          sf = Math.min(sf, 0.3 + (dist / 20) * 0.7);
        }
      }
      const sp = baseSpeed * hf * sf;
      const stepLen = Math.max(0.8, sp * 0.6);
      cx += Math.cos(windRad) * stepLen;
      cz += Math.sin(windRad) * stepLen;
      cy += (Math.random() - 0.3) * 0.4;
    }
    if (pt.length > 5) {
      streamlines.push({
        id: `sl_${i}`,
        points: pt,
        startSpeed: baseSpeed,
      });
    }
  }

  const windField: WindField = {
    gridSize: grid2D,
    bounds: {
      minX: -half, maxX: half, minY: 0, maxY: 40, minZ: -half, maxZ: half },
    points,
    streamlines,
  };

  const tempGrid: number[][] = [];
  let minT = Infinity;
  let maxT = -Infinity;
  const baseTemp = 24;
  const sunAngle = Math.PI / 4;
  const sunDirX = Math.cos(sunAngle);
  const sunDirZ = Math.sin(sunAngle) * 0.3;
  for (let xi = 0; xi <= grid2D; xi++) {
    tempGrid[xi] = [];
    for (let zi = 0; zi <= grid2D; zi++) {
      const x = -half + xi * step;
      const z = -half + zi * step;
      let shadow = 0;
      for (const b of buildings) {
        const dx = x - b.x;
        const dz = z - b.z;
        if (
          Math.abs(dx) < b.width / 2 && Math.abs(dz) < b.depth / 2
        ) {
          shadow = 1;
          break;
        }
        for (let t = 1; t < 20; t++) {
          const sx = x - sunDirX * t * 3;
          const sz = z - sunDirZ * t * 3;
          const sy = t * 3;
          if (
            sx >= b.x - b.width / 2 &&
            sx <= b.x + b.width / 2 &&
            sz >= b.z - b.depth / 2 &&
            sz <= b.z + b.depth / 2 &&
            sy <= b.height
          ) {
            shadow = Math.max(shadow, 1 - t / 20);
            break;
          }
        }
      }
      let density = 0;
      for (const b of buildings) {
        const dx = x - b.x;
        const dz = z - b.z;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < 30) {
          density += (b.height / (d + 5));
        }
      }
      density = Math.min(1, density / 40);
      const temp =
        baseTemp +
        (1 - shadow) * (params.solarIntensity / 100) * 18 +
        density * 4 -
        2;
      tempGrid[xi][zi] = temp;
      if (temp < minT) minT = temp;
      if (temp > maxT) maxT = temp;
    }
  }

  const temperatureField: TemperatureField = {
    gridSize: grid2D,
    bounds: { minX: -half, maxX: half, minZ: -half, maxZ: half },
    temperatures: tempGrid,
    minTemp: minT,
    maxTemp: maxT,
  };

  return { windField, temperatureField };
}

export function getBuildingInfo(
  building: Building,
  buildings: Building[],
  result: EnvironmentResult,
  solarIntensity: number
): BuildingInfo {
  const { windField, temperatureField } = result;
  const worldSize = 120;
  const half = worldSize / 2;
  const step = worldSize / temperatureField.gridSize;
  const sunAngle = Math.PI / 4;
  const sunDirX = Math.cos(sunAngle);
  const sunDirZ = Math.sin(sunAngle) * 0.3;

  const shadows: { x: number; z: number; width: number; depth: number }[] = [];
  const shadowLength = building.height / 1.2;
  shadows.push({
    x: building.x + sunDirX * shadowLength / 2,
    z: building.z + sunDirZ * shadowLength / 2,
    width: building.width + 3,
    depth: building.depth + 3,
  });

  let windSum = 0;
  let windCount = 0;
  const r = 15;
  for (const p of windField.points) {
    const dx = p.x - building.x;
    const dz = p.z - building.z;
    if (dx * dx + dz * dz < r * r && p.y < building.height + 2) {
      windSum += p.speed;
      windCount++;
    }
  }
  const avgWind = windCount > 0 ? windSum / windCount : 0;

  let tempSum = 0;
  let tempCount = 0;
  const gxi = Math.floor((building.x + half) / step);
  const gzi = Math.floor((building.z + half) / step);
  for (let di = -2; di <= 2; di++) {
    for (let dj = -2; dj <= 2; dj++) {
      const xi = gxi + di;
      const zi = gzi + dj;
      if (
        xi >= 0 &&
        xi < temperatureField.temperatures.length &&
        zi >= 0 &&
        zi < temperatureField.temperatures[0].length
      ) {
        tempSum += temperatureField.temperatures[xi][zi];
        tempCount++;
      }
    }
  }
  const avgTemp = tempCount > 0 ? tempSum / tempCount : 25;

  return {
    buildingId: building.id,
    shadowArea: shadows,
    avgWindSpeed: avgWind,
    avgSurfaceTemp: avgTemp,
  };
}

export function generateSliceData(
  windField: WindField, height: number): { x: number; z: number; speed: number }[][] {
  const worldSize = 120;
  const half = worldSize / 2;
  const gridN = 30;
  const step = worldSize / gridN;
  const data: { x: number; z: number; speed: number }[][] = [];
  for (let xi = 0; xi <= gridN; xi++) {
    data[xi] = [];
    for (let zi = 0; zi <= gridN; zi++) {
      const x = -half + xi * step;
      const z = -half + zi * step;
      let closest: { dist: number; speed: number } | null = null;
      for (const p of windField.points) {
        const d = (p.x - x) ** 2 + (p.z - z) ** 2 + (p.y - height) ** 2;
        if (!closest || d < closest.dist) {
          closest = { dist: d, speed: p.speed };
        }
      }
      data[xi][zi] = { x, z, speed: closest ? closest.speed : 0 };
    }
  }
  return data;
}
