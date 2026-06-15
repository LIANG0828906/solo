export interface PointCloudData {
  positions: Float32Array;
  colors: Float32Array;
  intensities: Uint8Array;
  count: number;
}

const POINT_COUNT = 8000;
const WORLD_SIZE = 50;

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function heightToColor(y: number, minY: number, maxY: number): [number, number, number] {
  const t = maxY === minY ? 0 : Math.max(0, Math.min(1, (y - minY) / (maxY - minY)));
  if (t < 0.5) {
    const k = t * 2;
    return [lerp(0.15, 0.25, k), lerp(0.75, 0.85, k), lerp(0.25, 0.55, k)];
  } else {
    const k = (t - 0.5) * 2;
    return [lerp(0.25, 0.20, k), lerp(0.85, 0.45, k), lerp(0.55, 0.95, k)];
  }
}

export function generatePointCloud(): PointCloudData {
  const positions = new Float32Array(POINT_COUNT * 3);
  const colors = new Float32Array(POINT_COUNT * 3);
  const intensities = new Uint8Array(POINT_COUNT);

  const ys: number[] = [];

  for (let i = 0; i < POINT_COUNT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * WORLD_SIZE;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const baseHeight = Math.sin(x * 0.1) * 5 + Math.cos(z * 0.08) * 5 + Math.random() * 3;
    const hill = Math.max(0, 20 - Math.sqrt(x * x + z * z) * 0.4) * Math.random();
    const y = baseHeight + hill + Math.random() * 2;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;
    ys.push(y);

    intensities[i] = Math.floor(40 + Math.random() * 215);
  }

  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  for (let i = 0; i < POINT_COUNT; i++) {
    const y = positions[i * 3 + 1];
    const [r, g, b] = heightToColor(y, minY, maxY);
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }

  return { positions, colors, intensities, count: POINT_COUNT };
}

export function filterByIntensity(
  data: PointCloudData,
  min: number,
  max: number
): Uint32Array {
  const result: number[] = [];
  for (let i = 0; i < data.count; i++) {
    const v = data.intensities[i];
    if (v >= min && v <= max) {
      result.push(i);
    }
  }
  return Uint32Array.from(result);
}

export function exportAsXYZ(
  data: PointCloudData,
  visibleIndices: Uint32Array,
  filename = 'points.csv'
): void {
  const lines: string[] = ['x,y,z,r,g,b'];
  for (let i = 0; i < visibleIndices.length; i++) {
    const idx = visibleIndices[i];
    const x = data.positions[idx * 3];
    const y = data.positions[idx * 3 + 1];
    const z = data.positions[idx * 3 + 2];
    const r = Math.round(data.colors[idx * 3] * 255);
    const g = Math.round(data.colors[idx * 3 + 1] * 255);
    const b = Math.round(data.colors[idx * 3 + 2] * 255);
    lines.push(`${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)},${r},${g},${b}`);
  }
  const csv = lines.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
