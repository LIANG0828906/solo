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
const DATA_DIR = path.join(__dirname, 'data');
const SAVES_DIR = path.join(DATA_DIR, 'saves');

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

ensureDir(SAVES_DIR);

app.get('/api/events', (_req, res) => {
  try {
    const eventsPath = path.join(DATA_DIR, 'events.json');
    const data = JSON.parse(fs.readFileSync(eventsPath, 'utf-8'));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load events' });
  }
});

app.get('/api/saves', (_req, res) => {
  try {
    const slots: (Record<string, unknown> | null)[] = [];
    for (let i = 0; i < 5; i++) {
      const savePath = path.join(SAVES_DIR, `save_${i}.json`);
      if (fs.existsSync(savePath)) {
        const raw = JSON.parse(fs.readFileSync(savePath, 'utf-8'));
        slots.push({
          slot: i,
          id: raw.id,
          name: raw.name,
          savedAt: raw.savedAt,
          turn: raw.state?.turn || 0,
          era: raw.state?.era || 0,
          population: raw.state?.population || 0,
          summary: raw.summary || ''
        });
      } else {
        slots.push(null);
      }
    }
    res.json({ success: true, data: slots });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list saves' });
  }
});

app.post('/api/saves/:slot', (req, res) => {
  try {
    const slot = parseInt(req.params.slot);
    if (slot < 0 || slot > 4) return res.status(400).json({ success: false, error: 'Invalid slot' });
    const { state, name } = req.body;
    if (!state) return res.status(400).json({ success: false, error: 'Missing state' });

    const id = uuidv4();
    const savedAt = new Date().toISOString();
    const summary = `T${state.turn || 0} | ${['石器', '农业', '青铜', '铁器'][state.era || 0]}时代 | ${state.population || 0}人`;
    const payload = { id, slot, name: name || `存档 ${slot + 1}`, savedAt, summary, state };

    fs.writeFileSync(path.join(SAVES_DIR, `save_${slot}.json`), JSON.stringify(payload, null, 2));
    res.json({ success: true, data: { id, savedAt, slot, summary } });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Save failed' });
  }
});

app.get('/api/saves/:slot', (req, res) => {
  try {
    const slot = parseInt(req.params.slot);
    const savePath = path.join(SAVES_DIR, `save_${slot}.json`);
    if (!fs.existsSync(savePath)) return res.status(404).json({ success: false, error: 'Save not found' });
    const raw = JSON.parse(fs.readFileSync(savePath, 'utf-8'));
    res.json({ success: true, data: raw.state });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Load failed' });
  }
});

app.delete('/api/saves/:slot', (req, res) => {
  try {
    const slot = parseInt(req.params.slot);
    const savePath = path.join(SAVES_DIR, `save_${slot}.json`);
    if (fs.existsSync(savePath)) fs.unlinkSync(savePath);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Running at http://localhost:${PORT}`);
});
