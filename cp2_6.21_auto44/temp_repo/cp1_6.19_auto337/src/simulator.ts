import type { Turbine } from './store';

export interface WakeCone {
  position: [number, number, number];
  height: number;
  radius: number;
  length: number;
  direction: [number, number, number];
}

export function calculateWake(
  turbines: Turbine[],
  windSpeed: number = 8
): WakeCone[] {
  const wakeCones: WakeCone[] = [];
  const wakeDecay = 0.075;
  const rotorDiameter = 5;

  for (const turbine of turbines) {
    const wakeLength = 10 * rotorDiameter;
    const initialRadius = rotorDiameter / 2;

    wakeCones.push({
      position: turbine.position,
      height: rotorDiameter * 2,
      radius: initialRadius + wakeDecay * wakeLength,
      length: wakeLength,
      direction: [1, 0, 0],
    });
  }

  return wakeCones;
}

export function generateHeightMap(
  size: number,
  amplitude: number
): number[][] {
  const heightMap: number[][] = [];
  const scale = size / 200;

  for (let z = 0; z < size; z++) {
    heightMap[z] = [];
    for (let x = 0; x < size; x++) {
      const nx = (x - size / 2) * scale / 50;
      const nz = (z - size / 2) * scale / 50;

      const valley = -Math.abs(nx * 3) * 0.5;
      const hills = Math.sin(nx * 2) * Math.cos(nz * 1.5) * 0.3 +
                    Math.sin(nx * 4 + 1) * Math.cos(nz * 3 + 0.5) * 0.15 +
                    Math.sin(nz * 2.5) * 0.2;

      const normalizedHeight = (valley + hills + 0.5) * amplitude;
      heightMap[z][x] = Math.max(0, normalizedHeight);
    }
  }

  return heightMap;
}

export function getTerrainHeight(
  heightMap: number[][],
  x: number,
  z: number,
  size: number = 200
): number {
  const mapSize = heightMap.length;
  const scale = mapSize / size;

  const xi = Math.floor((x + size / 2) * scale);
  const zi = Math.floor((z + size / 2) * scale);

  if (xi < 0 || xi >= mapSize || zi < 0 || zi >= mapSize) {
    return 0;
  }

  return heightMap[zi][xi];
}

export function calculateWindSpeedAtPoint(
  x: number,
  z: number,
  heightMap: number[][],
  turbines: Turbine[],
  baseWindSpeed: number = 8
): number {
  const terrainHeight = getTerrainHeight(heightMap, x, z);
  const elevationBoost = terrainHeight * 0.02;

  let windSpeed = baseWindSpeed + elevationBoost;

  for (const turbine of turbines) {
    const dx = x - turbine.position[0];
    const dz = z - turbine.position[2];
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dx > 0 && dx < 50 && dist < 30) {
      const wakeFactor = 1 - 0.4 * Math.exp(-(dist * dist) / 200);
      windSpeed *= wakeFactor;
    }
  }

  const nx = (x + 100) / 100;
  const nz = (z + 100) / 100;
  const terrainAcceleration = 1 + Math.abs(Math.sin(nx * 3) * Math.cos(nz * 2)) * 0.2;

  return windSpeed * terrainAcceleration;
}

export function optimizeLayout(
  heightMap: number[][],
  turbines: Turbine[],
  candidateCount: number = 3
): { positions: [number, number, number][]; gain: number } {
  const mapSize = heightMap.length;
  const scale = 200 / mapSize;

  const candidates: { position: [number, number, number]; score: number }[] = [];
  const step = 10;

  for (let z = 0; z < mapSize; z += step) {
    for (let x = 0; x < mapSize; x += step) {
      const worldX = (x - mapSize / 2) * scale;
      const worldZ = (z - mapSize / 2) * scale;
      const terrainHeight = heightMap[z][x];

      let tooClose = false;
      for (const turbine of turbines) {
        const dx = worldX - turbine.position[0];
        const dz = worldZ - turbine.position[2];
        if (Math.sqrt(dx * dx + dz * dz) < 20) {
          tooClose = true;
          break;
        }
      }

      if (tooClose) continue;

      const windSpeed = calculateWindSpeedAtPoint(
        worldX,
        worldZ,
        heightMap,
        turbines
      );

      let wakeExposure = 0;
      for (const turbine of turbines) {
        const dx = worldX - turbine.position[0];
        const dz = worldZ - turbine.position[2];
        if (dx > 0 && Math.abs(dz) < 15 && dx < 60) {
          wakeExposure += 0.3 * (1 - dx / 60);
        }
      }

      const score = windSpeed * (1 - wakeExposure) * (1 + terrainHeight * 0.01);
      candidates.push({
        position: [worldX, terrainHeight + 1, worldZ],
        score,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  const selected: { position: [number, number, number]; score: number }[] = [];
  for (const candidate of candidates) {
    if (selected.length >= candidateCount) break;

    let farEnough = true;
    for (const s of selected) {
      const dx = candidate.position[0] - s.position[0];
      const dz = candidate.position[2] - s.position[2];
      if (Math.sqrt(dx * dx + dz * dz) < 25) {
        farEnough = false;
        break;
      }
    }

    if (farEnough) {
      selected.push(candidate);
    }
  }

  const totalCurrentPower = turbines.reduce((sum, t) => sum + t.power, 0);
  const additionalPower = selected.reduce((sum, s) => sum + s.score * 50, 0);
  const gain = totalCurrentPower > 0
    ? (additionalPower / totalCurrentPower) * 100
    : additionalPower > 0 ? 30 : 0;

  return {
    positions: selected.map((s) => s.position),
    gain: Math.min(gain, 50),
  };
}

export function calculateTurbinePower(
  windSpeed: number,
  efficiency: number = 0.4
): number {
  const airDensity = 1.225;
  const rotorArea = Math.PI * 2.5 * 2.5;
  const power = 0.5 * airDensity * rotorArea * Math.pow(windSpeed, 3) * efficiency;
  return Math.max(0, power / 1000);
}
