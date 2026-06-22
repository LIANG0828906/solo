import express from 'express';
import cors from 'cors';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3003;

app.use(cors());
app.use(express.json());

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
  avatar: string;
  content: string;
  timestamp: number;
}

interface GiftRecord {
  id: string;
  nickname: string;
  avatar: string;
  gift: Gift;
  count: number;
  timestamp: number;
}

interface RankingItem {
  id: string;
  nickname: string;
  avatar: string;
  totalCoins: number;
  todayCoins: number;
  weekCoins: number;
}

interface DatabaseData {
  gifts: Gift[];
  danmakus: Danmaku[];
  giftRecords: GiftRecord[];
  ranking: RankingItem[];
}

const defaultData: DatabaseData = {
  gifts: [
    {
      id: '1',
      name: '小心心',
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/742/742756.png',
      price: 100,
      sales: 1250,
    },
    {
      id: '2',
      name: '玫瑰花',
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/745/745069.png',
      price: 500,
      sales: 680,
    },
    {
      id: '3',
      name: '皇冠',
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/263/263087.png',
      price: 1000,
      sales: 320,
    },
    {
      id: '4',
      name: '火箭',
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/1387/1387436.png',
      price: 5000,
      sales: 86,
    },
    {
      id: '5',
      name: '游艇',
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/3061/3061323.png',
      price: 10000,
      sales: 24,
    },
    {
      id: '6',
      name: '嘉年华',
      iconUrl: 'https://cdn-icons-png.flaticon.com/128/2583/2583461.png',
      price: 50000,
      sales: 5,
    },
  ],
  danmakus: [],
  giftRecords: [],
  ranking: [
    {
      id: 'u1',
      nickname: '超级粉丝小明',
      avatar: 'FF6B00',
      totalCoins: 128500,
      todayCoins: 8500,
      weekCoins: 25600,
    },
    {
      id: 'u2',
      nickname: '土豪大佬',
      avatar: '9333EA',
      totalCoins: 96800,
      todayCoins: 15000,
      weekCoins: 32000,
    },
    {
      id: 'u3',
      nickname: '小甜甜',
      avatar: 'EC4899',
      totalCoins: 67200,
      todayCoins: 3200,
      weekCoins: 18500,
    },
    {
      id: 'u4',
      nickname: '夜猫子',
      avatar: '06B6D4',
      totalCoins: 45600,
      todayCoins: 1200,
      weekCoins: 9800,
    },
    {
      id: 'u5',
      nickname: '追梦人',
      avatar: '10B981',
      totalCoins: 32100,
      todayCoins: 800,
      weekCoins: 6500,
    },
    {
      id: 'u6',
      nickname: '开心果',
      avatar: 'F59E0B',
      totalCoins: 21500,
      todayCoins: 500,
      weekCoins: 4200,
    },
    {
      id: 'u7',
      nickname: '文艺青年',
      avatar: '6366F1',
      totalCoins: 15800,
      todayCoins: 300,
      weekCoins: 2800,
    },
    {
      id: 'u8',
      nickname: '老司机',
      avatar: 'EF4444',
      totalCoins: 12300,
      todayCoins: 200,
      weekCoins: 1500,
    },
    {
      id: 'u9',
      nickname: '小萌新',
      avatar: '8B5CF6',
      totalCoins: 8600,
      todayCoins: 100,
      weekCoins: 800,
    },
    {
      id: 'u10',
      nickname: '路人甲',
      avatar: '64748B',
      totalCoins: 5200,
      todayCoins: 50,
      weekCoins: 300,
    },
  ],
};

const file = path.join(__dirname, 'db.json');
const adapter = new JSONFile<DatabaseData>(file);
const db = new Low(adapter, defaultData);

app.get('/api/gifts', async (req, res) => {
  await db.read();
  res.json(db.data.gifts);
});

app.get('/api/ranking', async (req, res) => {
  await db.read();
  const period = (req.query.period as string) || 'all';
  
  let rankingData = [...db.data.ranking];
  
  if (period === 'today') {
    rankingData = rankingData
      .map((item) => ({
        ...item,
        totalCoins: item.todayCoins,
      }))
      .sort((a, b) => b.totalCoins - a.totalCoins);
  } else if (period === 'week') {
    rankingData = rankingData
      .map((item) => ({
        ...item,
        totalCoins: item.weekCoins,
      }))
      .sort((a, b) => b.totalCoins - a.totalCoins);
  } else {
    rankingData.sort((a, b) => b.totalCoins - a.totalCoins);
  }
  
  res.json(rankingData);
});

app.post('/api/simulate/danmaku', async (req, res) => {
  const { nickname, content } = req.body;
  
  if (!nickname || !content) {
    return res.status(400).json({ error: '昵称和内容不能为空' });
  }
  
  const avatarColors = ['FF6B00', '9333EA', 'EC4899', '06B6D4', '10B981', 'F59E0B', '6366F1', '8B5CF6'];
  const randomAvatar = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  
  const danmaku: Danmaku = {
    id: uuidv4(),
    nickname,
    avatar: randomAvatar,
    content,
    timestamp: Date.now(),
  };
  
  await db.read();
  db.data.danmakus.push(danmaku);
  await db.write();
  
  res.json(danmaku);
});

app.post('/api/simulate/gift', async (req, res) => {
  const { nickname, giftId, count } = req.body;
  
  if (!nickname || !giftId || !count) {
    return res.status(400).json({ error: '参数不完整' });
  }
  
  await db.read();
  
  const gift = db.data.gifts.find((g) => g.id === giftId);
  if (!gift) {
    return res.status(404).json({ error: '礼物不存在' });
  }
  
  gift.sales += count;
  
  const avatarColors = ['FF6B00', '9333EA', 'EC4899', '06B6D4', '10B981', 'F59E0B', '6366F1', '8B5CF6'];
  const randomAvatar = avatarColors[Math.floor(Math.random() * avatarColors.length)];
  
  const record: GiftRecord = {
    id: uuidv4(),
    nickname,
    avatar: randomAvatar,
    gift: { ...gift },
    count,
    timestamp: Date.now(),
  };
  
  db.data.giftRecords.push(record);
  
  const totalValue = gift.price * count;
  let userRanking = db.data.ranking.find((r) => r.nickname === nickname);
  
  if (userRanking) {
    userRanking.totalCoins += totalValue;
    userRanking.todayCoins += totalValue;
    userRanking.weekCoins += totalValue;
  } else {
    userRanking = {
      id: uuidv4(),
      nickname,
      avatar: randomAvatar,
      totalCoins: totalValue,
      todayCoins: totalValue,
      weekCoins: totalValue,
    };
    db.data.ranking.push(userRanking);
  }
  
  db.data.ranking.sort((a, b) => b.totalCoins - a.totalCoins);
  
  await db.write();
  
  res.json({
    record,
    updatedGift: gift,
  });
});

app.listen(port, () => {
  console.log(`Mock server running at http://localhost:${port}`);
});
