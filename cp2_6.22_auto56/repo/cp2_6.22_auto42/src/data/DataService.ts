// 数据服务接口：向Express后端发送请求，获取模拟数据

export interface DataPoint {
  timeStep: number;
  lat: number;
  lng: number;
  windSpeed: number;
  pressure: number;
  category: number;
}

export type DisasterLevel = 1 | 2 | 3;

export interface CityTimelineStep {
  windLevel: number;
  rainfall: number;
  disasterLevel: DisasterLevel;
  affectedPopulation: number;
}

export interface CityImpact {
  cityId: string;
  name: string;
  lat: number;
  lng: number;
  size: 'small' | 'large';
  timeline: CityTimelineStep[];
}

export interface HeatmapCell { lat: number; lng: number; intensity: number; }
export interface HeatmapGrid { timeStep: number; cells: HeatmapCell[]; }

const tryPorts = ['3001', '3002', '3003', '3004', '3005', '3006', '3007', '3008', '3009', '3010'];
const detectBase = async (): Promise<string> => {
  for (const p of tryPorts) {
    try {
      const url = `http://localhost:${p}/api/typhoon/path`;
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), 400);
      const r = await fetch(url, { signal: ctrl.signal }).catch(() => null);
      clearTimeout(id);
      if (r && r.ok) {
        const body = await r.json().catch(() => null);
        if (body && Array.isArray(body.data) && body.data.length > 0) {
          return `http://localhost:${p}/api`;
        }
      }
    } catch { /* ignore */ }
  }
  return 'http://localhost:3002/api';
};
let API_BASE: string | null = null;

async function baseURL(): Promise<string> {
  if (API_BASE) return API_BASE;
  // 环境变量优先
  const envBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;
  if (envBase) { API_BASE = envBase; return API_BASE; }
  API_BASE = await detectBase();
  return API_BASE;
}

async function getJSON<T>(path: string): Promise<T> {
  const base = await baseURL();
  const url = base + path;
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return (await res.json()) as T;
}

export class DataService {
  static async fetchPath(): Promise<DataPoint[]> {
    const r = await getJSON<{ data: DataPoint[] }>(`/typhoon/path`);
    return r.data;
  }

  static async fetchCities(): Promise<CityImpact[]> {
    const r = await getJSON<{ data: CityImpact[] }>(`/typhoon/cities`);
    return r.data;
  }

  static async fetchHeatmap(timeStep: number): Promise<HeatmapGrid> {
    const r = await getJSON<{ data: HeatmapGrid }>(`/typhoon/heatmap?time=${timeStep}`);
    return r.data;
  }
}
