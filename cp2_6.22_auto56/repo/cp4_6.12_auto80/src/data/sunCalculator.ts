export interface SunPosition {
  altitude: number;
  azimuth: number;
  vector: { x: number; y: number; z: number };
}

export interface DateTimeInput {
  dayOfYear: number;
  hours: number;
}

const degToRad = (deg: number): number => (deg * Math.PI) / 180;
const radToDeg = (rad: number): number => (rad * 180) / Math.PI;

export function calculateSunPosition(dateTime: DateTimeInput): SunPosition {
  const { dayOfYear, hours } = dateTime;

  const latitude = degToRad(39.9);

  const declination = degToRad(
    23.45 * Math.sin(degToRad((360 / 365) * (dayOfYear - 81)))
  );

  const hourAngle = degToRad((hours - 12) * 15);

  const sinAltitude =
    Math.sin(latitude) * Math.sin(declination) +
    Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle);

  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));

  const cosAzimuth =
    (Math.sin(declination) * Math.cos(latitude) -
      Math.cos(declination) * Math.sin(latitude) * Math.cos(hourAngle)) /
    Math.cos(altitude);

  const sinAzimuth =
    (-Math.cos(declination) * Math.sin(hourAngle)) / Math.cos(altitude);

  let azimuth = Math.atan2(sinAzimuth, cosAzimuth);
  if (azimuth < 0) {
    azimuth += 2 * Math.PI;
  }

  const distance = 100;
  const x = distance * Math.cos(altitude) * Math.sin(azimuth);
  const y = Math.max(0, distance * Math.sin(altitude));
  const z = distance * Math.cos(altitude) * Math.cos(azimuth);

  return {
    altitude: radToDeg(altitude),
    azimuth: radToDeg(azimuth),
    vector: { x, y, z },
  };
}

export function dayOfYearToDate(dayOfYear: number, year: number = 2025): string {
  const date = new Date(year, 0, 1);
  date.setDate(dayOfYear);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function hoursToTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
