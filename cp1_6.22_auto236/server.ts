import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

interface CareTask {
  id: string;
  plantId: string;
  type: 'water' | 'fertilize' | 'prune';
  intervalDays: number;
  lastDone: string;
  nextDue: string;
  completed: boolean;
  lastCompletedAt?: string;
}

interface Plant {
  id: string;
  name: string;
  variety: string;
  photoColor: string;
  createdAt: string;
}

interface GrowthRecord {
  id: string;
  plantId: string;
  date: string;
  photoColor: string;
  notes: string;
}

const plants: Plant[] = [];
const tasks: CareTask[] = [];
const records: GrowthRecord[] = [];

function calcNextDue(lastDone: string, intervalDays: number): string {
  const d = new Date(lastDone);
  d.setDate(d.getDate() + intervalDays);
  return d.toISOString().split('T')[0];
}

function seedData() {
  const now = new Date();
  const ago = (days: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  const seedPlants: Array<{ name: string; variety: string; photoColor: string }> = [
    { name: '玫瑰', variety: '大马士革', photoColor: '#EF9A9A' },
    { name: '多肉', variety: '吉娃娃', photoColor: '#A5D6A7' },
    { name: '薰衣草', variety: '英国薰衣草', photoColor: '#CE93D8' },
    { name: '番茄', variety: '圣女果', photoColor: '#FFCC80' },
    { name: '茉莉', variety: '单瓣茉莉', photoColor: '#FFF59D' },
  ];

  const seedTasks: Array<{ plantIdx: number; type: 'water' | 'fertilize' | 'prune'; intervalDays: number; lastDoneAgo: number; completed: boolean }> = [
    { plantIdx: 0, type: 'water', intervalDays: 3, lastDoneAgo: 2, completed: false },
    { plantIdx: 0, type: 'fertilize', intervalDays: 30, lastDoneAgo: 25, completed: false },
    { plantIdx: 0, type: 'prune', intervalDays: 90, lastDoneAgo: 40, completed: true },
    { plantIdx: 1, type: 'water', intervalDays: 7, lastDoneAgo: 6, completed: false },
    { plantIdx: 1, type: 'fertilize', intervalDays: 60, lastDoneAgo: 20, completed: true },
    { plantIdx: 2, type: 'water', intervalDays: 4, lastDoneAgo: 3, completed: false },
    { plantIdx: 2, type: 'prune', intervalDays: 60, lastDoneAgo: 55, completed: false },
    { plantIdx: 3, type: 'water', intervalDays: 2, lastDoneAgo: 1, completed: false },
    { plantIdx: 3, type: 'fertilize', intervalDays: 14, lastDoneAgo: 10, completed: false },
    { plantIdx: 3, type: 'prune', intervalDays: 45, lastDoneAgo: 10, completed: true },
    { plantIdx: 4, type: 'water', intervalDays: 3, lastDoneAgo: 0, completed: true },
    { plantIdx: 4, type: 'fertilize', intervalDays: 21, lastDoneAgo: 5, completed: false },
  ];

  seedPlants.forEach(p => {
    const id = uuidv4();
    plants.push({ id, name: p.name, variety: p.variety, photoColor: p.photoColor, createdAt: ago(90) });
  });

  seedTasks.forEach(st => {
    const plant = plants[st.plantIdx];
    if (!plant) return;
    const lastDone = ago(st.lastDoneAgo);
    const task: CareTask = {
      id: uuidv4(),
      plantId: plant.id,
      type: st.type,
      intervalDays: st.intervalDays,
      lastDone,
      nextDue: calcNextDue(lastDone, st.intervalDays),
      completed: st.completed,
      lastCompletedAt: st.completed ? ago(st.lastDoneAgo) : undefined,
    };
    tasks.push(task);
  });

  const warmColors = ['#FFCC80', '#CE93D8', '#81D0B8'];
  const noteTemplates = [
    '生长状态良好，叶片翠绿有光泽',
    '新芽开始萌发，长势喜人',
    '花苞初现，期待绽放',
    '叶片略微发黄，需注意养护',
    '枝叶茂盛，形态优美',
  ];
  plants.forEach(plant => {
    for (let d = 0; d < 6; d++) {
      const daysAgo = d * 5 + Math.floor(Math.random() * 3);
      records.push({
        id: uuidv4(),
        plantId: plant.id,
        date: ago(daysAgo),
        photoColor: warmColors[(d + plants.indexOf(plant)) % warmColors.length],
        notes: noteTemplates[d % noteTemplates.length],
      });
    }
  });
}

seedData();

app.get('/api/plants', (_req, res) => {
  const plantsWithTasks = plants.map(plant => ({
    ...plant,
    tasks: tasks.filter(t => t.plantId === plant.id),
  }));
  res.json(plantsWithTasks);
});

app.get('/api/plants/:id', (req, res) => {
  const plant = plants.find(p => p.id === req.params.id);
  if (!plant) return res.status(404).json({ error: 'Plant not found' });
  const plantTasks = tasks.filter(t => t.plantId === plant.id);
  const plantRecords = records.filter(r => r.plantId === plant.id);
  res.json({ ...plant, tasks: plantTasks, records: plantRecords });
});

app.post('/api/plants', (req, res) => {
  const { name, variety, photoColor, careSchedules } = req.body;
  const id = uuidv4();
  const today = new Date().toISOString().split('T')[0];
  const plant: Plant = { id, name, variety, photoColor: photoColor || '#A5D6A7', createdAt: today };
  plants.push(plant);

  const newTasks: CareTask[] = [];
  if (careSchedules && Array.isArray(careSchedules)) {
    careSchedules.forEach((schedule: { type: 'water' | 'fertilize' | 'prune'; intervalDays: number }) => {
      const task: CareTask = {
        id: uuidv4(),
        plantId: id,
        type: schedule.type,
        intervalDays: schedule.intervalDays,
        lastDone: today,
        nextDue: calcNextDue(today, schedule.intervalDays),
        completed: false,
      };
      tasks.push(task);
      newTasks.push(task);
    });
  }

  res.status(201).json({ ...plant, tasks: newTasks });
});

app.delete('/api/plants/:id', (req, res) => {
  const idx = plants.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Plant not found' });
  plants.splice(idx, 1);
  for (let i = tasks.length - 1; i >= 0; i--) {
    if (tasks[i].plantId === req.params.id) tasks.splice(i, 1);
  }
  for (let i = records.length - 1; i >= 0; i--) {
    if (records[i].plantId === req.params.id) records.splice(i, 1);
  }
  res.json({ success: true });
});

app.post('/api/tasks/:id/complete', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const today = new Date().toISOString().split('T')[0];
  task.lastDone = today;
  task.nextDue = calcNextDue(today, task.intervalDays);
  task.completed = true;
  task.lastCompletedAt = today;
  res.json(task);
});

