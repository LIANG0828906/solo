import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  email: string;
  password: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

interface Instrument {
  id: string;
  name: string;
  category: 'acoustic-guitar' | 'electric-piano' | 'violin' | 'saxophone' | 'drum-kit';
  images: string[];
  condition: 'new' | 'minor-flaw' | 'used';
  conditionDescription: string;
  rentPerDay: number;
  salePrice: number;
  publisherId: string;
  publisherNickname: string;
  createdAt: string;
  status: 'active' | 'offline';
}

interface Booking {
  id: string;
  instrumentId: string;
  instrumentName: string;
  requesterId: string;
  requesterNickname: string;
  publisherId: string;
  publisherNickname: string;
  bookingDate: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

interface Review {
  id: string;
  instrumentId: string;
  userId: string;
  userNickname: string;
  userAvatar?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const users: User[] = [
  {
    id: 'user-1',
    email: 'demo@example.com',
    password: '123456',
    nickname: '音乐达人小王',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'user-2',
    email: 'lily@example.com',
    password: '123456',
    nickname: '吉他手莉莉',
    createdAt: new Date().toISOString(),
  },
];

const instruments: Instrument[] = [
  {
    id: 'inst-1',
    name: '马丁D-28木吉他',
    category: 'acoustic-guitar',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=acoustic%20guitar%20martin%20d28%20wooden%20texture%20high%20quality%20product%20photo&image_size=square_hd',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=acoustic%20guitar%20detail%20shot%20soundhole%20rosewood&image_size=square_hd',
    ],
    condition: 'minor-flaw',
    conditionDescription: '使用2年，琴颈有轻微划痕，音色完美，定期保养',
    rentPerDay: 80,
    salePrice: 8500,
    publisherId: 'user-1',
    publisherNickname: '音乐达人小王',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: 'active',
  },
  {
    id: 'inst-2',
    name: '雅马哈P-125电钢琴',
    category: 'electric-piano',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=yamaha%20digital%20piano%20black%20elegant%20product%20photography&image_size=square_hd',
    ],
    condition: 'new',
    conditionDescription: '全新未拆封，官方保修，含琴架和三踏板',
    rentPerDay: 60,
    salePrice: 4200,
    publisherId: 'user-2',
    publisherNickname: '吉他手莉莉',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    status: 'active',
  },
  {
    id: 'inst-3',
    name: '斯特拉迪瓦里仿古琴',
    category: 'violin',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=violin%20stradivarius%20replica%20vintage%20warm%20lighting%20professional%20photo&image_size=square_hd',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=violin%20f%20holes%20detail%20close%20up%20wooden%20texture&image_size=square_hd',
    ],
    condition: 'used',
    conditionDescription: '10年琴龄，欧洲木料手工制作，音色温暖醇厚，适合专业演奏',
    rentPerDay: 150,
    salePrice: 15000,
    publisherId: 'user-1',
    publisherNickname: '音乐达人小王',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    status: 'active',
  },
  {
    id: 'inst-4',
    name: '塞尔玛Mark VI萨克斯',
    category: 'saxophone',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=selmer%20mark%20vi%20saxophone%20brass%20golden%20shiny%20professional%20instrument&image_size=square_hd',
    ],
    condition: 'minor-flaw',
    conditionDescription: '表面有轻微氧化，按键灵敏，音色绝佳，收藏品级别',
    rentPerDay: 200,
    salePrice: 28000,
    publisherId: 'user-2',
    publisherNickname: '吉他手莉莉',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'active',
  },
  {
    id: 'inst-5',
    name: '珍珠Export系列架子鼓',
    category: 'drum-kit',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pearl%20export%20drum%20kit%20wine%20red%20professional%20studio%20setup&image_size=square_hd',
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=drum%20kit%20cymbals%20hardware%20detail%20shot&image_size=square_hd',
    ],
    condition: 'used',
    conditionDescription: '演出使用3年，鼓皮状态良好，含镲片全套，适合练习和小型演出',
    rentPerDay: 120,
    salePrice: 6500,
    publisherId: 'user-1',
    publisherNickname: '音乐达人小王',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    status: 'active',
  },
  {
    id: 'inst-6',
    name: '泰勒GS Mini旅行吉他',
    category: 'acoustic-guitar',
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=taylor%20gs%20mini%20acoustic%20guitar%20natural%20wood%20compact%20travel&image_size=square_hd',
    ],
    condition: 'new',
    conditionDescription: '全新正品，云杉面单，沙比利背侧，手感极佳，适合旅行携带',
    rentPerDay: 50,
    salePrice: 3800,
    publisherId: 'user-2',
    publisherNickname: '吉他手莉莉',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'active',
  },
];

const bookings: Booking[] = [
  {
    id: 'booking-1',
    instrumentId: 'inst-1',
    instrumentName: '马丁D-28木吉他',
    requesterId: 'user-2',
    requesterNickname: '吉他手莉莉',
    publisherId: 'user-1',
    publisherNickname: '音乐达人小王',
    bookingDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    timeSlot: '14:00-16:00',
    status: 'pending',
    createdAt: new Date().toISOString(),
  },
];

