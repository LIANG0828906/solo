import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

interface User {
  id: string;
  nickname: string;
  avatar: string;
  community: string;
  building: string;
  points: number;
  token: string;
}

interface Item {
  id: string;
  title: string;
  category: string;
  condition: string;
  description: string;
  community: string;
  building: string;
  images: string[];
  publisherId: string;
  publisherNickname: string;
  publisherAvatar: string;
  status: 'available' | 'claimed' | 'given';
  claims: Claim[];
  createdAt: number;
  distance: number;
}

interface Claim {
  id: string;
  itemId: string;
  claimantId: string;
  claimantNickname: string;
  claimantAvatar: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: number;
}

interface Review {
  id: string;
  fromUserId: string;
  toUserId: string;
  itemId: string;
  type: 'positive' | 'negative';
  createdAt: number;
}

const users: User[] = [
  {
    id: 'user-1',
    nickname: '小明',
    avatar: '',
    community: '阳光花园',
    building: '1号楼',
    points: 120,
    token: 'token-user-1',
  },
  {
    id: 'user-2',
    nickname: '小红',
    avatar: '',
    community: '阳光花园',
    building: '3号楼',
    points: 85,
    token: 'token-user-2',
  },
  {
    id: 'user-3',
    nickname: '老王',
    avatar: '',
    community: '翠湖小区',
    building: '5号楼',
    points: 210,
    token: 'token-user-3',
  },
];

const items: Item[] = [
  {
    id: 'item-1',
    title: '小米电饭煲',
    category: '家电',
    condition: '九成新',
    description: '用了半年，功能完好，搬家带不走了，送给需要的邻居。',
    community: '阳光花园',
    building: '1号楼',
    images: [],
    publisherId: 'user-1',
    publisherNickname: '小明',
    publisherAvatar: '',
    status: 'available',
    claims: [],
    createdAt: Date.now() - 86400000,
    distance: 200,
  },
  {
    id: 'item-2',
    title: '实木书桌',
    category: '家具',
    condition: '七成新',
    description: '1.2米实木书桌，有轻微使用痕迹，结实耐用。',
    community: '阳光花园',
    building: '3号楼',
    images: [],
    publisherId: 'user-2',
    publisherNickname: '小红',
    publisherAvatar: '',
    status: 'available',
    claims: [],
    createdAt: Date.now() - 172800000,
    distance: 350,
  },
  {
    id: 'item-3',
    title: '《人类简史》全套',
    category: '书籍',
    condition: '九成新',
    description: '尤瓦尔·赫拉利三部曲，看完了，转给爱读书的邻居。',
    community: '翠湖小区',
    building: '5号楼',
    images: [],
    publisherId: 'user-3',
    publisherNickname: '老王',
    publisherAvatar: '',
    status: 'available',
    claims: [],
    createdAt: Date.now() - 259200000,
    distance: 800,
  },
  {
    id: 'item-4',
    title: '飞利浦台灯',
    category: '家电',
    condition: '全新',
    description: '公司年会奖品，用不上，全新未拆封。',
    community: '阳光花园',
    building: '1号楼',
    images: [],
    publisherId: 'user-1',
    publisherNickname: '小明',
    publisherAvatar: '',
    status: 'claimed',
    claims: [
      {
        id: 'claim-1',
        itemId: 'item-4',
        claimantId: 'user-2',
        claimantNickname: '小红',
        claimantAvatar: '',
        reason: '孩子写作业需要一个护眼台灯',
        status: 'approved',
        createdAt: Date.now() - 3600000,
      },
    ],
    createdAt: Date.now() - 43200000,
    distance: 150,
  },
];

const reviews: Review[] = [];

const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  const user = users.find((u) => u.token === token);
  if (!user) {
    return res.status(401).json({ error: '未授权' });
  }
  (req as any).user = user;
  next();
};

app.post('/api/auth/login', (req, res) => {
  const { userId } = req.body;
  const user = users.find((u) => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  res.json({ user, token: user.token });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: (req as any).user });
});

app.put('/api/user/profile', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { nickname, community, building, avatar } = req.body;
  if (nickname) user.nickname = nickname;
  if (community) user.community = community;
  if (building) user.building = building;
  if (avatar !== undefined) user.avatar = avatar;
  res.json({ user });
});

app.get('/api/items', (req, res) => {
  const { category, sort, community } = req.query;
  let filteredItems = [...items];

  if (category && category !== 'all') {
    filteredItems = filteredItems.filter((item) => item.category === category);
  }

  if (community) {
    filteredItems = filteredItems.filter((item) => item.community === community);
  }

  if (sort === 'distance') {
    filteredItems.sort((a, b) => a.distance - b.distance);
  } else if (sort === 'points') {
    filteredItems.sort((a, b) => {
      const pubA = users.find((u) => u.id === a.publisherId);
      const pubB = users.find((u) => u.id === b.publisherId);
      return (pubB?.points || 0) - (pubA?.points || 0);
    });
  } else {
    filteredItems.sort((a, b) => b.createdAt - a.createdAt);
  }

  res.json({ items: filteredItems });
});

