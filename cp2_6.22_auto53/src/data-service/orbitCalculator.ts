export interface OrbitParams {
  altitude: number;
  velocity: number;
  inclination: number;
  raan: number;
  eccentricity: number;
  argumentOfPerigee: number;
  trueAnomaly: number;
  period: number;
  orbitPath: { x: number; y: number }[];
}

export interface OrbitPosition {
  stationPosition: { x: number; y: number };
  spacecraftPosition: { x: number; y: number };
  timestamp: number;
}

const EARTH_RADIUS = 6371;
const GRAVITATIONAL_CONSTANT = 398600.4418;
const DEFAULT_ALTITUDE = 408;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

export function calculateOrbitParams(
  semiMajorAxisKm: number = EARTH_RADIUS + DEFAULT_ALTITUDE
): OrbitParams {
  const semiMajorAxisMeters = semiMajorAxisKm * 1000;
  const periodSeconds =
    2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxisMeters, 3) / (GRAVITATIONAL_CONSTANT * 1e9));
  const period = periodSeconds / 60;
  const velocity =
    Math.sqrt(GRAVITATIONAL_CONSTANT * 1e9 / semiMajorAxisMeters) / 1000;
  const inclination = 51.64;
  const raan = (Date.now() / 100000) % 360;
  const eccentricity = 0.0003;
  const argumentOfPerigee = 180 + Math.random() * 20 - 10;
  const trueAnomaly = (Date.now() / 30000) % 360;
  const orbitPath = generateOrbitPathPoints(100, {
    altitude: DEFAULT_ALTITUDE,
    velocity,
    inclination,
    raan,
    eccentricity,
    argumentOfPerigee,
    trueAnomaly,
    period,
    orbitPath: []
  });
  return {
    altitude: DEFAULT_ALTITUDE,
    velocity: Number(velocity.toFixed(3)),
    inclination: Number(inclination.toFixed(2)),
    raan: Number(raan.toFixed(2)),
    eccentricity: Number(eccentricity.toFixed(5)),
    argumentOfPerigee: Number(argumentOfPerigee.toFixed(2)),
    trueAnomaly: Number(trueAnomaly.toFixed(2)),
    period: Number(period.toFixed(2)),
    orbitPath
  };
}

export function generateOrbitPathPoints(
  count: number,
  params: OrbitParams
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const scale = 0.8;
  const centerX = 0;
  const centerY = 0;
  const a = 1 * scale;
  const b = a * Math.sqrt(1 - params.eccentricity * params.eccentricity);
  const apAngle = toRadians(params.argumentOfPerigee);
  for (let i = 0; i < count; i++) {
    const theta = (i / count) * Math.PI * 2;
    const r =
      (a * (1 - params.eccentricity * params.eccentricity)) /
      (1 + params.eccentricity * Math.cos(theta));
    const x0 = r * Math.cos(theta);
    const y0 = r * Math.sin(theta);
    const x =
      centerX + x0 * Math.cos(apAngle) - y0 * Math.sin(apAngle);
    const y =
      centerY + x0 * Math.sin(apAngle) + y0 * Math.cos(apAngle);
    points.push({ x: Number(x.toFixed(4)), y: Number(y.toFixed(4)) });
  }
  return points;
}

export function getPositionOnOrbit(
  timestamp: number,
  params: OrbitParams
): { x: number; y: number } {
  const trueAnomalyRad = toRadians(params.trueAnomaly + (timestamp / 30000) % 360);
  const scale = 0.8;
  const a = 1 * scale;
  const apAngle = toRadians(params.argumentOfPerigee);
  const r =
    (a * (1 - params.eccentricity * params.eccentricity)) /
    (1 + params.eccentricity * Math.cos(trueAnomalyRad));
  const x0 = r * Math.cos(trueAnomalyRad);
  const y0 = r * Math.sin(trueAnomalyRad);
  return {
    x: Number((x0 * Math.cos(apAngle) - y0 * Math.sin(apAngle)).toFixed(4)),
    y: Number((x0 * Math.sin(apAngle) + y0 * Math.cos(apAngle)).toFixed(4))
  };
}
