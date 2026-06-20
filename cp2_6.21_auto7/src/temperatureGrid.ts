export interface TemperatureGrid {
  resolution: { width: number; height: number };
  data: Array<{ lon: number; lat: number; temperature: number }>;
  minTemp: number;
  maxTemp: number;
}

const RESOLUTION = { width: 20, height: 10 };
const LON_START = -180;
const LON_STEP = 18;
const LAT_START = -81;
const LAT_STEP = 18;

function isWarmCurrent(lon: number, lat: number): boolean {
  if (lon >= -85 && lon <= -55 && lat >= 15 && lat <= 45) return true;
  if (lon >= 125 && lon <= 155 && lat >= 10 && lat <= 40) return true;
  if (lon >= 45 && lon <= 75 && lat >= 5 && lat <= 30) return true;
  if (lon >= -10 && lon <= 20 && lat >= 20 && lat <= 60) return true;
  if (lon >= -170 && lon <= -140 && lat >= -10 && lat <= 20) return true;
  if (lon >= 110 && lon <= 140 && lat >= -35 && lat <= -10) return true;
  if (lon >= -10 && lon <= 20 && lat >= -35 && lat <= 5) return true;
  return false;
}

function isColdCurrent(lon: number, lat: number): boolean {
  if (lon >= -135 && lon <= -105 && lat >= 30 && lat <= 60) return true;
  if (lon >= 140 && lon <= 170 && lat >= 30 && lat <= 60) return true;
  if (lon >= -25 && lon <= 5 && lat >= 5 && lat <= 35) return true;
  if (lon >= 65 && lon <= 95 && lat >= -20 && lat <= 10) return true;
  if (lon >= -85 && lon <= -55 && lat >= -40 && lat <= -10) return true;
  if (lon >= 10 && lon <= 40 && lat >= -35 && lat <= -5) return true;
  if (lon >= -170 && lon <= -140 && lat >= 50 && lat <= 75) return true;
  return false;
}

function getSeasonalOffset(lat: number, season: string): number {
  const isNorthern = lat > 0;
  const absLat = Math.abs(lat);
  const latFactor = absLat / 81;

  switch (season) {
    case 'spring':
      return isNorthern
        ? Math.sin(latFactor * Math.PI) * 3
        : Math.sin(latFactor * Math.PI) * 3;
    case 'summer':
      return isNorthern
        ? 8 * latFactor
        : -4 * latFactor;
    case 'autumn':
      return isNorthern
        ? -3 * latFactor
        : 3 * latFactor;
    case 'winter':
      return isNorthern
        ? -8 * latFactor
        : 4 * latFactor;
    default:
      return 0;
  }
}

function clampTemp(temp: number): number {
  return Math.max(-10, Math.min(30, temp));
}

export function getTemperatureGrid(season: string): TemperatureGrid {
  const data: Array<{ lon: number; lat: number; temperature: number }> = [];
  let minTemp = Infinity;
  let maxTemp = -Infinity;

  for (let y = 0; y < RESOLUTION.height; y++) {
    const lat = LAT_START + y * LAT_STEP;
    const latFactor = Math.cos((lat * Math.PI) / 180);
    const baseTemp = 28 * latFactor - 5;

    for (let x = 0; x < RESOLUTION.width; x++) {
      const lon = LON_START + x * LON_STEP;

      let temp = baseTemp;

      temp += getSeasonalOffset(lat, season);

      if (isWarmCurrent(lon, lat)) {
        temp += 2 + Math.random() * 2;
      } else if (isColdCurrent(lon, lat)) {
        temp -= 2 + Math.random() * 2;
      }

      temp += (Math.random() - 0.5) * 1;

      temp = clampTemp(temp);

      data.push({ lon, lat, temperature: Math.round(temp * 10) / 10 });

      if (temp < minTemp) minTemp = temp;
      if (temp > maxTemp) maxTemp = temp;
    }
  }

  return {
    resolution: RESOLUTION,
    data,
    minTemp: Math.round(minTemp * 10) / 10,
    maxTemp: Math.round(maxTemp * 10) / 10,
  };
}
