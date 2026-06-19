import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import inventoryRoutes from './routes/inventory.ts';
import valuationRoutes from './routes/valuation.ts';
import type { Instrument, Offer } from './routes/inventory.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const rootDir = path.resolve(__dirname, '..');
const uploadsDir = path.join(rootDir, 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsDir));

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      cb(null, true);
    } else {
      cb(new Error('只支持图片文件格式'));
    }
  },
});

function generateFilename(ext: string): string {
  return (
    Date.now().toString(36) +
    Math.random().toString(36).substring(2, 8) +
    ext
  );
}

async function processImage(fileBuffer: Buffer): Promise<{ filename: string }> {
  const ext = '.webp';
  const filename = generateFilename(ext);
  const filePath = path.join(uploadsDir, filename);

  await sharp(fileBuffer)
    .resize(300, 300, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .toFormat('webp', { quality: 80 })
    .toFile(filePath);

  return { filename };
}

app.use(
  '/api/inventory',
  (req: Request, _res: Response, next: NextFunction) => {
    if (req.path === '/' && req.method === 'POST') {
      upload.single('image')(req, _res, async (err: unknown) => {
        if (err) {
          next(err as Error);
          return;
        }
        try {
          if (req.file) {
            const { filename } = await processImage(req.file.buffer);
            (
              req.file as Express.Multer.File & { savedFilename?: string }
            ).savedFilename = filename;
          }
          next();
        } catch (processErr) {
          next(processErr as Error);
        }
      });
    } else {
      next();
    }
  }
);

interface InventoryDB {
  instruments: Instrument[];
  offers: Offer[];
}

declare global {
  var __inventoryDB: InventoryDB;
}

function getDB(): InventoryDB {
  if (!global.__inventoryDB) {
    global.__inventoryDB = {
      instruments: [],
      offers: [],
    };
  }
  return global.__inventoryDB;
}

function initMockData() {
  const db = getDB();

  if (db.instruments.length > 0) {
    return;
  }

  const now = Date.now();

  const mockInstruments: Instrument[] = [
    {
      id: 'ins-001',
      brand: '雅马哈',
      model: 'FG830',
      category: 'guitar',
      purchaseYear: 2022,
      usageYears: 2,
      condition: 8,
      images: [],
      description: '雅马哈经典面单吉他，云杉面板玫瑰木背侧，音色温暖通透，适合指弹和弹唱。有轻微使用痕迹，品丝磨损极小。',
      expectedPrice: 1800,
      createdAt: now - 86400000 * 10,
      seller: { id: 'u001', name: '音乐达人' },
    },
    {
      id: 'ins-002',
      brand: '芬达',
      model: 'Player Stratocaster',
      category: 'guitar',
      purchaseYear: 2021,
      usageYears: 3,
      condition: 7,
      images: [],
      description: '墨西哥产芬达玩家系列斯特拉特，三单拾音器，枫木指板，经典音色。琴身有轻微划痕，不影响使用。',
      expectedPrice: 5500,
      createdAt: now - 86400000 * 8,
      seller: { id: 'u002', name: '摇滚青年' },
    },
    {
      id: 'ins-003',
      brand: '吉布森',
      model: 'Les Paul Standard',
      category: 'guitar',
      purchaseYear: 2019,
      usageYears: 5,
      condition: 6,
      images: [],
      description: '美产吉布森 Les Paul Standard，桃花心木琴体，虎纹枫木贴面，经典HH拾音器配置。带原装琴盒。',
      expectedPrice: 18000,
      createdAt: now - 86400000 * 6,
      seller: { id: 'u003', name: '布鲁斯老炮' },
    },
    {
      id: 'ins-004',
      brand: '罗兰',
      model: 'FP-30X',
      category: 'keyboard',
      purchaseYear: 2023,
      usageYears: 1,
      condition: 9,
      images: [],
      description: '罗兰FP-30X数码钢琴，88键逐级配重键盘，PHA-4 Standard键盘，蓝牙功能。几乎全新，在家中使用较少。',
      expectedPrice: 4200,
      createdAt: now - 86400000 * 5,
      seller: { id: 'u004', name: '钢琴教师' },
    },
    {
      id: 'ins-005',
      brand: '卡西欧',
      model: 'PX-S7000',
      category: 'keyboard',
      purchaseYear: 2022,
      usageYears: 2,
      condition: 8,
      images: [],
      description: '卡西欧 Privia 系列旗舰电钢琴，Smart Hybrid Hammer Action键盘，木质琴架三踏板，外观时尚现代。',
      expectedPrice: 6800,
      createdAt: now - 86400000 * 4,
      seller: { id: 'u005', name: '数码音乐爱好者' },
    },
    {
      id: 'ins-006',
      brand: '雅马哈',
      model: 'YAS-280',
      category: 'wind',
      purchaseYear: 2021,
      usageYears: 3,
      condition: 7,
      images: [],
      description: '雅马哈降E中音萨克斯，初学者标准款，黄铜漆金。配原装笛头和便携箱，适合考级和演奏。',
      expectedPrice: 5200,
      createdAt: now - 86400000 * 3,
      seller: { id: 'u006', name: '管乐团团长' },
    },
    {
      id: 'ins-007',
      brand: '塞尔玛',
      model: 'Seles Axos',
      category: 'wind',
      purchaseYear: 2020,
      usageYears: 4,
      condition: 8,
      images: [],
      description: '法国产塞尔玛中音萨克斯，专业级演奏乐器。音色细腻饱满，按键灵活。附原装琴盒及配件。',
      expectedPrice: 16500,
      createdAt: now - 86400000 * 2,
      seller: { id: 'u007', name: '爵士萨克斯手' },
    },
    {
      id: 'ins-008',
      brand: '马丁',
      model: 'D-28',
      category: 'guitar',
      purchaseYear: 2018,
      usageYears: 6,
      condition: 7,
      images: [],
      description: '美产马丁D-28经典全单民谣吉他，西提卡云杉面板，东印度玫瑰木背侧。开声充分，音色极好。有正常使用痕迹。',
      expectedPrice: 15500,
      createdAt: now - 86400000 * 1,
      seller: { id: 'u008', name: '民谣唱作人' },
    },
    {
      id: 'ins-009',
      brand: '泰勒',
      model: 'GS Mini',
      category: 'guitar',
      purchaseYear: 2023,
      usageYears: 1,
      condition: 9,
      images: [],
      description: '泰勒GS Mini旅行小吉他，36寸尺寸，携带方便。云杉面板，萨佩莱背侧，音色饱满。全新品相。',
      expectedPrice: 3800,
      createdAt: now - 86400000 * 0.5,
      seller: { id: 'u009', name: '旅行歌手' },
    },
    {
      id: 'ins-010',
      brand: '罗兰',
      model: 'AE-30',
      category: 'wind',
      purchaseYear: 2022,
      usageYears: 2,
      condition: 8,
      images: [],
      description: '罗兰AE-30电吹管，内置多种音色，支持MIDI和蓝牙，专业级电子管乐器。含吹嘴和便携包。',
      expectedPrice: 9800,
      createdAt: now,
      seller: { id: 'u010', name: '电子音乐人' },
    },
  ];

  db.instruments = mockInstruments;

  const mockOffers: Offer[] = [
    {
      id: 'off-001',
      instrumentId: 'ins-001',
      buyerName: '吉他新手',
      price: 1600,
      status: 'pending',
      createdAt: now - 3600000 * 48,
    },
    {
      id: 'off-002',
      instrumentId: 'ins-001',
      buyerName: '指弹玩家',
      price: 1700,
      status: 'pending',
      createdAt: now - 3600000 * 24,
    },
    {
      id: 'off-003',
      instrumentId: 'ins-002',
      buyerName: '乐队主音',
      price: 5000,
      status: 'pending',
      createdAt: now - 3600000 * 36,
    },
    {
      id: 'off-004',
      instrumentId: 'ins-004',
      buyerName: '学琴妈妈',
      price: 3900,
      status: 'accepted',
      createdAt: now - 3600000 * 12,
    },
    {
      id: 'off-005',
      instrumentId: 'ins-005',
      buyerName: '琴童家长',
      price: 6200,
      status: 'pending',
      createdAt: now - 3600000 * 8,
    },
  ];

  db.offers = mockOffers;
}

initMockData();

app.post('/api/offers/:offerId/accept', (req: Request, res: Response) => {
  const db = getDB();
  const offer = db.offers.find((o) => o.id === req.params.offerId);

  if (!offer) {
    res.status(404).json({ error: '出价不存在' });
    return;
  }

  if (offer.status !== 'pending') {
    res.status(400).json({ error: `当前出价状态为${offer.status}，无法接受` });
    return;
  }

  offer.status = 'accepted';

  db.offers
    .filter((o) => o.instrumentId === offer.instrumentId && o.id !== offer.id)
    .forEach((o) => {
      o.status = 'rejected';
    });

  res.json(offer);
});

app.post('/api/offers/:offerId/reject', (req: Request, res: Response) => {
  const db = getDB();
  const offer = db.offers.find((o) => o.id === req.params.offerId);

  if (!offer) {
    res.status(404).json({ error: '出价不存在' });
    return;
  }

  if (offer.status !== 'pending') {
    res.status(400).json({ error: `当前出价状态为${offer.status}，无法拒绝` });
    return;
  }

  offer.status = 'rejected';
  res.json(offer);
});

app.use('/api/inventory', inventoryRoutes);
app.use('/api/valuation', valuationRoutes);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({
    error: err.message || '服务器内部错误',
  });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 乐器交易平台后端服务已启动`);
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`📚 API 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📦 上传目录: ${uploadsDir}`);
});
