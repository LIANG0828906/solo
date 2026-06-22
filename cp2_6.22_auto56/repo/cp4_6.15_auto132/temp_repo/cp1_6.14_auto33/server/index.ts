import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_DIR = path.join(__dirname, 'data');
const CONFIG_FILE = path.join(DATA_DIR, 'configs.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(CONFIG_FILE)) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify({}, null, 2));
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));

type TerrainConfig = {
  heightScale: number;
  frequency: number;
  vegetationDensity: number;
  lightAngle: number;
  viewMode: 'first' | 'third';
  cameraPosition: [number, number, number];
  cameraTarget: [number, number, number];
  seed: number;
  createdAt?: string;
};

type ConfigStore = Record<string, TerrainConfig>;

function generateCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function readStore(): ConfigStore {
  try {
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as ConfigStore;
  } catch {
    return {};
  }
}

function writeStore(store: ConfigStore): void {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(store, null, 2));
}

function validateConfig(config: unknown): config is TerrainConfig {
  if (!config || typeof config !== 'object') return false;
  const c = config as Record<string, unknown>;
  return (
    typeof c.heightScale === 'number' &&
    typeof c.frequency === 'number' &&
    typeof c.vegetationDensity === 'number' &&
    typeof c.lightAngle === 'number' &&
    (c.viewMode === 'first' || c.viewMode === 'third') &&
    Array.isArray(c.cameraPosition) &&
    c.cameraPosition.length === 3 &&
    Array.isArray(c.cameraTarget) &&
    c.cameraTarget.length === 3 &&
    typeof c.seed === 'number'
  );
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/api/config', (req, res) => {
  try {
    const config = req.body as TerrainConfig;

    if (!validateConfig(config)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid configuration format'
      });
    }

    const store = readStore();
    let code: string;
    do {
      code = generateCode();
    } while (store[code]);

    const savedConfig: TerrainConfig = {
      ...config,
      createdAt: new Date().toISOString()
    };

    store[code] = savedConfig;
    writeStore(store);

    res.json({
      code,
      success: true
    });
  } catch (error) {
    console.error('[POST /api/config] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.get('/api/config/:code', (req, res) => {
  try {
    const { code } = req.params;

    if (!code || code.length !== 6) {
      return res.status(400).json({
        success: false,
        config: null,
        message: 'Invalid code format. Must be 6 characters.'
      });
    }

    const store = readStore();
    const config = store[code.toUpperCase()];

    if (!config) {
      return res.status(404).json({
        success: false,
        config: null,
        message: 'Configuration not found for the provided code.'
      });
    }

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('[GET /api/config/:code] Error:', error);
    res.status(500).json({
      success: false,
      config: null,
      message: 'Internal server error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Terrain Explorer API running on http://localhost:${PORT}`);
  console.log(`[Server] Data file: ${CONFIG_FILE}`);
});

export default app;
