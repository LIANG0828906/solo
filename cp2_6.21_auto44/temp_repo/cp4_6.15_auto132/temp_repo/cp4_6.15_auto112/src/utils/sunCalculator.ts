const degToRad = (deg: number): number => deg * Math.PI / 180;
const radToDeg = (rad: number): number => rad * 180 / Math.PI;

function getJulianDay(dayOfYear: number): number {
  return 2451545.0 + dayOfYear - 1.5;
}

function getSunDeclination(dayOfYear: number): number {
  const jd = getJulianDay(dayOfYear);
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = degToRad((357.528 + 0.9856003 * n) % 360);
  const lambda = degToRad(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  const epsilon = degToRad(23.439 - 0.0000004 * n);
  return Math.asin(Math.sin(epsilon) * Math.sin(lambda));
}

function getEquationOfTime(dayOfYear: number): number {
  const jd = getJulianDay(dayOfYear);
  const n = jd - 2451545.0;
  const L = (280.460 + 0.9856474 * n) % 360;
  const g = degToRad((357.528 + 0.9856003 * n) % 360);
  const lambda = degToRad(L + 1.915 * Math.sin(g) + 0.020 * Math.sin(2 * g));
  const epsilon = degToRad(23.439 - 0.0000004 * n);
  const alpha = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
  const eot = L - radToDeg(alpha);
  return eot * 4;
}

function getSolarTime(hour: number, longitude: number, eotMinutes: number): number {
  const solarTime = hour + (longitude / 15) + (eotMinutes / 60);
  return solarTime;
}

function getHourAngle(solarTime: number): number {
  return degToRad((solarTime - 12) * 15);
}

export function calculateSunPosition(
  dayOfYear: number,
  hour: number,
  latitude: number,
  longitude: number
): {
  azimuth: number;
  altitude: number;
  directionVector: [number, number, number];
} {
  const declination = getSunDeclination(dayOfYear);
  const eotMinutes = getEquationOfTime(dayOfYear);
  const solarTime = getSolarTime(hour, longitude, eotMinutes);
  const hourAngle = getHourAngle(solarTime);

  const latRad = degToRad(latitude);

  const sinAltitude = Math.sin(latRad) * Math.sin(declination) +
    Math.cos(latRad) * Math.cos(declination) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));

  const cosAzimuth = (Math.sin(declination) * Math.cos(latRad) -
    Math.cos(declination) * Math.sin(latRad) * Math.cos(hourAngle)) /
    Math.cos(altitude);
  const sinAzimuth = -Math.cos(declination) * Math.sin(hourAngle) / Math.cos(altitude);

  let azimuth = Math.atan2(sinAzimuth, cosAzimuth);
  if (azimuth < 0) {
    azimuth += 2 * Math.PI;
  }

  const cosAlt = Math.cos(altitude);
  const sinAlt = Math.sin(altitude);
  const x = -Math.sin(azimuth) * cosAlt;
  const y = sinAlt;
  const z = -Math.cos(azimuth) * cosAlt;

  return {
    azimuth,
    altitude,
    directionVector: [x, y, z],
  };
}

export function isDaytime(altitude: number): boolean {
  return altitude > 0;
}
