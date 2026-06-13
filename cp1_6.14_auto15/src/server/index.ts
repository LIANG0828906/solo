import express from 'express';
import session from 'express-session';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

import {
  initDb,
  getUserByUsername,
  getUserById,
  createUser,
  getInstruments,
  getInstrumentById,
  createInstrument,
  deleteInstrument,
  updateInstrumentStatus,
  getOrdersByUserId,
  getOrderById,
  createOrder,
  updateOrderStatus,
  sha256,
} from './dataStore.js';
import type {
  User,
  Instrument,
  Order,
  InstrumentCategory,
  OrderStatus,
  SessionUser,
} from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
const uploadsDir = path.join(projectRoot, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: 'instrument-rental-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  }),
);
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const filename = uuidv4() + ext;
    cb(null, filename);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传图片文件'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  next();
}

function calcDaysBetween(startStr: string, endStr: string): number {
  const [sy, sm, sd] = startStr.split('-').map(Number);
  const [ey, em, ed] = endStr.split('-').map(Number);
  const startUtc = Date.UTC(sy, sm - 1, sd);
  const endUtc = Date.UTC(ey, em - 1, ed);
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  const diffMs = endUtc - startUtc;
  if (diffMs < 0) return 0;
  return Math.round(diffMs / MS_PER_DAY) + 1;
}

function stripPasswordHash(user: User): SessionUser {
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
  };
}

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const { username, password, nickname } = req.body;

    if (!username || !password || !nickname) {
      res.status(400).json({ error: '用户名、密码和昵称不能为空' });
      return;
    }

    const existing = await getUserByUsername(username);
    if (existing) {
      res.status(400).json({ error: '用户名已被占用' });
      return;
    }

    const passwordHash = sha256(password);
    const user = await createUser({
      username,
      passwordHash,
      nickname,
    });

    const sessionUser = stripPasswordHash(user);
    req.session.user = sessionUser;

    res.json({ success: true, user: sessionUser });
  } catch (err) {
    res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: '用户名和密码不能为空' });
      return;
    }

    const user = await getUserByUsername(username);
    if (!user) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    if (sha256(password) !== user.passwordHash) {
      res.status(401).json({ error: '用户名或密码错误' });
      return;
    }

    const sessionUser = stripPasswordHash(user);
    req.session.user = sessionUser;

    res.json({ success: true, user: sessionUser });
  } catch (err) {
    res.status(500).json({ error: '登录失败' });
  }
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

app.get('/api/auth/me', (req: Request, res: Response) => {
  res.json({ user: req.session.user || null });
});

app.get('/api/instruments', async (req: Request, res: Response) => {
  try {
    const { category, sort, search } = req.query;

    let normalizedSort: 'asc' | 'desc' | undefined;
    if (sort === 'price-asc') {
      normalizedSort = 'asc';
    } else if (sort === 'price-desc') {
      normalizedSort = 'desc';
    }

    const instruments = await getInstruments({
      category: category as InstrumentCategory | undefined,
      sort: normalizedSort,
      search: search as string | undefined,
    });

    res.json({ instruments });
  } catch (err) {
    res.status(500).json({ error: '获取乐器列表失败' });
  }
});

app.get('/api/instruments/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const instrument = await getInstrumentById(id);

    if (!instrument) {
      res.status(404).json({ error: '乐器不存在' });
      return;
    }

    const owner = await getUserById(instrument.ownerId);
    if (!owner) {
      res.status(404).json({ error: '发布者不存在' });
      return;
    }

    res.json({
      instrument,
      owner: stripPasswordHash(owner),
    });
  } catch (err) {
    res.status(500).json({ error: '获取乐器详情失败' });
  }
});

