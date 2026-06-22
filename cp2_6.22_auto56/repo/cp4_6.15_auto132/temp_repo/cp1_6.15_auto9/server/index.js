const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const categories = ['餐饮', '交通', '购物', '娱乐', '其他'];
const paymentMethods = ['现金', '微信', '支付宝', '银行卡', '信用卡'];
const categoryWeights = [0.30, 0.15, 0.25, 0.15, 0.15];
const categoryAmountRanges = {
  '餐饮': [15, 200],
  '交通': [5, 150],
  '购物': [50, 800],
  '娱乐': [30, 300],
  '其他': [10, 500]
};

function getRandomCategory() {
  const rand = Math.random();
  let cumulative = 0;
  for (let i = 0; i < categories.length; i++) {
    cumulative += categoryWeights[i];
    if (rand < cumulative) return categories[i];
  }
  return categories[categories.length - 1];
}

function getRandomAmount(category) {
  const [min, max] = categoryAmountRanges[category];
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function getRandomPaymentMethod() {
  return paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
}

function getRandomDateWithinLastSixMonths() {
  const now = new Date();
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(now.getMonth() - 6);
  const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
  return new Date(randomTime).toISOString();
}

function generateTransactions(count) {
  const transactions = [];
  const descriptions = {
    '餐饮': ['午餐', '晚餐', '早餐', '外卖', '聚餐', '咖啡', '奶茶', '夜宵'],
    '交通': ['地铁', '公交', '打车', '加油', '停车费', '高铁票', '共享单车'],
    '购物': ['衣服', '日用品', '电子产品', '书籍', '食品', '化妆品', '家居'],
    '娱乐': ['电影票', '游戏充值', 'KTV', '健身', '演出门票', '视频会员'],
    '其他': ['话费', '水电费', '房租', '医疗', '礼物', '学习课程']
  };

  for (let i = 0; i < count; i++) {
    const category = getRandomCategory();
    const descList = descriptions[category];
    transactions.push({
      id: uuidv4(),
      category,
      amount: getRandomAmount(category),
      description: descList[Math.floor(Math.random() * descList.length)],
      paymentMethod: getRandomPaymentMethod(),
      date: getRandomDateWithinLastSixMonths(),
      createdAt: new Date().toISOString()
    });
  }

  transactions.sort((a, b) => new Date(b.date) - new Date(a.date));
  return transactions;
}

function generateGoals() {
  const now = new Date();
  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d.toISOString();
  };

  return [
    {
      id: uuidv4(),
      name: '旅行基金',
      targetAmount: 10000,
      currentAmount: 3500,
      deadline: addMonths(now, 8),
      createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      name: '新电脑',
      targetAmount: 8000,
      currentAmount: 5200,
      deadline: addMonths(now, 4),
      createdAt: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: uuidv4(),
      name: '应急储备金',
      targetAmount: 30000,
      currentAmount: 12000,
      deadline: addMonths(now, 12),
      createdAt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

let transactions = generateTransactions(1000);
let goals = generateGoals();

app.get('/api/transactions', (req, res) => {
  const { category, startDate, endDate, page = 1, limit = 30 } = req.query;
  const pageNum = parseInt(page, 10);
  const limitNum = parseInt(limit, 10);

  let filtered = [...transactions];

  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }

  if (startDate) {
    const start = new Date(startDate).getTime();
    filtered = filtered.filter(t => new Date(t.date).getTime() >= start);
  }

  if (endDate) {
    const end = new Date(endDate).getTime();
    filtered = filtered.filter(t => new Date(t.date).getTime() <= end);
  }

  const total = filtered.length;
  const startIndex = (pageNum - 1) * limitNum;
  const data = filtered.slice(startIndex, startIndex + limitNum);

  res.json({ data, total });
});

app.post('/api/transactions/delete', (req, res) => {
  const { id } = req.body;
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions.splice(index, 1);
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

app.get('/api/statistics/monthly', (req, res) => {
  const { month } = req.query;
  if (!month) {
    return res.status(400).json({ error: 'month参数是必需的 (格式: YYYY-MM)' });
  }

  const [year, monthNum] = month.split('-').map(Number);
  const monthStart = new Date(year, monthNum - 1, 1);
  const monthEnd = new Date(year, monthNum, 0, 23, 59, 59, 999);

  const monthTransactions = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= monthStart && d <= monthEnd;
  });

  const totalIncome = 0;
  const totalExpense = monthTransactions.reduce((sum, t) => sum + t.amount, 0);

  const categoryStats = {};
  categories.forEach(cat => {
    categoryStats[cat] = {
      amount: 0,
      count: 0
    };
  });

  monthTransactions.forEach(t => {
    categoryStats[t.category].amount += t.amount;
    categoryStats[t.category].count += 1;
  });

  const paymentStats = {};
  paymentMethods.forEach(pm => {
    paymentStats[pm] = {
      amount: 0,
      count: 0
    };
  });

  monthTransactions.forEach(t => {
    paymentStats[t.paymentMethod].amount += t.amount;
    paymentStats[t.paymentMethod].count += 1;
  });

  const dailyStats = {};
  const daysInMonth = monthEnd.getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    dailyStats[`${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`] = {
      amount: 0,
      count: 0
    };
  }

  monthTransactions.forEach(t => {
    const d = new Date(t.date);
    const dayKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (dailyStats[dayKey]) {
      dailyStats[dayKey].amount += t.amount;
      dailyStats[dayKey].count += 1;
    }
  });

  res.json({
    month,
    totalIncome,
    totalExpense: Math.round(totalExpense * 100) / 100,
    transactionCount: monthTransactions.length,
    categoryStats,
    paymentStats,
    dailyStats
  });
});

app.get('/api/goals', (req, res) => {
  res.json(goals);
});

app.post('/api/goals', (req, res) => {
  const { name, targetAmount, deadline } = req.body;

  if (!name || !targetAmount || !deadline) {
    return res.status(400).json({ error: 'name, targetAmount, deadline 都是必需的' });
  }

  const newGoal = {
    id: uuidv4(),
    name,
    targetAmount: parseFloat(targetAmount),
    currentAmount: 0,
    deadline,
    createdAt: new Date().toISOString()
  };

  goals.push(newGoal);
  res.json(newGoal);
});

app.get('/api/goals/:id/progress', (req, res) => {
  const { id } = req.params;
  const goal = goals.find(g => g.id === id);

  if (!goal) {
    return res.status(404).json({ error: '目标不存在' });
  }

  const progressPercent = goal.targetAmount > 0
    ? Math.round((goal.currentAmount / goal.targetAmount) * 10000) / 100
    : 0;

  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

  let estimatedDate = null;
  if (goal.currentAmount > 0) {
    const createdAt = new Date(goal.createdAt).getTime();
    const now = Date.now();
    const daysPassed = (now - createdAt) / (1000 * 60 * 60 * 24);
    if (daysPassed > 0 && remainingAmount > 0) {
      const savedPerDay = goal.currentAmount / daysPassed;
      const daysRemaining = remainingAmount / savedPerDay;
      estimatedDate = new Date(now + daysRemaining * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  res.json({
    id: goal.id,
    name: goal.name,
    targetAmount: goal.targetAmount,
    currentAmount: goal.currentAmount,
    remainingAmount: Math.round(remainingAmount * 100) / 100,
    progressPercent,
    deadline: goal.deadline,
    estimatedDate,
    createdAt: goal.createdAt
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
