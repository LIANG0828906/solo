import type { Building } from './buildingData';

export interface SunPosition {
  elevation: number;
  azimuth: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface ShadowPolygon {
  points: Point2D[];
  buildingId: string;
}

export interface HighlightArea {
  type: 'glass' | 'metal';
  position: Point2D;
  size: { w: number; h: number };
  opacity: number;
  rotation?: number;
  faceNormal?: Point3D;
}

export const ISO_SCALE = 60;
export const ISO_ORIGIN_X = 450;
export const ISO_ORIGIN_Y = 420;
const COS_30 = Math.cos(Math.PI / 6);
const SIN_30 = Math.sin(Math.PI / 6);

export const projectToIso = (p: Point3D): Point2D => ({
  x: ISO_ORIGIN_X + (p.x - p.z) * COS_30 * ISO_SCALE,
  y: ISO_ORIGIN_Y + (p.x + p.z) * SIN_30 * ISO_SCALE - p.y * ISO_SCALE,
});

export const isoToWorld = (screenX: number, screenY: number): Point2D => {
  const dx = (screenX - ISO_ORIGIN_X) / ISO_SCALE;
  const dy = (screenY - ISO_ORIGIN_Y) / ISO_SCALE;
  const x = (dx / COS_30 + dy / SIN_30) / 2;
  const z = (dy / SIN_30 - dx / COS_30) / 2;
  return { x, y: z };
};

export const calculateSunPosition = (minutesOfDay: number): SunPosition => {
  const t = Math.max(0, Math.min(1, (minutesOfDay - 480) / 600));
  const elevation = Math.sin(t * Math.PI) * (Math.PI / 2 - 0.1) + 0.1;
  const azimuth = (t - 0.5) * Math.PI * 0.8;
  return { elevation, azimuth };
};

export const getBuildingCorners = (building: Building): { base: Point3D[]; top: Point3D[] } => {
  const { x, z, width, depth, height } = building;
  const hw = width / 2;
  const hd = depth / 2;

  const base: Point3D[] = [
    { x: x - hw, y: 0, z: z - hd },
    { x: x + hw, y: 0, z: z - hd },
    { x: x + hw, y: 0, z: z + hd },
    { x: x - hw, y: 0, z: z + hd },
  ];

  const top: Point3D[] = base.map((p) => ({ ...p, y: height }));

  return { base, top };
};

export const calculateShadowPolygon = (
  building: Building,
  sun: SunPosition,
): ShadowPolygon | null => {
  if (sun.elevation <= 0.05) return null;

  const { base, top } = getBuildingCorners(building);
  const shadowLength = building.height / Math.tan(sun.elevation);
  const dx = -Math.sin(sun.azimuth) * shadowLength;
  const dz = -Math.cos(sun.azimuth) * shadowLength;

  const topShadow: Point3D[] = top.map((p) => ({
    x: p.x + dx,
    y: 0,
    z: p.z + dz,
  }));

  const polygon3D: Point3D[] = [...base, ...topShadow];
  const points: Point2D[] = polygon3D.map((p) => projectToIso(p));

  return { points, buildingId: building.id };
};

export const calculateBuildingHighlights = (
  building: Building,
  sun: SunPosition,
): HighlightArea[] => {
  const highlights: HighlightArea[] = [];
  if (sun.elevation <= 0.05) return highlights;

  const { material, height, width, depth } = building;

  const sunDirX = Math.sin(sun.azimuth) * Math.cos(sun.elevation);
  const sunDirY = Math.sin(sun.elevation);
  const sunDirZ = Math.cos(sun.azimuth) * Math.cos(sun.elevation);

  const faceNormals: Point3D[] = [
    { x: 0, y: 0, z: -1 },
    { x: 1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: -1, y: 0, z: 0 },
  ];

  const { base, top } = getBuildingCorners(building);

  faceNormals.forEach((normal, faceIdx) => {
    const dotProduct = normal.x * sunDirX + normal.y * sunDirY + normal.z * sunDirZ;
    if (dotProduct <= 0) return;

    const intensity = Math.min(1, dotProduct);

    if (material === 'glass') {
      const faceTop: Point3D[] = [];
      const faceBase: Point3D[] = [];

      if (faceIdx === 0) {
        faceBase.push(base[0], base[1]);
        faceTop.push(top[0], top[1]);
      } else if (faceIdx === 1) {
        faceBase.push(base[1], base[2]);
        faceTop.push(top[1], top[2]);
      } else if (faceIdx === 2) {
        faceBase.push(base[2], base[3]);
        faceTop.push(top[2], top[3]);
      } else {
        faceBase.push(base[3], base[0]);
        faceTop.push(top[3], top[0]);
      }

      const allFacePoints = [...faceBase, ...faceTop];
      const isoPoints = allFacePoints.map((p) => projectToIso(p));

      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      isoPoints.forEach((p) => {
        minX = Math.min(minX, p.x);
        maxX = Math.max(maxX, p.x);
        minY = Math.min(minY, p.y);
        maxY = Math.max(maxY, p.y);
      });

      highlights.push({
        type: 'glass',
        position: { x: (minX + maxX) / 2, y: (minY + maxY) / 2 },
        size: { w: Math.max(10, (maxX - minX) * 0.7), h: Math.max(10, (maxY - minY) * 0.7) },
        opacity: 0.3 + intensity * 0.4,
        faceNormal: normal,
      });
    } else if (material === 'metal') {
      const topCenter = projectToIso({
        x: building.x,
        y: height,
        z: building.z,
      });

      const highlightW = width * ISO_SCALE * 0.25;
      const highlightH = depth * ISO_SCALE * 0.25;

      highlights.push({
        type: 'metal',
        position: { x: topCenter.x, y: topCenter.y + height * ISO_SCALE * 0.2 },
        size: { w: highlightW, h: highlightH },
        opacity: 0.4 + intensity * 0.3,
        rotation: sun.azimuth,
        faceNormal: { x: 0, y: 1, z: 0 },
      });
    }
  });

  return highlights;
};

export const formatTime = (minutesOfDay: number): string => {
  const hours = Math.floor(minutesOfDay / 60);
  const minutes = Math.floor(minutesOfDay % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export const toDegrees = (radians: number): number => (radians * 180) / Math.PI;