app.post(
  '/api/instruments',
  requireAuth,
  upload.array('images', 3),
  async (req: Request, res: Response) => {
    try {
      const user = req.session.user!;
      const { name, category, brand, purchaseYear, dailyRate, deposit, description } = req.body;

      if (!name || !category || !brand || !purchaseYear || !dailyRate || !deposit || !description) {
        res.status(400).json({ error: '所有字段都不能为空' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      const processedImages: string[] = [];

      for (const file of files) {
        const ext = path.extname(file.originalname).toLowerCase();
        const compressedFilename = uuidv4() + '.jpg';
        const compressedPath = path.join(uploadsDir, compressedFilename);

        if (ext === '.jpg' || ext === '.jpeg') {
          await sharp(file.path)
            .resize(800, null, { withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(compressedPath);
        } else {
          await sharp(file.path)
            .resize(800, null, { withoutEnlargement: true })
            .jpeg({ quality: 80 })
            .toFile(compressedPath);
        }

        fs.unlinkSync(file.path);
        processedImages.push(`/uploads/${compressedFilename}`);
      }

      const instrument = await createInstrument({
        ownerId: user.id,
        name,
        category,
        brand,
        purchaseYear: Number(purchaseYear),
        dailyRate: Number(dailyRate),
        deposit: Number(deposit),
        description,
        images: processedImages,
      });

      res.json({ instrument });
    } catch (err) {
      res.status(500).json({ error: '创建乐器失败' });
    }
  },
);

app.delete('/api/instruments/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.session.user!;
    const { id } = req.params;

    const instrument = await getInstrumentById(id);
    if (!instrument) {
      res.status(404).json({ error: '乐器不存在' });
      return;
    }

    if (instrument.ownerId !== user.id) {
      res.status(403).json({ error: '没有权限删除该乐器' });
      return;
    }

    await deleteInstrument(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: '删除乐器失败' });
  }
});

app.get('/api/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.session.user!;
    const { role } = req.query;

    const orders = await getOrdersByUserId(
      user.id,
      role as 'sent' | 'received' | undefined,
    );

    const enrichedOrders = [];
    for (const order of orders) {
      const instrument = await getInstrumentById(order.instrumentId);
      const renter = await getUserById(order.renterId);
      const owner = await getUserById(order.ownerId);

      enrichedOrders.push({
        ...order,
        instrument,
        renter: renter ? stripPasswordHash(renter) : undefined,
        owner: owner ? stripPasswordHash(owner) : undefined,
      });
    }

    res.json({ orders: enrichedOrders });
  } catch (err) {
    res.status(500).json({ error: '获取订单列表失败' });
  }
});

app.post('/api/orders', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.session.user!;
    const { instrumentId, startDate, endDate } = req.body;

    if (!instrumentId || !startDate || !endDate) {
      res.status(400).json({ error: '参数不完整' });
      return;
    }

    const instrument = await getInstrumentById(instrumentId);
    if (!instrument) {
      res.status(404).json({ error: '乐器不存在' });
      return;
    }

    if (instrument.ownerId === user.id) {
      res.status(400).json({ error: '不能租用自己的乐器' });
      return;
    }

    const totalDays = calcDaysBetween(startDate, endDate);
    if (totalDays < 1) {
      res.status(400).json({ error: '租期至少为 1 天' });
      return;
    }
    if (totalDays > 30) {
      res.status(400).json({ error: '租期最多为 30 天' });
      return;
    }

    if (instrument.status !== 'available') {
      res.status(400).json({ error: '乐器当前不可租用' });
      return;
    }

    const totalRent = totalDays * instrument.dailyRate;

    const order = await createOrder({
      instrumentId,
      renterId: user.id,
      ownerId: instrument.ownerId,
      startDate,
      endDate,
      totalDays,
      totalRent,
      deposit: instrument.deposit,
    });

    await updateInstrumentStatus(instrumentId, 'pending');

    res.json({ order });
  } catch (err) {
    res.status(500).json({ error: '创建订单失败' });
  }
});

app.patch('/api/orders/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.session.user!;
    const { id } = req.params;
    const { status } = req.body as { status: OrderStatus };

    const order = await getOrderById(id);
    if (!order) {
      res.status(404).json({ error: '订单不存在' });
      return;
    }

    const isOwner = order.ownerId === user.id;
    const isRenter = order.renterId === user.id;

    if (!isOwner && !isRenter) {
      res.status(403).json({ error: '没有权限操作该订单' });
      return;
    }

    let allowed = false;

    if (isOwner) {
      if (
        (order.status === 'pending' && (status === 'confirmed' || status === 'rejected')) ||
        (order.status === 'confirmed' && status === 'completed')
      ) {
        allowed = true;
      }
    }

    if (isRenter) {
      if (order.status === 'pending' && status === 'cancelled') {
        allowed = true;
      }
      if (order.status === 'confirmed' && status === 'cancelled') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [sy, sm, sd] = order.startDate.split('-').map(Number);
        const startDate = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
        if (today.getTime() < startDate.getTime()) {
          allowed = true;
        }
      }
    }

    if (!allowed) {
      res.status(400).json({ error: '不允许的状态变更' });
      return;
    }

    const updatedOrder = await updateOrderStatus(id, status);

    if (status === 'rejected' || status === 'cancelled' || status === 'completed') {
      await updateInstrumentStatus(order.instrumentId, 'available');
    }

    res.json({ order: updatedOrder });
  } catch (err) {
    res.status(500).json({ error: '更新订单状态失败' });
  }
});

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
