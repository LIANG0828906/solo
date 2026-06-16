import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Trip, TripCreateInput, TripReport, DayPlan, ExpenseCategory } from '../types';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let trips: Trip[] = [];

function generateDays(startDate: string, endDate: string): DayPlan[] {
  const days: DayPlan[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    days.push({
      date: d.toISOString().split('T')[0],
      activities: []
    });
  }
  
  return days;
}

app.post('/api/trips', (req, res) => {
  const { destination, startDate, endDate, totalBudget }: TripCreateInput = req.body;
  
  if (!destination || !startDate || !endDate || totalBudget === undefined) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  
  const trip: Trip = {
    id: uuidv4(),
    destination,
    startDate,
    endDate,
    totalBudget,
    days: generateDays(startDate, endDate),
    createdAt: new Date().toISOString()
  };
  
  trips.push(trip);
  res.status(201).json(trip);
});

app.get('/api/trips', (_req, res) => {
  res.json(trips);
});

app.get('/api/trips/:id', (req, res) => {
  const trip = trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: '旅行计划不存在' });
  }
  res.json(trip);
});

app.put('/api/trips/:id', (req, res) => {
  const index = trips.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '旅行计划不存在' });
  }
  
  const updatedTrip: Trip = { ...trips[index], ...req.body, id: trips[index].id };
  trips[index] = updatedTrip;
  res.json(updatedTrip);
});

app.delete('/api/trips/:id', (req, res) => {
  const index = trips.findIndex(t => t.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '旅行计划不存在' });
  }
  
  trips.splice(index, 1);
  res.status(204).send();
});

app.get('/api/trips/:id/report', (req, res) => {
  const trip = trips.find(t => t.id === req.params.id);
  if (!trip) {
    return res.status(404).json({ error: '旅行计划不存在' });
  }
  
  const categoryBreakdown: Record<ExpenseCategory, number> = {
    transport: 0,
    accommodation: 0,
    food: 0,
    ticket: 0,
    other: 0
  };
  
  let totalSpent = 0;
  const dailySummary = trip.days.map(day => {
    let dayTotal = 0;
    day.activities.forEach(act => {
      dayTotal += act.cost;
      categoryBreakdown[act.category] += act.cost;
    });
    totalSpent += dayTotal;
    return {
      date: day.date,
      total: dayTotal,
      count: day.activities.length
    };
  });
  
  const report: TripReport = {
    trip,
    totalSpent,
    categoryBreakdown,
    dailySummary
  };
  
  res.json(report);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
