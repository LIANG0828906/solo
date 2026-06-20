import { Galaxy, createGalaxy } from './GalaxyState';

export interface GalaxyPreset {
  id: string;
  name: string;
  starCount: number;
  armDensity: number;
  centerX: number;
  centerY: number;
  vx: number;
  vy: number;
  color: string;
}

export interface CollisionData {
  id: string;
  timestamp: number;
  totalStars: number;
  collisionFrames: number;
  finalStarCount: number;
  galaxyData: {
    id: string;
    initialStarCount: number;
    finalStarCount: number;
    path: { x: number; y: number }[];
  }[];
}

const presetGalaxies: GalaxyPreset[] = [
  {
    id: 'spiral-a',
    name: '螺旋星系A',
    starCount: 200,
    armDensity: 1.2,
    centerX: 300,
    centerY: 400,
    vx: 1.0,
    vy: 0.2,
    color: '#64B5F6'
  },
  {
    id: 'spiral-b',
    name: '螺旋星系B',
    starCount: 180,
    armDensity: 0.9,
    centerX: 900,
    centerY: 400,
    vx: -1.0,
    vy: -0.2,
    color: '#F06292'
  },
  {
    id: 'elliptical',
    name: '椭圆星系',
    starCount: 250,
    armDensity: 0.5,
    centerX: 600,
    centerY: 300,
    vx: 0,
    vy: 0.5,
    color: '#FFE082'
  }
];

export function getGalaxyPreset(presetId: string): GalaxyPreset | undefined {
  return presetGalaxies.find(p => p.id === presetId);
}

export function getAllPresets(): GalaxyPreset[] {
  return [...presetGalaxies];
}

export function createGalaxyFromPreset(presetId: string, galaxyId: string): Galaxy | null {
  const preset = getGalaxyPreset(presetId);
  if (!preset) return null;

  return createGalaxy(
    galaxyId,
    preset.centerX,
    preset.centerY,
    preset.vx,
    preset.vy,
    preset.starCount,
    preset.armDensity,
    preset.color
  );
}

let savedCollisions: CollisionData[] = [];

export function saveCollisionData(data: Omit<CollisionData, 'id' | 'timestamp'>): CollisionData {
  const newData: CollisionData = {
    ...data,
    id: `collision-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now()
  };
  savedCollisions.push(newData);
  return newData;
}

export function getSavedCollisions(): CollisionData[] {
  return [...savedCollisions];
}

export function clearSavedCollisions(): void {
  savedCollisions = [];
}

export const ApiSimulator = {
  getGalaxyPreset,
  getAllPresets,
  createGalaxyFromPreset,
  saveCollisionData,
  getSavedCollisions,
  clearSavedCollisions
};

export default ApiSimulator;
