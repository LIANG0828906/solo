import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isToday,
  isWithinInterval,
  parseISO,
  addHours,
  differenceInMinutes,
} from 'date-fns';

interface MedicationPlan {
  id: string;
  petId: string;
  drugName: string;
  dosage: string;
  timesPerDay: number;
  startDate: string;
  endDate: string;
  notes: string;
}

interface MedicationLog {
  id: string;
  petId: string;
  planId: string;
  drugName: string;
  dosage: string;
  scheduledTime: string;
  actualTime: string | null;
  status: 'pending' | 'completed' | 'skipped';
}

interface Pet {
  id: string;
  name: string;
  breed: string;
  avatar: string;
  age: number;
  weight: number;
}

interface Database {
  pets: Pet[];
  medicationPlans: MedicationPlan[];
  medicationLogs: MedicationLog[];
}

const app = express();
app.use(cors());
app.use(express.json());

const db: Database = {
  pets: [
    { id: 'pet-1', name: '小白', breed: '金毛犬', avatar: '🐕', age: 3, weight: 25 },
    { id: 'pet-2', name: '咪咪', breed: '英国短毛猫', avatar: '🐱', age: 2, weight: 4.5 },
    { id: 'pet-3', name: '豆豆', breed: '泰迪犬', avatar: '🐩', age: 5, weight: 6 },
  ],
  medicationPlans: [
    {
      id: 'plan-1',
      petId: 'pet-1',
      drugName: '关节营养片',
      dosage: '2片',
      timesPerDay: 2,
      startDate: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      notes: '饭后服用',
    },
    {
      id: 'plan-2',
      petId: 'pet-2',
      drugName: '化毛膏',
      dosage: '5g',
      timesPerDay: 1,
      startDate: format(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      notes: '每日早晨',
    },
    {
      id: 'plan-3',
      petId: 'pet-3',
      drugName: '益生菌',
      dosage: '1袋',
      timesPerDay: 3,
      startDate: format(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      endDate: format(new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      notes: '混合在食物中',
    },
    {
      id: 'plan-4',
      petId: 'pet-1',
      drugName: '维生素B',
      dosage: '1片',
      timesPerDay: 1,
      startDate: '2024-01-01',
      endDate: '2024-01-15',
      notes: '已过期计划示例',
    },
  ],
  medicationLogs: [],
};

function generateDailyScheduledTimes(plan: MedicationPlan, date: Date): Date[] {
  const times: Date[] = [];
  const interval = 24 / plan.timesPerDay;
  const startHour = 8;
  for (let i = 0; i < plan.timesPerDay; i++) {
    const scheduled = new Date(date);
    scheduled.setHours(startHour + i * interval, 0, 0, 0);
    times.push(scheduled);
  }
  return times;
}

function ensureTodayLogs() {
  const today = new Date();
  db.medicationPlans.forEach((plan) => {
    const startDate = parseISO(plan.startDate);
    const endDate = parseISO(plan.endDate);
    endDate.setHours(23, 59, 59, 999);

    if (!isWithinInterval(today, { start: startDate, end: endDate })) {
      return;
    }

    const scheduledTimes = generateDailyScheduledTimes(plan, today);
    scheduledTimes.forEach((scheduledTime) => {
      const exists = db.medicationLogs.find(
        (log) =>
          log.planId === plan.id &&
          isToday(parseISO(log.scheduledTime)) &&
          differenceInMinutes(parseISO(log.scheduledTime), scheduledTime) === 0
      );
      if (!exists) {
        db.medicationLogs.push({
          id: uuidv4(),
          petId: plan.petId,
          planId: plan.id,
          drugName: plan.drugName,
          dosage: plan.dosage,
          scheduledTime: scheduledTime.toISOString(),
          actualTime: null,
          status: 'pending',
        });
      }
    });
  });
}

app.get('/api/pets', (req, res) => {
  ensureTodayLogs();
  const petsWithTodayMeds = db.pets.map((pet) => {
    const todayLogs = db.medicationLogs.filter(
      (log) => log.petId === pet.id && isToday(parseISO(log.scheduledTime))
    );
    const plans = db.medicationPlans.filter((p) => p.petId === pet.id);
    return {
      ...pet,
      todayMedications: todayLogs,
      activePlans: plans.filter((p) => {
        const end = parseISO(p.endDate);
        end.setHours(23, 59, 59, 999);
        return end >= new Date();
      }).length,
    };
  });
  res.json(petsWithTodayMeds);
});

app.get('/api/pets/:id', (req, res) => {
  ensureTodayLogs();
  const pet = db.pets.find((p) => p.id === req.params.id);
  if (!pet) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }
  const plans = db.medicationPlans.filter((p) => p.petId === pet.id);
  const logs = db.medicationLogs
    .filter((l) => l.petId === pet.id)
    .sort((a, b) => new Date(b.scheduledTime).getTime() - new Date(a.scheduledTime).getTime());
  res.json({ pet, plans, logs });
});

app.post('/api/pets', (req, res) => {
  const { name, breed, avatar, age, weight } = req.body;
  const newPet: Pet = {
    id: uuidv4(),
    name,
    breed,
    avatar,
    age,
    weight,
  };
  db.pets.push(newPet);
  res.json(newPet);
});

app.put('/api/pets/:id', (req, res) => {
  const index = db.pets.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }
  db.pets[index] = { ...db.pets[index], ...req.body };
  res.json(db.pets[index]);
});

app.delete('/api/pets/:id', (req, res) => {
  const petIndex = db.pets.findIndex((p) => p.id === req.params.id);
  if (petIndex === -1) {
    res.status(404).json({ error: 'Pet not found' });
    return;
  }
  db.pets.splice(petIndex, 1);
  db.medicationPlans = db.medicationPlans.filter((p) => p.petId !== req.params.id);
  db.medicationLogs = db.medicationLogs.filter((l) => l.petId !== req.params.id);
  res.json({ success: true });
});

app.post('/api/plans', (req, res) => {
  const { petId, drugName, dosage, timesPerDay, startDate, endDate, notes } = req.body;
  const newPlan: MedicationPlan = {
    id: uuidv4(),
    petId,
    drugName,
    dosage,
    timesPerDay,
    startDate,
    endDate,
    notes,
  };
  db.medicationPlans.push(newPlan);
  ensureTodayLogs();
  res.json(newPlan);
});

app.put('/api/plans/:id', (req, res) => {
  const index = db.medicationPlans.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }
  db.medicationPlans[index] = { ...db.medicationPlans[index], ...req.body };
  res.json(db.medicationPlans[index]);
});

