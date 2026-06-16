export const CAUCHY_A = 1.5;
export const CAUCHY_B = 0.005;
export const CAUCHY_C = 0.0002;

export function cauchyRefractiveIndex(
  wavelengthNm: number,
  A: number = CAUCHY_A,
  B: number = CAUCHY_B,
  C: number = CAUCHY_C
): number {
  const lambdaUm = wavelengthNm / 1000;
  const lambda2 = lambdaUm * lambdaUm;
  const lambda4 = lambda2 * lambda2;
  return A + B / lambda2 + C / lambda4;
}

export function refractVector(
  lx: number, ly: number, lz: number,
  nx: number, ny: number, nz: number,
  n1: number, n2: number
): { rx: number; ry: number; rz: number; tir: boolean } {
  const ratio = n1 / n2;
  const cosI1 = -(lx * nx + ly * ny + lz * nz);
  const sin2I1 = 1 - cosI1 * cosI1;
  const sin2I2 = ratio * ratio * sin2I1;
  if (sin2I2 > 1) {
    return { rx: 0, ry: 0, rz: 0, tir: true };
  }
  const cosI2 = Math.sqrt(1 - sin2I2);
  const k = ratio * cosI1 - cosI2;
  return {
    rx: ratio * lx + k * nx,
    ry: ratio * ly + k * ny,
    rz: ratio * lz + k * nz,
    tir: false
  };
}

export function intersectSphere(
  ox: number, oy: number, oz: number,
  dx: number, dy: number, dz: number,
  cx: number, cy: number, cz: number,
  r: number
): { t: number; px: number; py: number; pz: number } | null {
  const fx = ox - cx;
  const fy = oy - cy;
  const fz = oz - cz;
  const a = dx * dx + dy * dy + dz * dz;
  const b = 2 * (fx * dx + fy * dy + fz * dz);
  const c = fx * fx + fy * fy + fz * fz - r * r;
  const discriminant = b * b - 4 * a * c;
  if (discriminant < 0) return null;
  const sqrtD = Math.sqrt(discriminant);
  const t1 = (-b - sqrtD) / (2 * a);
  const t2 = (-b + sqrtD) / (2 * a);
  let t: number;
  if (t1 > 1e-6 && t2 > 1e-6) {
    t = Math.min(t1, t2);
  } else if (t1 > 1e-6) {
    t = t1;
  } else if (t2 > 1e-6) {
    t = t2;
  } else {
    return null;
  }
  return {
    t,
    px: ox + dx * t,
    py: oy + dy * t,
    pz: oz + dz * t
  };
}

export function normalize3(x: number, y: number, z: number): [number, number, number] {
  const len = Math.sqrt(x * x + y * y + z * z);
  if (len < 1e-12) return [0, 0, 0];
  return [x / len, y / len, z / len];
}

export function degToRad(deg: number): number {
  return deg * Math.PI / 180;
}

export function radToDeg(rad: number): number {
  return rad * 180 / Math.PI;
}
