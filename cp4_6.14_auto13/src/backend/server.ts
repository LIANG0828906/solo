import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

export interface Member {
  id: string;
  name: string;
  restrictions: string[];
  cuisinePrefs: string[];
  availability: boolean[][];
}

export interface Ingredient {
  name: string;
  amount: string;
  category: string;
}

export interface MealAssignment {
  name: string;
  cookTime: number;
  ingredients: Ingredient[];
  steps: string[];
  cuisine: string;
}

export interface MealPlan {
  id: string;
  weekStart: string;
  meals: (MealAssignment | null)[][];
}

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
    credentials: true,
  })
);
app.use(express.json());

let members: Member[] = [
  {
    id: uuidv4(),
    name: '爸爸',
    restrictions: ['不吃辣'],
    cuisinePrefs: ['中餐'],
    availability: Array.from({ length: 7 }, () => [true, true, true]),
  },
  {
    id: uuidv4(),
    name: '妈妈',
    restrictions: ['素食'],
    cuisinePrefs: ['中餐', '日料'],
    availability: Array.from({ length: 7 }, () => [true, true, true]),
  },
  {
    id: uuidv4(),
    name: '儿子',
    restrictions: [],
    cuisinePrefs: ['西餐', '中餐'],
    availability: Array.from({ length: 7 }, (_, d) => [
      true,
      d < 5 ? false : true,
      true,
    ]),
  },
  {
    id: uuidv4(),
    name: '女儿',
    restrictions: ['坚果过敏'],
    cuisinePrefs: ['日料', '西餐'],
    availability: Array.from({ length: 7 }, (_, d) => [
      true,
      d < 5 ? false : true,
      true,
    ]),
  },
];

let mealPlans: MealPlan[] = [];

app.get('/api/members', (_req, res) => {
  res.json(members);
});

app.post('/api/members', (req, res) => {
  const { name, restrictions, cuisinePrefs, availability } = req.body;
  if (!name) {
    return res.status(400).json({ error: '姓名必填' });
  }
  const newMember: Member = {
    id: uuidv4(),
    name,
    restrictions: restrictions || [],
    cuisinePrefs: cuisinePrefs || [],
    availability:
      availability ||
      Array.from({ length: 7 }, () => [true, true, true]),
  };
  members.push(newMember);
  res.status(201).json(newMember);
});

app.put('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const idx = members.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '成员不存在' });
  }
  members[idx] = { ...members[idx], ...req.body, id };
  res.json(members[idx]);
});

app.delete('/api/members/:id', (req, res) => {
  const { id } = req.params;
  const idx = members.findIndex((m) => m.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: '成员不存在' });
  }
  members.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/history', (_req, res) => {
  res.json(mealPlans);
});

app.post('/api/history', (req, res) => {
  const { weekStart, meals } = req.body;
  if (!weekStart || !meals) {
    return res.status(400).json({ error: '参数不完整' });
  }
  const plan: MealPlan = {
    id: uuidv4(),
    weekStart,
    meals,
  };
  mealPlans.push(plan);
  res.status(201).json(plan);
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[backend] listening on http://localhost:${PORT}`);
}).on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    const newPort = PORT + 1;
    console.log(`[backend] Port ${PORT} in use, trying ${newPort}...`);
    setTimeout(() => {
      try {
        app.listen(newPort, () => {
          console.log(`[backend] listening on http://localhost:${newPort}`);
        });
      } catch (e) {
        console.error('[backend] failed to start', e);
      }
    }, 500);
  } else {
    console.error('[backend] error:', err);
  }
});
