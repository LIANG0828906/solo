import type { SunPosition } from '@/types';

const DEFAULT_LATITUDE = 39.9;
const SUNRISE_COLOR = { r: 255, g: 140, b: 66 };
const NOON_COLOR = { r: 255, g: 255, b: 255 };

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function toDegrees(radians: number): number {
  return (radians * 180) / Math.PI;
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getJulianDay(date: Date): number {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

function interpolateColor(t: number): string {
  const clamped = Math.max(0, Math.min(1, t));
  const r = Math.round(SUNRISE_COLOR.r + (NOON_COLOR.r - SUNRISE_COLOR.r) * clamped);
  const g = Math.round(SUNRISE_COLOR.g + (NOON_COLOR.g - SUNRISE_COLOR.g) * clamped);
  const b = Math.round(SUNRISE_COLOR.b + (NOON_COLOR.b - SUNRISE_COLOR.b) * clamped);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
}

export function calculateSunPosition(
  date: Date,
  hours: number,
  minutes: number,
  latitude: number = DEFAULT_LATITUDE
): SunPosition {
  const N = getDayOfYear(date);
  const JD = getJulianDay(date);
  const T = (JD - 2451545.0) / 36525.0;
  const L0 = toRadians((280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360);
  const M = toRadians((357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360);
  const C = toRadians(
    ((1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M) +
      (0.019993 - 0.000101 * T) * Math.sin(2 * M) +
      0.000289 * Math.sin(3 * M)) % 360
  );
  const sunLong = L0 + C;
  const epsilon = toRadians(
    23 +
      (26 + (21.448 - 46.815 * T - 0.00059 * T * T + 0.001813 * T * T * T) / 60) / 60
  );
  const declination = toDegrees(Math.asin(Math.sin(epsilon) * Math.sin(sunLong)));

  const declinationAlt = 23.45 * Math.sin(toRadians((360 / 365) * (284 + N)));
  const finalDeclination = isNaN(declination) ? declinationAlt : declination;

  const solarNoon = 12;
  const ST = hours + minutes / 60;
  const H = 15 * (ST - solarNoon);

  const phi = toRadians(latitude);
  const delta = toRadians(finalDeclination);
  const H_rad = toRadians(H);

  const sinAlpha = Math.sin(phi) * Math.sin(delta) + Math.cos(phi) * Math.cos(delta) * Math.cos(H_rad);
  const altitude = toDegrees(Math.asin(Math.max(-1, Math.min(1, sinAlpha))));

  let azimuth = 0;
  if (altitude <= -90) {
    azimuth = H > 0 ? 270 : 90;
  } else {
    const alpha = toRadians(altitude);
    const cosA = (Math.sin(delta) - Math.sin(alpha) * Math.sin(phi)) / (Math.cos(alpha) * Math.cos(phi));
    azimuth = toDegrees(Math.acos(Math.max(-1, Math.min(1, cosA))));
    if (H > 0) {
      azimuth = 360 - azimuth;
    }
  }

  const maxAltitude = 90 - Math.abs(latitude - finalDeclination);
  const altitudeRatio = maxAltitude > 0 ? Math.max(0, altitude / maxAltitude) : 0;
  const timeProgress = Math.abs(ST - 12) / 12;
  const colorT = 1 - timeProgress;
  const color = interpolateColor(altitude < 0 ? 0 : Math.max(colorT, altitudeRatio));

  let lightIntensity: number;
  if (altitude < 0) {
    lightIntensity = 0.1;
  } else {
    const t = altitude / 90;
    lightIntensity = 0.2 + (1.3 - 0.2) * Math.min(1, t * 2);
  }

  return {
    azimuth: isNaN(azimuth) ? 180 : azimuth,
    altitude,
    color,
    lightIntensity,
  };
}

export function getSeasonLabel(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const isNear = (m: number, d: number, range: number = 1) => {
    if (month !== m) return false;
    return Math.abs(day - d) <= range;
  };

  if (isNear(3, 21)) return '春分';
  if (isNear(6, 21)) return '夏至';
  if (isNear(9, 23)) return '秋分';
  if (isNear(12, 22)) return '冬至';

  if (month >= 3 && month <= 5) return '春';
  if (month >= 6 && month <= 8) return '夏';
  if (month >= 9 && month <= 11) return '秋';
  return '冬';
}