app.post('/api/tasks/:id/postpone', (req, res) => {
  const task = tasks.find(t => t.id === req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  const due = new Date(task.nextDue);
  due.setDate(due.getDate() + 1);
  task.nextDue = due.toISOString().split('T')[0];
  res.json(task);
});

app.get('/api/notifications', (_req, res) => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const dueTasks = tasks
    .filter(t => !t.completed)
    .filter(t => {
      const due = new Date(t.nextDue);
      return due <= tomorrow;
    })
    .map(t => {
      const plant = plants.find(p => p.id === t.plantId);
      return { ...t, plantName: plant?.name || '未知' };
    });
  res.json(dueTasks);
});

app.get('/api/plants/:id/records', (req, res) => {
  const plantRecords = records.filter(r => r.plantId === req.params.id);
  res.json(plantRecords);
});

app.post('/api/plants/:id/records', (req, res) => {
  const { photoColor, notes } = req.body;
  const warmColors = ['#FFCC80', '#CE93D8', '#81D0B8'];
  const record: GrowthRecord = {
    id: uuidv4(),
    plantId: req.params.id,
    date: new Date().toISOString().split('T')[0],
    photoColor: photoColor || warmColors[Math.floor(Math.random() * warmColors.length)],
    notes: notes || '',
  };
  records.push(record);
  res.status(201).json(record);
});

app.get('/api/records', (_req, res) => {
  res.json(records);
});

app.get('/api/calendar/:year/:month', (req, res) => {
  const year = parseInt(req.params.year);
  const month = parseInt(req.params.month);
  const monthRecords = records.filter(r => {
    const d = new Date(r.date);
    return d.getFullYear() === year && d.getMonth() + 1 === month;
  });
  res.json(monthRecords);
});

app.listen(4000, () => {
  console.log('Garden Tracker server running on http://localhost:4000');
});
