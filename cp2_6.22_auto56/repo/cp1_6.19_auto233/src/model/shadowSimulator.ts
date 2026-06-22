import type { Building, FacadeData, ShadowPolygon, SunPosition, BlockStats } from '@/types';
import { buildingManager } from './buildingManager';
import { BLOCK_INFO } from '@/types';

const deg2rad = (deg: number): number => (deg * Math.PI) / 180;
const rad2deg = (rad: number): number => (rad * 180) / Math.PI;

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
};

const getSunlightColor = (hours: number): string => {
  const t = Math.max(0, Math.min(1, hours / 12));
  const start = hexToRgb('#1A1A40');
  const end = hexToRgb('#FFD700');
  return rgbToHex(lerp(start.r, end.r, t), lerp(start.g, end.g, t), lerp(start.b, end.b, t));
};

export const calculateSunPosition = (
  date: Date,
  time: number,
  latitude: number,
  longitude: number
): SunPosition => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();

  const jan1 = new Date(year, 0, 1);
  const dayOfYear = Math.floor((date.getTime() - jan1.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const declination = deg2rad(23.45 * Math.sin(deg2rad((360 / 365) * (dayOfYear - 81))));

  const lstm = 120;
  const B = deg2rad((360 / 365) * (dayOfYear - 81));
  const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
  const tc = 4 * (longitude - lstm) + eot;
  const lst = time + tc / 60;
  const ha = deg2rad(15 * (lst - 12));

  const latRad = deg2rad(latitude);
  const sinAltitude = Math.sin(latRad) * Math.sin(declination) + Math.cos(latRad) * Math.cos(declination) * Math.cos(ha);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));

  const cosAzimuth =
    (Math.sin(declination) * Math.cos(latRad) - Math.cos(declination) * Math.sin(latRad) * Math.cos(ha)) / Math.cos(altitude);
  const sinAzimuth = (-Math.cos(declination) * Math.sin(ha)) / Math.cos(altitude);
  let azimuth = Math.atan2(sinAzimuth, cosAzimuth);

  return { altitude, azimuth };
};

const isPointInShadow = (
  px: number,
  pz: number,
  building: Building,
  sunAltitude: number,
  sunAzimuth: number
): boolean => {
  if (sunAltitude <= 0) return true;

  const dx = building.position.x - px;
  const dz = building.position.z - pz;

  const sunDirX = Math.cos(sunAltitude) * Math.sin(sunAzimuth);
  const sunDirZ = Math.cos(sunAltitude) * Math.cos(sunAzimuth);

  const dist = Math.sqrt(dx * dx + dz * dz);
  const dirX = dx / (dist || 1);
  const dirZ = dz / (dist || 1);

  const dot = dirX * sunDirX + dirZ * sunDirZ;
  if (dot < 0) return false;

  const projectedHeight = dist * Math.tan(sunAltitude);
  if (projectedHeight > building.size.height) return false;

  const corners = buildingManager.getBuildingCorners(building);

  let inside = false;
  for (let i = 0, j = corners.length - 1; i < corners.length; j = i++) {
    const xi = corners[i].x;
    const zi = corners[i].z;
    const xj = corners[j].x;
    const zj = corners[j].z;

    if (((zi > pz) !== (zj > pz)) && px < ((xj - xi) * (pz - zi)) / (zj - zi || 1e-9) + xi) {
      inside = !inside;
    }
  }

  return inside;
};

const isFacadeOccluded = (
  building: Building,
  facadeIndex: number,
  sunDir: { x: number; y: number; z: number },
  allBuildings: Building[]
): boolean => {
  const facadeCenter = buildingManager.getFacadeCenter(building, facadeIndex);
  const rayStart = {
    x: facadeCenter.x + sunDir.x * 0.1,
    y: facadeCenter.y + sunDir.y * 0.1,
    z: facadeCenter.z + sunDir.z * 0.1,
  };

  for (const other of allBuildings) {
    if (other.id === building.id) continue;

    const dx = other.position.x - rayStart.x;
    const dz = other.position.z - rayStart.z;
    const distSq = dx * dx + dz * dz;
    const minDist = (other.size.width + other.size.depth) / 2 + building.size.width;

    if (distSq > minDist * minDist * 4) continue;

    const dot = dx * sunDir.x + dz * sunDir.z;
    if (dot < 0) continue;

    const t = dot;
    if (t <= 0 || t > 100) continue;

    const projectedX = rayStart.x + sunDir.x * t;
    const projectedZ = rayStart.z + sunDir.z * t;
    const projectedY = rayStart.y + sunDir.y * t;

    if (projectedY > other.position.y + other.size.height) continue;
    if (projectedY < other.position.y) continue;

    const localX = projectedX - other.position.x;
    const localZ = projectedZ - other.position.z;
    const cos = Math.cos(-other.rotation);
    const sin = Math.sin(-other.rotation);
    const rotatedX = localX * cos - localZ * sin;
    const rotatedZ = localX * sin + localZ * cos;

    if (
      Math.abs(rotatedX) <= other.size.width / 2 &&
      Math.abs(rotatedZ) <= other.size.depth / 2
    ) {
      return true;
    }
  }

  return false;
};