app.get('/api/items/:id', (req, res) => {
  const item = items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: '物品不存在' });
  }
  res.json({ item });
});

app.post('/api/items', authenticate, upload.array('images', 3), (req, res) => {
  const user = (req as any).user as User;
  const { title, category, condition, description, community, building } = req.body;
  const files = (req.files as Express.Multer.File[]) || [];
  const imageUrls = files.map((f) => `/uploads/${f.filename}`);

  const newItem: Item = {
    id: uuidv4(),
    title,
    category,
    condition,
    description,
    community,
    building,
    images: imageUrls,
    publisherId: user.id,
    publisherNickname: user.nickname,
    publisherAvatar: user.avatar,
    status: 'available',
    claims: [],
    createdAt: Date.now(),
    distance: Math.floor(Math.random() * 1000) + 50,
  };

  items.unshift(newItem);
  res.status(201).json({ item: newItem });
});

app.get('/api/items/mine', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const myItems = items.filter((item) => item.publisherId === user.id);
  myItems.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ items: myItems });
});

app.post('/api/items/:id/claim', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const item = items.find((i) => i.id === req.params.id);
  if (!item) {
    return res.status(404).json({ error: '物品不存在' });
  }
  if (item.status !== 'available') {
    return res.status(400).json({ error: '物品已被申领' });
  }
  if (item.publisherId === user.id) {
    return res.status(400).json({ error: '不能申领自己发布的物品' });
  }

  const { reason } = req.body;
  const claim: Claim = {
    id: uuidv4(),
    itemId: item.id,
    claimantId: user.id,
    claimantNickname: user.nickname,
    claimantAvatar: user.avatar,
    reason,
    status: 'pending',
    createdAt: Date.now(),
  };

  item.claims.push(claim);
  res.json({ claim });
});

app.get('/api/claims/mine', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const myClaims: (Claim & { itemTitle: string; itemImage: string })[] = [];

  items.forEach((item) => {
    item.claims.forEach((claim) => {
      if (claim.claimantId === user.id) {
        myClaims.push({
          ...claim,
          itemTitle: item.title,
          itemImage: item.images[0] || '',
        });
      }
    });
  });

  myClaims.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ claims: myClaims });
});

app.post('/api/claims/:claimId/approve', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const claim = items.flatMap((i) => i.claims).find((c) => c.id === req.params.claimId);
  if (!claim) {
    return res.status(404).json({ error: '申领不存在' });
  }

  const item = items.find((i) => i.id === claim.itemId);
  if (!item || item.publisherId !== user.id) {
    return res.status(403).json({ error: '无权操作' });
  }

  item.claims.forEach((c) => {
    c.status = c.id === claim.id ? 'approved' : 'rejected';
  });
  item.status = 'claimed';

  res.json({ claim, item });
});

app.post('/api/claims/:claimId/reject', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const claim = items.flatMap((i) => i.claims).find((c) => c.id === req.params.claimId);
  if (!claim) {
    return res.status(404).json({ error: '申领不存在' });
  }

  const item = items.find((i) => i.id === claim.itemId);
  if (!item || item.publisherId !== user.id) {
    return res.status(403).json({ error: '无权操作' });
  }

  claim.status = 'rejected';
  res.json({ claim });
});

app.post('/api/items/:id/confirm-transfer', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const item = items.find((i) => i.id === req.params.id);
  if (!item || item.publisherId !== user.id) {
    return res.status(403).json({ error: '无权操作' });
  }

  item.status = 'given';
  res.json({ item });
});

app.post('/api/reviews', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const { toUserId, itemId, type } = req.body;

  const existing = reviews.find(
    (r) => r.fromUserId === user.id && r.toUserId === toUserId && r.itemId === itemId
  );
  if (existing) {
    return res.status(400).json({ error: '已评价过' });
  }

  const review: Review = {
    id: uuidv4(),
    fromUserId: user.id,
    toUserId,
    itemId,
    type,
    createdAt: Date.now(),
  };
  reviews.push(review);

  const targetUser = users.find((u) => u.id === toUserId);
  if (targetUser) {
    if (type === 'positive') {
      targetUser.points += 10;
    } else {
      targetUser.points = Math.max(0, targetUser.points - 5);
    }
  }

  res.json({ review, user: targetUser });
});

app.get('/api/reviews/mine', authenticate, (req, res) => {
  const user = (req as any).user as User;
  const myReviews = reviews.filter((r) => r.toUserId === user.id);
  myReviews.sort((a, b) => b.createdAt - a.createdAt);
  res.json({ reviews: myReviews });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find((u) => u.id === req.params.id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  const { token, ...userWithoutToken } = user;
  res.json({ user: userWithoutToken });
});

app.post('/api/upload', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '未上传图片' });
  }
  res.json({ url: `/uploads/${req.file.filename}` });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
