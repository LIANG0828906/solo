import express, { type Request, type Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const PRESETS_FILE = path.join(__dirname, 'presets.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

interface Preset {
  id: string;
  name: string;
  rules: unknown[];
  createdAt: string;
}

const readPresets = (): Preset[] => {
  if (!fs.existsSync(PRESETS_FILE)) {
    return [];
  }
  try {
    const data = fs.readFileSync(PRESETS_FILE, 'utf-8');
    return JSON.parse(data) as Preset[];
  } catch {
    return [];
  }
};

const writePresets = (presets: Preset[]): void => {
  fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf-8');
};

app.get('/api/presets', (_req: Request, res: Response) => {
  const presets = readPresets();
  res.json({ presets });
});

app.post('/api/presets', (req: Request, res: Response) => {
  const { name, rules } = req.body as { name: string; rules: unknown[] };
  if (!name || !rules) {
    res.status(400).json({ success: false, error: 'Name and rules are required' });
    return;
  }
  const presets = readPresets();
  const newPreset: Preset = {
    id: uuidv4(),
    name,
    rules,
    createdAt: new Date().toISOString(),
  };
  presets.push(newPreset);
  writePresets(presets);
  res.json({ preset: newPreset });
});

app.delete('/api/presets/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const presets = readPresets();
  const filtered = presets.filter((p) => p.id !== id);
  if (filtered.length === presets.length) {
    res.status(404).json({ success: false, error: 'Preset not found' });
    return;
  }
  writePresets(filtered);
  res.json({ success: true });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
