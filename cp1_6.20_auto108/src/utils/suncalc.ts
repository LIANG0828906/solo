import * as THREE from 'three';
import type { SunPosition } from '../types';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function julianDay(date: Date): number {
  const y = date.getUTCFullYear();
  const m = date.getUTCMonth() + 1;
  const d = date.getUTCDate() + date.getUTCHours() / 24 + date.getUTCMinutes() / 1440;
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  return d + Math.floor((153 * mm + 2) / 5) + 365 * yy + Math.floor(yy / 4) - Math.floor(yy / 100) + Math.floor(yy / 400) - 32045;
}

function toJulianCentury(JD: number): number {
  return (JD - 2451545.0) / 36525.0;
}

function sunGeometricMeanLongitude(T: number): number {
  let L0 = 280.46646 + T * (36000.76983 + T * 0.0003032);
  L0 = ((L0 % 360) + 360) % 360;
  return L0 * DEG;
}

function sunMeanAnomaly(T: number): number {
  let M = 357.52911 + T * (35999.05029 - T * 0.0001537);
  M = ((M % 360) + 360) % 360;
  return M * DEG;
}

function sunEquationOfCenter(T: number): number {
  const M = sunMeanAnomaly(T);
  const C =
    Math.sin(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) +
    Math.sin(2 * M) * (0.019993 - 0.000101 * T) +
    Math.sin(3 * M) * 0.000289;
  return C * DEG;
}

function sunTrueLongitude(T: number): number {
  return sunGeometricMeanLongitude(T) + sunEquationOfCenter(T);
}

function sunApparentLongitude(T: number): number {
  const trueLong = sunTrueLongitude(T);
  const omega = (125.04 - 1934.136 * T) * DEG;
  const lambda = trueLong - 0.00569 * DEG - 0.00478 * DEG * Math.sin(omega);
  return lambda;
}

function meanObliquityOfEcliptic(T: number): number {
  const seconds = 21.448 - T * (46.815 + T * (0.00059 - T * 0.001813));
  return (23 + (26 + seconds / 60) / 60) * DEG;
}

function obliquityCorrected(T: number): number {
  const e0 = meanObliquityOfEcliptic(T);
  const omega = (125.04 - 1934.136 * T) * DEG;
  return e0 + 0.00256 * DEG * Math.cos(omega);
}

function sunDeclination(T: number): number {
  const e = obliquityCorrected(T);
  const lambda = sunApparentLongitude(T);
  const sinDec = Math.sin(e) * Math.sin(lambda);
  return Math.asin(sinDec);
}

function equationOfTime(T: number): number {
  const epsilon = obliquityCorrected(T);
  const l0 = sunGeometricMeanLongitude(T);
  const e = Math.tan(epsilon / 2) ** 2;
  const m = sunMeanAnomaly(T);
  const y = e;
  const sin2l0 = Math.sin(2 * l0);
  const sinm = Math.sin(m);
  const cos2l0 = Math.cos(2 * l0);
  const sin4l0 = Math.sin(4 * l0);
  const sin2m = Math.sin(2 * m);
  let Etime =
    y * sin2l0 -
    2 * 0.0167086 * sinm +
    4 * 0.0167086 * y * sinm * cos2l0 -
    0.5 * y * y * sin4l0 -
    1.25 * 0.0167086 * 0.0167086 * sin2m;
  Etime = Etime * RAD * 4;
  return Etime;
}

interface SunAngles {
  altitude: number;
  azimuth: number;
}

function calculateSolarAngles(
  date: Date,
  hourDecimal: number,
  lat: number,
  lon: number
): SunAngles {
  const workingDate = new Date(date);
  workingDate.setUTCHours(Math.floor(hourDecimal), Math.round((hourDecimal % 1) * 60), 0, 0);

  const JD = julianDay(workingDate);
  const T = toJulianCentury(JD);

  const delta = sunDeclination(T);
  const E = equationOfTime(T);

  const solarTime = ((hourDecimal * 60 + E + 4 * lon) % 1440 + 1440) % 1440;
  let hourAngle = (solarTime / 4 - 180) * DEG;

  const latRad = lat * DEG;
  const sinAlt = Math.sin(latRad) * Math.sin(delta) + Math.cos(latRad) * Math.cos(delta) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAlt)));

  let cosAz =
    (Math.sin(delta) - Math.sin(latRad) * Math.sin(altitude)) /
    (Math.cos(latRad) * Math.cos(altitude) || 1e-9);
  cosAz = Math.max(-1, Math.min(1, cosAz));

  let azimuth;
  if (hourAngle > 0) {
    azimuth = Math.acos(cosAz);
  } else {
    azimuth = 2 * Math.PI - Math.acos(cosAz);
  }

  return { altitude, azimuth };
}

export function getSunPosition(
  date: Date,
  hourDecimal: number,
  latitude: number = 40.0,
  longitude: number = 116.4
): SunPosition {
  const { altitude, azimuth } = calculateSolarAngles(date, hourDecimal, latitude, longitude);

  const r = 200;
  const x = r * Math.cos(altitude) * Math.sin(azimuth);
  const y = r * Math.sin(altitude);
  const z = r * Math.cos(altitude) * Math.cos(azimuth);

  const vector3 = new THREE.Vector3(x, y, z);
  const direction = new THREE.Vector3(-x, -y, -z).normalize();

  return { altitude, azimuth, vector3, direction };
}

export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatHour(hourDecimal: number): string {
  const h = Math.floor(hourDecimal);
  const m = Math.round((hourDecimal - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
