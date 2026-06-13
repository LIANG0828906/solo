import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';

interface Habit {
  id: string;
  name: string;
  frequency: number;
  timePeriod: 'morning' | 'afternoon' | 'evening' | 'anytime';
  reminderTime?: string;
  color: string;
  icon: string;
  createdAt: string;
  streak: number;
  badges: number[];
  checkins: Checkin[];
}

interface Checkin {
  habitId: string;
  date: string;
  completed: boolean;
}

interface DailyStats {
  date: string;
  completed: number;
  total: number;
}

interface MonthlyTrend {
  month: string;
  completionRate: number;
}

interface StatsData {
  heatmap: DailyStats[];
  monthlyTrend: MonthlyTrend[];
  totalHabits: number;
  todayCompleted: number;
  bestStreak: number;
}

const app = express();
const PORT = 3001;
const MILESTONES = [3, 7, 14, 30, 60, 100];

app.use(cors());
app.use(express.json());

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateId(): string {
  return `habit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getDatesBetween(start: Date, end: Date): Date[] {
  const dates: Date[] = [];
  const current = new Date(start);
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

const sampleHabits: Habit[] = [
  {
    id: generateId(),
    name: '每天阅读30分钟',
    frequency: 7,
    timePeriod: 'evening',
    reminderTime: '21:00',
    color: '#4ecdc4',
    icon: '📚',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    streak: 5,
    badges: [3],
    checkins: [],
  },
  {
    id: generateId(),
    name: '跑步3公里',
    frequency: 4,
    timePeriod: 'morning',
    reminderTime: '07:00',
    color: '#ff6b6b',
    icon: '🏃',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    streak: 3,
    badges: [3],
    checkins: [],
  },
  {
    id: generateId(),
    name: '喝8杯水',
    frequency: 7,
    timePeriod: 'anytime',
    reminderTime: undefined,
    color: '#6c5ce7',
    icon: '💧',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    streak: 8,
    badges: [3, 7],
    checkins: [],
  },
  {
    id: generateId(),
    name: '冥想10分钟',
    frequency: 5,
    timePeriod: 'morning',
    reminderTime: '08:00',
    color: '#aa96da',
    icon: '🧘',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    streak: 2,
    badges: [],
    checkins: [],
  },
];

function generateSampleCheckins(habits: Habit[]): Habit[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return habits.map(habit => {
    const created = new Date(habit.createdAt);
    const endDate = new Date(today);
    const dates = getDatesBetween(created, endDate);
    const checkins: Checkin[] = [];

    dates.forEach((date, idx) => {
      const dateStr = formatDate(date);
      const isToday = dateStr === formatDate(today);
      const isYesterday = dateStr === formatDate(new Date(today.getTime() - 24 * 60 * 60 * 1000));

      if (isToday) return;

      const probability = idx >= dates.length - habit.streak && !isYesterday ? 1 : 0.7;
      const completed = Math.random() < probability;

      if (completed || Math.random() < 0.85) {
        checkins.push({
          habitId: habit.id,
          date: dateStr,
          completed,
        });
      }
    });

    return { ...habit, checkins };
  });
}

const habitsData: Habit[] = generateSampleCheckins(sampleHabits);

function calculateStreak(habit: Habit): number {
  const sortedCheckins = [...habit.checkins]
    .filter(c => c.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedCheckins.length === 0) return 0;

  let streak = 1;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentDate = new Date(sortedCheckins[0].date);
  currentDate.setHours(0, 0, 0, 0);

  const diffToday = Math.floor((today.getTime() - currentDate.getTime()) / (24 * 60 * 60 * 1000));
  if (diffToday > 1) return 0;

  for (let i = 1; i < sortedCheckins.length; i++) {
    const nextDate = new Date(sortedCheckins[i].date);
    nextDate.setHours(0, 0, 0, 0);
    const diff = Math.floor((currentDate.getTime() - nextDate.getTime()) / (24 * 60 * 60 * 1000));

    if (diff === 1) {
      streak++;
      currentDate = nextDate;
    } else if (diff > 1) {
      break;
    }
  }

  return streak;
}

function updateMilestones(habit: Habit): number[] {
  const streak = calculateStreak(habit);
  const newBadges = [...habit.badges];
  MILESTONES.forEach(m => {
    if (streak >= m && !newBadges.includes(m)) {
      newBadges.push(m);
    }
  });
  return newBadges.sort((a, b) => a - b);
}

app.get('/api/habits', (_req: Request, res: Response<Habit[]>) => {
  const updated = habitsData.map(h => ({
    ...h,
    streak: calculateStreak(h),
    badges: updateMilestones(h),
  }));
  res.json(updated);
});

app.post('/api/habits', (req: Request<{}, {}, Omit<Habit, 'id' | 'createdAt' | 'streak' | 'badges' | 'checkins'>>, res: Response<Habit>) => {
  const { name, frequency, timePeriod, reminderTime, color, icon } = req.body;

  if (!name || typeof name !== 'string') {
    res.status(400).send({ error: 'Name is required' } as any);
    return;
  }

  const newHabit: Habit = {
    id: generateId(),
    name: name.trim(),
    frequency: Math.max(1, Math.min(7, Number(frequency) || 7)),
    timePeriod,
    reminderTime,
    color,
    icon,
    createdAt: new Date().toISOString(),
    streak: 0,
    badges: [],
    checkins: [],
  };

  habitsData.push(newHabit);
  res.status(201).json(newHabit);
});

app.put('/api/habits/:id', (req: Request<{ id: string }, {}, Partial<Habit>>, res: Response<Habit>) => {
  const { id } = req.params;
  const index = habitsData.findIndex(h => h.id === id);

  if (index === -1) {
    res.status(404).send({ error: 'Habit not found' } as any);
    return;
  }

  const current = habitsData[index];
  const updated: Habit = { ...current, ...req.body };
  habitsData[index] = updated;
  res.json(updated);
});

app.delete('/api/habits/:id', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const index = habitsData.findIndex(h => h.id === id);

  if (index === -1) {
    res.status(404).send({ error: 'Habit not found' } as any);
    return;
  }

  habitsData.splice(index, 1);
  res.status(204).send();
});

app.post('/api/checkin', (req: Request<{}, {}, { habitId: string; date: string; completed?: boolean }>, res: Response<Habit>) => {
  const { habitId, date, completed } = req.body;

  if (!habitId || !date) {
    res.status(400).send({ error: 'habitId and date are required' } as any);
    return;
  }

  const index = habitsData.findIndex(h => h.id === habitId);

  if (index === -1) {
    res.status(404).send({ error: 'Habit not found' } as any);
    return;
  }

  const habit = habitsData[index];
  const checkinIndex = habit.checkins.findIndex(c => c.date === date);
  const isCompleted = completed ?? true;

  if (checkinIndex >= 0) {
    habit.checkins[checkinIndex].completed = isCompleted;
  } else {
    habit.checkins.push({
      habitId,
      date,
      completed: isCompleted,
    });
  }

  habit.streak = calculateStreak(habit);
  habit.badges = updateMilestones(habit);

  res.json(habit);
});

app.get('/api/stats', (_req: Request, res: Response<StatsData>) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = formatDate(today);

  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 365);

  const allDates = getDatesBetween(startDate, today);
  const heatmap: DailyStats[] = allDates.map(date => {
    const dateStr = formatDate(date);
    const habitsOnDate = habitsData.filter(h => new Date(h.createdAt) <= date);
    let completed = 0;
    const total = habitsOnDate.length;

    habitsOnDate.forEach(habit => {
      const checkin = habit.checkins.find(c => c.date === dateStr);
      if (checkin?.completed) completed++;
    });

    return { date: dateStr, completed, total };
  });

  const monthMap = new Map<string, { completed: number; total: number }>();

  heatmap.forEach(day => {
    if (day.total === 0) return;
    const monthKey = day.date.slice(0, 7);
    const current = monthMap.get(monthKey) || { completed: 0, total: 0 };
    current.completed += day.completed;
    current.total += day.total;
    monthMap.set(monthKey, current);
  });

  const monthlyTrend: MonthlyTrend[] = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, data]) => ({
      month,
      completionRate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));

  const todayCompleted = habitsData.filter(h => {
    const c = h.checkins.find(c => c.date === todayStr);
    return c?.completed;
  }).length;

  const bestStreak = habitsData.reduce((max, h) => Math.max(max, h.streak), 0);

  res.json({
    heatmap,
    monthlyTrend,
    totalHabits: habitsData.length,
    todayCompleted,
    bestStreak,
  });
});

app.listen(PORT, () => {
  console.log(`Habit Tracker API server running on http://localhost:${PORT}`);
});
