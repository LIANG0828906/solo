import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import cron from 'node-cron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(__dirname, 'data');
const DEFECTS_FILE = path.join(DATA_DIR, 'defects.json');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return [];
  }
}

function writeJsonFile(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

app.post('/api/defects', (req, res) => {
  const start = Date.now();
  try {
    const { imageName, imageUrl, annotations } = req.body;
    const defects = readJsonFile(DEFECTS_FILE);

    const record = {
      id: uuidv4(),
      imageName: imageName || 'unknown',
      imageUrl: imageUrl || '',
      annotations: Array.isArray(annotations) ? annotations : [],
      createdAt: new Date().toISOString(),
    };

    defects.push(record);
    writeJsonFile(DEFECTS_FILE, defects);

    const elapsed = Date.now() - start;
    console.log(`[POST /api/defects] ${elapsed}ms`);
    res.json({ success: true, id: record.id });
  } catch (err) {
    console.error('Error saving defect:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/defects', (req, res) => {
  const start = Date.now();
  try {
    const defects = readJsonFile(DEFECTS_FILE);
    const elapsed = Date.now() - start;
    console.log(`[GET /api/defects] ${elapsed}ms, count: ${defects.length}`);
    res.json(defects);
  } catch (err) {
    console.error('Error getting defects:', err);
    res.status(500).json([]);
  }
});

app.get('/api/trend', (req, res) => {
  const start = Date.now();
  try {
    const defects = readJsonFile(DEFECTS_FILE);
    const days = 30;
    const trendData = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const categoryCounts = {};
    const categories = ['裂痕', '划痕', '色差', '污渍', '其他'];
    categories.forEach((c) => (categoryCounts[c] = 0));

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const nextDate = new Date(d);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayDefects = defects.filter((record) => {
        const recordDate = new Date(record.createdAt);
        return recordDate >= d && recordDate < nextDate;
      });

      const totalInspected = dayDefects.length > 0 ? dayDefects.length * 2 : 0;
      const defectCount = dayDefects.reduce(
        (sum, r) => sum + (r.annotations?.length || 0),
        0
      );
      const defectRate = totalInspected > 0
        ? Number(((defectCount / totalInspected) * 100).toFixed(2))
        : 0;

      trendData.push({
        date: dateStr,
        totalInspected,
        defectCount,
        defectRate,
      });

      dayDefects.forEach((record) => {
        record.annotations?.forEach((ann) => {
          if (categoryCounts[ann.category] !== undefined) {
            categoryCounts[ann.category]++;
          }
        });
      });
    }

    const totalCategoryCount = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
    const categoryData = categories.map((cat) => ({
      category: cat,
      count: categoryCounts[cat],
      percentage: totalCategoryCount > 0
        ? Number(((categoryCounts[cat] / totalCategoryCount) * 100).toFixed(1))
        : 0,
    }));

    const elapsed = Date.now() - start;
    console.log(`[GET /api/trend] ${elapsed}ms`);
    res.json({ trendData, categoryData });
  } catch (err) {
    console.error('Error getting trend:', err);
    res.status(500).json({ trendData: [], categoryData: [] });
  }
});

app.get('/api/reports', (req, res) => {
  const start = Date.now();
  try {
    let reports = readJsonFile(REPORTS_FILE);

    if (reports.length === 0) {
      reports = generateMockReports();
      writeJsonFile(REPORTS_FILE, reports);
    }

    reports.sort((a, b) => new Date(b.date) - new Date(a.date));

    const elapsed = Date.now() - start;
    console.log(`[GET /api/reports] ${elapsed}ms, count: ${reports.length}`);
    res.json({ reports });
  } catch (err) {
    console.error('Error getting reports:', err);
    res.status(500).json({ reports: [] });
  }
});

function generateMockReports() {
  const reports = [];
  const today = new Date();
  const categories = ['裂痕', '划痕', '色差', '污渍', '其他'];

  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const total = 80 + Math.floor(Math.random() * 40);
    const defectCount = Math.floor(total * (0.015 + Math.random() * 0.05));

    let remaining = defectCount;
    const breakdown = categories.map((cat, idx) => {
      let count;
      if (idx === categories.length - 1) {
        count = remaining;
      } else {
        count = Math.floor(defectCount * (0.1 + Math.random() * 0.25));
        remaining -= count;
      }
      return {
        category: cat,
        count: Math.max(0, count),
        percentage: defectCount > 0
          ? Number(((Math.max(0, count) / defectCount) * 100).toFixed(1))
          : 0,
      };
    });

    const totalCount = breakdown.reduce((sum, b) => sum + b.count, 0);

    reports.push({
      id: uuidv4(),
      date: d.toISOString().split('T')[0],
      totalInspected: total,
      defectCount: totalCount,
      defectRate: Number(((totalCount / total) * 100).toFixed(2)),
      categoryBreakdown: breakdown,
      createdAt: d.toISOString(),
    });
  }
  return reports;
}

function generateDailyReport() {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);
  const dateStr = yesterday.toISOString().split('T')[0];

  const defects = readJsonFile(DEFECTS_FILE);
  const nextDay = new Date(yesterday);
  nextDay.setDate(nextDay.getDate() + 1);

  const dayDefects = defects.filter((record) => {
    const recordDate = new Date(record.createdAt);
    return recordDate >= yesterday && recordDate < nextDay;
  });

  const totalInspected = dayDefects.length;
  let totalDefectCount = 0;
  const categoryCounts = {};
  const categories = ['裂痕', '划痕', '色差', '污渍', '其他'];
  categories.forEach((c) => (categoryCounts[c] = 0));

  dayDefects.forEach((record) => {
    record.annotations?.forEach((ann) => {
      totalDefectCount++;
      if (categoryCounts[ann.category] !== undefined) {
        categoryCounts[ann.category]++;
      }
    });
  });

  const categoryBreakdown = categories.map((cat) => ({
    category: cat,
    count: categoryCounts[cat],
    percentage: totalDefectCount > 0
      ? Number(((categoryCounts[cat] / totalDefectCount) * 100).toFixed(1))
      : 0,
  }));

  const report = {
    id: uuidv4(),
    date: dateStr,
    totalInspected,
    defectCount: totalDefectCount,
    defectRate: totalInspected > 0
      ? Number(((totalDefectCount / totalInspected) * 100).toFixed(2))
      : 0,
    categoryBreakdown,
    createdAt: new Date().toISOString(),
  };

  const reports = readJsonFile(REPORTS_FILE);
  const existingIdx = reports.findIndex((r) => r.date === dateStr);
  if (existingIdx >= 0) {
    reports[existingIdx] = report;
  } else {
    reports.push(report);
  }
  writeJsonFile(REPORTS_FILE, reports);

  console.log(`[CRON] Daily report generated for ${dateStr}`);
  return report;
}

cron.schedule('0 0 * * *', () => {
  generateDailyReport();
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  POST /api/defects');
  console.log('  GET  /api/defects');
  console.log('  GET  /api/trend');
  console.log('  GET  /api/reports');
});