app.delete('/api/plans/:id', (req, res) => {
  const index = db.medicationPlans.findIndex((p) => p.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Plan not found' });
    return;
  }
  db.medicationPlans.splice(index, 1);
  res.json({ success: true });
});

app.post('/api/medication', (req, res) => {
  const { logId, status } = req.body;
  const log = db.medicationLogs.find((l) => l.id === logId);
  if (!log) {
    res.status(404).json({ error: 'Log not found' });
    return;
  }
  log.status = status;
  log.actualTime = status === 'completed' ? new Date().toISOString() : null;
  res.json(log);
});

app.get('/api/stats/:id', (req, res) => {
  const petId = req.params.id;
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const petPlans = db.medicationPlans.filter((p) => p.petId === petId);

  const dailyStats = days.map((day) => {
    let totalScheduled = 0;
    let completed = 0;

    petPlans.forEach((plan) => {
      const startDate = parseISO(plan.startDate);
      const endDate = parseISO(plan.endDate);
      endDate.setHours(23, 59, 59, 999);

      if (isWithinInterval(day, { start: startDate, end: endDate }) || day > now) {
        return;
      }

      if (day <= now && isWithinInterval(day, { start: startDate, end: endDate })) {
        totalScheduled += plan.timesPerDay;
      }
    });

    const dayLogs = db.medicationLogs.filter((log) => {
      const logDate = parseISO(log.scheduledTime);
      return (
        log.petId === petId &&
        format(logDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      );
    });

    completed = dayLogs.filter((l) => l.status === 'completed').length;
    if (totalScheduled === 0) totalScheduled = dayLogs.length;

    return {
      date: format(day, 'MM-dd'),
      dayName: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][day.getDay() === 0 ? 6 : day.getDay() - 1],
      completed,
      total: totalScheduled,
      rate: totalScheduled > 0 ? Math.round((completed / totalScheduled) * 100) : 0,
    };
  });

  const totalCompleted = dailyStats.reduce((sum, d) => sum + d.completed, 0);
  const totalScheduled = dailyStats.reduce((sum, d) => sum + d.total, 0);
  const overallRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  res.json({
    dailyStats,
    overallRate,
    totalCompleted,
    totalScheduled,
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
