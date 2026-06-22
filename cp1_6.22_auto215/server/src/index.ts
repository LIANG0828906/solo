import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface ActivityStep {
  name: string;
  order: number;
}

interface Activity {
  id: string;
  name: string;
  steps: ActivityStep[];
  createdAt: string;
}

interface EventRecord {
  id: string;
  activityId: string;
  stepName: string;
  userId: string;
  userType: 'new' | 'returning' | 'high-value';
  timestamp: number;
}

const app = express();
app.use(cors());
app.use(express.json());

const activities: Map<string, Activity> = new Map();
const events: EventRecord[] = [];

const userTypes: Array<'new' | 'returning' | 'high-value'> = ['new', 'returning', 'high-value'];

function createDefaultActivity(): Activity {
  const activity: Activity = {
    id: uuidv4(),
    name: '双十一促销活动',
    steps: [
      { name: '浏览', order: 0 },
      { name: '点击', order: 1 },
      { name: '加购', order: 2 },
      { name: '支付', order: 3 },
    ],
    createdAt: new Date().toISOString(),
  };
  activities.set(activity.id, activity);
  return activity;
}

function simulateEvent(): EventRecord {
  const activityList = Array.from(activities.values());
  const activity = activityList[Math.floor(Math.random() * activityList.length)];
  const step = activity.steps[Math.floor(Math.random() * activity.steps.length)];
  const userType = userTypes[Math.floor(Math.random() * userTypes.length)];
  const event: EventRecord = {
    id: uuidv4(),
    activityId: activity.id,
    stepName: step.name,
    userId: uuidv4(),
    userType,
    timestamp: Date.now(),
  };
  return event;
}

const defaultActivity = createDefaultActivity();

setInterval(() => {
  if (activities.size > 0) {
    const event = simulateEvent();
    events.push(event);
    if (events.length > 10000) {
      events.splice(0, events.length - 10000);
    }
  }
}, 1000);

app.post('/api/events', (req, res) => {
  const { activityId, stepName, userId, userType } = req.body;
  if (!activityId || !stepName) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const event: EventRecord = {
    id: uuidv4(),
    activityId,
    stepName,
    userId: userId || uuidv4(),
    userType: userType || 'new',
    timestamp: Date.now(),
  };
  events.push(event);
  res.json({ success: true, event });
});

app.get('/api/events', (req, res) => {
  const { activityId, limit } = req.query;
  let filtered = events;
  if (activityId) {
    filtered = filtered.filter((e) => e.activityId === activityId);
  }
  const count = limit ? parseInt(limit as string, 10) : 500;
  res.json(filtered.slice(-count));
});

app.get('/api/funnel', (req, res) => {
  const { activityId } = req.query;
  if (!activityId) {
    res.status(400).json({ error: 'activityId is required' });
    return;
  }
  const activity = activities.get(activityId as string);
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }
  const filtered = events.filter((e) => e.activityId === activityId);
  res.json({
    activityId,
    activityName: activity.name,
    steps: activity.steps,
    events: filtered,
    totalEvents: filtered.length,
  });
});

app.get('/api/activities', (_req, res) => {
  const list = Array.from(activities.values());
  res.json(list);
});

app.post('/api/activities', (req, res) => {
  const { name, steps } = req.body;
  if (!name || !steps || !Array.isArray(steps) || steps.length < 3 || steps.length > 6) {
    res.status(400).json({ error: 'Name and 3-6 steps are required' });
    return;
  }
  const activity: Activity = {
    id: uuidv4(),
    name,
    steps: steps.map((name: string, i: number) => ({ name, order: i })),
    createdAt: new Date().toISOString(),
  };
  activities.set(activity.id, activity);
  res.json(activity);
});

app.get('/api/stats', (_req, res) => {
  const totalEvents = events.length;
  const totalActivities = activities.size;
  res.json({ totalEvents, totalActivities });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
