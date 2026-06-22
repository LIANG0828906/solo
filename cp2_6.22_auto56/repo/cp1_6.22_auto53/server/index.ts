const express = require('express');
const cors = require('cors');

interface TerrainPhysics {
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  friction: number;
  grip: number;
  color: string;
  name: string;
}

interface TerrainZone {
  id: string;
  type: string;
  startAngle: number;
  endAngle: number;
}

interface TrackConfig {
  centerX: number;
  centerY: number;
  semiMajor: number;
  semiMinor: number;
  width: number;
  zones: TerrainZone[];
}

interface TerrainsData {
  physics: Record<string, TerrainPhysics>;
  track: TrackConfig;
  zones: TerrainZone[];
}

interface LeaderboardEntry {
  id: string;
  time: number;
  averageSpeed: number;
  terrainTimes: Record<string, number>;
  date: number;
}

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const terrainPhysics: Record<string, TerrainPhysics> = {
  asphalt: {
    maxSpeed: 320,
    acceleration: 180,
    deceleration: 250,
    friction: 0.98,
    grip: 0.95,
    color: '#3a3a4a',
    name: '沥青',
  },
  sand: {
    maxSpeed: 240,
    acceleration: 140,
    deceleration: 200,
    friction: 0.92,
    grip: 0.7,
    color: '#c2b280',
    name: '沙地',
  },
  snow: {
    maxSpeed: 200,
    acceleration: 100,
    deceleration: 150,
    friction: 0.85,
    grip: 0.4,
    color: '#e8e8e8',
    name: '雪地',
  },
  mud: {
    maxSpeed: 180,
    acceleration: 80,
    deceleration: 180,
    friction: 0.88,
    grip: 0.5,
    color: '#5c4033',
    name: '泥地',
  },
};

const trackConfig: TrackConfig = {
  centerX: 0,
  centerY: 0,
  semiMajor: 800,
  semiMinor: 500,
  width: 120,
  zones: [
    { id: 'zone-1', type: 'asphalt', startAngle: 0, endAngle: 90 },
    { id: 'zone-2', type: 'sand', startAngle: 90, endAngle: 180 },
    { id: 'zone-3', type: 'snow', startAngle: 180, endAngle: 270 },
    { id: 'zone-4', type: 'mud', startAngle: 270, endAngle: 360 },
  ],
};

let leaderboard: LeaderboardEntry[] = [];

app.get('/api/terrains', (_req: any, res: any) => {
  res.json({
    physics: terrainPhysics,
    track: trackConfig,
    zones: trackConfig.zones,
  });
});

app.get('/api/leaderboard', (_req: any, res: any) => {
  res.json(leaderboard);
});

app.post('/api/leaderboard', (req: any, res: any) => {
  const { time, averageSpeed, terrainTimes } = req.body;

  if (typeof time !== 'number' || typeof averageSpeed !== 'number' || !terrainTimes) {
    res.status(400).json([]);
    return;
  }

  const newEntry: LeaderboardEntry = {
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    time,
    averageSpeed,
    terrainTimes,
    date: Date.now(),
  };

  leaderboard.push(newEntry);
  leaderboard.sort((a: LeaderboardEntry, b: LeaderboardEntry) => a.time - b.time);
  leaderboard = leaderboard.slice(0, 10);

  res.json(leaderboard);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
