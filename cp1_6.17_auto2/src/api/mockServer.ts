import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Gift {
  id: string;
  name: string;
  iconUrl: string;
  price: number;
  sales: number;
}

interface Danmaku {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  avatar: string;
}

interface GiftRecord {
  id: string;
  nickname: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  quantity: number;
  timestamp: number;
}

interface RankingItem {
  userId: string;
  nickname: string;
  avatar: string;
  contribution: number;
}

interface Database {
  gifts: Gift[];
  danmakus: Danmaku[];
  giftRecords: GiftRecord[];
  ranking: {
    today: RankingItem[];
    week: RankingItem[];
    all: RankingItem[];
  };
}

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const defaultData: Database = {
  gifts: [
    { id: '1', name: '小心心', iconUrl: 'https://api.iconify.design/mdi:heart.svg?color=%23FF6B00', price: 10, sales: 156 },
    { id: '2', name: '火箭', iconUrl: 'https://api.iconify.design/mdi:rocket-launch.svg?color=%23FF6B00', price: 500, sales: 23 },
    { id: '3', name: '皇冠', iconUrl: 'https://api.iconify.design/mdi:crown.svg?color=%23FFD700', price: 1000, sales: 8 },
    { id: '4', name: '鲜花', iconUrl: 'https://api.iconify.design/mdi:flower.svg?color=%23E91E63', price: 50, sales: 89 },
    { id: '5', name: '跑车', iconUrl: 'https://api.iconify.design/mdi:car-sports.svg?color=%232196F3', price: 2000, sales: 5 },
  ],
  danmakus: [
    { id: '1', nickname: '小明', content: '主播好棒！', timestamp: Date.now() - 60000, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1' },
    { id: '2', nickname: '大白', content: '666666', timestamp: Date.now() - 30000, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2' },
  ],
  giftRecords: [],
  ranking: {
    today: [
      { userId: '1', nickname: '土豪哥', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rich1', contribution: 12500 },
      { userId: '2', nickname: '花花', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hua', contribution: 8900 },
      { userId: '3', nickname: '老铁', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laotie', contribution: 5600 },
      { userId: '4', nickname: '小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1', contribution: 3200 },
      { userId: '5', nickname: '大白', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2', contribution: 1500 },
    ],
    week: [
      { userId: '1', nickname: '土豪哥', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rich1', contribution: 45600 },
      { userId: '6', nickname: '直播间常客', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=regular', contribution: 32100 },
      { userId: '2', nickname: '花花', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hua', contribution: 28900 },
      { userId: '3', nickname: '老铁', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laotie', contribution: 15600 },
      { userId: '7', nickname: '新人小王', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=new', contribution: 8900 },
    ],
    all: [
      { userId: '1', nickname: '土豪哥', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rich1', contribution: 128500 },
      { userId: '6', nickname: '直播间常客', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=regular', contribution: 98700 },
      { userId: '8', nickname: '神秘大佬', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=mystery', contribution: 76500 },
      { userId: '2', nickname: '花花', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=hua', contribution: 54300 },
      { userId: '3', nickname: '老铁', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laotie', contribution: 43200 },
    ],
  },
};

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile<Database>(file);
const db = new Low<Database>(adapter, defaultData);

await db.write();

app.get('/api/gifts', async (_req, res) => {
  await db.read();
  res.json(db.data.gifts);
});

app.post('/api/gifts', async (req, res) => {
  await db.read();
  const newGift: Gift = {
    id: uuidv4(),
    name: req.body.name,
    iconUrl: req.body.iconUrl,
    price: req.body.price,
    sales: 0,
  };
  db.data.gifts.push(newGift);
  await db.write();
  res.json(newGift);
});

app.put('/api/gifts/:id', async (req, res) => {
  await db.read();
  const index = db.data.gifts.findIndex((g) => g.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Gift not found' });
  }
  db.data.gifts[index] = { ...db.data.gifts[index], ...req.body };
  await db.write();
  res.json(db.data.gifts[index]);
});

app.delete('/api/gifts/:id', async (req, res) => {
  await db.read();
  db.data.gifts = db.data.gifts.filter((g) => g.id !== req.params.id);
  await db.write();
  res.json({ success: true });
});

app.get('/api/danmakus', async (_req, res) => {
  await db.read();
  res.json(db.data.danmakus.slice(-50));
});

app.get('/api/gift-records', async (_req, res) => {
  await db.read();
  res.json(db.data.giftRecords.slice(-20));
});

app.get('/api/ranking', async (req, res) => {
  await db.read();
  const period = (req.query.period as string) || 'today';
  const ranking = db.data.ranking[period as keyof typeof db.data.ranking];
  if (!ranking) {
    return res.status(400).json({ error: 'Invalid period' });
  }
  res.json(ranking);
});

app.post('/api/simulate', async (req, res) => {
  await db.read();
  const { type, nickname, content, giftId, quantity, avatar } = req.body;

  if (type === 'danmaku') {
    const newDanmaku: Danmaku = {
      id: uuidv4(),
      nickname,
      content,
      timestamp: Date.now(),
      avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
    };
    db.data.danmakus.push(newDanmaku);
    await db.write();
    return res.json(newDanmaku);
  }

  if (type === 'gift') {
    const gift = db.data.gifts.find((g) => g.id === giftId);
    if (!gift) {
      return res.status(404).json({ error: 'Gift not found' });
    }

    gift.sales += quantity;

    const newRecord: GiftRecord = {
      id: uuidv4(),
      nickname,
      giftId: gift.id,
      giftName: gift.name,
      giftIcon: gift.iconUrl,
      quantity,
      timestamp: Date.now(),
    };
    db.data.giftRecords.push(newRecord);

    const contribution = gift.price * quantity;
    const updateRanking = (list: RankingItem[]) => {
      const existing = list.find((r) => r.nickname === nickname);
      if (existing) {
        existing.contribution += contribution;
      } else {
        list.push({
          userId: uuidv4(),
          nickname,
          avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${nickname}`,
          contribution,
        });
      }
      list.sort((a, b) => b.contribution - a.contribution);
    };

    updateRanking(db.data.ranking.today);
    updateRanking(db.data.ranking.week);
    updateRanking(db.data.ranking.all);

    await db.write();
    return res.json(newRecord);
  }

  res.status(400).json({ error: 'Invalid type' });
});

app.listen(port, () => {
  console.log(`Mock server running on http://localhost:${port}`);
});
