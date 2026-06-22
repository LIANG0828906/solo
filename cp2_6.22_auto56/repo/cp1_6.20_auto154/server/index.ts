import express from 'express';
import cors from 'cors';
import {
  getHeatmapData,
  getScheduleData,
  updateScheduleItem,
  regenerateAllData,
  generateBookings,
} from './utils/dataGenerator';
import fs from 'fs/promises';
import path from 'path';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/heatmap', async (req, res) => {
  try {
    const period = (req.query.period as 'week' | 'month') || 'week';
    if (period !== 'week' && period !== 'month') {
      return res.status(400).json({ error: 'Invalid period. Must be "week" or "month"' });
    }
    const data = await getHeatmapData(period);
    res.json(data);
  } catch (error) {
    console.error('Error fetching heatmap data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/schedule', async (_req, res) => {
  try {
    const data = await getScheduleData();
    res.json(data);
  } catch (error) {
    console.error('Error fetching schedule data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/schedule/update', async (req, res) => {
  try {
    const { itemId, newDate, newTimeSlot } = req.body;
    
    if (!itemId || !newDate || typeof newTimeSlot !== 'number') {
      return res.status(400).json({ 
        error: 'Missing required fields: itemId, newDate, newTimeSlot' 
      });
    }

    const result = await updateScheduleItem(itemId, newDate, newTimeSlot);
    res.json(result);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/bookings', async (_req, res) => {
  try {
    const DATA_DIR = path.resolve(process.cwd(), 'data');
    const BOOKINGS_FILE = path.join(DATA_DIR, 'bookings.json');
    
    try {
      await fs.access(DATA_DIR);
    } catch {
      await fs.mkdir(DATA_DIR, { recursive: true });
    }

    let bookings;
    try {
      const content = await fs.readFile(BOOKINGS_FILE, 'utf-8');
      bookings = JSON.parse(content);
    } catch {
      bookings = generateBookings();
      await fs.writeFile(BOOKINGS_FILE, JSON.stringify(bookings, null, 2), 'utf-8');
    }

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/refresh', async (_req, res) => {
  try {
    await regenerateAllData();
    res.json({ success: true, message: 'All data regenerated successfully' });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
