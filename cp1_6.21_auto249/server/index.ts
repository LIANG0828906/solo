import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { RobotPose, SavedPose, PoseSummary } from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const savedPoses: SavedPose[] = [];

function isValidPose(pose: unknown): pose is RobotPose {
  if (!pose || typeof pose !== 'object') return false;
  const p = pose as Record<string, unknown>;
  if (!Array.isArray(p.legs) || p.legs.length !== 6) return false;
  for (const leg of p.legs) {
    if (!leg || typeof leg !== 'object') return false;
    const l = leg as Record<string, unknown>;
    for (const key of ['coxa', 'femur', 'tibia']) {
      const val = l[key];
      if (typeof val !== 'number' || val < 0 || val > 180) return false;
    }
  }
  return true;
}

app.post('/api/pose', (req, res) => {
  const { pose } = req.body as { pose?: RobotPose };
  if (!isValidPose(pose)) {
    return res.status(400).json({ error: 'Invalid pose data' });
  }
  const id = uuidv4();
  const saved: SavedPose = {
    id,
    createdAt: Date.now(),
    pose,
  };
  savedPoses.push(saved);
  res.json({ id });
});

app.get('/api/pose/:id', (req, res) => {
  const { id } = req.params;
  const found = savedPoses.find((p) => p.id === id);
  if (!found) {
    return res.status(404).json({ error: 'Pose not found' });
  }
  res.json(found);
});

app.get('/api/poses', (_req, res) => {
  const summaries: PoseSummary[] = savedPoses.map(({ id, createdAt }) => ({
    id,
    createdAt,
  }));
  res.json(summaries);
});

app.listen(PORT, () => {
  console.log(`Hexapod simulator backend running on http://localhost:${PORT}`);
});
