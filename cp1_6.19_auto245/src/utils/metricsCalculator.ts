import * as THREE from 'three';
import { scaleLinear, scaleSequential } from 'd3-scale';
import { interpolateViridis, interpolateTurbo } from 'd3-scale-chromatic';
import { useAppStore, BuildingPressure } from '../stores/appStore';
import type { ParticleSnapshot } from '../modules/particleSystem';
import type { BuildingData } from '../modules/modelManager';
import { useParticleStore } from '../store/useParticleStore';

export const CALM_ZONE_THRESHOLD = 0.5;
export const MAX_WIND_SPEED = 12;
export const WIND_DIRECTION = new THREE.Vector3(1, 0.1, 1).normalize();

export const windSpeedColorScale = scaleLinear<string>()
  .domain([0, MAX_WIND_SPEED / 2, MAX_WIND_SPEED])
  .range(['#3498DB', '#9B59B6', '#E74C3C'])
  .clamp(true);

export const turbulenceColorScale = scaleSequential()
  .domain([0, 100])
  .interpolator(interpolateTurbo);

export const pressureColorScale = scaleSequential()
  .domain([-50, 50])
  .interpolator(interpolateViridis);

export const CALM_ZONE_HIGHLIGHT_COLOR = '#6C3483';

interface BuildingDimensions {
  width: number;
  height: number;
  depth: number;
}

function getBuildingDimensions(type: string, height: number): BuildingDimensions {
  switch (type) {
    case 'plate':
      return { width: 20, height, depth: 10 };
    case 'tower':
      return { width: 12, height, depth: 12 };
    case 'terrace':
      return { width: 18, height, depth: 15 };
    case 'arc':
      return { width: 30, height, depth: 15 };
    default:
      return { width: 15, height, depth: 15 };
  }
}

function rotatePoint(
  point: { x: number; z: number },
  center: { x: number; z: number },
  angleDeg: number
): { x: number; z: number } {
  const angleRad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = point.x - center.x;
  const dz = point.z - center.z;
  return {
    x: center.x + dx * cos - dz * sin,
    z: center.z + dx * sin + dz * cos,
  };
}

function getParticleSpeed(particleData: ParticleSnapshot['particles'][0]): number {
  const pos = particleData.position;
  const color = particleData.color;
  const normalizedSpeed = (color[0] - 0.2) / 0.8;
  return Math.max(0, Math.min(MAX_WIND_SPEED, normalizedSpeed * MAX_WIND_SPEED));
}

function estimateParticleVelocity(
  particle: ParticleSnapshot['particles'][0],
  windDirection: THREE.Vector3,
  speed: number
): THREE.Vector3 {
  const velocity = windDirection.clone().multiplyScalar(speed);
  const turbulence = new THREE.Vector3(
    (Math.random() - 0.5) * 0.5,
    (Math.random() - 0.5) * 0.3,
    (Math.random() - 0.5) * 0.5
  );
  return velocity.add(turbulence);
}

export function calculateAverageWindSpeed(snapshot: ParticleSnapshot | null): number {
  if (!snapshot || snapshot.particles.length === 0) return 0;

  const activeParticles = snapshot.particles.filter((p) => p.active);
  if (activeParticles.length === 0) return 0;

  const totalSpeed = activeParticles.reduce((sum, p) => {
    const speed = getParticleSpeed(p);
    return sum + Math.min(speed, MAX_WIND_SPEED);
  }, 0);

  return Math.min(totalSpeed / activeParticles.length, MAX_WIND_SPEED);
}

export function calculateTurbulenceIntensity(
  snapshot: ParticleSnapshot | null,
  averageSpeed: number
): number {
  if (!snapshot || averageSpeed === 0) return 0;

  const activeParticles = snapshot.particles.filter((p) => p.active);
  if (activeParticles.length === 0) return 0;

  const variance =
    activeParticles.reduce((sum, p) => {
      const speed = getParticleSpeed(p);
      const clampedSpeed = Math.min(speed, MAX_WIND_SPEED);
      const diff = clampedSpeed - averageSpeed;
      return sum + diff * diff;
    }, 0) / activeParticles.length;

  const stdDev = Math.sqrt(variance);
  return Math.min((stdDev / averageSpeed) * 100, 100);
}

export function calculateCalmZoneRatio(snapshot: ParticleSnapshot | null): {
  ratio: number;
  calmParticleIndices: number[];
} {
  if (!snapshot || snapshot.particles.length === 0) {
    return { ratio: 0, calmParticleIndices: [] };
  }

  const activeParticles = snapshot.particles.filter((p) => p.active);
  if (activeParticles.length === 0) {
    return { ratio: 0, calmParticleIndices: [] };
  }

  const calmParticleIndices: number[] = [];
  snapshot.particles.forEach((p, index) => {
    if (p.active) {
      const speed = getParticleSpeed(p);
      if (speed < CALM_ZONE_THRESHOLD) {
        calmParticleIndices.push(index);
      }
    }
  });

  return {
    ratio: calmParticleIndices.length / activeParticles.length,
    calmParticleIndices,
  };
}

