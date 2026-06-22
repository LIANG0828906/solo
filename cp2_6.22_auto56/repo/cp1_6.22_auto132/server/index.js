import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

if (!global.localStorage) {
  const store = {};
  global.localStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(key => delete store[key]); }
  };
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const habits = new Map();
const rewards = new Map();
let user = {
  points: 0,
  totalPoints: 0,
  redeemedRewards: []
};

const loadData = () => {
  try {
    const savedHabits = global.localStorage.getItem('habits');
    const savedRewards = global.localStorage.getItem('rewards');
    const savedUser = global.localStorage.getItem('user');

    if (savedHabits) {
      const habitsArray = JSON.parse(savedHabits);
      habitsArray.forEach(h => habits.set(h.id, h));
    }

    if (savedRewards) {
      const rewardsArray = JSON.parse(savedRewards);
      rewardsArray.forEach(r => rewards.set(r.id, r));
    }

    if (savedUser) {
      user = JSON.parse(savedUser);
    }
  } catch (err) {
    console.error('Failed to load data:', err);
  }
};

const saveData = () => {
  try {
    global.localStorage.setItem('habits', JSON.stringify(Array.from(habits.values())));
    global.localStorage.setItem('rewards', JSON.stringify(Array.from(rewards.values())));
    global.localStorage.setItem('user', JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save data:', err);
  }
};

const initMockData = () => {
  if (habits.size === 0) {
    const mockHabits = [
      {
        id: uuidv4(),
        name: '每天阅读30分钟',
        description: '每天阅读书籍30分钟',
        targetDays: 7,
        checkins: [],
        currentStreak: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '每周健身3次',
        description: '每周去健身房锻炼3次',
        targetDays: 3,
        checkins: [],
        currentStreak: 0,
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '每天喝8杯水',
        description: '每天喝够8杯水，保持健康',
        targetDays: 7,
        checkins: [],
        currentStreak: 0,
        createdAt: new Date().toISOString()
      }
    ];
    mockHabits.forEach(h => habits.set(h.id, h));
  }

  if (rewards.size === 0) {
    const mockRewards = [
      {
        id: uuidv4(),
        name: '看一场电影',
        cost: 500,
        description: '去电影院看一场喜欢的电影',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '买小礼物',
        cost: 300,
        description: '给自己买一个小礼物',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '吃大餐',
        cost: 1000,
        description: '去餐厅吃一顿丰盛的大餐',
        createdAt: new Date().toISOString()
      }
    ];
    mockRewards.forEach(r => rewards.set(r.id, r));
  }

  saveData();
};

const calculatePoints = (streak) => {
  if (streak <= 7) return 10;
  if (streak <= 30) return 20;
  return 30;
};

const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const calculateStreak = (checkins) => {
  if (checkins.length === 0) return 0;

  const sortedDates = [...checkins].sort((a, b) => new Date(b) - new Date(a));
  const today = formatDate(new Date());
  const yesterday = formatDate(new Date(Date.now() - 86400000));

  if (sortedDates[0] !== today && sortedDates[0] !== yesterday) {
    return 0;
  }

  let streak = 1;
  for (let i = 1; i < sortedDates.length; i++) {
    const current = new Date(sortedDates[i - 1]);
    const prev = new Date(sortedDates[i]);
    const diffDays = (current - prev) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

app.get('/api/habits', (req, res) => {
  res.json(Array.from(habits.values()));
});

app.get('/api/habits/:id', (req, res) => {
  const habit = habits.get(req.params.id);
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  res.json(habit);
});

app.post('/api/habits', (req, res) => {
  const { name, description, targetDays } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  const newHabit = {
    id: uuidv4(),
    name,
    description: description || '',
    targetDays: targetDays || 7,
    checkins: [],
    currentStreak: 0,
    createdAt: new Date().toISOString()
  };

  habits.set(newHabit.id, newHabit);
  saveData();
  res.status(201).json(newHabit);
});

app.put('/api/habits/:id', (req, res) => {
  const habit = habits.get(req.params.id);
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  const { name, description, targetDays } = req.body;
  if (name !== undefined) habit.name = name;
  if (description !== undefined) habit.description = description;
  if (targetDays !== undefined) habit.targetDays = targetDays;

  saveData();
  res.json(habit);
});

app.delete('/api/habits/:id', (req, res) => {
  const deleted = habits.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Habit not found' });
  }
  saveData();
  res.json({ message: 'Habit deleted successfully' });
});

app.post('/api/habits/:id/checkin', (req, res) => {
  const habit = habits.get(req.params.id);
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found' });
  }

  const today = formatDate(new Date());
  if (habit.checkins.includes(today)) {
    return res.status(400).json({ error: 'Already checked in today' });
  }

  habit.checkins.push(today);
  habit.currentStreak = calculateStreak(habit.checkins);

  const pointsEarned = calculatePoints(habit.currentStreak);
  user.points += pointsEarned;
  user.totalPoints += pointsEarned;

  saveData();
  res.json({
    habit,
    pointsEarned,
    currentStreak: habit.currentStreak,
    totalPoints: user.points
  });
});

app.get('/api/rewards', (req, res) => {
  res.json(Array.from(rewards.values()));
});

app.get('/api/rewards/:id', (req, res) => {
  const reward = rewards.get(req.params.id);
  if (!reward) {
    return res.status(404).json({ error: 'Reward not found' });
  }
  res.json(reward);
});

app.post('/api/rewards', (req, res) => {
  const { name, cost, description } = req.body;
  if (!name || cost === undefined) {
    return res.status(400).json({ error: 'Name and cost are required' });
  }

  const newReward = {
    id: uuidv4(),
    name,
    cost: Number(cost),
    description: description || '',
    createdAt: new Date().toISOString()
  };

  rewards.set(newReward.id, newReward);
  saveData();
  res.status(201).json(newReward);
});

app.put('/api/rewards/:id', (req, res) => {
  const reward = rewards.get(req.params.id);
  if (!reward) {
    return res.status(404).json({ error: 'Reward not found' });
  }

  const { name, cost, description } = req.body;
  if (name !== undefined) reward.name = name;
  if (cost !== undefined) reward.cost = Number(cost);
  if (description !== undefined) reward.description = description;

  saveData();
  res.json(reward);
});

app.delete('/api/rewards/:id', (req, res) => {
  const deleted = rewards.delete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ error: 'Reward not found' });
  }
  saveData();
  res.json({ message: 'Reward deleted successfully' });
});

app.post('/api/rewards/:id/redeem', (req, res) => {
  const reward = rewards.get(req.params.id);
  if (!reward) {
    return res.status(404).json({ error: 'Reward not found' });
  }

  if (user.points < reward.cost) {
    return res.status(400).json({ error: 'Insufficient points' });
  }

  user.points -= reward.cost;
  user.redeemedRewards.push({
    rewardId: reward.id,
    rewardName: reward.name,
    cost: reward.cost,
    redeemedAt: new Date().toISOString()
  });

  saveData();
  res.json({
    message: 'Reward redeemed successfully',
    remainingPoints: user.points,
    redeemedReward: user.redeemedRewards[user.redeemedRewards.length - 1]
  });
});

app.get('/api/user/points', (req, res) => {
  res.json({
    points: user.points,
    totalPoints: user.totalPoints,
    redeemedRewards: user.redeemedRewards
  });
});

loadData();
initMockData();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
