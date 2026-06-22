import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface ConstellationLine {
  id: string;
  startStarId: string;
  endStarId: string;
}

interface StarData {
  id: string;
  name: string;
  position: [number, number, number];
}

interface SavedConstellation {
  id: string;
  timestamp: number;
  lines: ConstellationLine[];
  lineCount: number;
  starData?: StarData[];
}

let constellations: SavedConstellation[] = [];

const generateSampleStars = () => {
  const spectralTypes = ['O', 'B', 'A', 'F', 'G', 'K', 'M'];
  const stars = [];
  
  for (let i = 0; i < 200; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = 50 * Math.cbrt(Math.random());
    
    stars.push({
      id: `star-${i}`,
      name: `HD-${Math.floor(Math.random() * 90000) + 10000}`,
      magnitude: Math.round((0 + 10 * Math.pow(Math.random(), 1.5)) * 100) / 100,
      spectralType: spectralTypes[Math.floor(Math.random() * spectralTypes.length)],
      position: [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi),
      ] as [number, number, number],
    });
  }
  
  return stars;
};

app.get('/api/stars', (req, res) => {
  const stars = generateSampleStars();
  res.json(stars);
});

app.post('/api/constellations', (req, res) => {
  const { lines, lineCount, starData } = req.body;
  
  if (!lines || !Array.isArray(lines)) {
    return res.status(400).json({ error: 'Invalid constellation data' });
  }

  const newConstellation: SavedConstellation = {
    id: uuidv4(),
    timestamp: Date.now(),
    lines,
    lineCount: lineCount || lines.length,
    starData,
  };

  constellations.unshift(newConstellation);

  if (constellations.length > 50) {
    constellations = constellations.slice(0, 50);
  }

  res.status(201).json(newConstellation);
});

app.get('/api/constellations', (req, res) => {
  const summary = constellations.map(c => ({
    id: c.id,
    timestamp: c.timestamp,
    lineCount: c.lineCount,
  }));
  res.json(summary);
});

app.get('/api/constellations/:id', (req, res) => {
  const { id } = req.params;
  const constellation = constellations.find(c => c.id === id);

  if (!constellation) {
    return res.status(404).json({ error: 'Constellation not found' });
  }

  res.json(constellation);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET  /api/stars`);
  console.log(`  POST /api/constellations`);
  console.log(`  GET  /api/constellations`);
  console.log(`  GET  /api/constellations/:id`);
});

export default app;
