import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Cat, HealthStatus, ShelterStats } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Database {
  cats: Cat[];
  users: { id: string; username: string; password: string }[];
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dbFile = path.join(__dirname, 'db.json');
const defaultData: Database = {
  cats: [],
  users: [],
};

const adapter = new JSONFile<Database>(dbFile);
const db = new Low<Database>(adapter, defaultData);

async function initDatabase() {
  await db.read();
  if (!db.data) {
    db.data = defaultData;
    await db.write();
  }
  
  if (db.data.cats.length === 0) {
    console.log('Initializing with sample cats...');
    for (let i = 0; i < 2; i++) {
      const cat = generateRandomCat();
      db.data.cats.push(cat);
    }
    
    const cat1 = generateRandomCat();
    cat1.area = 'shelter';
    cat1.healthStatus = 'healthy';
    cat1.metrics = generateRandomMetrics('healthy');
    db.data.cats.push(cat1);
    
    const cat2 = generateRandomCat();
    cat2.area = 'shelter';
    cat2.healthStatus = 'mild';
    cat2.metrics = generateRandomMetrics('mild');
    db.data.cats.push(cat2);
    
    await db.write();
    console.log(`Initialized with ${db.data.cats.length} sample cats`);
  }
}

const breeds = [
  '中华田园猫', '橘猫', '狸花猫', '三花猫', '奶牛猫',
  '英短蓝猫', '布偶猫', '暹罗猫', '美短虎斑', '波斯猫',
  '缅因猫', '无毛猫', '苏格兰折耳', '英国短毛', '美国短毛',
];

const colors = [
  '橘白相间', '纯黑', '纯白', '黑白花', '狸花',
  '三花', '玳瑁', '蓝灰色', '奶油色', '巧克力色',
  '虎斑', '烟灰色', '丁香色', '银渐层', '金渐层',
];

const catNames = [
  '小橘', '咪咪', '球球', '豆豆', '花花',
  '奶茶', '布丁', '汤圆', '饺子', '年糕',
  '可乐', '咖啡', '芝士', '糖糖', '果果',
  '毛毛', '豆豆', '小白', '黑妞', '虎子',
  '雪花', '麻薯', '寿司', '饭团', '馒头',
];

const catAvatars = ['🐱', '🐈', '🐈‍⬛', '😺', '😸', '😻', '🙀', '😿'];

const stories = [
  '在公园的垃圾桶旁被发现，当时正在翻找食物。虽然有些怕人，但只要有耐心就能赢得它的信任。',
  '下雨天躲在小区楼道里瑟瑟发抖，被好心的居民送来救助站。性格温顺，喜欢被摸下巴。',
  '从非法繁殖场解救出来的猫咪，之前的生活条件很差，但依然对人类充满善意。',
  '原主人因过敏不得不放弃它。从小家养，非常亲人，会主动蹭人的腿。',
  '在建筑工地的废墟中被发现，身上有些伤口，但精神状态还不错。',
  '流浪在大学校园里的常客，深受学生们喜爱，因校园整治需要临时安置。',
  '在高速公路旁被好心人救下，当时已经奄奄一息，经过救治终于恢复了活力。',
  '被遗弃在宠物店门口的纸箱里，和兄弟姐妹一起被送来。性格活泼好动。',
];

const behaviorRecordsPool = [
  '喜欢追逐逗猫棒，能玩很久不觉得累',
  '会使用猫砂盆，卫生习惯良好',
  '食量正常，不挑食',
  '喜欢在阳光下发呆，一晒就是一下午',
  '偶尔会调皮，但大多数时间很安静',
  '和其他猫咪相处融洽，不会打架',
  '喜欢被撸肚子，会开心地呼噜呼噜',
  '听到罐头的声音会立刻跑过来',
  '睡觉喜欢窝在柔软的毛毯上',
  '会在门口迎接主人回家',
];

function generateRandomMetrics(healthStatus: HealthStatus) {
  const base = healthStatus === 'healthy' ? 80 : healthStatus === 'mild' ? 60 : 40;
  const variance = healthStatus === 'healthy' ? 15 : healthStatus === 'mild' ? 20 : 25;
  
  return {
    appetite: Math.min(100, Math.max(20, base + Math.floor(Math.random() * variance - variance / 2))),
    energy: Math.min(100, Math.max(20, base + Math.floor(Math.random() * variance - variance / 2))),
    friendliness: Math.min(100, Math.max(20, base + 5 + Math.floor(Math.random() * variance - variance / 2))),
    cleanliness: Math.min(100, Math.max(20, base + Math.floor(Math.random() * variance - variance / 2))),
    health: Math.min(100, Math.max(20, base + Math.floor(Math.random() * variance / 2))),
  };
}

function generateRandomCat(): Cat {
  const rand = Math.random();
  const healthStatus: HealthStatus = rand < 0.5 ? 'healthy' : rand < 0.85 ? 'mild' : 'severe';
  
  const numRecords = 2 + Math.floor(Math.random() * 3);
  const shuffled = [...behaviorRecordsPool].sort(() => 0.5 - Math.random());
  const behaviorRecords = shuffled.slice(0, numRecords);

  return {
    id: uuidv4(),
    name: catNames[Math.floor(Math.random() * catNames.length)],
    breed: breeds[Math.floor(Math.random() * breeds.length)],
    color: colors[Math.floor(Math.random() * colors.length)],
    healthStatus,
    story: stories[Math.floor(Math.random() * stories.length)],
    metrics: generateRandomMetrics(healthStatus),
    behaviorRecords,
    avatar: catAvatars[Math.floor(Math.random() * catAvatars.length)],
    arrivalDate: new Date().toISOString(),
    area: 'reception',
    isExamining: false,
    examProgress: 0,
  };
}

function calculateStats(cats: Cat[]): ShelterStats {
  return {
    totalCats: cats.length,
    healthyCats: cats.filter(c => c.healthStatus === 'healthy' && c.area === 'shelter').length,
    mildCats: cats.filter(c => c.healthStatus === 'mild' && c.area === 'shelter').length,
    severeCats: cats.filter(c => c.healthStatus === 'severe' && c.area === 'shelter').length,
    adoptedCats: cats.filter(c => c.area === 'adoption').length,
    pendingExams: cats.filter(c => c.area === 'reception' || c.area === 'checkup').length,
  };
}

await initDatabase();

app.get('/api/stats', async (_req, res) => {
  try {
    await db.read();
    const stats = calculateStats(db.data.cats);
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

app.get('/api/cats', async (req, res) => {
  try {
    await db.read();
    let cats = db.data.cats;
    
    const area = req.query.area as Cat['area'];
    if (area) {
      cats = cats.filter(c => c.area === area);
    }
    
    res.json(cats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cats' });
  }
});

app.get('/api/cats/:id', async (req, res) => {
  try {
    await db.read();
    const cat = db.data.cats.find(c => c.id === req.params.id);
    if (!cat) {
      return res.status(404).json({ error: 'Cat not found' });
    }
    res.json(cat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get cat' });
  }
});

app.post('/api/cats', async (req, res) => {
  try {
    const catData = req.body as Omit<Cat, 'id'>;
    const newCat: Cat = {
      ...catData,
      id: uuidv4(),
    };
    
    await db.read();
    db.data.cats.push(newCat);
    await db.write();
    
    res.status(201).json(newCat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create cat' });
  }
});

app.post('/api/cats/generate', async (_req, res) => {
  try {
    const newCat = generateRandomCat();
    
    await db.read();
    db.data.cats.push(newCat);
    await db.write();
    
    res.status(201).json(newCat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate cat' });
  }
});

app.put('/api/cats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body as Partial<Cat>;
    
    await db.read();
    const index = db.data.cats.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Cat not found' });
    }
    
    db.data.cats[index] = {
      ...db.data.cats[index],
      ...updates,
    };
    
    await db.write();
    res.json(db.data.cats[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update cat' });
  }
});

app.delete('/api/cats/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.read();
    const index = db.data.cats.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Cat not found' });
    }
    
    db.data.cats.splice(index, 1);
    await db.write();
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete cat' });
  }
});

app.post('/api/cats/:id/exam', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.read();
    const index = db.data.cats.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Cat not found' });
    }
    
    if (db.data.cats[index].area !== 'reception') {
      return res.status(400).json({ error: 'Cat is not in reception area' });
    }
    
    db.data.cats[index] = {
      ...db.data.cats[index],
      area: 'checkup',
      isExamining: true,
      examProgress: 0,
    };
    
    await db.write();
    res.json(db.data.cats[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start exam' });
  }
});

app.post('/api/cats/:id/exam/complete', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.read();
    const index = db.data.cats.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Cat not found' });
    }
    
    const cat = db.data.cats[index];
    let newArea: Cat['area'] = 'shelter';
    
    const currentMetrics = cat.metrics;
    const avgHealth = (currentMetrics.appetite + currentMetrics.energy + 
                       currentMetrics.friendliness + currentMetrics.cleanliness + 
                       currentMetrics.health) / 5;
    
    let newHealthStatus: HealthStatus = cat.healthStatus;
    if (avgHealth >= 75) {
      newHealthStatus = 'healthy';
    } else if (avgHealth >= 50) {
      newHealthStatus = 'mild';
    } else {
      newHealthStatus = 'severe';
    }
    
    const improvedMetrics = {
      appetite: Math.min(100, currentMetrics.appetite + 5),
      energy: Math.min(100, currentMetrics.energy + 5),
      friendliness: Math.min(100, currentMetrics.friendliness + 5),
      cleanliness: Math.min(100, currentMetrics.cleanliness + 5),
      health: Math.min(100, currentMetrics.health + 10),
    };
    
    const updatedExamRecord = `${new Date().toLocaleDateString('zh-CN')}：完成体检，各项指标良好`;
    const newBehaviorRecords = [...cat.behaviorRecords];
    if (newBehaviorRecords.length < 6) {
      newBehaviorRecords.push(updatedExamRecord);
    }
    
    db.data.cats[index] = {
      ...cat,
      area: newArea,
      healthStatus: newHealthStatus,
      isExamining: false,
      examProgress: 100,
      metrics: improvedMetrics,
      behaviorRecords: newBehaviorRecords,
    };
    
    await db.write();
    res.json(db.data.cats[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to complete exam' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Cat Shelter API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Cat Shelter API server running on http://localhost:${PORT}`);
  console.log(`📊 Database file: ${dbFile}`);
});
