import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_PATH = path.join(__dirname, 'data', 'presets.json');

app.use(cors());
app.use(bodyParser.json());

interface ParticleParams {
  count: number;
  size: number;
  color: string;
  rotationSpeed: number;
  spreadRadius: number;
}

interface Preset {
  id: string;
  name: string;
  params: ParticleParams;
  createdAt: string;
}

interface PresetData {
  presets: Preset[];
}

const readPresets = (): PresetData => {
  try {
    const data = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading presets:', error);
    return { presets: [] };
  }
};

const writePresets = (data: PresetData): void => {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing presets:', error);
  }
};

app.get('/api/presets', (req, res) => {
  const data = readPresets();
  res.json({
    success: true,
    data: data.presets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ),
  });
});

app.get('/api/presets/:id', (req, res) => {
  const { id } = req.params;
  const data = readPresets();
  const preset = data.presets.find((p) => p.id === id);

  if (!preset) {
    return res.status(404).json({
      success: false,
      error: 'Preset not found',
    });
  }

  res.json({
    success: true,
    data: preset,
  });
});

app.post('/api/presets', (req, res) => {
  const { name, params } = req.body as { name: string; params: ParticleParams };

  if (!name || !params) {
    return res.status(400).json({
      success: false,
      error: 'Name and params are required',
    });
  }

  const newPreset: Preset = {
    id: uuidv4(),
    name,
    params,
    createdAt: new Date().toISOString(),
  };

  const data = readPresets();
  data.presets.push(newPreset);
  writePresets(data);

  res.status(201).json({
    success: true,
    data: newPreset,
  });
});

app.put('/api/presets/:id', (req, res) => {
  const { id } = req.params;
  const { name, params } = req.body as { name?: string; params?: ParticleParams };

  const data = readPresets();
  const index = data.presets.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Preset not found',
    });
  }

  if (name) {
    data.presets[index].name = name;
  }
  if (params) {
    data.presets[index].params = params;
  }

  writePresets(data);

  res.json({
    success: true,
    data: data.presets[index],
  });
});

app.delete('/api/presets/:id', (req, res) => {
  const { id } = req.params;
  const data = readPresets();
  const index = data.presets.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({
      success: false,
      error: 'Preset not found',
    });
  }

  const deleted = data.presets.splice(index, 1)[0];
  writePresets(data);

  res.json({
    success: true,
    data: deleted,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
