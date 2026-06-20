import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

app.get('/api/earthquakes', (req, res) => {
  const dataPath = path.join(__dirname, 'earthquakes_data.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  let earthquakes = JSON.parse(rawData);

  const { startTime, endTime } = req.query;

  if (startTime) {
    const start = new Date(startTime as string).getTime();
    earthquakes = earthquakes.filter(
      (eq: { time: string }) => new Date(eq.time).getTime() >= start
    );
  }

  if (endTime) {
    const end = new Date(endTime as string).getTime();
    earthquakes = earthquakes.filter(
      (eq: { time: string }) => new Date(eq.time).getTime() <= end
    );
  }

  res.json(earthquakes);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
