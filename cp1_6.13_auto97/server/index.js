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
const PRESETS_FILE = path.join(DATA_DIR, 'presets.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

const loadPresets = () => {
  try {
    if (fs.existsSync(PRESETS_FILE)) {
      const data = fs.readFileSync(PRESETS_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error loading presets:', err);
  }
  return [
    {
      id: uuidv4(),
      name: '清晨薄雾',
      description: '春日清晨，薄雾缭绕的城市',
      time: 6.5,
      season: 'spring',
      weather: 'foggy'
    },
    {
      id: uuidv4(),
      name: '正午晴空',
      description: '夏日正午，阳光明媚',
      time: 12,
      season: 'summer',
      weather: 'sunny'
    },
    {
      id: uuidv4(),
      name: '黄昏日落',
      description: '秋日傍晚，金色余晖',
      time: 18,
      season: 'autumn',
      weather: 'sunny'
    },
    {
      id: uuidv4(),
      name: '雨夜霓虹',
      description: '冬夜雨中，灯火阑珊',
      time: 23,
      season: 'winter',
      weather: 'rainy'
    }
  ];
};

const savePresets = (presets) => {
  try {
    fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving presets:', err);
  }
};

let presets = loadPresets();

const generateBuildingData = (count = 30) => {
  const buildings = [];
  const colors = [
    0x4a5568, 0x718096, 0x2d3748, 0x1a202c,
    0x63b3ed, 0x4299e1, 0x3182ce, 0x2b6cb0
  ];
  
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 15 + Math.random() * 40;
    buildings.push({
      id: uuidv4(),
      height: 10 + Math.random() * 70,
      width: 4 + Math.random() * 8,
      depth: 4 + Math.random() * 8,
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
      color: colors[Math.floor(Math.random() * colors.length)],
      emissive: 0x1a1a2e,
      emissiveIntensity: 0.1
    });
  }
  return buildings;
};

app.get('/api/buildings', (req, res) => {
  const count = parseInt(req.query.count) || 30;
  res.json(generateBuildingData(count));
});

app.get('/api/presets', (req, res) => {
  res.json(presets);
});

app.post('/api/presets', (req, res) => {
  const { name, description, time, season, weather } = req.body;
  
  if (!name || time === undefined || !season || !weather) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const newPreset = {
    id: uuidv4(),
    name,
    description: description || '',
    time,
    season,
    weather
  };
  
  presets.push(newPreset);
  savePresets(presets);
  res.status(201).json(newPreset);
});

app.get('/api/presets/:id', (req, res) => {
  const preset = presets.find(p => p.id === req.params.id);
  if (!preset) {
    return res.status(404).json({ error: '预设不存在' });
  }
  res.json(preset);
});

app.delete('/api/presets/:id', (req, res) => {
  const index = presets.findIndex(p => p.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '预设不存在' });
  }
  presets.splice(index, 1);
  savePresets(presets);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`SkylineMorph 后端服务运行在 http://localhost:${PORT}`);
});
