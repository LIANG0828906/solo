import express from 'express';
import cors from 'cors';
import { connectDB, queryDB } from './database.js';
import { generatePrediction } from './prediction.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

connectDB();

app.get('/api/projects', (_req, res) => {
  try {
    const projects = queryDB('SELECT * FROM projects ORDER BY created_at DESC');
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', (req, res) => {
  try {
    const { name, start_date, end_date, client_name, rate_type, rate_amount, progress = 0, status = 'in_progress' } = req.body;
    const result = queryDB(
      'INSERT INTO projects (name, start_date, end_date, client_name, rate_type, rate_amount, progress, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, start_date, end_date, client_name, rate_type, rate_amount, progress, status]
    );
    res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', (req, res) => {
  try {
    const project = queryDB('SELECT * FROM projects WHERE id = ?', [req.params.id]);
    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const income = queryDB('SELECT * FROM income WHERE project_id = ? ORDER BY income_date DESC', [req.params.id]);
    res.json({ ...project[0], income });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/income', (_req, res) => {
  try {
    const income = queryDB(`
      SELECT income.*, projects.name as project_name 
      FROM income 
      LEFT JOIN projects ON income.project_id = projects.id 
      ORDER BY income_date DESC
    `);
    res.json(income);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/income', (req, res) => {
  try {
    const { project_id, income_date, amount, invoice_number = '', payment_status = 'pending' } = req.body;
    const result = queryDB(
      'INSERT INTO income (project_id, income_date, amount, invoice_number, payment_status) VALUES (?, ?, ?, ?, ?)',
      [project_id, income_date, amount, invoice_number, payment_status]
    );
    res.status(201).json({ id: result.lastInsertRowid, ...req.body });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/income/:id', (req, res) => {
  try {
    queryDB('DELETE FROM income WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/overview/summary', (_req, res) => {
  try {
    const totalIncome = queryDB("SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE payment_status = 'received'")[0].total;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlyIncome = queryDB(
      "SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE payment_status = 'received' AND strftime('%Y-%m', income_date) = ?",
      [currentMonth]
    )[0].total;

    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthlyIncome = queryDB(
      "SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE payment_status = 'received' AND strftime('%Y-%m', income_date) = ?",
      [lastMonthStr]
    )[0].total;

    const monthBeforeLast = new Date(now.getFullYear(), now.getMonth() - 2, 1);
    const monthBeforeLastStr = `${monthBeforeLast.getFullYear()}-${String(monthBeforeLast.getMonth() + 1).padStart(2, '0')}`;
    const prev2MonthlyIncome = queryDB(
      "SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE payment_status = 'received' AND strftime('%Y-%m', income_date) = ?",
      [monthBeforeLastStr]
    )[0].total;

    res.json({
      totalIncome,
      monthlyIncome,
      prevMonthlyIncome,
      prev2MonthlyIncome,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/overview/prediction', (_req, res) => {
  try {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }

    const rawData = queryDB(
      "SELECT strftime('%Y-%m', income_date) as month, COALESCE(SUM(amount), 0) as total FROM income WHERE payment_status = 'received' GROUP BY strftime('%Y-%m', income_date) ORDER BY month"
    );

    const historical = months.map(m => {
      const found = rawData.find(r => r.month === m);
      return { month: m, total: found ? found.total : 0 };
    });

    const last6 = historical.slice(-6).filter(h => h.total > 0 || true);
    const predictions = generatePrediction(last6.length > 0 ? last6 : historical);

    res.json({
      historical,
      predictions,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
