import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface TimeSlot {
  id: string;
  label: string;
  votes: number;
}

interface Dish {
  id: string;
  name: string;
  description: string;
  image: string;
  votes: number;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  votes: number;
}

interface EventData {
  id: string;
  code: string;
  name: string;
  dateTime: string;
  location: string;
  welcomeMessage: string;
  backgroundImage: string;
  timeSlots: TimeSlot[];
  dishes: Dish[];
  songs: Song[];
  createdAt: string;
}

interface CreateEventRequest {
  name: string;
  dateTime: string;
  location: string;
  welcomeMessage: string;
  backgroundImage: string;
}

interface VoteRequest {
  timeSlotId?: string;
  dishIds?: string[];
  songIds?: string[];
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

const eventsStore = new Map<string, EventData>();

const generateCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (eventsStore.has(code)) {
    return generateCode();
  }
  return code;
};

const getDefaultTimeSlots = (): TimeSlot[] => [
  { id: uuidv4(), label: '下午 14:00 - 16:00', votes: 0 },
  { id: uuidv4(), label: '下午 16:00 - 18:00', votes: 0 },
  { id: uuidv4(), label: '晚上 18:00 - 20:00', votes: 0 },
];

const getDefaultDishes = (): Dish[] => [
  {
    id: uuidv4(),
    name: '三文鱼刺身拼盘',
    description: '新鲜挪威三文鱼，搭配芥末酱油，入口即化',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&h=200&fit=crop',
    votes: 0,
  },
  {
    id: uuidv4(),
    name: '意式烤鸡翅',
    description: '秘制酱料腌制，外酥里嫩，香气扑鼻',
    image: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=300&h=200&fit=crop',
    votes: 0,
  },
  {
    id: uuidv4(),
    name: '芝士焗龙虾',
    description: '波士顿龙虾配马苏里拉芝士，浓郁鲜美',
    image: 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=300&h=200&fit=crop',
    votes: 0,
  },
  {
    id: uuidv4(),
    name: '凯撒沙拉',
    description: '新鲜生菜配帕玛森芝士和凯撒酱，清爽解腻',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&h=200&fit=crop',
    votes: 0,
  },
  {
    id: uuidv4(),
    name: '黑椒牛柳粒',
    description: '精选和牛，黑椒酱汁，肉质鲜嫩多汁',
    image: 'https://images.unsplash.com/photo-1600891964599-f61ba0e24092?w=300&h=200&fit=crop',
    votes: 0,
  },
  {
    id: uuidv4(),
    name: '提拉米苏',
    description: '经典意式甜品，马斯卡彭芝士配浓缩咖啡',
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=300&h=200&fit=crop',
    votes: 0,
  },
];

const getDefaultSongs = (): Song[] => [
  { id: uuidv4(), title: '朋友', artist: '周华健', votes: 0 },
  { id: uuidv4(), title: '夜空中最亮的星', artist: '逃跑计划', votes: 0 },
  { id: uuidv4(), title: '海阔天空', artist: 'Beyond', votes: 0 },
  { id: uuidv4(), title: '稻香', artist: '周杰伦', votes: 0 },
  { id: uuidv4(), title: '小幸运', artist: '田馥甄', votes: 0 },
  { id: uuidv4(), title: '光辉岁月', artist: 'Beyond', votes: 0 },
  { id: uuidv4(), title: '成都', artist: '赵雷', votes: 0 },
  { id: uuidv4(), title: '难忘今宵', artist: '李谷一', votes: 0 },
];

app.post('/api/event', (req: Request, res: Response) => {
  try {
    const { name, dateTime, location, welcomeMessage, backgroundImage } = req.body as CreateEventRequest;

    if (!name || !dateTime || !location || !welcomeMessage || !backgroundImage) {
      return res.status(400).json({ error: '所有字段均为必填项' });
    }

    const code = generateCode();
    const event: EventData = {
      id: uuidv4(),
      code,
      name,
      dateTime,
      location,
      welcomeMessage,
      backgroundImage,
      timeSlots: getDefaultTimeSlots(),
      dishes: getDefaultDishes(),
      songs: getDefaultSongs(),
      createdAt: new Date().toISOString(),
    };

    eventsStore.set(code, event);

    const shareLink = `${req.protocol}://${req.get('host')}/event/${code}`;

    res.status(201).json({ event, shareLink });
  } catch (error) {
    console.error('创建活动失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.get('/api/event/:code', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const event = eventsStore.get(code.toUpperCase());

    if (!event) {
      return res.status(404).json({ error: '活动不存在，请检查邀请码' });
    }

    res.json(event);
  } catch (error) {
    console.error('获取活动失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.post('/api/event/:code/vote', (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const { timeSlotId, dishIds, songIds } = req.body as VoteRequest;

    const event = eventsStore.get(code.toUpperCase());

    if (!event) {
      return res.status(404).json({ error: '活动不存在' });
    }

    if (timeSlotId) {
      const slot = event.timeSlots.find((s) => s.id === timeSlotId);
      if (slot) slot.votes += 1;
    }

    if (dishIds && Array.isArray(dishIds)) {
      dishIds.forEach((id) => {
        const dish = event.dishes.find((d) => d.id === id);
        if (dish) dish.votes += 1;
      });
    }

    if (songIds && Array.isArray(songIds)) {
      songIds.forEach((id) => {
        const song = event.songs.find((s) => s.id === id);
        if (song) song.votes += 1;
      });
    }

    eventsStore.set(code.toUpperCase(), event);

    res.json({ success: true, event });
  } catch (error) {
    console.error('投票失败:', error);
    res.status(500).json({ error: '服务器内部错误' });
  }
});

app.listen(PORT, () => {
  console.log(`🎉 酒会筹办平台后端服务已启动: http://localhost:${PORT}`);
});
