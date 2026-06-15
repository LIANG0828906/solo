import * as d3 from 'd3';

export interface TimeSlice {
  time: number;
  positions: Float32Array;
  values: Float32Array;
}

export interface DataBounds {
  centerLon: number;
  centerLat: number;
  spanLon: number;
  spanLat: number;
}

interface RawRow {
  timestamp: string;
  latitude: string;
  longitude: string;
  flow: string;
}

function parseTimeToMinutes(ts: string): number {
  const date = new Date(ts);
  if (isNaN(date.getTime())) {
    const parts = ts.trim().split(/[\s:]+/);
    if (parts.length >= 3) {
      const h = parseInt(parts[parts.length - 3], 10);
      const m = parseInt(parts[parts.length - 2], 10);
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m;
    }
    return 0;
  }
  return date.getHours() * 60 + date.getMinutes();
}

function minutesToSlice(minutes: number, sliceMinutes: number): number {
  return Math.floor(minutes / sliceMinutes);
}

export function parseCSV(csvText: string): TimeSlice[] {
  const parsed = d3.csvParse(csvText.trim()) as unknown as RawRow[];
  const sliceMinutes = 30;
  const totalSlices = 48;

  const rows = parsed
    .map((r) => ({
      lat: parseFloat(r.latitude),
      lon: parseFloat(r.longitude),
      flow: parseFloat(r.flow),
      minutes: parseTimeToMinutes(r.timestamp),
    }))
    .filter((r) => !isNaN(r.lat) && !isNaN(r.lon) && !isNaN(r.flow) && !isNaN(r.minutes));

  if (rows.length === 0) return [];

  const lons = rows.map((r) => r.lon);
  const lats = rows.map((r) => r.lat);
  const centerLon = (d3.min(lons)! + d3.max(lons)!) / 2;
  const centerLat = (d3.min(lats)! + d3.max(lats)!) / 2;
  const spanLon = d3.max(lons)! - d3.min(lons)! || 0.01;
  const spanLat = d3.max(lats)! - d3.min(lats)! || 0.01;

  const scale = 18 / Math.max(spanLon, spanLat);

  const grouped: Map<number, Array<{ x: number; z: number; flow: number }>> = new Map();
  for (let i = 0; i < totalSlices; i++) grouped.set(i, []);

  for (const r of rows) {
    const si = Math.min(minutesToSlice(r.minutes, sliceMinutes), totalSlices - 1);
    const x = (r.lon - centerLon) * scale;
    const z = -(r.lat - centerLat) * scale;
    grouped.get(si)!.push({ x, z, flow: r.flow });
  }

  const slices: TimeSlice[] = [];
  for (let i = 0; i < totalSlices; i++) {
    const points = grouped.get(i)!;
    const count = points.length;
    const positions = new Float32Array(count * 3);
    const values = new Float32Array(count);

    for (let j = 0; j < count; j++) {
      positions[j * 3] = points[j].x;
      positions[j * 3 + 1] = 0;
      positions[j * 3 + 2] = points[j].z;
      values[j] = points[j].flow;
    }

    slices.push({ time: i, positions, values });
  }

  return slices;
}

export function getBounds(csvText: string): DataBounds {
  const parsed = d3.csvParse(csvText.trim()) as unknown as RawRow[];
  const rows = parsed
    .map((r) => ({ lat: parseFloat(r.latitude), lon: parseFloat(r.longitude) }))
    .filter((r) => !isNaN(r.lat) && !isNaN(r.lon));

  if (rows.length === 0) return { centerLon: 116.4, centerLat: 39.9, spanLon: 0.01, spanLat: 0.01 };

  const lons = rows.map((r) => r.lon);
  const lats = rows.map((r) => r.lat);
  return {
    centerLon: (d3.min(lons)! + d3.max(lons)!) / 2,
    centerLat: (d3.min(lats)! + d3.max(lats)!) / 2,
    spanLon: d3.max(lons)! - d3.min(lons)!,
    spanLat: d3.max(lats)! - d3.min(lats)!,
  };
}

export function createColorScale(threshold: number): (value: number) => [number, number, number] {
  const scale = d3
    .scaleLinear<string>()
    .domain([0, threshold / 3, (threshold * 2) / 3, threshold])
    .range(['#1e3a8a', '#06b6d4', '#f97316', '#ef4444'])
    .clamp(true);

  return (value: number): [number, number, number] => {
    const c = d3.rgb(scale(value));
    return [c.r / 255, c.g / 255, c.b / 255];
  };
}
