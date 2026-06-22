import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(bodyParser.json());

const COLOR_PALETTE = [
  '#E57373', '#F06292', '#BA68C8', '#9575CD',
  '#7986CB', '#64B5F6', '#4FC3F7', '#4DD0E1',
  '#4DB6AC', '#81C784', '#AED581', '#DCE775',
  '#FFD54F', '#FFB74D', '#FF8A65', '#A1887F',
  '#90A4AE', '#B39DDB', '#80CBC4', '#C5E1A5'
];

function readData() {
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function generateUniqueColor(existingColors) {
  const available = COLOR_PALETTE.filter(c => !existingColors.includes(c));
  if (available.length > 0) {
    return available[Math.floor(Math.random() * available.length)];
  }
  return `hsl(${Math.floor(Math.random() * 360)}, 70%, 70%)`;
}

function calculateDebts(activity) {
  const { participants, expenses, redPackets } = activity;
  const balances = {};
  
  participants.forEach(p => {
    balances[p.id] = 0;
  });

  expenses.forEach(expense => {
    const payer = expense.payerId;
    const total = expense.amount;
    
    balances[payer] = (balances[payer] || 0) + total;
    
    if (expense.splitType === 'equal') {
      const share = total / expense.participants.length;
      expense.participants.forEach(pId => {
        balances[pId] = (balances[pId] || 0) - share;
      });
    } else if (expense.splitType === 'custom' && expense.customRatios) {
      expense.participants.forEach(pId => {
        const ratio = expense.customRatios[pId] || 0;
        balances[pId] = (balances[pId] || 0) - total * ratio;
      });
    } else if (expense.splitType === 'full') {
      const fullPayer = expense.participants[0];
      balances[fullPayer] = (balances[fullPayer] || 0) - total;
    }
  });

  redPackets?.forEach(packet => {
    balances[packet.from] = (balances[packet.from] || 0) - packet.amount;
    balances[packet.to] = (balances[packet.to] || 0) + packet.amount;
  });

  const debtors = [];
  const creditors = [];
  
  Object.entries(balances).forEach(([id, balance]) => {
    if (balance < -0.01) {
      debtors.push({ id, amount: -balance });
    } else if (balance > 0.01) {
      creditors.push({ id, amount: balance });
    }
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts = [];
  let i = 0, j = 0;
  
  while (i < debtors.length && j < creditors.length) {
    const amount = Math.min(debtors[i].amount, creditors[j].amount);
    const hasRedPacket = redPackets?.some(p => 
      p.from === debtors[i].id && p.to === creditors[j].id
    );
    
    debts.push({
      from: debtors[i].id,
      to: creditors[j].id,
      amount: Math.round(amount * 100) / 100,
      hasRedPacket: hasRedPacket || false
    });
    
    debtors[i].amount -= amount;
    creditors[j].amount -= amount;
    
    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return debts;
}

app.get('/api/activities', (req, res) => {
  const activities = readData();
  res.json(activities);
});

app.post('/api/activities', (req, res) => {
  const { name, participants } = req.body;
  const activities = readData();
  
  const existingColors = activities.flatMap(a => a.participants.map(p => p.color));
  
  const newActivity = {
    id: uuidv4(),
    name,
    status: 'active',
    participants: participants.map((pName, index) => ({
      id: uuidv4(),
      name: pName,
      color: generateUniqueColor([...existingColors, ...Array(index).fill(0).map((_, i) => 
        activities.flatMap(a => a.participants.map(p => p.color))[i] || '')
      ]),
      confirmed: false
    })),
    expenses: [],
    redPackets: [],
    createdAt: Date.now()
  };
  
  activities.push(newActivity);
  writeData(activities);
  res.json(newActivity);
});

app.get('/api/activities/:id', (req, res) => {
  const activities = readData();
  const activity = activities.find(a => a.id === req.params.id);
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  res.json(activity);
});

app.put('/api/activities/:id', (req, res) => {
  const activities = readData();
  const index = activities.findIndex(a => a.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  activities[index] = { ...activities[index], ...req.body };
  writeData(activities);
  res.json(activities[index]);
});

app.delete('/api/activities/:id', (req, res) => {
  const activities = readData();
  const filtered = activities.filter(a => a.id !== req.params.id);
  if (filtered.length === activities.length) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  writeData(filtered);
  res.json({ success: true });
});

app.get('/api/expenses/:activityId', (req, res) => {
  const activities = readData();
  const activity = activities.find(a => a.id === req.params.activityId);
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  res.json(activity.expenses || []);
});

app.post('/api/expenses/:activityId', (req, res) => {
  const activities = readData();
  const activityIndex = activities.findIndex(a => a.id === req.params.activityId);
  if (activityIndex === -1) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  
  const newExpense = {
    id: uuidv4(),
    ...req.body,
    timestamp: Date.now()
  };
  
  activities[activityIndex].expenses = activities[activityIndex].expenses || [];
  activities[activityIndex].expenses.push(newExpense);
  writeData(activities);
  res.json(newExpense);
});

app.put('/api/expenses/:activityId/:expenseId', (req, res) => {
  const activities = readData();
  const activity = activities.find(a => a.id === req.params.activityId);
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  
  const expenseIndex = activity.expenses.findIndex(e => e.id === req.params.expenseId);
  if (expenseIndex === -1) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  
  activity.expenses[expenseIndex] = { ...activity.expenses[expenseIndex], ...req.body };
  writeData(activities);
  res.json(activity.expenses[expenseIndex]);
});

app.delete('/api/expenses/:activityId/:expenseId', (req, res) => {
  const activities = readData();
  const activity = activities.find(a => a.id === req.params.activityId);
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  
  const initialLength = activity.expenses.length;
  activity.expenses = activity.expenses.filter(e => e.id !== req.params.expenseId);
  
  if (activity.expenses.length === initialLength) {
    return res.status(404).json({ error: 'Expense not found' });
  }
  
  writeData(activities);
  res.json({ success: true });
});

app.post('/api/redpackets/:activityId', (req, res) => {
  const activities = readData();
  const activityIndex = activities.findIndex(a => a.id === req.params.activityId);
  if (activityIndex === -1) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  
  const newPacket = {
    id: uuidv4(),
    ...req.body,
    timestamp: Date.now()
  };
  
  activities[activityIndex].redPackets = activities[activityIndex].redPackets || [];
  activities[activityIndex].redPackets.push(newPacket);
  writeData(activities);
  res.json(newPacket);
});

app.get('/api/settle/:activityId', (req, res) => {
  const activities = readData();
  const activity = activities.find(a => a.id === req.params.activityId);
  if (!activity) {
    return res.status(404).json({ error: 'Activity not found' });
  }
  
  const debts = calculateDebts(activity);
  res.json(debts);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
