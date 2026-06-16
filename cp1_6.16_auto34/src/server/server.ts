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

  const body = req.body;
  const errors: string[] = [];
  const validCategories: ExpenseCategory[] = ['transport', 'accommodation', 'food', 'ticket', 'other'];

  if ('destination' in body) {
    if (typeof body.destination !== 'string' || body.destination.trim() === '') {
      errors.push('destination 不能为空字符串');
    }
  }

  if ('startDate' in body) {
    if (typeof body.startDate !== 'string' || isNaN(Date.parse(body.startDate))) {
      errors.push('startDate 必须是有效的日期格式');
    }
  }

  if ('endDate' in body) {
    if (typeof body.endDate !== 'string' || isNaN(Date.parse(body.endDate))) {
      errors.push('endDate 必须是有效的日期格式');
    }
  }

  if ('totalBudget' in body) {
    if (typeof body.totalBudget !== 'number' || body.totalBudget < 0) {
      errors.push('totalBudget 必须是 >= 0 的数字');
    }
  }

  if ('days' in body) {
    if (!Array.isArray(body.days)) {
      errors.push('days 必须是数组');
    } else {
      body.days.forEach((day: any, dayIndex: number) => {
        if (day === null || typeof day !== 'object') {
          errors.push('days[' + dayIndex + '] 必须是对象');
          return;
        }
        if (!('date' in day) || !('activities' in day)) {
          errors.push('days[' + dayIndex + '] 必须有 date 和 activities 字段');
        }
        if ('activities' in day && !Array.isArray(day.activities)) {
          errors.push('days[' + dayIndex + '].activities 必须是数组');
        } else if ('activities' in day && Array.isArray(day.activities)) {
          day.activities.forEach((activity: any, actIndex: number) => {
            if (activity === null || typeof activity !== 'object') {
              errors.push('days[' + dayIndex + '].activities[' + actIndex + '] 必须是对象');
              return;
            }
            const requiredFields = ['id', 'time', 'location', 'cost', 'category'];
            requiredFields.forEach(field => {
              if (!(field in activity)) {
                errors.push('days[' + dayIndex + '].activities[' + actIndex + '] 缺少 ' + field + ' 字段');
              }
            });
            if ('cost' in activity && typeof activity.cost !== 'number') {
              errors.push('days[' + dayIndex + '].activities[' + actIndex + '].cost 必须是数字');
            }
            if ('category' in activity && !validCategories.includes(activity.category)) {
              errors.push('days[' + dayIndex + '].activities[' + actIndex + '].category 必须是有效的类别');
            }
          });
        }
      });
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({ error: errors.join(', ') });
  }

  const updatedTrip = { ...trips[index] };

  if ('destination' in body) {
    updatedTrip.destination = body.destination;
  }
  if ('startDate' in body) {
    updatedTrip.startDate = body.startDate;
  }
  if ('endDate' in body) {
    updatedTrip.endDate = body.endDate;
  }
  if ('totalBudget' in body) {
    updatedTrip.totalBudget = body.totalBudget;
  }
  if ('days' in body) {
    updatedTrip.days = body.days;
  }

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
  console.log('服务器运行在 http://localhost:' + PORT);
});