const reviews: Review[] = [
  {
    id: 'review-1',
    instrumentId: 'inst-1',
    userId: 'user-2',
    userNickname: '吉他手莉莉',
    rating: 5,
    comment: '琴主人非常好，琴的状态也很棒，音色温暖通透，试音体验很好！强烈推荐！',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'review-2',
    instrumentId: 'inst-3',
    userId: 'user-1',
    userNickname: '音乐达人小王',
    rating: 4,
    comment: '小提琴音色很不错，就是琴盒有点旧了，但不影响使用。',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

const generateToken = (userId: string) => {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
};

const authenticate = (req: Request, res: Response, next: () => void) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权访问' });
  }
  next();
};

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, password, nickname } = req.body;

    if (!email || !password || !nickname) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const existingUser = users.find((u) => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: '该邮箱已被注册' });
    }

    const newUser: User = {
      id: uuidv4(),
      email,
      password,
      nickname,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    const token = generateToken(newUser.id);

    res.json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        nickname: newUser.nickname,
        avatar: newUser.avatar,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = users.find((u) => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ error: '邮箱或密码错误' });
    }

    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        avatar: user.avatar,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    res.status(500).json({ error: '登录失败' });
  }
});

app.get('/api/instruments', (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    let filtered = instruments.filter((i) => i.status === 'active');

    if (category) {
      filtered = filtered.filter((i) => i.category === category);
    }

    res.json(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) {
    res.status(500).json({ error: '获取乐器列表失败' });
  }
});

app.get('/api/instruments/:id', (req: Request, res: Response) => {
  try {
    const instrument = instruments.find((i) => i.id === req.params.id);
    if (!instrument) {
      return res.status(404).json({ error: '乐器不存在' });
    }
    res.json(instrument);
  } catch (error) {
    res.status(500).json({ error: '获取乐器详情失败' });
  }
});

app.post('/api/instruments', authenticate, (req: Request, res: Response) => {
  try {
    const { name, category, images, condition, conditionDescription, rentPerDay, salePrice, publisherId, publisherNickname } = req.body;

    if (!name || !category || !images || images.length === 0 || !condition || !rentPerDay || !salePrice || !publisherId) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const newInstrument: Instrument = {
      id: uuidv4(),
      name,
      category,
      images,
      condition,
      conditionDescription: conditionDescription || '',
      rentPerDay: Number(rentPerDay),
      salePrice: Number(salePrice),
      publisherId,
      publisherNickname,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    instruments.unshift(newInstrument);
    res.status(201).json(newInstrument);
  } catch (error) {
    res.status(500).json({ error: '发布失败' });
  }
});

app.put('/api/instruments/:id', authenticate, (req: Request, res: Response) => {
  try {
    const index = instruments.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: '乐器不存在' });
    }

    instruments[index] = { ...instruments[index], ...req.body };
    res.json(instruments[index]);
  } catch (error) {
    res.status(500).json({ error: '更新失败' });
  }
});

app.delete('/api/instruments/:id', authenticate, (req: Request, res: Response) => {
  try {
    const index = instruments.findIndex((i) => i.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: '乐器不存在' });
    }

    instruments[index].status = 'offline';
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '下架失败' });
  }
});

app.get('/api/instruments/:id/reviews', (req: Request, res: Response) => {
  try {
    const instrumentReviews = reviews.filter((r) => r.instrumentId === req.params.id);
    res.json(instrumentReviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) {
    res.status(500).json({ error: '获取评价失败' });
  }
});

app.post('/api/instruments/:id/reviews', authenticate, (req: Request, res: Response) => {
  try {
    const { rating, comment, userId, userNickname } = req.body;

    if (!rating || !comment || !userId) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const newReview: Review = {
      id: uuidv4(),
      instrumentId: req.params.id,
      userId,
      userNickname,
      rating: Math.min(5, Math.max(1, Number(rating))) as 1 | 2 | 3 | 4 | 5,
      comment,
      createdAt: new Date().toISOString(),
    };

    reviews.unshift(newReview);
    res.status(201).json(newReview);
  } catch (error) {
    res.status(500).json({ error: '评价失败' });
  }
});

app.get('/api/bookings', (req: Request, res: Response) => {
  try {
    const { userId } = req.query;
    let filtered = bookings;

    if (userId) {
      filtered = bookings.filter((b) => b.requesterId === userId || b.publisherId === userId);
    }

    res.json(filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) {
    res.status(500).json({ error: '获取预约列表失败' });
  }
});

app.post('/api/bookings', authenticate, (req: Request, res: Response) => {
  try {
    const { instrumentId, instrumentName, bookingDate, timeSlot, requesterId, requesterNickname, publisherId, publisherNickname } = req.body;

    if (!instrumentId || !bookingDate || !timeSlot || !requesterId) {
      return res.status(400).json({ error: '请填写完整信息' });
    }

    const newBooking: Booking = {
      id: uuidv4(),
      instrumentId,
      instrumentName,
      requesterId,
      requesterNickname,
      publisherId,
      publisherNickname,
      bookingDate,
      timeSlot,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    bookings.unshift(newBooking);
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ error: '预约失败' });
  }
});

app.put('/api/bookings/:id/status', authenticate, (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const index = bookings.findIndex((b) => b.id === req.params.id);

    if (index === -1) {
      return res.status(404).json({ error: '预约不存在' });
    }

    bookings[index].status = status;
    res.json(bookings[index]);
  } catch (error) {
    res.status(500).json({ error: '更新状态失败' });
  }
});

app.get('/api/users/:id/instruments', (req: Request, res: Response) => {
  try {
    const userInstruments = instruments.filter((i) => i.publisherId === req.params.id);
    res.json(userInstruments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  } catch (error) {
    res.status(500).json({ error: '获取用户乐器失败' });
  }
});

app.get('/api/users/:id', (req: Request, res: Response) => {
  try {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: '用户不存在' });
    }
    res.json({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
