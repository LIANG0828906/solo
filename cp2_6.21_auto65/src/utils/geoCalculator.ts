const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const MINUTES_PER_DAY = 1440;
const MINUTES_PER_HOUR = 60;
const DEGREES_PER_HOUR = 15;
const MINUTES_PER_DEGREE = 4;
const SUNRISE_SUNSET_ALTITUDE = -0.833;

function toRad(deg: number): number {
  return deg * DEG_TO_RAD;
}

function toDeg(rad: number): number {
  return rad * RAD_TO_DEG;
}

function normalizeLon(lon: number): number {
  let result = lon;
  while (result > 180) result -= 360;
  while (result < -180) result += 360;
  return result;
}

function formatTime(totalMinutes: number): string {
  let minutes = Math.round(totalMinutes);
  minutes = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hours = Math.floor(minutes / MINUTES_PER_HOUR);
  const mins = minutes % MINUTES_PER_HOUR;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}

export function calcSunPosition(time: number, sunDeclination: number = 0): { lat: number; lon: number } {
  const hoursFromNoon = (time - 12 * MINUTES_PER_HOUR) / MINUTES_PER_HOUR;
  const lon = normalizeLon(hoursFromNoon * DEGREES_PER_HOUR);
  return { lat: sunDeclination, lon };
}

export function calcLocalTime(_lat: number, lon: number, sunLon: number): string {
  const lonDiff = lon - sunLon;
  const minutesDiff = lonDiff * MINUTES_PER_DEGREE;
  const localMinutes = 12 * MINUTES_PER_HOUR + minutesDiff;
  return formatTime(localMinutes);
}

export function calcSunriseSunset(
  lat: number,
  lon: number,
  _time: number,
  sunDeclination: number,
): { sunrise: string; sunset: string; dayLength: string } {
  const latRad = toRad(lat);
  const decRad = toRad(sunDeclination);
  const altRad = toRad(SUNRISE_SUNSET_ALTITUDE);

  const cosH = (Math.sin(altRad) - Math.sin(latRad) * Math.sin(decRad)) / (Math.cos(latRad) * Math.cos(decRad));

  if (cosH <= -1) {
    return { sunrise: "极昼", sunset: "极昼", dayLength: "极昼" };
  }
  if (cosH >= 1) {
    return { sunrise: "极夜", sunset: "极夜", dayLength: "极夜" };
  }

  const hourAngleDeg = toDeg(Math.acos(cosH));
  const noonMinutes = 12 * MINUTES_PER_HOUR;
  const hourAngleMinutes = (hourAngleDeg / DEGREES_PER_HOUR) * MINUTES_PER_HOUR;

  const lonDiff = lon - calcSunPosition(_time, sunDeclination).lon;
  const lonOffsetMinutes = lonDiff * MINUTES_PER_DEGREE;

  const sunriseMinutes = noonMinutes - hourAngleMinutes + lonOffsetMinutes;
  const sunsetMinutes = noonMinutes + hourAngleMinutes + lonOffsetMinutes;
  const dayLengthMinutes = 2 * hourAngleMinutes;

  return {
    sunrise: formatTime(sunriseMinutes),
    sunset: formatTime(sunsetMinutes),
    dayLength: formatTime(dayLengthMinutes),
  };
}
