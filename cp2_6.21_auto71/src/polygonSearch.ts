import type { POI, SearchResult } from './types';

const AZIMUTH_MAPPINGS: Array<{ angle: number; text: string }> = [
  { angle: 0, text: 'N' },
  { angle: 22.5, text: 'NNE' },
  { angle: 45, text: 'NE' },
  { angle: 67.5, text: 'ENE' },
  { angle: 90, text: 'E' },
  { angle: 112.5, text: 'ESE' },
  { angle: 135, text: 'SE' },
  { angle: 157.5, text: 'SSE' },
  { angle: 180, text: 'S' },
  { angle: 202.5, text: 'SSW' },
  { angle: 225, text: 'SW' },
  { angle: 247.5, text: 'WSW' },
  { angle: 270, text: 'W' },
  { angle: 292.5, text: 'WNW' },
  { angle: 315, text: 'NW' },
  { angle: 337.5, text: 'NNW' },
];

function calculateDistance(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function calculateAzimuth(
  [lat1, lng1]: [number, number],
  [lat2, lng2]: [number, number]
): number {
  const dLng = toRad(lng2 - lng1);
  const y = Math.sin(dLng) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLng);
  let azimuth = toDeg(Math.atan2(y, x));
  azimuth = (azimuth + 360) % 360;
  return azimuth;
}

function toRad(deg: number): number {
  return deg * Math.PI / 180;
}

function toDeg(rad: number): number {
  return rad * 180 / Math.PI;
}

function getAzimuthText(azimuth: number): string {
  let closest = AZIMUTH_MAPPINGS[0];
  let minDiff = Math.abs(azimuth - closest.angle);
  
  for (const mapping of AZIMUTH_MAPPINGS) {
    let diff = Math.abs(azimuth - mapping.angle);
    diff = Math.min(diff, 360 - diff);
    if (diff < minDiff) {
      minDiff = diff;
      closest = mapping;
    }
  }
  
  return closest.text;
}

function isAngleInSector(
  angle: number,
  startAngle: number,
  angleRange: number
): boolean {
  if (angleRange >= 360) {
    return true;
  }
  
  const normalizedAngle = (angle + 360) % 360;
  const normalizedStart = (startAngle + 360) % 360;
  const endAngle = (normalizedStart + angleRange) % 360;
  
  if (normalizedStart < endAngle) {
    return normalizedAngle >= normalizedStart && normalizedAngle < endAngle;
  } else {
    return normalizedAngle >= normalizedStart || normalizedAngle < endAngle;
  }
}

export function searchInSector(
  pois: POI[],
  center: [number, number],
  radius: number,
  startAngle: number,
  angleRange: number
): SearchResult[] {
  const results: SearchResult[] = [];
  
  for (const poi of pois) {
    const distance = calculateDistance(center, [poi.lat, poi.lng]);
    
    if (distance > radius) {
      continue;
    }
    
    const azimuth = calculateAzimuth(center, [poi.lat, poi.lng]);
    
    if (!isAngleInSector(azimuth, startAngle, angleRange)) {
      continue;
    }
    
    results.push({
      poi,
      distance: Math.round(distance),
      azimuth,
      azimuthText: getAzimuthText(azimuth),
    });
  }
  
  results.sort((a, b) => a.distance - b.distance);
  
  return results;
}

export function generateSectorPath(
  center: [number, number],
  radius: number,
  startAngle: number,
  angleRange: number
): Array<[number, number]> {
  if (angleRange >= 360) {
    const circlePoints: Array<[number, number]> = [];
    for (let i = 0; i <= 72; i++) {
      const angle = (i / 72) * 360;
      circlePoints.push(getPointAtDistanceAndAngle(center, radius, angle));
    }
    return circlePoints;
  }
  
  const points: Array<[number, number]> = [center];
  const steps = Math.max(1, Math.ceil(angleRange / 5));
  
  for (let i = 0; i <= steps; i++) {
    const angle = startAngle + (i / steps) * angleRange;
    points.push(getPointAtDistanceAndAngle(center, radius, angle));
  }
  
  points.push(center);
  return points;
}

function getPointAtDistanceAndAngle(
  center: [number, number],
  distance: number,
  angle: number
): [number, number] {
  const R = 6371000;
  const lat1 = toRad(center[0]);
  const lng1 = toRad(center[1]);
  const bearing = toRad(angle);
  const d = distance / R;
  
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
    Math.cos(lat1) * Math.sin(d) * Math.cos(bearing)
  );
  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  );
  
  return [toDeg(lat2), toDeg(lng2)];
}
