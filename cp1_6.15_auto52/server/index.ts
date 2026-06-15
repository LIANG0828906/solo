import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

interface Artifact {
  id: string;
  type: string;
  pieceIndex: number;
  totalPieces: number;
  collected: boolean;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  name: string;
}

interface ProgressItem {
  type: string;
  name: string;
  totalPieces: number;
  collectedCount: number;
  completed: boolean;
}

interface GameData {
  artifacts: Artifact[];
}

const ARTIFACT_TYPES = [
  { type: 'pottery', name: '古代陶罐', totalPieces: 4 },
  { type: 'statue', name: '大理石雕像', totalPieces: 5 },
  { type: 'coin', name: '金币堆', totalPieces: 3 },
  { type: 'tablet', name: '石刻碑文', totalPieces: 4 },
  { type: 'weapon', name: '青铜剑', totalPieces: 4 },
  { type: 'jewelry', name: '金冠饰品', totalPieces: 3 },
];

function generateInitialArtifacts(): Artifact[] {
  const artifacts: Artifact[] = [];
  const rings = [
    { radius: 12, yRange: [-3, 2] },
    { radius: 18, yRange: [-5, 1] },
    { radius: 25, yRange: [-6, 0] },
  ];

  let ringIndex = 0;
  let angleOffset = 0;

  ARTIFACT_TYPES.forEach((typeDef) => {
    for (let i = 0; i < typeDef.totalPieces; i++) {
      const ring = rings[ringIndex % rings.length];
      const angle = (i / typeDef.totalPieces) * Math.PI * 2 + angleOffset;
      const jitter = () => (Math.random() - 0.5) * 3;

      artifacts.push({
        id: uuidv4(),
        type: typeDef.type,
        pieceIndex: i,
        totalPieces: typeDef.totalPieces,
        collected: false,
        position: {
          x: Math.cos(angle) * ring.radius + jitter(),
          y: ring.yRange[0] + Math.random() * (ring.yRange[1] - ring.yRange[0]),
          z: Math.sin(angle) * ring.radius + jitter(),
        },
        rotation: {
          x: Math.random() * Math.PI,
          y: Math.random() * Math.PI,
          z: Math.random() * Math.PI,
        },
        name: typeDef.name,
      });
    }
    ringIndex++;
    angleOffset += Math.PI / 6;
  });

  return artifacts;
}

function loadGameData(): GameData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('读取存档失败，将创建新存档');
  }
  const data = { artifacts: generateInitialArtifacts() };
  saveGameData(data);
  return data;
}

function saveGameData(data: GameData): void {
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('保存存档失败:', err);
  }
}

let gameData: GameData = loadGameData();

app.use(cors());
app.use(express.json());

app.get('/api/artifacts', (_req, res) => {
  res.json({ artifacts: gameData.artifacts });
});

app.post('/api/collect', (req, res) => {
  const { id } = req.body;

  if (!id || typeof id !== 'string' || id.trim().length === 0) {
    return res.status(400).json({ error: '缺少有效的碎片ID', code: 'INVALID_ID' });
  }

  const artifact = gameData.artifacts.find((a) => a.id === id);
  if (!artifact) {
    return res.status(404).json({ error: '碎片不存在', code: 'NOT_FOUND', requestedId: id });
  }

  if (artifact.collected) {
    return res.status(400).json({
      error: '该碎片已被采集',
      code: 'ALREADY_COLLECTED',
      artifact: {
        id: artifact.id,
        type: artifact.type,
        pieceIndex: artifact.pieceIndex,
        totalPieces: artifact.totalPieces,
        collected: true,
        name: artifact.name,
      },
    });
  }

  artifact.collected = true;
  saveGameData(gameData);

  const progress = calculateProgress();
  res.json({
    success: true,
    artifact: {
      id: artifact.id,
      type: artifact.type,
      pieceIndex: artifact.pieceIndex,
      totalPieces: artifact.totalPieces,
      collected: artifact.collected,
      position: artifact.position,
      rotation: artifact.rotation,
      name: artifact.name,
    },
    progress,
  });
});

function calculateProgress(): ProgressItem[] {
  const grouped = new Map<string, Artifact[]>();
  gameData.artifacts.forEach((a) => {
    if (!grouped.has(a.type)) grouped.set(a.type, []);
    grouped.get(a.type)!.push(a);
  });

  const progress: ProgressItem[] = [];
  grouped.forEach((items, type) => {
    const typeDef = ARTIFACT_TYPES.find((t) => t.type === type);
    const totalPieces = items.length;
    const collectedCount = items.filter((a) => a.collected).length;
    progress.push({
      type,
      name: typeDef?.name ?? type,
      totalPieces,
      collectedCount,
      completed: collectedCount >= totalPieces,
    });
  });
  return progress;
}

app.get('/api/progress', (_req, res) => {
  res.json({ progress: calculateProgress() });
});

app.post('/api/reset', (_req, res) => {
  gameData = { artifacts: generateInitialArtifacts() };
  saveGameData(gameData);
  res.json({ success: true, artifacts: gameData.artifacts });
});

app.listen(PORT, () => {
  console.log(`后端服务运行在 http://localhost:${PORT}`);
  console.log(`存档文件: ${DATA_FILE}`);
});
