import type { Season } from "./oceanCurrents";

export interface TemperaturePoint {
  lat: number;
  lng: number;
  temp: number;
}

export const GRID_LNG = 20;
export const GRID_LAT = 10;

function latIndexToLat(i: number): number {
  return 90 - (i / (GRID_LAT - 1)) * 180;
}

function lngIndexToLng(j: number): number {
  return -180 + (j / (GRID_LNG - 1)) * 360;
}

function baseTemperature(lat: number, lng: number): number {
  const equatorBias = Math.cos((lat * Math.PI) / 180);
  const base = -10 + 40 * equatorBias;
  const oceanMod = Math.sin((lng * Math.PI) / 60) * 3;
  return base + oceanMod;
}

function seasonOffset(lat: number, season: Season): number {
  const hemisphere = lat >= 0 ? 1 : -1;
  const latFactor = Math.cos((lat * Math.PI) / 180);
  switch (season) {
    case "summer":
      return hemisphere * 12 * latFactor;
    case "winter":
      return -hemisphere * 12 * latFactor;
    case "spring":
      return hemisphere * 4 * latFactor;
    case "autumn":
      return -hemisphere * 4 * latFactor;
  }
}

export function getTemperatureGrid(season: Season): TemperaturePoint[] {
  const points: TemperaturePoint[] = [];
  for (let i = 0; i < GRID_LAT; i++) {
    for (let j = 0; j < GRID_LNG; j++) {
      const lat = latIndexToLat(i);
      const lng = lngIndexToLng(j);
      const base = baseTemperature(lat, lng);
      const offset = seasonOffset(lat, season);
      const noise = ((i * 7 + j * 13) % 5) - 2;
      const temp = Math.max(-10, Math.min(30, base + offset + noise * 0.6));
      points.push({ lat, lng, temp: Math.round(temp * 10) / 10 });
    }
  }
  return points;
}

export { latIndexToLat, lngIndexToLng };
