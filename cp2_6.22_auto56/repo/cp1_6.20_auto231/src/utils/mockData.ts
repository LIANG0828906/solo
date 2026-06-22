import type { LightDataPoint } from "../types";
import { classifyLevel, mapIntensityToColor } from "./colorMapper";

export function generateMockData(count: number = 500): LightDataPoint[] {
  const centerLat = 31.2304;
  const centerLng = 121.4737;
  const spread = 0.12;

  const raw: { lat: number; lng: number; intensity: number }[] = [];
  let minI = Infinity;
  let maxI = -Infinity;

  for (let i = 0; i < count; i++) {
    const r = Math.random() * spread;
    const theta = Math.random() * Math.PI * 2;
    const lat = centerLat + r * Math.cos(theta) * 0.7;
    const lng = centerLng + r * Math.sin(theta);

    const dist = Math.sqrt(
      Math.pow((lat - centerLat) / spread, 2) +
        Math.pow((lng - centerLng) / spread, 2)
    );
    const centerBoost = Math.max(0, 1 - dist * 1.5);
    const randomJitter = Math.random();

    const intensity = 0.5 + centerBoost * 3.5 + randomJitter * 1.2;
    raw.push({ lat, lng, intensity });
    if (intensity < minI) minI = intensity;
    if (intensity > maxI) maxI = intensity;
  }

  const range = maxI - minI || 1;
  const worldSize = 200;

  const allLats = raw.map((p) => p.lat);
  const allLngs = raw.map((p) => p.lng);
  const latMin = Math.min(...allLats);
  const latMax = Math.max(...allLats);
  const lngMin = Math.min(...allLngs);
  const lngMax = Math.max(...allLngs);
  const latRange = latMax - latMin || 1;
  const lngRange = lngMax - lngMin || 1;

  return raw.map((p, idx) => {
    const normalizedIntensity = (p.intensity - minI) / range;
    const x = ((p.lng - lngMin) / lngRange - 0.5) * worldSize;
    const z = ((p.lat - latMin) / latRange - 0.5) * worldSize;
    const color = mapIntensityToColor(normalizedIntensity, "default");

    return {
      id: `pt_${idx.toString().padStart(5, "0")}`,
      latitude: Number(p.lat.toFixed(5)),
      longitude: Number(p.lng.toFixed(5)),
      intensity: Number(p.intensity.toFixed(3)),
      normalizedIntensity: Number(normalizedIntensity.toFixed(4)),
      level: classifyLevel(normalizedIntensity),
      position: { x, y: 0, z },
      color,
    };
  });
}

export function generateSampleCSV(count: number = 200): string {
  const rows = ["latitude,longitude,intensity"];
  const data = generateMockData(count);
  for (const p of data) {
    rows.push(`${p.latitude},${p.longitude},${p.intensity}`);
  }
  return rows.join("\n");
}

export function downloadSampleCSV() {
  const csv = generateSampleCSV(300);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sample-light-pollution-data.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
