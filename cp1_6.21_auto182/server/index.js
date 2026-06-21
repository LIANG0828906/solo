import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const timePresets = [];

app.post('/post/time-preset', (req, res) => {
  const { time, name } = req.body;

  if (typeof time !== 'number' || time < 0 || time > 24) {
    return res.status(400).json({ error: 'Invalid time value. Must be between 0 and 24.' });
  }

  const preset = {
    id: uuidv4(),
    time,
    name: name || `预设 ${timePresets.length + 1}`,
    createdAt: new Date().toISOString()
  };

  timePresets.unshift(preset);
  res.json(preset);
});

app.get('/get/time-presets', (_req, res) => {
  res.json({ data: timePresets });
});

app.listen(PORT, () => {
  console.log(`光影城境后端服务运行在 http://localhost:${PORT}`);
});