const calculateFacadeSunlight = (
  building: Building,
  facadeIndex: number,
  date: Date,
  latitude: number,
  longitude: number,
  allBuildings: Building[]
): { hours: number; intensity: number[] } => {
  const hourlyIntensity: number[] = new Array(24).fill(0);
  let totalHours = 0;

  const facadeNormal = buildingManager.getFacadeNormal(facadeIndex, building.rotation);

  for (let hour = 6; hour <= 18; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time = hour + minute / 60;
      const sunPos = calculateSunPosition(date, time, latitude, longitude);

      if (sunPos.altitude <= 0) continue;

      const sunDir = {
        x: Math.cos(sunPos.altitude) * Math.sin(sunPos.azimuth),
        y: Math.sin(sunPos.altitude),
        z: Math.cos(sunPos.altitude) * Math.cos(sunPos.azimuth),
      };

      const dotProduct = facadeNormal.x * sunDir.x + facadeNormal.z * sunDir.z;
      if (dotProduct <= 0) continue;

      if (isFacadeOccluded(building, facadeIndex, sunDir, allBuildings)) continue;

      const intensity = dotProduct * Math.sin(sunPos.altitude);
      hourlyIntensity[hour] += intensity / 2;
      totalHours += 0.5;
    }
  }

  return { hours: totalHours, intensity: hourlyIntensity };
};

export const calculateShadowPolygons = (
  buildings: Building[],
  sunPosition: SunPosition
): ShadowPolygon[] => {
  const polygons: ShadowPolygon[] = [];

  if (sunPosition.altitude <= 0) return polygons;

  const shadowLength = 1 / Math.tan(sunPosition.altitude);
  const shadowDx = Math.sin(sunPosition.azimuth) * shadowLength;
  const shadowDz = Math.cos(sunPosition.azimuth) * shadowLength;

  for (const building of buildings) {
    const corners = buildingManager.getBuildingCorners(building);
    const height = building.size.height;

    const projectedCorners = corners.map((c) => ({
      x: c.x + shadowDx * height,
      z: c.z + shadowDz * height,
    }));

    const points: { x: number; z: number }[] = [];
    corners.forEach((c) => points.push(c));
    projectedCorners.reverse().forEach((c) => points.push(c));

    polygons.push({
      buildingId: building.id,
      points,
    });
  }

  return polygons;
};

export const calculateFacadeData = (
  buildings: Building[],
  date: Date,
  latitude: number,
  longitude: number
): FacadeData[] => {
  const facadeData: FacadeData[] = [];

  for (const building of buildings) {
    for (let i = 0; i < 4; i++) {
      const { hours, intensity } = calculateFacadeSunlight(
        building,
        i,
        date,
        latitude,
        longitude,
        buildings
      );
      facadeData.push({
        buildingId: building.id,
        facadeIndex: i,
        sunlightHours: Math.round(hours * 10) / 10,
        hourlyIntensity: intensity,
        color: getSunlightColor(hours),
      });
    }
  }

  return facadeData;
};

export const calculateBlockStats = (
  buildings: Building[],
  facadeData: FacadeData[],
  shadowPolygons: ShadowPolygon[]
): BlockStats[] => {
  const blockIds = [...new Set(buildings.map((b) => b.blockId))];

  return blockIds.map((blockId) => {
    const blockBuildings = buildings.filter((b) => b.blockId === blockId);
    const blockFacades = facadeData.filter((fd) =>
      blockBuildings.some((b) => b.id === fd.buildingId)
    );

    const avgSunlight =
      blockFacades.length > 0
        ? blockFacades.reduce((sum, f) => sum + f.sunlightHours, 0) / blockFacades.length
        : 0;

    const info = BLOCK_INFO[blockId] || { name: blockId, area: 100 };
    let shadowCoverage = 0;

    const gridSize = 2;
    const areaSize = Math.sqrt(info.area) * 2;
    let totalPoints = 0;
    let shadowPoints = 0;

    for (let x = -areaSize; x <= areaSize; x += gridSize) {
      for (let z = -areaSize; z <= areaSize; z += gridSize) {
        totalPoints++;
        for (const building of blockBuildings) {
          if (isPointInShadow(x, z, building, Math.PI / 4, 0)) {
            shadowPoints++;
            break;
          }
        }
      }
    }

    shadowCoverage = totalPoints > 0 ? shadowPoints / totalPoints : 0;

    return {
      blockId,
      blockName: info.name,
      avgSunlightHours: Math.round(avgSunlight * 10) / 10,
      shadowCoverage: Math.round(shadowCoverage * 100) / 100,
      totalArea: info.area,
    };
  });
};

export const shadowSimulator = {
  calculateSunPosition,
  calculateShadowPolygons,
  calculateFacadeData,
  calculateBlockStats,
};
