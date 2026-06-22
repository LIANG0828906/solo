import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const readData = () => {
  const data = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(data);
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const generateId = () => {
  return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
};

app.get('/api/trips', (req, res) => {
  try {
    const data = readData();
    res.json(data.trips);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.get('/api/trips/:id', (req, res) => {
  try {
    const data = readData();
    const trip = data.trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.post('/api/trips', (req, res) => {
  try {
    const data = readData();
    const newTrip = {
      id: generateId(),
      title: req.body.title || '新旅行',
      destination: req.body.destination || '',
      startDate: req.body.startDate || '',
      endDate: req.body.endDate || '',
      coverImage: req.body.coverImage || '',
      description: req.body.description || '',
      days: []
    };
    data.trips.unshift(newTrip);
    writeData(data);
    res.status(201).json(newTrip);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

app.put('/api/trips/:id', (req, res) => {
  try {
    const data = readData();
    const index = data.trips.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    data.trips[index] = { ...data.trips[index], ...req.body };
    writeData(data);
    res.json(data.trips[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

app.delete('/api/trips/:id', (req, res) => {
  try {
    const data = readData();
    const index = data.trips.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    data.trips.splice(index, 1);
    writeData(data);
    res.json({ message: 'Trip deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

app.put('/api/trips/:id/days', (req, res) => {
  try {
    const data = readData();
    const tripIndex = data.trips.findIndex(t => t.id === req.params.id);
    if (tripIndex === -1) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    data.trips[tripIndex].days = req.body.days || [];
    writeData(data);
    res.json(data.trips[tripIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update days' });
  }
});

app.post('/api/trips/:id/days/:date/activities', (req, res) => {
  try {
    const data = readData();
    const tripIndex = data.trips.findIndex(t => t.id === req.params.id);
    if (tripIndex === -1) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    const date = req.params.date;
    let dayIndex = data.trips[tripIndex].days.findIndex(d => d.date === date);
    
    if (dayIndex === -1) {
      data.trips[tripIndex].days.push({ date, activities: [] });
      dayIndex = data.trips[tripIndex].days.length - 1;
    }
    
    const newActivity = {
      id: generateId(),
      time: req.body.time || '',
      place: req.body.place || '',
      description: req.body.description || '',
      notes: req.body.notes || '',
      lat: req.body.lat || 0,
      lng: req.body.lng || 0
    };
    
    data.trips[tripIndex].days[dayIndex].activities.push(newActivity);
    data.trips[tripIndex].days[dayIndex].activities.sort((a, b) => a.time.localeCompare(b.time));
    
    writeData(data);
    res.status(201).json(newActivity);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

app.put('/api/trips/:id/activities/:activityId', (req, res) => {
  try {
    const data = readData();
    const tripIndex = data.trips.findIndex(t => t.id === req.params.id);
    if (tripIndex === -1) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    let foundActivity = null;
    let dayIndex = -1;
    let activityIndex = -1;
    
    for (let i = 0; i < data.trips[tripIndex].days.length; i++) {
      const actIdx = data.trips[tripIndex].days[i].activities.findIndex(a => a.id === req.params.activityId);
      if (actIdx !== -1) {
        dayIndex = i;
        activityIndex = actIdx;
        foundActivity = data.trips[tripIndex].days[i].activities[actIdx];
        break;
      }
    }
    
    if (!foundActivity) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    data.trips[tripIndex].days[dayIndex].activities[activityIndex] = {
      ...foundActivity,
      ...req.body
    };
    
    writeData(data);
    res.json(data.trips[tripIndex].days[dayIndex].activities[activityIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

app.delete('/api/trips/:id/activities/:activityId', (req, res) => {
  try {
    const data = readData();
    const tripIndex = data.trips.findIndex(t => t.id === req.params.id);
    if (tripIndex === -1) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    let dayIndex = -1;
    let activityIndex = -1;
    
    for (let i = 0; i < data.trips[tripIndex].days.length; i++) {
      const actIdx = data.trips[tripIndex].days[i].activities.findIndex(a => a.id === req.params.activityId);
      if (actIdx !== -1) {
        dayIndex = i;
        activityIndex = actIdx;
        break;
      }
    }
    
    if (activityIndex === -1) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    
    data.trips[tripIndex].days[dayIndex].activities.splice(activityIndex, 1);
    
    writeData(data);
    res.json({ message: 'Activity deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
