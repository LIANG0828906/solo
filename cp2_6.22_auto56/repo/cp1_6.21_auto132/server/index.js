import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;
const SNAPSHOTS_FILE = path.join(__dirname, 'snapshots.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

function readSnapshots() {
  try {
    if (!fs.existsSync(SNAPSHOTS_FILE)) {
      fs.writeFileSync(SNAPSHOTS_FILE, JSON.stringify([], null, 2));
      return [];
    }
    const data = fs.readFileSync(SNAPSHOTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Error reading snapshots:', e);
    return [];
  }
}

function writeSnapshots(data) {
  fs.writeFileSync(SNAPSHOTS_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/snapshots', (_req, res) => {
  try {
    const snapshots = readSnapshots();
    const list = snapshots.map((s) => ({
      id: s.id,
      name: s.name || '未命名快照',
      createdAt: s.createdAt,
    }));
    list.sort((a, b) => b.createdAt - a.createdAt);
    res.json(list);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load snapshots' });
  }
});

app.get('/api/snapshots/:id', (req, res) => {
  try {
    const { id } = req.params;
    const snapshots = readSnapshots();
    const found = snapshots.find((s) => s.id === id);
    if (!found) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    res.json(found);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load snapshot' });
  }
});

app.post('/api/snapshots', (req, res) => {
  try {
    const snapshot = req.body;
    if (!snapshot || !snapshot.id) {
      return res.status(400).json({ error: 'Invalid snapshot data' });
    }
    const snapshots = readSnapshots();
    snapshots.push(snapshot);
    writeSnapshots(snapshots);
    res.json({ id: snapshot.id, success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save snapshot' });
  }
});

app.delete('/api/snapshots/:id', (req, res) => {
  try {
    const { id } = req.params;
    const snapshots = readSnapshots();
    const filtered = snapshots.filter((s) => s.id !== id);
    if (filtered.length === snapshots.length) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    writeSnapshots(filtered);
    res.json({ success: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete snapshot' });
  }
});

app.listen(PORT, () => {
  console.log(`[Server] Snapshots API running on http://localhost:${PORT}`);
  console.log(`[Server] Storage: ${SNAPSHOTS_FILE}`);
});
