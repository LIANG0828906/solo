import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

function generateTemperatureData(seed) {
  const baseTemp = 15 + (seed % 10);
  const data = [];
  const now = Date.now();
  for (let i = 59; i >= 0; i--) {
    const noise = Math.sin(i * 0.3 + seed) * 1.5 + (Math.random() - 0.5) * 0.8;
    data.push({
      timestamp: now - i * 1000,
      temperature: parseFloat((baseTemp + noise).toFixed(1))
    });
  }
  return data;
}

const buoySeeds = new Map();
let nextBuoyId = 1;

app.get('/api/temperature', (req, res) => {
  const { x, z, buoyId } = req.query;
  const id = buoyId ? String(buoyId) : `gen_${nextBuoyId++}`;
  
  if (!buoySeeds.has(id)) {
    const xNum = parseFloat(x) || 0;
    const zNum = parseFloat(z) || 0;
    buoySeeds.set(id, Math.abs(xNum * 0.1 + zNum * 0.15 + Math.random() * 10));
  }
  
  const seed = buoySeeds.get(id);
  res.json({
    buoyId: id,
    data: generateTemperatureData(seed)
  });
});

app.listen(PORT, () => {
  console.log(`Temperature API server running on http://localhost:${PORT}`);
});
