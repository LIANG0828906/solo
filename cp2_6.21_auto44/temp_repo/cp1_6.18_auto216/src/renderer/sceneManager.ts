import type { Building } from '@/data/buildingModel';
import { interpolate } from '@/analytics/solarSim';

export interface TransitionTarget {
  id: string;
  position: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  colorHex: string;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function buildTransitionTargets(buildings: Building[]): Map<string, TransitionTarget> {
  const map = new Map<string, TransitionTarget>();
  for (const b of buildings) {
    map.set(b.id, {
      id: b.id,
      position: { ...b.position },
      scale: { x: b.dimensions.width, y: b.dimensions.height, z: b.dimensions.depth },
      colorHex: b.energyLevel,
    });
  }
  return map;
}

export interface AnimatedValue {
  from: number;
  to: number;
  start: number;
  duration: number;
}

export function animateValue(av: AnimatedValue, now: number): number {
  if (now <= av.start) return av.from;
  if (now >= av.start + av.duration) return av.to;
  const t = (now - av.start) / av.duration;
  return interpolate(av.from, av.to, t);
}

export interface BuildingAnimationState {
  id: string;
  posX: AnimatedValue;
  posY: AnimatedValue;
  posZ: AnimatedValue;
  scaleX: AnimatedValue;
  scaleY: AnimatedValue;
  scaleZ: AnimatedValue;
}

export function createBuildingAnimations(
  currentState: Map<string, { x: number; y: number; z: number; sx: number; sy: number; sz: number }>,
  targets: Building[],
  startTime: number,
  duration: number
): BuildingAnimationState[] {
  const anims: BuildingAnimationState[] = [];
  const byId = new Map(targets.map((b) => [b.id, b]));
  for (const [id, cur] of currentState) {
    const target = byId.get(id);
    if (!target) continue;
    anims.push({
      id,
      posX: { from: cur.x, to: target.position.x, start: startTime, duration },
      posY: { from: cur.y, to: target.position.y, start: startTime, duration },
      posZ: { from: cur.z, to: target.position.z, start: startTime, duration },
      scaleX: { from: cur.sx, to: target.dimensions.width, start: startTime, duration },
      scaleY: { from: cur.sy, to: target.dimensions.height, start: startTime, duration },
      scaleZ: { from: cur.sz, to: target.dimensions.depth, start: startTime, duration },
    });
  }
  return anims;
}

export interface CameraPreset {
  position: [number, number, number];
  target: [number, number, number];
}

export const CAMERA_PRESETS: Record<'default' | 'top' | 'side', CameraPreset> = {
  default: {
    position: [0, 25 * Math.sin(Math.PI / 6), 25 * Math.cos(Math.PI / 6)],
    target: [0, 0, 0],
  },
  top: {
    position: [0, 32, 0.01],
    target: [0, 0, 0],
  },
  side: {
    position: [25, 12, 0],
    target: [0, 3, 0],
  },
};
