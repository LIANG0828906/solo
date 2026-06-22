import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const PLOTS_FILE = path.join(DATA_DIR, 'plots.json');
const NOTICES_FILE = path.join(DATA_DIR, 'notices.json');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

function readJsonFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/plots', (req, res) => {
  try {
    const plots = readJsonFile(PLOTS_FILE);
    res.json(plots);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read plots data' });
  }
});

app.post('/api/plots/:id/logs', (req, res) => {
  try {
    const { id } = req.params;
    const { date, photoUrl, height, note, healthStatus } = req.body;
    const plots = readJsonFile(PLOTS_FILE);
    const plotIndex = plots.findIndex((p) => p.id === id);

    if (plotIndex === -1) {
      return res.status(404).json({ error: 'Plot not found' });
    }

    const newLog = {
      id: uuidv4(),
      date,
      photoUrl: photoUrl || '',
      height: Number(height),
      note: note || '',
      healthStatus,
    };

    plots[plotIndex].logs.push(newLog);
    writeJsonFile(PLOTS_FILE, plots);
    res.status(201).json(newLog);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add log' });
  }
});

app.put('/api/plots/:id/logs/:logId', (req, res) => {
  try {
    const { id, logId } = req.params;
    const plots = readJsonFile(PLOTS_FILE);
    const plotIndex = plots.findIndex((p) => p.id === id);

    if (plotIndex === -1) {
      return res.status(404).json({ error: 'Plot not found' });
    }

    const logIndex = plots[plotIndex].logs.findIndex((l) => l.id === logId);
    if (logIndex === -1) {
      return res.status(404).json({ error: 'Log not found' });
    }

    plots[plotIndex].logs[logIndex] = {
      ...plots[plotIndex].logs[logIndex],
      ...req.body,
      height: req.body.height !== undefined ? Number(req.body.height) : plots[plotIndex].logs[logIndex].height,
    };

    writeJsonFile(PLOTS_FILE, plots);
    res.json(plots[plotIndex].logs[logIndex]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update log' });
  }
});

app.delete('/api/plots/:id/logs/:logId', (req, res) => {
  try {
    const { id, logId } = req.params;
    const plots = readJsonFile(PLOTS_FILE);
    const plotIndex = plots.findIndex((p) => p.id === id);

    if (plotIndex === -1) {
      return res.status(404).json({ error: 'Plot not found' });
    }

    const logIndex = plots[plotIndex].logs.findIndex((l) => l.id === logId);
    if (logIndex === -1) {
      return res.status(404).json({ error: 'Log not found' });
    }

    plots[plotIndex].logs.splice(logIndex, 1);
    writeJsonFile(PLOTS_FILE, plots);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete log' });
  }
});

app.get('/api/notices', (req, res) => {
  try {
    const notices = readJsonFile(NOTICES_FILE);
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read notices data' });
  }
});

app.post('/api/notices/:id/like', (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    const notices = readJsonFile(NOTICES_FILE);
    const noticeIndex = notices.findIndex((n) => n.id === id);

    if (noticeIndex === -1) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    const likedIndex = notices[noticeIndex].likedBy.indexOf(userId);
    if (likedIndex === -1) {
      notices[noticeIndex].likedBy.push(userId);
      notices[noticeIndex].likes += 1;
    } else {
      notices[noticeIndex].likedBy.splice(likedIndex, 1);
      notices[noticeIndex].likes -= 1;
    }

    writeJsonFile(NOTICES_FILE, notices);
    res.json(notices[noticeIndex]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update like' });
  }
});

app.post('/api/notices/:id/comments', (req, res) => {
  try {
    const { id } = req.params;
    const { author, content } = req.body;
    const notices = readJsonFile(NOTICES_FILE);
    const noticeIndex = notices.findIndex((n) => n.id === id);

    if (noticeIndex === -1) {
      return res.status(404).json({ error: 'Notice not found' });
    }

    const now = new Date();
    const createdAt = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newComment = {
      id: uuidv4(),
      author,
      content,
      createdAt,
    };

    notices[noticeIndex].comments.push(newComment);
    writeJsonFile(NOTICES_FILE, notices);
    res.status(201).json(newComment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

app.listen(PORT, () => {
  console.log(`🌱 Community Garden server running on http://localhost:${PORT}`);
});
