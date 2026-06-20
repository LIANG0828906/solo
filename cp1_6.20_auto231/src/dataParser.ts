import Papa from "papaparse";
import type { DataSummary, LightDataPoint } from "./types";
import { classifyLevel, mapIntensityToColor } from "./utils/colorMapper";

export interface ParseResult {
  success: boolean;
  data?: LightDataPoint[];
  summary?: DataSummary;
  error?: string;
}

interface RawRow {
  latitude?: string | number;
  longitude?: string | number;
  intensity?: string | number;
  lat?: string | number;
  lng?: string | number;
  value?: string | number;
}

export async function parseCSVFile(file: File): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const parsed = processRows(results.data as RawRow[]);
          resolve(parsed);
        } catch (e) {
          resolve({
            success: false,
            error: e instanceof Error ? e.message : "数据处理失败",
          });
        }
      },
      error: (err: Papa.ParseError) => {
        resolve({ success: false, error: `CSV解析错误: ${err.message}` });
      },
    });
  });
}

export async function parseCSVContent(content: string): Promise<ParseResult> {
  return new Promise((resolve) => {
    Papa.parse<RawRow>(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => {
        try {
          const parsed = processRows(results.data as RawRow[]);
          resolve(parsed);
        } catch (e) {
          resolve({
            success: false,
            error: e instanceof Error ? e.message : "数据处理失败",
          });
        }
      },
      error: (err: Papa.ParseError) => {
        resolve({ success: false, error: `CSV解析错误: ${err.message}` });
      },
    });
  });
}

function processRows(rows: RawRow[]): ParseResult {
  if (!rows || rows.length === 0) {
    return { success: false, error: "CSV文件为空" };
  }

  const validRows: {
    lat: number;
    lng: number;
    intensity: number;
  }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const latVal =
      row.latitude !== undefined ? row.latitude : row.lat;
    const lngVal =
      row.longitude !== undefined ? row.longitude : row.lng;
    const intVal =
      row.intensity !== undefined ? row.intensity : row.value;

    if (
      latVal === undefined ||
      lngVal === undefined ||
      intVal === undefined
    ) {
      continue;
    }

    const lat = Number(latVal);
    const lng = Number(lngVal);
    const intensity = Number(intVal);

    if (Number.isNaN(lat) || Number.isNaN(lng) || Number.isNaN(intensity)) {
      continue;
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      continue;
    }
    if (intensity < 0) {
      continue;
    }

    validRows.push({ lat, lng, intensity });
  }

  if (validRows.length === 0) {
    return {
      success: false,
      error: "未找到有效数据行，请确认CSV包含 latitude, longitude, intensity 列",
    };
  }

  let minI = Infinity;
  let maxI = -Infinity;
  let latMin = Infinity;
  let latMax = -Infinity;
  let lngMin = Infinity;
  let lngMax = -Infinity;

  for (const r of validRows) {
    if (r.intensity < minI) minI = r.intensity;
    if (r.intensity > maxI) maxI = r.intensity;
    if (r.lat < latMin) latMin = r.lat;
    if (r.lat > latMax) latMax = r.lat;
    if (r.lng < lngMin) lngMin = r.lng;
    if (r.lng > lngMax) lngMax = r.lng;
  }

  const intensityRange = maxI - minI || 1;
  const latRange = latMax - latMin || 1;
  const lngRange = lngMax - lngMin || 1;
  const worldSize = 200;

  const data: LightDataPoint[] = validRows.map((r, idx) => {
    const normalizedIntensity = (r.intensity - minI) / intensityRange;
    const x = ((r.lng - lngMin) / lngRange - 0.5) * worldSize;
    const z = ((r.lat - latMin) / latRange - 0.5) * worldSize;
    const color = mapIntensityToColor(normalizedIntensity, "default");

    return {
      id: `pt_${idx.toString().padStart(5, "0")}`,
      latitude: Number(r.lat.toFixed(5)),
      longitude: Number(r.lng.toFixed(5)),
      intensity: Number(r.intensity.toFixed(3)),
      normalizedIntensity: Number(normalizedIntensity.toFixed(4)),
      level: classifyLevel(normalizedIntensity),
      position: { x, y: 0, z },
      color,
    };
  });

  return {
    success: true,
    data,
    summary: {
      totalPoints: data.length,
      latRange: { min: Number(latMin.toFixed(4)), max: Number(latMax.toFixed(4)) },
      lngRange: { min: Number(lngMin.toFixed(4)), max: Number(lngMax.toFixed(4)) },
      intensityRange: {
        min: Number(minI.toFixed(3)),
        max: Number(maxI.toFixed(3)),
      },
    },
  };
}
