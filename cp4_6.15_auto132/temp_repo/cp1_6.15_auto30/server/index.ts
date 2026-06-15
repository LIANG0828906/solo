import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

interface Goal {
  id: string;
  name: string;
  totalPlannedHours: number;
  accumulatedMinutes: number;
  dailyGoalMinutes: number;
  order: number;
  createdAt: string;
}

interface StudyRecord {
  id: string;
  goalId: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  note?: string;
  createdAt: string;
}

app.use(cors());
app.use(express.json());

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

let goals: Goal[] = [
  {
    id: 'goal-1',
    name: '掌握 React',
    totalPlannedHours: 80,
    accumulatedMinutes: 1250,
    dailyGoalMinutes: 60,
    order: 0,
    createdAt: new Date('2025-01-01').toISOString(),
  },
  {
    id: 'goal-2',
    name: '通过 PMP 考试',
    totalPlannedHours: 120,
    accumulatedMinutes: 420,
    dailyGoalMinutes: 90,
    order: 1,
    createdAt: new Date('2025-01-02').toISOString(),
  },
  {
    id: 'goal-3',
    name: '学习 TypeScript',
    totalPlannedHours: 40,
    accumulatedMinutes: 960,
    dailyGoalMinutes: 45,
    order: 2,
    createdAt: new Date('2025-01-03').toISOString(),
  },
];

function randomMinutesAgo(minutes: number): Date {
  return new Date(today.getTime() + minutes * 60000);
}

let records: StudyRecord[] = [
  {
    id: 'rec-1',
    goalId: 'goal-1',
    startTime: randomMinutesAgo(-180).toISOString(),
    endTime: randomMinutesAgo(-120).toISOString(),
    durationMinutes: 60,
    note: '学习 React Hooks 深入',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'rec-2',
    goalId: 'goal-1',
    startTime: randomMinutesAgo(-90).toISOString(),
    endTime: randomMinutesAgo(-45).toISOString(),
    durationMinutes: 45,
    note: '状态管理实践',
    createdAt: new Date().toISOString(),
  },
];

function generateMockRecords() {
  const goalIds = ['goal-1', 'goal-2', 'goal-3'];
  const notes = [
    '阅读文档学习',
    '实战项目练习',
    '视频教程学习',
    '练习题巩固',
    '复盘总结',
  ];

  for (let day = 0; day < 20; day++) {
    const dayDate = new Date(today);
    dayDate.setDate(dayDate.getDate() - day);
    for (let i = 0; i < Math.floor(Math.random() * 3) + 1; i++) {
      const goalId = goalIds[Math.floor(Math.random() * goalIds.length)];
      const duration = [25, 45, 60, 30][Math.floor(Math.random() * 4)];
      const hour = 9 + Math.floor(Math.random() * 10);
      const start = new Date(dayDate);
      start.setHours(hour, Math.floor(Math.random() * 60));
      const end = new Date(start.getTime() + duration * 60000);
      records.push({
        id: uuidv4(),
        goalId,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        durationMinutes: duration,
        note: notes[Math.floor(Math.random() * notes.length)],
        createdAt: dayDate.toISOString(),
      });
    }
  }
}
generateMockRecords();

app.get('/api/goals', (req, res) => {
  const sorted = [...goals].sort((a, b) => a.order - b.order);
  res.json(sorted);
});

app.post('/api/goals', (req, res) => {
  const { name, totalPlannedHours, dailyGoalMinutes = 60 } = req.body;
  if (!name || !totalPlannedHours) {
    return res.status(400).json({ error: '名称和计划时长必填' });
  }
  const newGoal: Goal = {
    id: uuidv4(),
    name,
    totalPlannedHours: Number(totalPlannedHours),
    accumulatedMinutes: 0,
    dailyGoalMinutes: Number(dailyGoalMinutes),
    order: goals.length,
    createdAt: new Date().toISOString(),
  };
  goals.push(newGoal);
  res.status(201).json(newGoal);
});

app.put('/api/goals/:id', (req, res) => {
  const { id } = req.params;
  const idx = goals.findIndex((g) => g.id === id);
  if (idx === -1) return res.status(404).json({ error: '目标不存在' });
  goals[idx] = { ...goals[idx], ...req.body, id };
  res.json(goals[idx]);
});

app.delete('/api/goals/:id', (req, res) => {
  const { id } = req.params;
  goals = goals.filter((g) => g.id !== id);
  records = records.filter((r) => r.goalId !== id);
  res.json({ success: true });
});

app.post('/api/goals/reorder', (req, res) => {
  const { id, newOrder } = req.body;
  if (!id || newOrder === undefined) {
    return res.status(400).json({ error: '缺少参数' });
  }
  const goal = goals.find((g) => g.id === id);
  if (goal) {
    goal.order = newOrder;
  }
  res.json({ success: true });
});

app.get('/api/records', (req, res) => {
  const { goalId } = req.query;
  let result = [...records];
  if (goalId && typeof goalId === 'string') {
    result = result.filter((r) => r.goalId === goalId);
  }
  result.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  res.json(result);
});

app.post('/api/records', (req, res) => {
  const { goalId, startTime, endTime, durationMinutes, note } = req.body;
  if (!goalId || !startTime || !endTime || durationMinutes === undefined) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  const newRecord: StudyRecord = {
    id: uuidv4(),
    goalId,
    startTime,
    endTime,
    durationMinutes: Number(durationMinutes),
    note,
    createdAt: new Date().toISOString(),
  };
  records.push(newRecord);
  const goal = goals.find((g) => g.id === goalId);
  if (goal) {
    goal.accumulatedMinutes += Number(durationMinutes);
  }
  res.status(201).json(newRecord);
});

app.put('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const idx = records.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ error: '记录不存在' });
  const oldDuration = records[idx].durationMinutes;
  const updated = { ...records[idx], ...req.body, id };
  if (req.body.durationMinutes !== undefined) {
    updated.durationMinutes = Number(req.body.durationMinutes);
  }
  records[idx] = updated;
  const goal = goals.find((g) => g.id === updated.goalId);
  if (goal) {
    goal.accumulatedMinutes += updated.durationMinutes - oldDuration;
  }
  res.json(updated);
});

app.delete('/api/records/:id', (req, res) => {
  const { id } = req.params;
  const record = records.find((r) => r.id === id);
  if (!record) return res.status(404).json({ error: '记录不存在' });
  records = records.filter((r) => r.id !== id);
  const goal = goals.find((g) => g.id === record.goalId);
  if (goal) {
    goal.accumulatedMinutes -= record.durationMinutes;
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
