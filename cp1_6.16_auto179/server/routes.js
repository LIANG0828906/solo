import { Router } from 'express';
import db, {
  getUsers,
  getTransactionsByUserId,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBudgetsByUserId,
  updateBudget,
  createBudget,
  calculateBalance,
  calculateMonthlySummary,
} from './db.js';

const router = Router();

router.get('/api/users', (req, res) => {
  res.json(getUsers());
});

router.get('/api/transactions', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  res.json(getTransactionsByUserId(userId));
});

router.post('/api/transactions', (req, res) => {
  const { userId, date, type, category, amount, note } = req.body;
  if (!userId || !date || !type || !category || !amount) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const transaction = createTransaction({
    userId,
    date,
    type,
    category,
    amount: parseFloat(amount),
    note: note || '',
  });

  const balance = calculateBalance(userId);
  const now = new Date();
  const summary = calculateMonthlySummary(userId, now.getFullYear(), now.getMonth() + 1);
  const budgets = getBudgetsByUserId(userId);

  res.json({
    transaction,
    balance,
    monthlySummary: summary,
    budgets,
  });
});

router.put('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const updated = updateTransaction(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const { userId } = updated;
  const balance = calculateBalance(userId);
  const now = new Date();
  const summary = calculateMonthlySummary(userId, now.getFullYear(), now.getMonth() + 1);
  const budgets = getBudgetsByUserId(userId);

  res.json({
    transaction: updated,
    balance,
    monthlySummary: summary,
    budgets,
  });
});

router.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const allTransactions = db.data.transactions || [];
  const target = allTransactions.find((t) => t.id === id);

  if (!target) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const deleted = deleteTransaction(id);
  if (!deleted) {
    return res.status(404).json({ error: 'Transaction not found' });
  }

  const userId = target.userId;
  const balance = calculateBalance(userId);
  const now = new Date();
  const summary = calculateMonthlySummary(userId, now.getFullYear(), now.getMonth() + 1);
  const budgets = getBudgetsByUserId(userId);

  res.json({
    transaction: deleted,
    balance,
    monthlySummary: summary,
    budgets,
  });
});

router.get('/api/budgets', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  res.json(getBudgetsByUserId(userId));
});

router.put('/api/budgets/:id', (req, res) => {
  const { id } = req.params;
  const updated = updateBudget(id, req.body);
  if (!updated) {
    return res.status(404).json({ error: 'Budget not found' });
  }
  res.json(updated);
});

router.post('/api/budgets', (req, res) => {
  const { userId, category, amount, month } = req.body;
  if (!userId || !category || !amount || !month) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const budget = createBudget({
    userId,
    category,
    amount: parseFloat(amount),
    month,
  });
  res.json(budget);
});

router.get('/api/summary', (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: 'userId is required' });
  }
  const balance = calculateBalance(userId);
  const now = new Date();
  const monthlySummary = calculateMonthlySummary(userId, now.getFullYear(), now.getMonth() + 1);

  const trendData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const s = calculateMonthlySummary(userId, y, m);
    trendData.push({
      month: `${y}-${String(m).padStart(2, '0')}`,
      monthLabel: `${m}月`,
      income: s.income,
      expense: s.expense,
    });
  }

  const budgets = getBudgetsByUserId(userId);
  const transactions = getTransactionsByUserId(userId);
  const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const currentMonthExpenses = transactions.filter(
    (t) => t.type === 'expense' && t.date.startsWith(currentMonthPrefix)
  );

  const budgetWithUsage = budgets.map((b) => {
    const used = currentMonthExpenses
      .filter((t) => t.category === b.category)
      .reduce((sum, t) => sum + t.amount, 0);
    return { ...b, used };
  });

  res.json({
    balance,
    monthlySummary,
    trendData,
    budgets: budgetWithUsage,
    transactions,
  });
});

export default router;
