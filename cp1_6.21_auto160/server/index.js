import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const presets = new Map();

app.post('/api/presets', (req, res) => {
  const { name, caveData, sourcePosition, sourceFrequency, sourceIntensity, wallRoughness } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Preset name is required' });
  }
  const id = uuidv4();
  const preset = {
    id,
    name,
    caveData: caveData || null,
    sourcePosition: sourcePosition || { x: 0, y: 0, z: 0 },
    sourceFrequency: sourceFrequency || 440,
    sourceIntensity: sourceIntensity || 80,
    wallRoughness: wallRoughness || 0.5,
    createdAt: new Date().toISOString(),
  };
  presets.set(id, preset);
  res.status(201).json(preset);
});

app.get('/api/presets', (_req, res) => {
  const list = Array.from(presets.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(list);
});

app.get('/api/presets/:id', (req, res) => {
  const preset = presets.get(req.params.id);
  if (!preset) {
    return res.status(404).json({ error: 'Preset not found' });
  }
  res.json(preset);
});

app.delete('/api/presets/:id', (req, res) => {
  const deleted = presets.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Preset not found' });
  }
  res.json({ success: true });
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
