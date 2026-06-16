import type {
  Lens,
  LightSource,
  RaySegment,
  TraceResult,
  OpticalSurface,
  InitialRay
} from '../../types/optical';
import {
  CAUCHY_A,
  CAUCHY_B,
  CAUCHY_C,
  cauchyRefractiveIndex,
  degToRad,
  normalize3
} from '../../utils/opticsFormulas';

export const WAVELENGTHS: number[] = [400, 450, 500, 550, 600, 650, 700];
export const RAY_COUNT = 50;

const FIELD_MIN = -30;
const FIELD_MAX = 30;
const DEFAULT_SCREEN_Z_OFFSET = 100;

function buildOpticalSurfaces(lenses: Lens[]): OpticalSurface[] {
  const surfaces: OpticalSurface[] = [];
  let currentZ = 0;
  let prevN = 1.0;
  const sorted = [...lenses].sort((a, b) => a.positionZ - b.positionZ);
  for (const lens of sorted) {
    for (let i = 0; i < lens.surfaces.length; i++) {
      const s = lens.surfaces[i];
      const isLastSurface = i === lens.surfaces.length - 1;
      const nextN = isLastSurface ? 1.0 : (lens.surfaces[i + 1]?.refractiveIndex || 1.0);
      const surfaceZ = lens.positionZ + currentZ;
      const curvature = Math.abs(s.radius) < 1e-6 ? 0 : 1 / s.radius;
      surfaces.push({
        z: surfaceZ,
        radius: s.radius,
        curvature,
        aperture: lens.aperture,
        n1: prevN,
        n2: i === 0 ? s.refractiveIndex : nextN,
        cauchyA: CAUCHY_A,
        cauchyB: CAUCHY_B,
        cauchyC: CAUCHY_C
      });
      currentZ += s.thickness;
      prevN = i === 0 ? s.refractiveIndex : nextN;
    }
  }
  return surfaces.sort((a, b) => a.z - b.z);
}

export function generateInitialRays(
  lightSource: LightSource,
  rayCount: number = RAY_COUNT,
  fieldAngles?: number[]
): InitialRay[] {
  const rays: InitialRay[] = [];
  const wavelengths = lightSource.wavelengths.length > 0 ? lightSource.wavelengths : WAVELENGTHS;
  const angles: number[] = fieldAngles && fieldAngles.length > 0
    ? fieldAngles
    : Array.from({ length: rayCount }, (_, i) => {
        if (rayCount === 1) return 0;
        return FIELD_MIN + (FIELD_MAX - FIELD_MIN) * (i / (rayCount - 1));
      });
  const ox = lightSource.position.x;
  const oy = lightSource.position.y;
  const oz = lightSource.position.z;
  for (const angleDeg of angles) {
    const angleRad = degToRad(angleDeg);
    const sinA = Math.sin(angleRad);
    const cosA = Math.cos(angleRad);
    const [dx, dy, dz] = normalize3(sinA, 0, cosA);
    for (const wl of wavelengths) {
      rays.push({
        origin: [ox, oy, oz],
        direction: [dx, dy, dz],
        wavelength: wl,
        fieldAngle: angleDeg
      });
    }
  }
  return rays;
}

