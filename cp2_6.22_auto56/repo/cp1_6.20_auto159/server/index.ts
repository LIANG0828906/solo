import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'scores.json');

interface Score {
  id: string;
  name: string;
  waves: number;
  time: number;
  score: number;
  createdAt: string;
}

app.use(cors());
app.use(express.json());

function readScores(): Score[] {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data) as Score[];
  } catch (error) {
    return [];
  }
}

function writeScores(scores: Score[]): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(scores, null, 2), 'utf-8');
}

app.get('/api/score', (_req, res) => {
  try {
    const scores = readScores();
    const topScores = scores
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    res.json({ success: true, data: topScores });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to read scores' });
  }
});

app.post('/api/score', (req, res) => {
  try {
    const { name, waves, time } = req.body;

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid name' });
    }
    if (typeof waves !== 'number' || waves < 0) {
      return res.status(400).json({ success: false, message: 'Invalid waves' });
    }
    if (typeof time !== 'number' || time < 0) {
      return res.status(400).json({ success: false, message: 'Invalid time' });
    }

    const score = waves * 100 + Math.floor(time);

    const newScore: Score = {
      id: uuidv4(),
      name,
      waves,
      time,
      score,
      createdAt: new Date().toISOString(),
    };

    const scores = readScores();
    scores.push(newScore);
    writeScores(scores);

    res.json({ success: true, data: newScore });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save score' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
