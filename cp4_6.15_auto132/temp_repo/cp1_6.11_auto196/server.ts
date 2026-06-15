import express from 'express';
import cors from 'cors';

interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
  force: number;
  speed: number;
}

interface RecipeParams {
  force: number;
  angle: number;
  speed: number;
}

interface Recipe {
  id: string;
  name: string;
  createdAt: number;
  params: RecipeParams;
  trajectory: TrajectoryPoint[];
}

const app = express();
const PORT = 3003;

app.use(cors({
  origin: 'http://localhost:3002',
  credentials: true,
}));

app.use(express.json());

let recipes: Recipe[] = [
  {
    id: 'demo-1',
    name: '春风拂面',
    createdAt: Date.now(),
    params: { force: 50, angle: 15, speed: 5 },
    trajectory: generateDemoTrajectory(50, 15, 5),
  },
  {
    id: 'demo-2',
    name: '疾风骤雨',
    createdAt: Date.now(),
    params: { force: 85, angle: 30, speed: 8 },
    trajectory: generateDemoTrajectory(85, 30, 8),
  },
  {
    id: 'demo-3',
    name: '细雨润无声',
    createdAt: Date.now(),
    params: { force: 25, angle: 10, speed: 3 },
    trajectory: generateDemoTrajectory(25, 10, 3),
  },
];

function generateDemoTrajectory(force: number, angle: number, speed: number): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  const duration = 3000;
  const interval = 30;
  const angleRad = (angle * Math.PI) / 180;
  const radius = 80 + force * 0.5;
  const angularSpeed = (speed * 0.02) + 0.01;

  for (let t = 0; t < duration; t += interval) {
    const progress = t / duration;
    const angularOffset = progress * Math.PI * 4 * angularSpeed;
    const wobble = Math.sin(progress * Math.PI * 6) * 15;
    
    const x = Math.cos(angleRad + angularOffset) * (radius + wobble) * 0.6;
    const y = Math.sin(angleRad + angularOffset) * (radius + wobble) * 0.6;
    
    points.push({
      x,
      y,
      timestamp: t,
      force: force * (0.8 + Math.random() * 0.4),
      speed: speed * (0.8 + Math.random() * 0.4),
    });
  }
  
  return points;
}

function generateId(): string {
  return `recipe-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

app.get('/api/recipes', (_req, res) => {
  res.json(recipes);
});

app.post('/api/recipes', (req, res) => {
  const { name, params, trajectory } = req.body as Omit<Recipe, 'id' | 'createdAt'>;

  if (!name || !params || !trajectory) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  if (recipes.length >= 10) {
    return res.status(400).json({ error: '最多保存10条配方' });
  }

  const newRecipe: Recipe = {
    id: generateId(),
    name,
    createdAt: Date.now(),
    params,
    trajectory,
  };

  recipes.push(newRecipe);
  res.status(201).json(newRecipe);
});

app.delete('/api/recipes/:id', (req, res) => {
  const { id } = req.params;
  const index = recipes.findIndex((r) => r.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '配方不存在' });
  }

  recipes.splice(index, 1);
  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`茶筅·击拂录 后端服务运行在 http://localhost:${PORT}`);
});
