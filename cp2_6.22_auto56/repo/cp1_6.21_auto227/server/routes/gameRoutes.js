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

const writeRecords = (records) => {
  ensureDataFile();
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
};

router.post('/record', (req, res) => {
  try {
    const { time, date, totalPairs, correctCount, totalAttempts, accuracy, maxCombo } = req.body;

    if (!time || !date || totalPairs === undefined || correctCount === undefined) {
      return res.status(400).json({ error: '缺少必要字段' });
    }

    const records = readRecords();
    const newRecord = {
      id: Date.now(),
      time: parseFloat(time),
      date,
      totalPairs: parseInt(totalPairs),
      correctCount: parseInt(correctCount),
      totalAttempts: parseInt(totalAttempts) || 0,
      accuracy: parseFloat(accuracy) || 0,
      maxCombo: parseInt(maxCombo) || 0,
      createdAt: new Date().toISOString(),
    };

    records.push(newRecord);
    writeRecords(records);

    res.status(201).json({
      success: true,
      message: '游戏记录已保存',
      record: newRecord,
    });
  } catch (err) {
    console.error('保存游戏记录失败:', err);
    res.status(500).json({ error: '保存游戏记录失败' });
  }
});

router.get('/records', (req, res) => {
  try {
    const records = readRecords();
    const sorted = records.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({
      success: true,
      total: sorted.length,
      records: sorted,
    });
  } catch (err) {
    console.error('获取游戏记录失败:', err);
    res.status(500).json({ error: '获取游戏记录失败' });
  }
});

router.delete('/reset', (req, res) => {
  try {
    writeRecords([]);
    res.json({
      success: true,
      message: '所有游戏记录已清空',
    });
  } catch (err) {
    console.error('重置记录失败:', err);
    res.status(500).json({ error: '重置记录失败' });
  }
});

export default router;
