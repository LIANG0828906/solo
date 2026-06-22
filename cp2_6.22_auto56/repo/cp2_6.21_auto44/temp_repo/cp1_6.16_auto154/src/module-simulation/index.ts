import { BuildingBlock, WindParams, VelocityGrid, Streamline, SimulationResult, BuildingWindStats } from '../types';

const SCENE_MIN = -10;
const SCENE_MAX = 10;
const GRID_STEP = 0.5;
const GRID_SIZE = Math.round((SCENE_MAX - SCENE_MIN) / GRID_STEP);
const INFLUENCE_RADIUS = 4;
const STREAMLINE_COUNT = 5000;
const STREAMLINE_STEPS = 60;
const STREAMLINE_DT = 0.08;

interface Panel {
  cx: number;
  cz: number;
  nx: number;
  nz: number;
  length: number;
  buildingIdx: number;
}

function buildPanels(buildings: BuildingBlock[]): Panel[] {
  const panels: Panel[] = [];

  buildings.forEach((b, buildingIdx) => {
    const hw = b.width / 2;
    const hd = b.depth / 2;

    const corners = [
      { x: b.x - hw, z: b.z - hd },
      { x: b.x + hw, z: b.z - hd },
      { x: b.x + hw, z: b.z + hd },
      { x: b.x - hw, z: b.z + hd },
    ];

    for (let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];
      const cx = (p1.x + p2.x) / 2;
      const cz = (p1.z + p2.z) / 2;
      const dx = p2.x - p1.x;
      const dz = p2.z - p1.z;
      const length = Math.sqrt(dx * dx + dz * dz);
      const nx = -dz / length;
      const nz = dx / length;
      panels.push({ cx, cz, nx, nz, length, buildingIdx });
    }
  });

  return panels;
}

function velFromPanel(panel: Panel, targetX: number, targetZ: number, sigma: number) {
  const rx = targetX - panel.cx;
  const rz = targetZ - panel.cz;
  const d2 = rx * rx + rz * rz;
  if (d2 < 0.001) return { vx: 0, vz: 0 };

  const invD2 = 1 / d2;
  const sigmaTerm = 1 - Math.exp(-d2 / (sigma * sigma));

  const dot = rx * panel.nx + rz * panel.nz;
  const strength = panel.length * dot * invD2 * sigmaTerm;

  return {
    vx: strength * (rz) * invD2,
    vz: strength * (-rx) * invD2,
  };
}

function isInsideBuilding(px: number, pz: number, buildings: BuildingBlock[]): boolean {
  for (const b of buildings) {
    const hw = b.width / 2 + 0.05;
    const hd = b.depth / 2 + 0.05;
    if (px >= b.x - hw && px <= b.x + hw && pz >= b.z - hd && pz <= b.z + hd) {
      return true;
    }
  }
  return false;
}

function computeVelocity(
  px: number,
  pz: number,
  windDirRad: number,
  windSpeed: number,
  panels: Panel[],
  buildings: BuildingBlock[]
): { vx: number; vz: number } {
  if (isInsideBuilding(px, pz, buildings)) {
    return { vx: 0, vz: 0 };
  }

  let vx = Math.cos(windDirRad) * windSpeed;
  let vz = Math.sin(windDirRad) * windSpeed;

  for (const panel of panels) {
    const delta = velFromPanel(panel, px, pz, INFLUENCE_RADIUS);
    vx += delta.vx * 3.5;
    vz += delta.vz * 3.5;
  }

  const localMax = windSpeed * 1.8;
  const mag = Math.sqrt(vx * vx + vz * vz);
  if (mag > localMax && mag > 0) {
    const scale = localMax / mag;
    vx *= scale;
    vz *= scale;
  }

  return { vx, vz };
}

export function computeVelocityGrid(
  buildings: BuildingBlock[],
  windParams: WindParams
): VelocityGrid {
  const windDirRad = (windParams.direction * Math.PI) / 180;
  const panels = buildPanels(buildings);

  const velocities: { x: number; z: number; magnitude: number }[][] = [];

  for (let i = 0; i <= GRID_SIZE; i++) {
    const row: { x: number; z: number; magnitude: number }[] = [];
    const px = SCENE_MIN + i * GRID_STEP;
    for (let j = 0; j <= GRID_SIZE; j++) {
      const pz = SCENE_MIN + j * GRID_STEP;
      const { vx, vz } = computeVelocity(px, pz, windDirRad, windParams.speed, panels, buildings);
      const magnitude = Math.sqrt(vx * vx + vz * vz);
      row.push({ x: vx, z: vz, magnitude });
    }
    velocities.push(row);
  }

  return {
    sizeX: GRID_SIZE + 1,
    sizeZ: GRID_SIZE + 1,
    minX: SCENE_MIN,
    minZ: SCENE_MIN,
    step: GRID_STEP,
    velocities,
  };
}

function generateStreamlineStartPoints(count: number): { x: number; z: number }[] {
  const points: { x: number; z: number }[] = [];
  const perSide = Math.ceil(Math.sqrt(count / 4));

  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < perSide; i++) {
      const t = (i + Math.random()) / perSide;
      let x: number, z: number;
      const margin = 0.5;

      switch (s) {
        case 0:
          x = SCENE_MIN + margin;
          z = SCENE_MIN + t * (SCENE_MAX - SCENE_MIN) - margin * 2 + margin;
          break;
        case 1:
          x = SCENE_MAX - margin;
          z = SCENE_MIN + t * (SCENE_MAX - SCENE_MIN) - margin * 2 + margin;
          break;
        case 2:
          x = SCENE_MIN + t * (SCENE_MAX - SCENE_MIN) - margin * 2 + margin;
          z = SCENE_MIN + margin;
          break;
        default:
          x = SCENE_MIN + t * (SCENE_MAX - SCENE_MIN) - margin * 2 + margin;
          z = SCENE_MAX - margin;
          break;
      }
      points.push({ x, z });
    }
  }

  while (points.length < count) {
    points.push({
      x: SCENE_MIN + Math.random() * (SCENE_MAX - SCENE_MIN),
      z: SCENE_MIN + Math.random() * (SCENE_MAX - SCENE_MIN),
    });
  }

  return points.slice(0, count);
}

