import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

interface GrowthRecord {
  id: string;
  date: string;
  content: string;
}

interface Plant {
  id: string;
  name: string;
  category: string;
  waterFrequency: number;
  lastWateredDate: string;
  photo?: string;
  growthRecords: GrowthRecord[];
}

interface Database {
  plants: Plant[];
}

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const dbFile = path.join(__dirname, 'db.json');
const adapter = new FileSync(dbFile);
const db = low(adapter);

const defaultData: Database = { plants: [] };
db.defaults(defaultData).write();

const getDaysDiff = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

app.get('/api/plants', (_req, res) => {
  try {
    const plants = db.get('plants').value() as Plant[];
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: '获取植物列表失败' });
  }
});

app.post('/api/plants', (req, res) => {
  try {
    const { name, category, waterFrequency, photo } = req.body;

    if (!name || !category || !waterFrequency) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const newPlant: Plant = {
      id: uuidv4(),
      name,
      category,
      waterFrequency: parseInt(waterFrequency, 10),
      lastWateredDate: new Date().toISOString(),
      photo,
      growthRecords: [],
    };

    db.get('plants').push(newPlant).write();
    res.status(201).json(newPlant);
  } catch (error) {
    res.status(500).json({ error: '创建植物失败' });
  }
});

app.patch('/api/plants/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const plant = db.get('plants').find({ id }).value() as Plant | undefined;

    if (!plant) {
      return res.status(404).json({ error: '植物不存在' });
    }

    const updated: Plant = {
      ...plant,
      ...updates,
    };

    db.get('plants').find({ id }).assign(updated).write();
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: '更新植物失败' });
  }
});

app.delete('/api/plants/:id', (req, res) => {
  try {
    const { id } = req.params;

    const plant = db.get('plants').find({ id }).value() as Plant | undefined;

    if (!plant) {
      return res.status(404).json({ error: '植物不存在' });
    }

    db.get('plants').remove({ id }).write();
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: '删除植物失败' });
  }
});

app.post('/api/plants/:id/records', (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: '记录内容不能为空' });
    }

    const plant = db.get('plants').find({ id }).value() as Plant | undefined;

    if (!plant) {
      return res.status(404).json({ error: '植物不存在' });
    }

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const lastRecord = plant.growthRecords[0];
    if (lastRecord) {
      const lastRecordDate = new Date(lastRecord.date).toISOString().split('T')[0];
      if (lastRecordDate === today) {
        return res.status(429).json({ error: '每24小时只能添加一条记录' });
      }
    }

    const newRecord: GrowthRecord = {
      id: uuidv4(),
      date: now.toISOString(),
      content,
    };

    const updatedRecords = [newRecord, ...plant.growthRecords];
    db.get('plants').find({ id }).assign({ growthRecords: updatedRecords }).write();

    res.status(201).json(newRecord);
  } catch (error) {
    res.status(500).json({ error: '添加记录失败' });
  }
});

app.get('/api/today-reminders', (_req, res) => {
  try {
    const today = new Date();
    const todayStr = today.toISOString();

    const plants = db.get('plants').value() as Plant[];
    const plantsNeedingWater = plants.filter((plant) => {
      const daysSinceLastWatered = getDaysDiff(plant.lastWateredDate, todayStr);
      return daysSinceLastWatered >= plant.waterFrequency;
    });

    res.json({
      count: plantsNeedingWater.length,
      plants: plantsNeedingWater,
    });
  } catch (error) {
    res.status(500).json({ error: '获取今日提醒失败' });
  }
});

app.post('/api/plants/:id/water', (req, res) => {
  try {
    const { id } = req.params;

    const plant = db.get('plants').find({ id }).value() as Plant | undefined;

    if (!plant) {
      return res.status(404).json({ error: '植物不存在' });
    }

    const newDate = new Date().toISOString();
    const updated = { ...plant, lastWateredDate: newDate };
    db.get('plants').find({ id }).assign({ lastWateredDate: newDate }).write();

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: '更新浇水时间失败' });
  }
});

app.listen(PORT, () => {
  console.log(`花园小管家服务器运行在 http://localhost:${PORT}`);
});
