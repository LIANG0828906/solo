import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { SaveData, Hero } from '../types';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

let saveData: SaveData | null = null;

app.post('/api/save', (req, res) => {
  try {
    const { hero, floor } = req.body as { hero: Hero; floor: number };

    saveData = {
      id: uuidv4(),
      hero,
      floor,
      timestamp: Date.now(),
    };

    res.json({ success: true, saveId: saveData.id });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ success: false, error: '保存失败' });
  }
});

app.get('/api/save', (req, res) => {
  try {
    if (!saveData) {
      res.status(404).json({ success: false, error: '没有找到存档' });
      return;
    }

    res.json({
      hero: saveData.hero,
      floor: saveData.floor,
      timestamp: saveData.timestamp,
    });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ success: false, error: '读取失败' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🗡️ 暗黑地牢服务器运行在 http://localhost:${PORT}`);
});
