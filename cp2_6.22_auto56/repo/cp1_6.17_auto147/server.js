import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let entries = [];

const generateMockData = () => {
  const moods = ['very_happy', 'happy', 'neutral', 'down', 'terrible'];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const mood = moods[Math.floor(Math.random() * moods.length)];
    const taskCount = Math.floor(Math.random() * 4) + 1;
    const tasks = [];
    for (let j = 0; j < taskCount; j++) {
      tasks.push({
        id: uuidv4(),
        text: `任务 ${j + 1}`,
        completed: Math.random() > 0.5
      });
    }
    entries.push({
      id: uuidv4(),
      date: dateStr,
      mood: mood,
      title: `日记 ${dateStr}`,
      content: `这是 ${dateStr} 的日记内容。\n\n今天过得还不错。`,
      tasks: tasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
};

generateMockData();

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

app.get('/api/entries', async (req, res) => {
  await delay(100);
  const { month } = req.query;
  if (!month) {
    return res.json(entries);
  }
  const filtered = entries.filter(e => e.date.startsWith(month));
  res.json(filtered);
});

app.get('/api/entries/:id', async (req, res) => {
  await delay(80);
  const entry = entries.find(e => e.id === req.params.id);
  if (!entry) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  res.json(entry);
});

app.post('/api/entries', async (req, res) => {
  await delay(120);
  const newEntry = {
    id: uuidv4(),
    ...req.body,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  entries.unshift(newEntry);
  res.status(201).json(newEntry);
});

app.put('/api/entries/:id', async (req, res) => {
  await delay(100);
  const index = entries.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  entries[index] = {
    ...entries[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };
  res.json(entries[index]);
});

app.delete('/api/entries/:id', async (req, res) => {
  await delay(80);
  const index = entries.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Entry not found' });
  }
  entries.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/stats', async (req, res) => {
  await delay(150);
  const { start, end } = req.query;
  if (!start || !end) {
    return res.status(400).json({ error: 'start and end are required' });
  }
  const moodScore = {
    very_happy: 10,
    happy: 8,
    neutral: 6,
    down: 4,
    terrible: 2
  };
  const startDate = new Date(start);
  const endDate = new Date(end);
  const stats = [];
  const filtered = entries.filter(e => {
    const d = new Date(e.date);
    return d >= startDate && d <= endDate;
  });
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const dayEntries = filtered.filter(e => e.date === dateStr);
    const moodValues = dayEntries.map(e => moodScore[e.mood] || 6);
    const avgMood = moodValues.length > 0
      ? moodValues.reduce((a, b) => a + b, 0) / moodValues.length
      : null;
    const totalTasks = dayEntries.reduce((acc, e) => acc + (e.tasks?.length || 0), 0);
    const completedTasks = dayEntries.reduce(
      (acc, e) => acc + (e.tasks?.filter(t => t.completed).length || 0),
      0
    );
    const completedTaskList = dayEntries.flatMap(e =>
      (e.tasks || []).filter(t => t.completed).map(t => ({
        id: t.id,
        text: t.text,
        date: e.date,
        entryId: e.id
      }))
    );
    stats.push({
      date: dateStr,
      avgMood: avgMood,
      totalTasks: totalTasks,
      completedTasks: completedTasks,
      completedTaskList: completedTaskList
    });
  }
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
