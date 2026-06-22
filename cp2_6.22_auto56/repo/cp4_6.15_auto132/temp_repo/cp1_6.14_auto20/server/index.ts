import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const DATA_DIR = path.join(__dirname);

app.use(cors());
app.use(express.json());

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const getSnapshotFiles = (): string[] => {
  ensureDataDir();
  const files = fs.readdirSync(DATA_DIR);
  return files
    .filter((f) => f.startsWith('game_') && f.endsWith('.json'))
    .map((f) => f.replace(/^game_/, '').replace(/\.json$/, ''))
    .sort()
    .reverse();
};

app.get('/api/state', (_req, res) => {
  try {
    const snapshots = getSnapshotFiles();
    if (snapshots.length === 0) {
      return res.json({
        units: [],
        terrain: [],
        currentRound: 1,
        selectedUnitId: null,
        editMode: false,
        brushType: 'grass',
        logs: [],
      });
    }
    const latest = snapshots[0];
    const filePath = path.join(DATA_DIR, `game_${latest}.json`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('Error reading state:', error);
    res.status(500).json({ error: 'Failed to read state' });
  }
});

app.post('/api/state', (req, res) => {
  try {
    ensureDataDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `game_${timestamp}.json`;
    const filePath = path.join(DATA_DIR, filename);
    fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));

    const logFilename = `log_${timestamp}.json`;
    const logPath = path.join(DATA_DIR, logFilename);
    fs.writeFileSync(logPath, JSON.stringify(req.body.logs || [], null, 2));

    res.json({ success: true, filename: timestamp });
  } catch (error) {
    console.error('Error saving state:', error);
    res.status(500).json({ error: 'Failed to save state' });
  }
});

app.post('/api/state/load', (req, res) => {
  try {
    const { filename } = req.body;
    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }
    const filePath = path.join(DATA_DIR, `game_${filename}.json`);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Snapshot not found' });
    }
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json(data);
  } catch (error) {
    console.error('Error loading state:', error);
    res.status(500).json({ error: 'Failed to load state' });
  }
});

app.get('/api/snapshots', (_req, res) => {
  try {
    const snapshots = getSnapshotFiles();
    res.json({ filenames: snapshots });
  } catch (error) {
    console.error('Error listing snapshots:', error);
    res.status(500).json({ error: 'Failed to list snapshots' });
  }
});

app.get('/api/log', (_req, res) => {
  try {
    const snapshots = getSnapshotFiles();
    if (snapshots.length === 0) {
      return res.json([]);
    }
    const latest = snapshots[0];
    const logPath = path.join(DATA_DIR, `log_${latest}.json`);
    if (fs.existsSync(logPath)) {
      const data = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
      return res.json(data);
    }
    res.json([]);
  } catch (error) {
    console.error('Error reading log:', error);
    res.status(500).json({ error: 'Failed to read log' });
  }
});

app.post('/api/log', (req, res) => {
  try {
    const snapshots = getSnapshotFiles();
    let logs: any[] = [];

    if (snapshots.length > 0) {
      const latest = snapshots[0];
      const logPath = path.join(DATA_DIR, `log_${latest}.json`);
      if (fs.existsSync(logPath)) {
        logs = JSON.parse(fs.readFileSync(logPath, 'utf-8'));
      }
    }

    logs.push(req.body);

    const latestFile = snapshots.length > 0 ? snapshots[0] : 'default';
    const logPath = path.join(DATA_DIR, `log_${latestFile}.json`);
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2));

    res.json({ success: true });
  } catch (error) {
    console.error('Error appending log:', error);
    res.status(500).json({ error: 'Failed to append log' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});

export default app;
