import express, { Request, Response } from 'express';
import {
  calculateOrbitParams,
  getPositionOnOrbit,
  OrbitParams,
  OrbitPosition
} from './orbitCalculator';

const app = express();
const PORT = 3002;

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.get('/api/orbit-params', (req: Request, res: Response<OrbitParams>) => {
  const params = calculateOrbitParams();
  res.json(params);
});

app.get('/api/orbit-position', (req: Request, res: Response<OrbitPosition>) => {
  const timestamp = Date.now();
  const params = calculateOrbitParams();
  const stationPosition = getPositionOnOrbit(timestamp, params);
  const offsetX = 0.05 * Math.cos(timestamp / 5000);
  const offsetY = 0.05 * Math.sin(timestamp / 5000);
  const spacecraftPosition = {
    x: Number((stationPosition.x + offsetX).toFixed(4)),
    y: Number((stationPosition.y + offsetY).toFixed(4))
  };
  res.json({
    stationPosition,
    spacecraftPosition,
    timestamp
  });
});

app.listen(PORT, () => {
  console.log(`[Docking Simulator] Orbit data service running at http://localhost:${PORT}`);
  console.log(`  GET /api/orbit-params`);
  console.log(`  GET /api/orbit-position`);
});
