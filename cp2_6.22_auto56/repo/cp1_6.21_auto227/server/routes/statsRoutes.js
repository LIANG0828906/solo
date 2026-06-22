import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const DATA_FILE = path.join(__dirname, '..', 'data', 'gameRecords.json');

const ensureDataFile = () => {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
  }
};

const readRecords = () => {
  ensureDataFile();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

router.get('/week', (req, res) => {
  try {
    const records = readRecords();

    const result = [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    for (let i = 6; i >= 0; i--) {
      const day = new Date(today);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);

      const dayRecords = records.filter((r) => {
        const recordDate = new Date(r.date);
        return recordDate >= dayStart && recordDate <= dayEnd;
      });

      const count = dayRecords.length;
      let avgTime = 0;
      let avgAccuracy = 0;

      if (count > 0) {
        const totalTime = dayRecords.reduce((sum, r) => sum + (r.time || 0), 0);
        const totalAcc = dayRecords.reduce((sum, r) => sum + (r.accuracy || 0), 0);
        avgTime = parseFloat((totalTime / count).toFixed(1));
        avgAccuracy = parseFloat((totalAcc / count).toFixed(1));
      }

      result.push({
        date: `${day.getMonth() + 1}/${day.getDate()}`,
        avgTime,
        avgAccuracy,
        count,
      });
    }

    res.json(result);
  } catch (err) {
    console.error('获取周统计数据失败:', err);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

router.get('/summary', (req, res) => {
  try {
    const records = readRecords();
    const totalGames = records.length;

    if (totalGames === 0) {
      return res.json({
        totalGames: 0,
        avgTime: 0,
        avgAccuracy: 0,
        bestTime: 0,
        totalCorrect: 0,
      });
    }

    const totalTime = records.reduce((sum, r) => sum + (r.time || 0), 0);
    const totalAcc = records.reduce((sum, r) => sum + (r.accuracy || 0), 0);
    const times = records.map((r) => r.time).filter((t) => t > 0);
    const bestTime = times.length > 0 ? Math.min(...times) : 0;
    const totalCorrect = records.reduce((sum, r) => sum + (r.correctCount || 0), 0);

    res.json({
      totalGames,
      avgTime: parseFloat((totalTime / totalGames).toFixed(1)),
      avgAccuracy: parseFloat((totalAcc / totalGames).toFixed(1)),
      bestTime: parseFloat(bestTime.toFixed(1)),
      totalCorrect,
    });
  } catch (err) {
    console.error('获取统计摘要失败:', err);
    res.status(500).json({ error: '获取统计摘要失败' });
  }
});

export default router;
