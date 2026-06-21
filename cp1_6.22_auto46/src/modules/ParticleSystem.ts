import * as THREE from 'three';
import type { TerrainData } from './Terrain';
import { getHeightAt, getTerrainNormalAt } from './Terrain';

const PARTICLE_COUNT = 3500;
const MAX_SPEED = 25;
const GRAVITY = -1.5;
const TERRAIN_OFFSET = 0.3;

export interface ParticleSystemState {
  positions: Float32Array;
  velocities: Float32Array;
  colors: Float32Array;
  count: number;
  terrainData: TerrainData | null;
}

export function createParticleSystem(): ParticleSystemState {
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    resetParticle(i, positions, velocities, colors, null);
  }

  return {
    positions,
    velocities,
    colors,
    count: PARTICLE_COUNT,
    terrainData: null,
  };
}

function resetParticle(
  i: number,
  positions: Float32Array,
  velocities: Float32Array,
  colors: Float32Array,
  terrainData: TerrainData | null,
  windAngle: number = 0
) {
  const i3 = i * 3;
  const halfW = terrainData ? terrainData.width / 2 : 50;
  const halfD = terrainData ? terrainData.depth / 2 : 50;

  const rad = (windAngle * Math.PI) / 180;
  const emitX = -Math.sin(rad) * halfW * 0.95;
  const emitZ = -Math.cos(rad) * halfD * 0.95;

  const spread = 0.6 + Math.random() * 0.4;
  const perpX = Math.cos(rad);
  const perpZ = -Math.sin(rad);

  positions[i3] = emitX + perpX * (Math.random() - 0.5) * halfW * 1.6 * spread;
  positions[i3 + 1] = 2 + Math.random() * 8;
  positions[i3 + 2] = emitZ + perpZ * (Math.random() - 0.5) * halfD * 1.6 * spread;

  if (terrainData) {
    const th = getHeightAt(positions[i3], positions[i3 + 2], terrainData);
    positions[i3 + 1] = th + TERRAIN_OFFSET + Math.random() * 6;
  }

  velocities[i3] = 0;
  velocities[i3 + 1] = 0;
  velocities[i3 + 2] = 0;

  colors[i3] = 0;
  colors[i3 + 1] = 0.5;
  colors[i3 + 2] = 1;
}

export function updateParticleSystem(
  state: ParticleSystemState,
  windSpeed: number,
  windAngle: number,
  dt: number
): void {
  const { positions, velocities, colors, count, terrainData } = state;
  if (!terrainData) return;

  const clampedDt = Math.min(dt, 0.05);

  const rad = (windAngle * Math.PI) / 180;
  const windX = windSpeed * Math.sin(rad);
  const windZ = windSpeed * Math.cos(rad);

  const halfW = terrainData.width / 2;
  const halfD = terrainData.depth / 2;
  const dragCoeff = 2.5;
  const windForce = 0.8;

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;

    let vx = velocities[i3];
    let vy = velocities[i3 + 1];
    let vz = velocities[i3 + 2];

    const relX = windX - vx;
    const relZ = windZ - vz;
    vx += relX * windForce * clampedDt;
    vz += relZ * windForce * clampedDt;

    vy += GRAVITY * clampedDt;

    const drag = 1 - dragCoeff * clampedDt;
    vx *= Math.max(drag, 0);
    vy *= Math.max(drag, 0);
    vz *= Math.max(drag, 0);

    let px = positions[i3] + vx * clampedDt;
    let py = positions[i3 + 1] + vy * clampedDt;
    let pz = positions[i3 + 2] + vz * clampedDt;

    if (px >= -halfW && px <= halfW && pz >= -halfD && pz <= halfD) {
      const th = getHeightAt(px, pz, terrainData);

      if (py < th + TERRAIN_OFFSET) {
        py = th + TERRAIN_OFFSET;

        const normal = getTerrainNormalAt(px, pz, terrainData);
        const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);
        const dot = vx * normal.x + vy * normal.y + vz * normal.z;

        if (dot < 0) {
          vx -= dot * normal.x * 1.5;
          vy -= dot * normal.y * 1.5;
          vz -= dot * normal.z * 1.5;

          const lateralX = -normal.x * normal.y;
          const lateralZ = -normal.z * normal.y;
          const latLen = Math.sqrt(lateralX * lateralX + lateralZ * lateralZ);
          if (latLen > 0.01) {
            const deflect = Math.min(speed * 0.3, 3);
            vx += (lateralX / latLen) * deflect * clampedDt * 10;
            vz += (lateralZ / latLen) * deflect * clampedDt * 10;
          }
        }

        vy = Math.max(vy, 0.1);
      }
    }

    const speed = Math.sqrt(vx * vx + vy * vy + vz * vz);

    const outOfBounds =
      px < -halfW * 1.1 || px > halfW * 1.1 ||
      pz < -halfD * 1.1 || pz > halfD * 1.1 ||
      py > 30;

    if (outOfBounds || speed < 0.01) {
      resetParticle(i, positions, velocities, colors, terrainData, windAngle);
      continue;
    }

    positions[i3] = px;
    positions[i3 + 1] = py;
    positions[i3 + 2] = pz;
    velocities[i3] = vx;
    velocities[i3 + 1] = vy;
    velocities[i3 + 2] = vz;

    const t = Math.min(speed / MAX_SPEED, 1);
    if (t < 0.5) {
      const s = t * 2;
      colors[i3] = 0;
      colors[i3 + 1] = 0.4 + s * 0.6;
      colors[i3 + 2] = 1 - s * 0.6;
    } else {
      const s = (t - 0.5) * 2;
      colors[i3] = s;
      colors[i3 + 1] = 1 - s * 0.7;
      colors[i3 + 2] = 0.4 - s * 0.4;
    }
  }
}

export function setTerrainData(state: ParticleSystemState, data: TerrainData): void {
  state.terrainData = data;
  for (let i = 0; i < state.count; i++) {
    resetParticle(i, state.positions, state.velocities, state.colors, data, 0);
  }
}
