import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let schedules = [
  {
    id: uuidv4(),
    title: '团队周会',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    notes: '<strong>会议议程：</strong><ul><li>项目进度汇报</li><li>下周计划讨论</li></ul>',
    completed: false,
    priority: 'high',
    duration: 60
  },
  {
    id: uuidv4(),
    title: '代码审查',
    date: new Date().toISOString().split('T')[0],
    startTime: '14:00',
    endTime: '15:30',
    notes: '审查新功能的PR',
    completed: false,
    priority: 'medium',
    duration: 90
  }
];

const getDaySchedules = (dateStr) => {
  return schedules
    .filter(s => s.date === dateStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

const timeToMinutes = (time) => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes) => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const findFreeSlots = (dateStr, duration) => {
  const daySchedules = getDaySchedules(dateStr);
  const slots = [];
  const workStart = 8 * 60;
  const workEnd = 20 * 60;
  
  let lastEnd = workStart;
  
  for (const schedule of daySchedules) {
    const start = timeToMinutes(schedule.startTime);
    if (start - lastEnd >= duration) {
      slots.push({
        startTime: minutesToTime(lastEnd),
        endTime: minutesToTime(Math.min(lastEnd + duration, workEnd))
      });
    }
    lastEnd = Math.max(lastEnd, timeToMinutes(schedule.endTime));
  }
  
  if (workEnd - lastEnd >= duration) {
    slots.push({
      startTime: minutesToTime(lastEnd),
      endTime: minutesToTime(Math.min(lastEnd + duration, workEnd))
    });
  }
  
  return slots;
};

const getDateDensity = (dateStr) => {
  const daySchedules = getDaySchedules(dateStr);
  let totalMinutes = 0;
  for (const schedule of daySchedules) {
    totalMinutes += timeToMinutes(schedule.endTime) - timeToMinutes(schedule.startTime);
  }
  return totalMinutes;
};

app.get('/api/schedules', (req, res) => {
  const { month, year } = req.query;
  
  if (month && year) {
    const filtered = schedules.filter(s => {
      const d = new Date(s.date);
      return d.getMonth() === Number(month) && d.getFullYear() === Number(year);
    });
    return res.json(filtered);
  }
  
  res.json(schedules);
});

app.post('/api/schedules', (req, res) => {
  const { title, date, startTime, endTime, notes, priority, duration } = req.body;
  
  if (!title || !date || !startTime || !endTime) {
    return res.status(400).json({ error: '缺少必要字段' });
  }
  
  const newSchedule = {
    id: uuidv4(),
    title,
    date,
    startTime,
    endTime,
    notes: notes || '',
    completed: false,
    priority: priority || 'medium',
    duration: duration || timeToMinutes(endTime) - timeToMinutes(startTime)
  };
  
  schedules.push(newSchedule);
  res.status(201).json(newSchedule);
});

app.put('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  const index = schedules.findIndex(s => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: '日程不存在' });
  }
  
  const updated = { ...schedules[index], ...req.body };
  schedules[index] = updated;
  res.json(updated);
});

app.delete('/api/schedules/:id', (req, res) => {
  const { id } = req.params;
  const index = schedules.findIndex(s => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: '日程不存在' });
  }
  
  schedules.splice(index, 1);
  res.json({ message: '删除成功' });
});

app.patch('/api/schedules/:id/complete', (req, res) => {
  const { id } = req.params;
  const index = schedules.findIndex(s => s.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: '日程不存在' });
  }
  
  schedules[index].completed = !schedules[index].completed;
  res.json(schedules[index]);
});

app.get('/api/smart-suggest', (req, res) => {
  const { date, duration } = req.query;
  
  if (!date || !duration) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const dur = Number(duration);
  
  const today = new Date(date);
  const suggestions = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const slots = findFreeSlots(dateStr, dur);
    const density = getDateDensity(dateStr);
    
    if (slots.length > 0) {
      suggestions.push({
        date: dateStr,
        density,
        slots: slots.slice(0, 3)
      });
    }
  }
  
  suggestions.sort((a, b) => a.density - b.density);
  res.json(suggestions.slice(0, 5));
});

app.get('/api/monthly-stats', (req, res) => {
  const { year, month } = req.query;
  
  if (!year || !month) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const y = Number(year);
  const m = Number(month);
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const stats = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySchedules = getDaySchedules(dateStr);
    const completed = daySchedules.filter(s => s.completed).length;
    const total = daySchedules.length;
    
    stats.push({
      date: dateStr,
      total,
      completed,
      rate: total > 0 ? completed / total : 0
    });
  }
  
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