export function computeStreamlines(
  buildings: BuildingBlock[],
  windParams: WindParams
): Streamline[] {
  const windDirRad = (windParams.direction * Math.PI) / 180;
  const panels = buildPanels(buildings);
  const starts = generateStreamlineStartPoints(STREAMLINE_COUNT);
  const streamlines: Streamline[] = [];

  for (const start of starts) {
    const points: { x: number; z: number }[] = [];
    let cx = start.x;
    let cz = start.z;
    let maxVel = 0;
    let valid = true;

    for (let step = 0; step < STREAMLINE_STEPS; step++) {
      if (cx < SCENE_MIN - 2 || cx > SCENE_MAX + 2 || cz < SCENE_MIN - 2 || cz > SCENE_MAX + 2) {
        valid = step > 3;
        break;
      }

      if (isInsideBuilding(cx, cz, buildings)) {
        valid = step > 3;
        break;
      }

      points.push({ x: cx, z: cz });

      const { vx, vz } = computeVelocity(cx, cz, windDirRad, windParams.speed, panels, buildings);
      const mag = Math.sqrt(vx * vx + vz * vz);
      if (mag > maxVel) maxVel = mag;

      if (mag < 0.01) {
        valid = step > 3;
        break;
      }

      cx += vx * STREAMLINE_DT;
      cz += vz * STREAMLINE_DT;
    }

    if (valid && points.length >= 4) {
      streamlines.push({ points, velocity: maxVel });
    }
  }

  return streamlines;
}

export function computeBuildingStats(
  buildings: BuildingBlock[],
  grid: VelocityGrid,
  windParams: WindParams
): BuildingWindStats[] {
  const windDirRad = (windParams.direction * Math.PI) / 180;
  const result: BuildingWindStats[] = [];

  for (const b of buildings) {
    const hw = b.width / 2;
    const hd = b.depth / 2;

    const wnx = Math.cos(windDirRad);
    const wnz = Math.sin(windDirRad);

    let windwardTotal = 0;
    let windwardCount = 0;
    let leewardTotal = 0;
    let leewardCount = 0;

    const sampleStep = 0.25;
    const sampleDist = 0.6;

    for (let t = -1; t <= 1; t += sampleStep / Math.max(b.width, b.depth)) {
      const tx = b.x + wnx * t * Math.max(hw, hd) * 0.8;
      const tz = b.z + wnz * t * Math.max(hw, hd) * 0.8;

      const wx = tx + wnx * sampleDist;
      const wz = tz + wnz * sampleDist;

      const lw = Math.max(hw, hd);
      const perpX = -wnz;
      const perpZ = wnx;
      const sx = b.x + perpX * t * lw - wnx * sampleDist;
      const sz = b.z + perpZ * t * lw - wnz * sampleDist;

      const gx1 = Math.floor((wx - grid.minX) / grid.step);
      const gz1 = Math.floor((wz - grid.minZ) / grid.step);
      if (gx1 >= 0 && gx1 < grid.sizeX && gz1 >= 0 && gz1 < grid.sizeZ) {
        windwardTotal += grid.velocities[gx1][gz1].magnitude;
        windwardCount++;
      }

      const gx2 = Math.floor((sx - grid.minX) / grid.step);
      const gz2 = Math.floor((sz - grid.minZ) / grid.step);
      if (gx2 >= 0 && gx2 < grid.sizeX && gz2 >= 0 && gz2 < grid.sizeZ) {
        leewardTotal += grid.velocities[gx2][gz2].magnitude;
        leewardCount++;
      }
    }

    const windwardVel = windwardCount > 0 ? windwardTotal / windwardCount : windParams.speed;
    const leewardVel = leewardCount > 0 ? leewardTotal / leewardCount : windParams.speed * 0.4;

    result.push({
      buildingId: b.id,
      windwardVelocity: windwardVel,
      leewardVelocity: leewardVel,
    });
  }

  return result;
}

export function runSimulation(
  buildings: BuildingBlock[],
  windParams: WindParams
): SimulationResult {
  const grid = computeVelocityGrid(buildings, windParams);
  const streamlines = computeStreamlines(buildings, windParams);

  let maxMag = windParams.speed;
  let totalMag = 0;
  let totalCount = 0;

  for (let i = 0; i < grid.sizeX; i++) {
    for (let j = 0; j < grid.sizeZ; j++) {
      const mag = grid.velocities[i][j].magnitude;
      if (mag > maxMag) maxMag = mag;
      totalMag += mag;
      totalCount++;
    }
  }

  const maxVelocityRatio = windParams.speed > 0 ? maxMag / windParams.speed : 0;
  const avgVelocity = totalCount > 0 ? totalMag / totalCount : 0;

  const buildingStats = computeBuildingStats(buildings, grid, windParams);

  return {
    velocityGrid: grid,
    streamlines,
    maxVelocityRatio,
    avgVelocity,
    buildingStats,
    timestamp: Date.now(),
  };
}
