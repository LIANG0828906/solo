import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const STORAGE_KEY = 'rpg_scene_presets';

function readPresets() {
  try {
    const data = global.__presets__ || '[]';
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writePresets(presets) {
  global.__presets__ = JSON.stringify(presets);
}

app.get('/api/presets', (_req, res) => {
  setTimeout(() => {
    const presets = readPresets();
    res.json({ success: true, data: presets });
  }, 300);
});

app.post('/api/presets', (req, res) => {
  setTimeout(() => {
    const { name, theme, weather, lightAngle, lightIntensity, characterColor } = req.body;
    const newPreset = {
      id: 'preset_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      name,
      theme,
      weather,
      lightAngle,
      lightIntensity,
      characterColor,
      createdAt: Date.now()
    };
    const presets = readPresets();
    presets.push(newPreset);
    writePresets(presets);
    res.json({ success: true, data: newPreset });
  }, 500);
});

app.listen(PORT, () => {
  console.log(`Preset API server running on http://localhost:${PORT}`);
});
