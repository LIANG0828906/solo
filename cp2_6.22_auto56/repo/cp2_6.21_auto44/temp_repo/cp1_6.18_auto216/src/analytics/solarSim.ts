import * as THREE from 'three';
import type { Building, SolarResult } from '@/data/buildingModel';

interface SunPosition {
  x: number;
  y: number;
  z: number;
  color: THREE.Color;
  intensity: number;
}

export function calculateSunPosition(hour: number): SunPosition {
  const t = Math.max(0, Math.min(1, (hour - 8) / 10));
  const angle = Math.PI * (1 - t);
  const radius = 35;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;
  const z = -8 + t * 4;
  const color = getSunColor(t);
  const intensity = 0.4 + Math.sin(angle) * 0.8;
  return { x, y, z, color, intensity };
}

export function getSunColor(t: number): THREE.Color {
  const stops = [
    { pos: 0, color: new THREE.Color('#FFD699') },
    { pos: 0.35, color: new THREE.Color('#FFCC80') },
    { pos: 0.7, color: new THREE.Color('#FF6B35') },
    { pos: 1, color: new THREE.Color('#C2185B') },
  ];
  let i = 0;
  while (i < stops.length - 2 && t > stops[i + 1].pos) i++;
  const range = stops[i + 1].pos - stops[i].pos;
  const localT = (t - stops[i].pos) / range;
  return stops[i].color.clone().lerp(stops[i + 1].color, localT);
}

export function getSunCSSColor(hour: number): string {
  const t = Math.max(0, Math.min(1, (hour - 8) / 10));
  const color = getSunColor(t);
  return `#${color.getHexString()}`;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function computeFaceExposure(
  bPosX: number,
  bPosZ: number,
  bWidth: number,
  bDepth: number,
  bHeight: number,
  sunX: number,
  sunY: number,
  sunZ: number,
  allBuildings: Building[],
  selfId: string
): Record<'east' | 'west' | 'south' | 'north' | 'top', number> {
  const dirToSun = new THREE.Vector3(sunX - bPosX, sunY - bHeight / 2, sunZ - bPosZ).normalize();
  const northDot = dirToSun.dot(new THREE.Vector3(0, 0, -1));
  const southDot = dirToSun.dot(new THREE.Vector3(0, 0, 1));
  const eastDot = dirToSun.dot(new THREE.Vector3(1, 0, 0));
  const westDot = dirToSun.dot(new THREE.Vector3(-1, 0, 0));
  const topDot = dirToSun.dot(new THREE.Vector3(0, 1, 0));
  let base = {
    north: Math.max(0, northDot),
    south: Math.max(0, southDot),
    east: Math.max(0, eastDot),
    west: Math.max(0, westDot),
    top: Math.max(0.3, topDot),
  };
  for (const other of allBuildings) {
    if (other.id === selfId) continue;
    const dx = other.position.x - bPosX;
    const dz = other.position.z - bPosZ;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 8) continue;
    const otherTop = other.position.y + other.dimensions.height / 2;
    if (otherTop < bHeight) continue;
    const toSun = new THREE.Vector3(sunX - bPosX, 0, sunZ - bPosZ).normalize();
    const toOther = new THREE.Vector3(dx, 0, dz).normalize();
    const dot = toSun.dot(toOther);
    if (dot > 0.6) {
      const shadowFactor = 0.3 * (1 - dist / 8);
      const keys: Array<keyof typeof base> = ['north', 'south', 'east', 'west'];
      for (const k of keys) {
        base[k] = Math.max(0, base[k] - shadowFactor);
      }
      base.top = Math.max(0.3, base.top - shadowFactor * 0.4);
    }
  }
  return base;
}

export function calculateSolar(hour: number, buildings: Building[]): SolarResult[] {
  const sun = calculateSunPosition(hour);
  const results: SolarResult[] = [];
  const t = Math.max(0, Math.min(1, (hour - 8) / 10));
  const daylightCurve = Math.sin(t * Math.PI);
  for (const b of buildings) {
    const brightness = computeFaceExposure(
      b.position.x,
      b.position.z,
      b.dimensions.width,
      b.dimensions.depth,
      b.dimensions.height,
      sun.x,
      sun.y,
      sun.z,
      buildings,
      b.id
    );
    const avg =
      (brightness.north + brightness.south + brightness.east + brightness.west + brightness.top * 1.2) / 5.2;
    const intensity = 0.3 + avg * 0.7;
    const baseDaylight = daylightCurve * 100;
    const heightBonus = Math.min(20, b.dimensions.height * 2);
    const daylight = Math.min(100, baseDaylight * 0.7 + heightBonus + intensity * 10);
    results.push({
      buildingId: b.id,
      sunIntensity: easeInOutCubic(intensity),
      daylightHours: Math.round(daylight * 10) / 10,
      surfaceBrightness: brightness,
    });
  }
  return results;
}

export function getDaylightPercent(building: Building, hour: number, buildings: Building[]): number {
  const results = calculateSolar(hour, buildings);
  const r = results.find((x) => x.buildingId === building.id);
  return r ? r.daylightHours : 0;
}

export function generateDaylightCurveData(building: Building, buildings: Building[]): Array<{ hour: number; value: number }> {
  const points: Array<{ hour: number; value: number }> = [];
  for (let h = 8; h <= 18; h += 0.5) {
    points.push({ hour: h, value: getDaylightPercent(building, h, buildings) });
  }
  return points;
}

export function interpolate(a: number, b: number, t: number): number {
  return lerp(a, b, easeInOutCubic(t));
}
