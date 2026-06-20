import express from 'express';
import cors from 'cors';
import {
  addFeedback,
  getAllFeedbacks,
  getEmotionTrend,
  getAllActions,
  updateAction,
  addAction,
} from './data.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/feedback', (req, res) => {
  const { good, bad, improve } = req.body;
  if (!good || !bad || !improve) {
    res.status(400).json({ error: '所有字段均为必填' });
    return;
  }
  const feedback = addFeedback(good, bad, improve);
  res.json({ success: true, feedback });
});

app.get('/api/feedback', (_req, res) => {
  const feedbacks = getAllFeedbacks();
  res.json(feedbacks);
});

app.get('/api/emotion-trend', (_req, res) => {
  const trend = getEmotionTrend();
  res.json(trend);
});

app.get('/api/actions', (_req, res) => {
  const actions = getAllActions();
  res.json(actions);
});

app.put('/api/actions/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const action = updateAction(id, updates);
  if (!action) {
    res.status(404).json({ error: '行动项未找到' });
    return;
  }
  res.json({ success: true, action });
});

app.post('/api/actions', (req, res) => {
  const { description, assignee, priority, dueDate, completed } = req.body;
  if (!description) {
    res.status(400).json({ error: '描述为必填项' });
    return;
  }
  const action = addAction({
    description,
    assignee: assignee || '',
    priority: priority || 'medium',
    dueDate: dueDate || '',
    completed: completed || false,
  });
  res.json({ success: true, action });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
