import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');

app.use(cors());
app.use(express.json());

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const TEMPLATES_FILE = path.join(DATA_DIR, 'templates.json');
const SAVED_FILE = path.join(DATA_DIR, 'saved.json');

const defaultTemplates = [
  {
    id: 'spiral-nebula',
    name: '螺旋星云',
    shape: 'spiral',
    density: 30000,
    rotationSpeed: 0.5,
    particleSize: 1.5,
    attenuation: 0.6,
    pulseAmplitude: 0.2,
    colorStart: '#6a0dad',
    colorMid: '#1e90ff',
    colorEnd: '#00ffff'
  },
  {
    id: 'rose-nebula',
    name: '玫瑰星云',
    shape: 'sphere',
    density: 35000,
    rotationSpeed: 0.3,
    particleSize: 2.0,
    attenuation: 0.4,
    pulseAmplitude: 0.3,
    colorStart: '#ff1493',
    colorMid: '#ff6347',
    colorEnd: '#ffa500'
  },
  {
    id: 'ring-nebula',
    name: '环状星云',
    shape: 'torus',
    density: 25000,
    rotationSpeed: 0.8,
    particleSize: 1.2,
    attenuation: 0.7,
    pulseAmplitude: 0.15,
    colorStart: '#00ff88',
    colorMid: '#00bfff',
    colorEnd: '#4169e1'
  },
  {
    id: 'supernova-remnant',
    name: '超新星遗迹',
    shape: 'sphere',
    density: 50000,
    rotationSpeed: 1.2,
    particleSize: 1.8,
    attenuation: 0.5,
    pulseAmplitude: 0.4,
    colorStart: '#ff4500',
    colorMid: '#ffd700',
    colorEnd: '#ffffff'
  }
];

if (!fs.existsSync(TEMPLATES_FILE)) {
  fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(defaultTemplates, null, 2));
}

if (!fs.existsSync(SAVED_FILE)) {
  fs.writeFileSync(SAVED_FILE, JSON.stringify([], null, 2));
}

app.get('/api/templates', (req, res) => {
  try {
    const templates = JSON.parse(fs.readFileSync(TEMPLATES_FILE, 'utf-8'));
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

app.post('/api/saved', (req, res) => {
  try {
    const config = req.body;
    const saved = JSON.parse(fs.readFileSync(SAVED_FILE, 'utf-8'));
    
    const newConfig = {
      ...config,
      id: uuidv4(),
      savedAt: new Date().toISOString()
    };
    
    saved.push(newConfig);
    fs.writeFileSync(SAVED_FILE, JSON.stringify(saved, null, 2));
    
    res.json({ id: newConfig.id, success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

app.get('/api/saved', (req, res) => {
  try {
    const saved = JSON.parse(fs.readFileSync(SAVED_FILE, 'utf-8'));
    res.json(saved);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load saved configurations' });
  }
});

app.listen(PORT, () => {
  console.log(`Nebula API server running on http://localhost:${PORT}`);
});
