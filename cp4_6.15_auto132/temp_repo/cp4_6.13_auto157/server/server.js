const express = require('express');
const Database = require('better-sqlite3');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const app = express();
const PORT = 3001;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json());

const dbPath = path.join(__dirname, '..', 'finance.db');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date)');
db.exec('CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category)');

app.post('/api/transactions', (req, res) => {
  const transactions = req.body;

  if (!Array.isArray(transactions)) {
    return res.status(400).json({ error: '请求体必须是数组' });
  }

  const insertStmt = db.prepare(`
    INSERT INTO transactions (id, date, amount, category, description)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((txns) => {
    for (const txn of txns) {
      const id = uuidv4();
      insertStmt.run(id, txn.date, txn.amount, txn.category, txn.description || null);
    }
  });

  try {
    insertMany(transactions);
    res.json({ success: true, count: transactions.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    const monthlyExpenseRow = db.prepare(`
      SELECT COALESCE(SUM(ABS(amount)), 0) as total
      FROM transactions
      WHERE amount < 0 AND strftime('%Y-%m', date) = ?
    `).get(currentMonthStr);
    const monthlyExpense = Math.round(monthlyExpenseRow.total * 100) / 100;

    const monthlyIncomeRow = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM transactions
      WHERE amount > 0 AND strftime('%Y-%m', date) = ?
    `).get(currentMonthStr);
    const monthlyIncome = Math.round(monthlyIncomeRow.total * 100) / 100;

    const balance = Math.round((monthlyIncome - monthlyExpense) * 100) / 100;

    const transactionCountRow = db.prepare('SELECT COUNT(*) as count FROM transactions').get();
    const transactionCount = transactionCountRow.count;

    const categoryRows = db.prepare(`
      SELECT category, COALESCE(SUM(ABS(amount)), 0) as amount
      FROM transactions
      WHERE amount < 0 AND strftime('%Y-%m', date) = ?
      GROUP BY category
      ORDER BY amount DESC
    `).all(currentMonthStr);

    const categoryStats = categoryRows.map(row => ({
      category: row.category,
      amount: Math.round(row.amount * 100) / 100,
      percentage: monthlyExpense > 0 ? Math.round((row.amount / monthlyExpense) * 10000) / 100 : 0
    }));

    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1 - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth() + 1;
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;

      const expenseRow = db.prepare(`
        SELECT COALESCE(SUM(ABS(amount)), 0) as total
        FROM transactions
        WHERE amount < 0 AND strftime('%Y-%m', date) = ?
      `).get(monthStr);

      const incomeRow = db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE amount > 0 AND strftime('%Y-%m', date) = ?
      `).get(monthStr);

      monthlyTrend.push({
        month: monthStr,
        expense: Math.round(expenseRow.total * 100) / 100,
        income: Math.round(incomeRow.total * 100) / 100
      });
    }

    res.json({
      monthlyExpense,
      monthlyIncome,
      balance,
      transactionCount,
      categoryStats,
      monthlyTrend
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
