import { scaleLinear } from 'd3-scale';
import { interpolateRgb } from 'd3-interpolate';

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export interface TemperatureGridPoint {
  lon: number;
  lat: number;
  temperature: number;
  color: RgbColor;
}

export interface TemperatureGrid {
  resolution: { width: number; height: number };
  data: TemperatureGridPoint[];
  minTemp: number;
  maxTemp: number;
}

const RESOLUTION = { width: 20, height: 10 };
const LON_START = -171;
const LON_STEP = 18;
const LAT_START = -81;
const LAT_STEP = 18;

export const temperatureColorScale = scaleLinear<string>()
  .domain([-10, 0, 10, 20, 30])
  .range(['#00008b', '#88ccff', '#ffcc00', '#ff4400', '#8b0000'])
  .interpolate(interpolateRgb as unknown as (a: string, b: string) => (t: number) => string);

function parseRgbString(rgbStr: string): RgbColor {
  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(rgbStr);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16) / 255,
      g: parseInt(hexMatch[2], 16) / 255,
      b: parseInt(hexMatch[3], 16) / 255,
    };
  }
  const rgbMatch = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/.exec(rgbStr);
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10) / 255,
      g: parseInt(rgbMatch[2], 10) / 255,
      b: parseInt(rgbMatch[3], 10) / 255,
    };
  }
  return { r: 0, g: 0, b: 0 };
}

function tempToColor(temp: number): RgbColor {
  const clamped = Math.max(-10, Math.min(30, temp));
  const colorStr = temperatureColorScale(clamped);
  return parseRgbString(colorStr);
}

function isWarmCurrent(lon: number, lat: number): boolean {
  if (lon >= -85 && lon <= -55 && lat >= 15 && lat <= 45) return true;
  if (lon >= 125 && lon <= 155 && lat >= 10 && lat <= 40) return true;
  if (lon >= 45 && lon <= 75 && lat >= 5 && lat <= 30) return true;
  if (lon >= -10 && lon <= 20 && lat >= 20 && lat <= 60) return true;
  if (lon >= -170 && lon <= -140 && lat >= -10 && lat <= 20) return true;
  if (lon >= 110 && lon <= 140 && lat >= -35 && lat <= -10) return true;
  if (lon >= -10 && lon <= 20 && lat >= -35 && lat <= 5) return true;
  if (lon >= 50 && lon <= 80 && lat >= -25 && lat <= -5) return true;
  if (lon >= -40 && lon <= -10 && lat >= -30 && lat <= -10) return true;
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
  if (lon >= 15 && lon <= 45 && lat >= 35 && lat <= 55) return true;
  if (lon >= -50 && lon <= -20 && lat >= 55 && lat <= 70) return true;
  return false;
}

function getSeasonalOffset(lat: number, season: string): number {
  const isNorthern = lat > 0;
  const absLat = Math.abs(lat);
  const latFactor = absLat / 81;
  const sinFactor = Math.sin(latFactor * Math.PI);

  switch (season) {
    case 'spring':
      return sinFactor * (isNorthern ? (2 + latFactor * 2) : (2 + latFactor * 2));
    case 'summer':
      return isNorthern
        ? 5 + latFactor * 5
        : -2 + latFactor * 7;
    case 'autumn':
      return isNorthern
        ? -2 + latFactor * 2
        : 2 + latFactor * 2;
    case 'winter':
      return isNorthern
        ? -5 - latFactor * 5
        : 2 + latFactor * 3;
    default:
      return 0;
  }
}

function clampTemp(temp: number): number {
  return Math.max(-10, Math.min(30, temp));
}

export function getTemperatureGrid(season: string): TemperatureGrid {
  const data: TemperatureGridPoint[] = [];
  let minTemp = Infinity;
  let maxTemp = -Infinity;

  for (let y = 0; y < RESOLUTION.height; y++) {
    const lat = LAT_START + y * LAT_STEP;
    const latFactor = Math.cos((lat * Math.PI) / 180);
    const baseTemp = 45.05 * latFactor - 17.05;

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

      const roundedTemp = Math.round(temp * 10) / 10;
      const color = tempToColor(roundedTemp);

      data.push({ lon, lat, temperature: roundedTemp, color });

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
