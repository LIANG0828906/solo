export interface MagneticFieldResult {
  intensity: number;
  inclination: number;
  declination: number;
  direction: {
    x: number;
    y: number;
    z: number;
  };
}

const EARTH_RADIUS = 6371.2;

const GNM = [
  { n: 1, m: 0, g: -29404.8, h: 0.0 },
  { n: 1, m: 1, g: -1450.9, h: 4652.5 },
  { n: 2, m: 0, g: -2445.1, h: 0.0 },
  { n: 2, m: 1, g: 3012.5, h: -2845.6 },
  { n: 2, m: 2, g: 1676.6, h: -642.0 },
  { n: 3, m: 0, g: 1350.6, h: 0.0 },
  { n: 3, m: 1, g: -2352.3, h: -115.3 },
  { n: 3, m: 2, g: 1225.6, h: 245.2 },
  { n: 3, m: 3, g: 582.0, h: -538.3 },
];

function factorial(n: number): number {
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

function associatedLegendre(n: number, m: number, x: number): number {
  if (m > n || m < 0) return 0;
  let pmm = 1.0;
  const somx2 = Math.sqrt((1.0 - x) * (1.0 + x));
  for (let i = 1; i <= m; i++) {
    pmm *= -somx2 * (2 * i - 1);
  }
  if (n === m) return pmm;
  let pmmp1 = x * (2 * m + 1) * pmm;
  if (n === m + 1) return pmmp1;
  let pll = 0.0;
  for (let ll = m + 2; ll <= n; ll++) {
    pll = ((2 * ll - 1) * x * pmmp1 - (ll + m - 1) * pmm) / (ll - m);
    pmm = pmmp1;
    pmmp1 = pll;
  }
  return pll;
}

function schmidtQuasiNormalized(n: number, m: number): number {
  if (m === 0) return 1.0;
  const factor = (2.0 * factorial(n - m)) / factorial(n + m);
  return Math.sqrt(factor);
}

export function calculateMagneticField(
  latDeg: number,
  lonDeg: number,
  altKm: number = 0,
  reversalFactor: number = 1.0
): MagneticFieldResult {
  const lat = (latDeg * Math.PI) / 180.0;
  const lon = (lonDeg * Math.PI) / 180.0;
  const r = EARTH_RADIUS + altKm;
  const theta = Math.PI / 2 - lat;
  const phi = lon;

  let Bx = 0.0;
  let By = 0.0;
  let Bz = 0.0;

  for (const coef of GNM) {
    const { n, m, g, h } = coef;
    const schmidt = schmidtQuasiNormalized(n, m);
    const pnm = associatedLegendre(n, m, Math.cos(theta)) * schmidt;
    const pnmp1 = associatedLegendre(n, m + 1, Math.cos(theta)) * schmidtQuasiNormalized(n, m + 1);

    const rFactor = Math.pow(EARTH_RADIUS / r, n + 2);
    const cosMphi = Math.cos(m * phi);
    const sinMphi = Math.sin(m * phi);

    const gCosHSin = g * cosMphi + h * sinMphi;
    const gSinHCos = g * sinMphi - h * cosMphi;

    Bx -= rFactor * (gCosHSin * pnmp1 - m * (Math.cos(theta) / Math.sin(theta)) * gCosHSin * pnm);
    By += rFactor * m * gSinHCos * (1.0 / Math.sin(theta)) * pnm;
    Bz -= rFactor * (n + 1) * gCosHSin * pnm;
  }

  Bx *= 1e-9 * reversalFactor;
  By *= 1e-9 * reversalFactor;
  Bz *= 1e-9 * reversalFactor;

  const Bnorth = -Bx;
  const Beast = By;
  const Bdown = -Bz;

  const intensity = Math.sqrt(Bnorth * Bnorth + Beast * Beast + Bdown * Bdown);
  const inclination = Math.atan2(Bdown, Math.sqrt(Bnorth * Bnorth + Beast * Beast)) * (180.0 / Math.PI);
  const declination = Math.atan2(Beast, Bnorth) * (180.0 / Math.PI);

  const latRad = (latDeg * Math.PI) / 180.0;
  const lonRad = (lonDeg * Math.PI) / 180.0;
  const sinLat = Math.sin(latRad);
  const cosLat = Math.cos(latRad);
  const sinLon = Math.sin(lonRad);
  const cosLon = Math.cos(lonRad);

  const dirX = -sinLat * cosLon * Bnorth - sinLon * Beast + cosLat * cosLon * Bdown;
  const dirY = -sinLat * sinLon * Bnorth + cosLon * Beast + cosLat * sinLon * Bdown;
  const dirZ = cosLat * Bnorth + sinLat * Bdown;

  const dirLen = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);

  return {
    intensity: intensity * 1e9,
    inclination,
    declination,
    direction: {
      x: dirX / dirLen,
      y: dirY / dirLen,
      z: dirZ / dirLen,
    },
  };
}

export function latLonToVector(latDeg: number, lonDeg: number, radius: number): { x: number; y: number; z: number } {
  const lat = (latDeg * Math.PI) / 180.0;
  const lon = (lonDeg * Math.PI) / 180.0;
  return {
    x: radius * Math.cos(lat) * Math.cos(lon),
    y: radius * Math.sin(lat),
    z: radius * Math.cos(lat) * Math.sin(lon),
  };
}

export function vectorToLatLon(x: number, y: number, z: number): { lat: number; lon: number } {
  const r = Math.sqrt(x * x + y * y + z * z);
  const lat = Math.asin(y / r) * (180.0 / Math.PI);
  const lon = Math.atan2(z, x) * (180.0 / Math.PI);
  return { lat, lon };
}

export function getFieldLinePoints(
  startLat: number,
  startLon: number,
  startAlt: number,
  steps: number = 200,
  stepSize: number = 50,
  reversalFactor: number = 1.0
): { x: number; y: number; z: number; intensity: number }[] {
  const points: { x: number; y: number; z: number; intensity: number }[] = [];
  const r = EARTH_RADIUS + startAlt;
  let pos = latLonToVector(startLat, startLon, r);
  let px = pos.x;
  let py = pos.y;
  let pz = pos.z;

  for (let i = 0; i < steps; i++) {
    const dist = Math.sqrt(px * px + py * py + pz * pz);
    const alt = dist - EARTH_RADIUS;

    if (alt < 0 || alt > 5000) break;

    const latLon = vectorToLatLon(px, py, pz);
    const field = calculateMagneticField(latLon.lat, latLon.lon, alt, reversalFactor);

    points.push({
      x: px,
      y: py,
      z: pz,
      intensity: field.intensity,
    });

    const dir = field.direction;
    px += dir.x * stepSize;
    py += dir.y * stepSize;
    pz += dir.z * stepSize;
  }

  return points;
}

export function generateFieldLines(
  count: number = 30,
  steps: number = 150,
  reversalFactor: number = 1.0
): { points: { x: number; y: number; z: number; intensity: number }[]; intensity: number }[] {
  const lines: { points: { x: number; y: number; z: number; intensity: number }[]; intensity: number }[] = [];

  for (let i = 0; i < count; i++) {
    const lat = -80 + (i / (count - 1)) * 160;
    const lon = (i % 5) * 72;
    const points = getFieldLinePoints(lat, lon, 100, steps, 40, reversalFactor);
    
    if (points.length > 10) {
      const avgIntensity = points.reduce((sum, p) => sum + p.intensity, 0) / points.length;
      lines.push({ points, intensity: avgIntensity });
    }
  }

  return lines;
}