export function calculateBuildingPressure(
  building: BuildingData,
  snapshot: ParticleSnapshot | null,
  windDirection: THREE.Vector3 = WIND_DIRECTION
): { windward: number; leeward: number; difference: number } {
  if (!snapshot || snapshot.particles.length === 0) {
    return { windward: 0, leeward: 0, difference: 0 };
  }

  const activeParticles = snapshot.particles.filter((p) => p.active);
  if (activeParticles.length === 0) {
    return { windward: 0, leeward: 0, difference: 0 };
  }

  const dimensions = getBuildingDimensions(building.type, building.height);
  const halfWidth = dimensions.width / 2;
  const halfDepth = dimensions.depth / 2;

  const faceNormals = [
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(-1, 0, 0),
  ].map((n) => {
    const rotated = rotatePoint({ x: n.x, z: n.z }, { x: 0, z: 0 }, building.rotation);
    return new THREE.Vector3(rotated.x, n.y, rotated.z).normalize();
  });

  let maxDot = -Infinity;
  let minDot = Infinity;
  let windwardNormal = faceNormals[0];
  let leewardNormal = faceNormals[2];

  faceNormals.forEach((normal) => {
    const dot = normal.dot(windDirection);
    if (dot > maxDot) {
      maxDot = dot;
      windwardNormal = normal;
    }
    if (dot < minDot) {
      minDot = dot;
      leewardNormal = normal;
    }
  });

  const windwardCenter = new THREE.Vector3(
    building.position.x + windwardNormal.x * halfWidth,
    building.position.y + dimensions.height / 2,
    building.position.z + windwardNormal.z * halfDepth
  );

  const leewardCenter = new THREE.Vector3(
    building.position.x + leewardNormal.x * halfWidth,
    building.position.y + dimensions.height / 2,
    building.position.z + leewardNormal.z * halfDepth
  );

  const influenceRadius = Math.max(dimensions.width, dimensions.depth) * 1.5;
  const buildingCenter = new THREE.Vector3(
    building.position.x,
    building.position.y + dimensions.height / 2,
    building.position.z
  );

  let windwardPressure = 0;
  let leewardPressure = 0;
  let windwardCount = 0;
  let leewardCount = 0;

  const tempPos = new THREE.Vector3();
  const tempVel = new THREE.Vector3();

  activeParticles.forEach((particleData) => {
    tempPos.set(...particleData.position);
    const distToCenter = tempPos.distanceTo(buildingCenter);

    if (distToCenter > influenceRadius) return;

    const speed = getParticleSpeed(particleData);
    const dynamicPressure = 0.5 * 1.225 * speed * speed;

    const windwardDist = tempPos.distanceTo(windwardCenter);
    const leewardDist = tempPos.distanceTo(leewardCenter);

    tempVel.copy(estimateParticleVelocity(particleData, windDirection, speed));
    tempVel.normalize();

    const windwardDot = tempVel.dot(windwardNormal);
    const leewardDot = tempVel.dot(leewardNormal);

    if (windwardDist < influenceRadius / 2 && windwardDot > 0.3) {
      const weight = 1 - windwardDist / (influenceRadius / 2);
      windwardPressure += dynamicPressure * weight * windwardDot;
      windwardCount++;
    }

    if (leewardDist < influenceRadius / 2 && leewardDot < -0.3) {
      const weight = 1 - leewardDist / (influenceRadius / 2);
      leewardPressure += dynamicPressure * weight * Math.abs(leewardDot);
      leewardCount++;
    }
  });

  if (windwardCount > 0) {
    windwardPressure /= windwardCount;
  }
  if (leewardCount > 0) {
    leewardPressure /= leewardCount;
  }

  return {
    windward: windwardPressure,
    leeward: -leewardPressure,
    difference: windwardPressure + leewardPressure,
  };
}

export function getTopPressureDiffBuildings(
  buildings: BuildingData[],
  buildingPressures: Map<string, BuildingPressure>,
  count: number = 3
): BuildingPressure[] {
  return buildings
    .map((b) => {
      const pressure = buildingPressures.get(b.id);
      return (
        pressure || {
          buildingId: b.id,
          windward: 0,
          leeward: 0,
          difference: 0,
        }
      );
    })
    .sort((a, b) => b.difference - a.difference)
    .slice(0, count);
}

export function calculateAndUpdateMetrics(): void {
  const particleState = useParticleStore.getState();
  const appState = useAppStore.getState();
  const { currentSnapshot } = particleState;
  const { buildings, setBuildingPressure, setMetrics } = appState;

  const averageWindSpeed = calculateAverageWindSpeed(currentSnapshot);
  const turbulenceIntensity = calculateTurbulenceIntensity(currentSnapshot, averageWindSpeed);
  const { ratio: calmZoneRatio, calmZoneParticleIndices } = calculateCalmZoneRatio(currentSnapshot);

  buildings.forEach((building) => {
    const pressure = calculateBuildingPressure(building, currentSnapshot);
    setBuildingPressure(building.id, {
      windward: pressure.windward,
      leeward: pressure.leeward,
      difference: pressure.difference,
    });
  });

  const updatedAppState = useAppStore.getState();
  const topPressureDiffBuildings = getTopPressureDiffBuildings(
    buildings,
    updatedAppState.buildingPressures,
    3
  );

  setMetrics({
    averageWindSpeed,
    turbulenceIntensity,
    calmZoneRatio,
    calmZoneParticleIndices,
    topPressureDiffBuildings,
  });
}

export function getParticleColor(particleData: ParticleSnapshot['particles'][0]): string {
  const speed = getParticleSpeed(particleData);
  return windSpeedColorScale(speed);
}

export function isParticleInCalmZone(particleData: ParticleSnapshot['particles'][0]): boolean {
  const speed = getParticleSpeed(particleData);
  return speed < CALM_ZONE_THRESHOLD;
}

export default {
  calculateAndUpdateMetrics,
  calculateAverageWindSpeed,
  calculateTurbulenceIntensity,
  calculateCalmZoneRatio,
  calculateBuildingPressure,
  getTopPressureDiffBuildings,
  getParticleColor,
  isParticleInCalmZone,
  windSpeedColorScale,
  turbulenceColorScale,
  pressureColorScale,
  CALM_ZONE_HIGHLIGHT_COLOR,
  CALM_ZONE_THRESHOLD,
  MAX_WIND_SPEED,
};
