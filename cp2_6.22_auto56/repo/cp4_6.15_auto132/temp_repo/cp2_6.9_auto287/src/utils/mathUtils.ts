export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function sphericalToCartesian(
  azimuth: number,
  polar: number,
  radius: number
): [number, number, number] {
  const x = radius * Math.sin(polar) * Math.cos(azimuth);
  const y = radius * Math.cos(polar);
  const z = radius * Math.sin(polar) * Math.sin(azimuth);
  return [x, y, z];
}

export function cartesianToSpherical(
  x: number,
  y: number,
  z: number
): { azimuth: number; polar: number; radius: number } {
  const radius = Math.sqrt(x * x + y * y + z * z);
  const polar = Math.acos(clamp(y / radius, -1, 1));
  const azimuth = Math.atan2(z, x);
  return { azimuth, polar, radius };
}

export function calculateAltitude(cameraDirection: [number, number, number]): number {
  const length = Math.sqrt(
    cameraDirection[0] ** 2 + cameraDirection[1] ** 2 + cameraDirection[2] ** 2
  );
  const normalizedY = cameraDirection[1] / length;
  const altitude = (Math.asin(clamp(normalizedY, -1, 1)) * 180) / Math.PI;
  return Math.max(0, Math.min(90, altitude));
}

export function calculateAzimuth(cameraDirection: [number, number, number]): number {
  let azimuth = (Math.atan2(cameraDirection[2], cameraDirection[0]) * 180) / Math.PI;
  if (azimuth < 0) azimuth += 360;
  return azimuth;
}

export function distance2D(
  p1: [number, number, number],
  p2: [number, number, number]
): number {
  const dx = p1[0] - p2[0];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dz * dz);
}

export function distance3D(
  p1: [number, number, number],
  p2: [number, number, number]
): number {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  const dz = p1[2] - p2[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function normalizeAngle(angle: number): number {
  while (angle < 0) angle += 360;
  while (angle >= 360) angle -= 360;
  return angle;
}

export function getDirectionBetweenPoints(
  from: [number, number, number],
  to: [number, number, number]
): number {
  const dx = to[0] - from[0];
  const dz = to[2] - from[2];
  let angle = (Math.atan2(dz, dx) * 180) / Math.PI;
  angle = 90 - angle;
  return normalizeAngle(angle);
}

export function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

export function formatAltitude(altitude: number): string {
  const rounded = Math.round(altitude * 2) / 2;
  return `${rounded.toFixed(1)}°`;
}

export function getWindDirection(): number {
  return Math.random() * 360;
}

export function getWindSpeed(): number {
  return 2 + Math.random() * 6;
}
