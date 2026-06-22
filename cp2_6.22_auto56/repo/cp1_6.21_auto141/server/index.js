import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const PRESETS_FILE = path.join(__dirname, 'presets.json');

const defaultPresets = [
  {
    id: 'default-cyclone',
    name: '标准气旋',
    cycloneType: 'cyclone',
    windSpeed: 5,
    particleDensity: 2000,
    createdAt: new Date().toISOString()
  }
];

function initPresetsFile() {
  if (!fs.existsSync(PRESETS_FILE)) {
    fs.writeFileSync(PRESETS_FILE, JSON.stringify(defaultPresets, null, 2), 'utf-8');
  } else {
    try {
      const data = fs.readFileSync(PRESETS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (!Array.isArray(parsed)) {
        fs.writeFileSync(PRESETS_FILE, JSON.stringify(defaultPresets, null, 2), 'utf-8');
      }
    } catch (err) {
      fs.writeFileSync(PRESETS_FILE, JSON.stringify(defaultPresets, null, 2), 'utf-8');
    }
  }
}

function generateId() {
  return 'preset-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
}

app.use(cors());
app.use(express.json());

app.get('/presets', (req, res) => {
  try {
    const data = fs.readFileSync(PRESETS_FILE, 'utf-8');
    let presets = JSON.parse(data);
    if (!Array.isArray(presets)) {
      presets = defaultPresets;
      fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf-8');
    }
    res.json(presets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read presets' });
  }
});

app.post('/presets', (req, res) => {
  try {
    const { name, cycloneType, windSpeed, particleDensity } = req.body;

    if (!name || !cycloneType || windSpeed == null || particleDensity == null) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let presets;
    try {
      const data = fs.readFileSync(PRESETS_FILE, 'utf-8');
      presets = JSON.parse(data);
      if (!Array.isArray(presets)) {
        presets = [];
      }
    } catch (err) {
      presets = [];
    }

    const newPreset = {
      id: generateId(),
      name,
      cycloneType,
      windSpeed,
      particleDensity,
      createdAt: new Date().toISOString()
    };

    presets.push(newPreset);
    fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf-8');

    res.json({ success: true, preset: newPreset });
  } catch (err) {
    res.status(500).json({ error: 'Failed to write preset' });
  }
});

initPresetsFile();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
