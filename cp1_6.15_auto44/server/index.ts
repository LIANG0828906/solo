import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3500;

app.use(cors());
app.use(express.json());

interface ResolutionConfig {
  cols: number;
  rows: number;
}

const RESOLUTIONS: Record<string, ResolutionConfig> = {
  low: { cols: 18, rows: 9 },
  medium: { cols: 36, rows: 18 },
  high: { cols: 72, rows: 36 }
};

function mulberry32(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededHash(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function generate2DArray(
  rand: () => number,
  rows: number,
  cols: number,
  min: number,
  max: number,
  hourOffset: number,
  latBias: (row: number) => number,
  waveStrength: number
): number[][] {
  const result: number[][] = [];
  const range = max - min;

  for (let r = 0; r < rows; r++) {
    const row: number[] = [];
    const latFactor = latBias(r);

    for (let c = 0; c < cols; c++) {
      const wave1 = Math.sin((c / cols) * Math.PI * 4 + hourOffset * 0.12 + r * 0.25) * 0.5 + 0.5;
      const wave2 = Math.cos((r / rows) * Math.PI * 3 - hourOffset * 0.08 + c * 0.18) * 0.5 + 0.5;
      const wave3 = Math.sin(((r + c) / (rows + cols)) * Math.PI * 6 + hourOffset * 0.2) * 0.5 + 0.5;
      const noise = rand();

      const combined =
        wave1 * 0.32 +
        wave2 * 0.26 +
        wave3 * 0.18 +
        noise * 0.24;

      const biased = combined * (1 - waveStrength) + ((wave1 + wave2) / 2) * waveStrength;
      const withLat = biased * 0.7 + latFactor * 0.3;
      const value = min + Math.max(0, Math.min(1, withLat)) * range;

      row.push(Math.round(value * 100) / 100);
    }
    result.push(row);
  }
  return result;
}

app.get('/api/weather', (req, res) => {
  const startHour = Math.max(0, Math.min(71, parseInt(req.query.startHour as string) || 0));
  const endHour = Math.max(startHour, Math.min(71, parseInt(req.query.endHour as string) || 71));
  const resolutionKey = (req.query.resolution as string) || 'medium';
  const resolution = RESOLUTIONS[resolutionKey] || RESOLUTIONS.medium;

  const baseSeed = seededHash('global-cloud-visualizer-v1');
  const { cols, rows } = resolution;
  const hours = endHour - startHour + 1;

  const data = [];

  for (let h = 0; h < hours; h++) {
    const hour = startHour + h;
    const hourSeed = baseSeed + hour * 7919;
    const randT = mulberry32(hourSeed);
    const randH = mulberry32(hourSeed + 104729);
    const randW = mulberry32(hourSeed + 224737);

    const temperature = generate2DArray(
      randT, rows, cols, -40, 50, hour,
      (r) => {
        const lat = 90 - (r / (rows - 1)) * 180;
        return 0.5 + Math.cos((lat * Math.PI) / 180) * 0.35 - Math.abs(lat) / 180 * 0.3;
      },
      0.35
    );

    const humidity = generate2DArray(
      randH, rows, cols, 0, 100, hour,
      (r) => {
        const lat = 90 - (r / (rows - 1)) * 180;
        const eqBand = Math.exp(-Math.pow(lat / 25, 2)) * 0.4;
        const midBand = Math.exp(-Math.pow((Math.abs(lat) - 55) / 20, 2)) * 0.25;
        return 0.35 + eqBand + midBand;
      },
      0.25
    );

    const windSpeed = generate2DArray(
      randW, rows, cols, 0, 150, hour,
      (r) => {
        const lat = 90 - (r / (rows - 1)) * 180;
        const jetStream = Math.exp(-Math.pow((Math.abs(lat) - 45) / 12, 2)) * 0.5;
        const tradeWinds = Math.exp(-Math.pow(lat / 20, 2)) * 0.2;
        return 0.2 + jetStream + tradeWinds;
      },
      0.45
    );

    data.push({ hour, temperature, humidity, windSpeed });
  }

  res.setHeader('ETag', `W/"${baseSeed}-${startHour}-${endHour}-${resolutionKey}"`);
  res.setHeader('Cache-Control', 'public, max-age=3600');

  res.json({
    success: true,
    requestId: uuidv4(),
    generatedAt: new Date().toISOString(),
    hours,
    resolution: { cols, rows },
    data
  });
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`[server] Weather API server running on http://localhost:${PORT}`);
  console.log(`[server] GET /api/weather?startHour=0&endHour=71&resolution=medium`);
});
