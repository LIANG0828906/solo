import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '../data/data.json');

const router = express.Router();

const readData = () => {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

router.get('/', (_req, res) => {
  try {
    const data = readData();
    res.json(data.trips);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read trips' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const data = readData();
    const trip = data.trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read trip' });
  }
});

router.post('/', (req, res) => {
  try {
    const { destination, startDate, endDate, coverImage } = req.body;
    const data = readData();
    const newTrip = {
      id: `trip_${uuidv4().slice(0, 8)}`,
      destination,
      startDate,
      endDate,
      coverImage: coverImage || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beautiful%20travel%20destination%20scenic%20landscape&image_size=landscape_16_9',
      activities: [],
      locations: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.trips.unshift(newTrip);
    writeData(data);
    res.status(201).json(newTrip);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

router.put('/:id', (req, res) => {
  try {
    const data = readData();
    const index = data.trips.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    data.trips[index] = {
      ...data.trips[index],
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    writeData(data);
    res.json(data.trips[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const data = readData();
    const index = data.trips.findIndex(t => t.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    data.trips.splice(index, 1);
    writeData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

router.post('/:id/activities', (req, res) => {
  try {
    const data = readData();
    const trip = data.trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const newActivity = {
      id: `act_${uuidv4().slice(0, 8)}`,
      ...req.body,
    };
    trip.activities.push(newActivity);
    trip.updatedAt = new Date().toISOString();
    writeData(data);
    res.status(201).json(newActivity);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add activity' });
  }
});

router.put('/:id/activities/:activityId', (req, res) => {
  try {
    const data = readData();
    const trip = data.trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const actIndex = trip.activities.findIndex(a => a.id === req.params.activityId);
    if (actIndex === -1) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    trip.activities[actIndex] = {
      ...trip.activities[actIndex],
      ...req.body,
    };
    trip.updatedAt = new Date().toISOString();
    writeData(data);
    res.json(trip.activities[actIndex]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update activity' });
  }
});

router.delete('/:id/activities/:activityId', (req, res) => {
  try {
    const data = readData();
    const trip = data.trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const actIndex = trip.activities.findIndex(a => a.id === req.params.activityId);
    if (actIndex === -1) {
      return res.status(404).json({ error: 'Activity not found' });
    }
    trip.activities.splice(actIndex, 1);
    trip.updatedAt = new Date().toISOString();
    writeData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

router.put('/:id/activities/reorder', (req, res) => {
  try {
    const { activityIds, dayIndex } = req.body;
    const data = readData();
    const trip = data.trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    
    const dayActivities = trip.activities.filter(a => a.dayIndex === dayIndex);
    const otherActivities = trip.activities.filter(a => a.dayIndex !== dayIndex);
    
    const reorderedActivities = activityIds.map(id => 
      dayActivities.find(a => a.id === id)
    ).filter(Boolean);
    
    trip.activities = [...otherActivities, ...reorderedActivities];
    trip.updatedAt = new Date().toISOString();
    writeData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reorder activities' });
  }
});

router.post('/:id/locations', (req, res) => {
  try {
    const data = readData();
    const trip = data.trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const newLocation = {
      id: `loc_${uuidv4().slice(0, 8)}`,
      ...req.body,
    };
    trip.locations.push(newLocation);
    trip.updatedAt = new Date().toISOString();
    writeData(data);
    res.status(201).json(newLocation);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add location' });
  }
});

router.delete('/:id/locations/:locationId', (req, res) => {
  try {
    const data = readData();
    const trip = data.trips.find(t => t.id === req.params.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const locIndex = trip.locations.findIndex(l => l.id === req.params.locationId);
    if (locIndex === -1) {
      return res.status(404).json({ error: 'Location not found' });
    }
    trip.locations.splice(locIndex, 1);
    trip.updatedAt = new Date().toISOString();
    writeData(data);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete location' });
  }
});

export default router;
