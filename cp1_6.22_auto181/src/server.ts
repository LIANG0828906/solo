import express from 'express';
import cors from 'cors';
import {
  getActivities,
  getActivityById,
  getHourlyData,
  getHeatmapData,
  generateActivity,
  initializeSampleData
} from './dataSimulator';
import type { ActivityCreate } from './types';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

initializeSampleData();

app.get('/api/activities', (_req, res) => {
  const activities = getActivities();
  res.json(activities);
});

app.get('/api/activities/:id', (req, res) => {
  const { id } = req.params;
  const activity = getActivityById(id);
  
  if (!activity) {
    res.status(404).json({ error: 'Activity not found' });
    return;
  }

  const hourlyData = getHourlyData(id);
  const heatmapData = getHeatmapData(id);

  res.json({
    ...activity,
    hourlyData,
    heatmapData
  });
});

app.post('/api/activities', (req, res) => {
  try {
    const data: ActivityCreate = req.body;
    
    if (!data.name || !data.type || !data.budgetLimit || !data.startTime || !data.endTime) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const activity = generateActivity(data);
    res.status(201).json(activity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create activity' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
