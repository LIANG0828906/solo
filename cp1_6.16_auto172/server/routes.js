import express from 'express';
import cors from 'cors';
import {
  getUser,
  getTasks,
  completeTask,
  getCoffees,
  exchangeCoffee,
  getRank,
  getExchangeRecords,
} from './data.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const delay = (min = 300, max = 500) => 
  new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));

app.get('/api/user', async (_req, res) => {
  await delay();
  res.json(getUser());
});

app.get('/api/tasks', async (_req, res) => {
  await delay();
  res.json(getTasks());
});

app.post('/api/completeTask', async (req, res) => {
  await delay();
  const { taskId } = req.body;
  if (!taskId) {
    return res.status(400).json({ success: false, message: '缺少任务ID' });
  }
  const result = completeTask(taskId);
  res.json(result);
});

app.get('/api/coffees', async (_req, res) => {
  await delay();
  res.json(getCoffees());
});

app.post('/api/exchange', async (req, res) => {
  await delay();
  const { coffeeId } = req.body;
  if (!coffeeId) {
    return res.status(400).json({ success: false, message: '缺少咖啡券ID' });
  }
  const result = exchangeCoffee(coffeeId);
  res.json(result);
});

app.get('/api/rank', async (req, res) => {
  await delay();
  const { timeRange = 'all' } = req.query;
  const result = getRank(timeRange);
  res.json(result);
});

app.get('/api/exchangeRecords', async (req, res) => {
  await delay();
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 10;
  const result = getExchangeRecords(page, pageSize);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