function intersectSurface(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  surf: OpticalSurface
): { t: number; px: number; py: number; pz: number; nx: number; ny: number; nz: number } | null {
  const R = surf.radius;
  const z0 = surf.z;
  if (Math.abs(R) < 1e-6 || Math.abs(surf.curvature) < 1e-6) {
    if (Math.abs(dz) < 1e-12) return null;
    const t = (z0 - oz) / dz;
    if (t <= 1e-6) return null;
    const px = ox + dx * t;
    const py = oy + dy * t;
    const pz = oz + dz * t;
    if (Math.sqrt(px * px + py * py) > surf.aperture) return null;
    const nz = R < 0 ? -1 : 1;
    return { t, px, py, pz, nx: 0, ny: 0, nz };
  }
  const cx = 0;
  const cy = 0;
  const cz = z0 + R;
  const fx = ox - cx;
  const fy = oy - cy;
  const fz = oz - cz;
  const a = dx * dx + dy * dy + dz * dz;
  const b = 2 * (fx * dx + fy * dy + fz * dz);
  const c = fx * fx + fy * fy + fz * fz - R * R;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const sqrtD = Math.sqrt(disc);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);
  let t = Infinity;
  if (t1 > 1e-6) t = t1;
  if (t2 > 1e-6 && t2 < t) t = t2;
  if (!isFinite(t)) return null;
  const px = ox + dx * t;
  const py = oy + dy * t;
  const pz = oz + dz * t;
  if (Math.sqrt(px * px + py * py) > surf.aperture) return null;
  const sign = R > 0 ? 1 : -1;
  const vx = px - cx;
  const vy = py - cy;
  const vz = pz - cz;
  const vlen = Math.sqrt(vx * vx + vy * vy + vz * vz);
  if (vlen < 1e-12) return { t, px, py, pz, nx: 0, ny: 0, nz: sign };
  return {
    t, px, py, pz,
    nx: sign * vx / vlen,
    ny: sign * vy / vlen,
    nz: sign * vz / vlen
  };
}

export function traceSingleRay(
  origin: [number, number, number],
  direction: [number, number, number],
  wavelength: number,
  opticalSurfaces: OpticalSurface[],
  screenZ: number
): RaySegment[] {
  const segments: RaySegment[] = [];
  let ox = origin[0], oy = origin[1], oz = origin[2];
  let dx = direction[0], dy = direction[1], dz = direction[2];
  const dlen = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (dlen < 1e-12) return segments;
  dx /= dlen; dy /= dlen; dz /= dlen;
  for (const surf of opticalSurfaces) {
    if (surf.z <= oz && dz <= 0) continue;
    if (surf.z >= oz && dz >= 0) {
      const hit = intersectSurface(ox, oy, oz, dx, dy, dz, surf);
      if (!hit) continue;
      segments.push({
        start: [ox, oy, oz],
        end: [hit.px, hit.py, hit.pz],
        wavelength
      });
      const n1 = surf.n1 === 1.0 ? 1.0 : cauchyRefractiveIndex(wavelength, surf.cauchyA, surf.cauchyB, surf.cauchyC);
      const n2 = surf.n2 === 1.0 ? 1.0 : cauchyRefractiveIndex(wavelength, surf.cauchyA, surf.cauchyB, surf.cauchyC);
      const ratio = n1 / n2;
      const cosI1 = -(dx * hit.nx + dy * hit.ny + dz * hit.nz);
      const sin2I1 = 1 - cosI1 * cosI1;
      const sin2I2 = ratio * ratio * sin2I1;
      if (sin2I2 > 1) return segments;
      const cosI2 = Math.sqrt(1 - sin2I2);
      const k = ratio * cosI1 - cosI2;
      const rdx = ratio * dx + k * hit.nx;
      const rdy = ratio * dy + k * hit.ny;
      const rdz = ratio * dz + k * hit.nz;
      const rlen = Math.sqrt(rdx * rdx + rdy * rdy + rdz * rdz);
      if (rlen < 1e-12) return segments;
      dx = rdx / rlen; dy = rdy / rlen; dz = rdz / rlen;
      ox = hit.px; oy = hit.py; oz = hit.pz;
    }
  }
  if (Math.abs(dz) < 1e-12) {
    const tFar = 1000;
    segments.push({
      start: [ox, oy, oz],
      end: [ox + dx * tFar, oy + dy * tFar, oz + dz * tFar],
      wavelength
    });
    return segments;
  }
  const tScreen = (screenZ - oz) / dz;
  if (tScreen > 1e-6) {
    segments.push({
      start: [ox, oy, oz],
      end: [ox + dx * tScreen, oy + dy * tScreen, screenZ],
      wavelength
    });
  } else {
    const tFar = 1000;
    segments.push({
      start: [ox, oy, oz],
      end: [ox + dx * tFar, oy + dy * tFar, oz + dz * tFar],
      wavelength
    });
  }
  return segments;
}

export function traceAllRays(
  lenses: Lens[],
  lightSource: LightSource
): TraceResult {
  const opticalSurfaces = buildOpticalSurfaces(lenses);
  const lastSurfZ = opticalSurfaces.length