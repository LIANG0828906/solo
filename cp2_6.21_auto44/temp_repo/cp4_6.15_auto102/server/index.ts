import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({ storage });

interface Item {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  images: string[];
  publisherId: string;
  publisherName: string;
  publisherAvatar: string;
  stock: number;
  status: 'pending' | 'approved' | 'exchanged';
  createdAt: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  createdAt: string;
}

interface WalletData {
  userId: string;
  balance: number;
  weeklyChanges: { date: string; change: number }[];
  transactions: Transaction[];
}

interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

const CATEGORIES = ['教材书籍', '电子产品', '生活用品', '运动器材', '服饰鞋包', '其他'];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function img(prompt: string): string {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`;
}

const items: Item[] = [
  { id: '1', title: '高等数学同济第七版（上下册）', description: '大一高数教材，上下册全套，笔记不多，保存完好。', category: '教材书籍', points: 30, images: [img('大学数学教材 木制桌面 干净简约')], publisherId: 'u1', publisherName: '数学小达人', publisherAvatar: '', stock: 3, status: 'approved', createdAt: daysAgo(2) },
  { id: '2', title: 'iPad Air 4 64G 绿色', description: '自用一年半，无划痕，电池健康度91%，配原装妙控键盘。', category: '电子产品', points: 280, images: [img('绿色iPad Air 白色桌面 键盘 干净产品照')], publisherId: 'u2', publisherName: '毕业清仓王', publisherAvatar: '', stock: 1, status: 'approved', createdAt: daysAgo(1) },
  { id: '3', title: '宜家台灯+书架组合', description: '宿舍必备良品！台灯三档调光，书架五层，半价出。', category: '生活用品', points: 45, images: [img('宜家台灯和书架 宿舍房间 暖光')], publisherId: 'u3', publisherName: '生活小能手', publisherAvatar: '', stock: 2, status: 'approved', createdAt: daysAgo(3) },
  { id: '4', title: '哑铃套装 10kg×2', description: '居家健身哑铃，几乎全新，带防滑握把。', category: '运动器材', points: 60, images: [img('黑色哑铃 10kg 健身垫 健身器材')], publisherId: 'u4', publisherName: '运动健将', publisherAvatar: '', stock: 1, status: 'approved', createdAt: daysAgo(5) },
  { id: '5', title: 'Python编程从入门到实践', description: '自学Python的神书！基本全新，只翻了几章。', category: '教材书籍', points: 25, images: [img('Python编程书 桌面 干净照片')], publisherId: 'u5', publisherName: '码农小张', publisherAvatar: '', stock: 5, status: 'approved', createdAt: daysAgo(1) },
  { id: '6', title: '小米充电宝20000mAh', description: '出门旅行必备！支持快充，带两个USB口，白色款。', category: '电子产品', points: 35, images: [img('小米白色充电宝 20000mAh 桌面 干净产品照')], publisherId: 'u1', publisherName: '数学小达人', publisherAvatar: '', stock: 4, status: 'approved', createdAt: daysAgo(4) },
  { id: '7', title: '优衣库羽绒服黑色M码', description: '去年冬天买的，穿了一个季节，很暖和，没有起球。', category: '服饰鞋包', points: 80, images: [img('黑色优衣库羽绒服 衣架 干净产品照')], publisherId: 'u6', publisherName: '时尚学姐', publisherAvatar: '', stock: 1, status: 'approved', createdAt: daysAgo(2) },
  { id: '8', title: '大学物理实验报告模板全套', description: '涵盖所有实验项目，附数据分析和思考题答案。', category: '教材书籍', points: 15, images: [img('物理实验报告 笔记本 桌面 钢笔')], publisherId: 'u7', publisherName: '物理系老司机', publisherAvatar: '', stock: 10, status: 'approved', createdAt: daysAgo(6) },
  { id: '9', title: '罗技MX Master 3S 鼠标', description: '程序员神器！多设备切换，静音点击，电磁滚轮。', category: '电子产品', points: 120, images: [img('罗技MX Master 3S鼠标 桌面 俯视图 干净')], publisherId: 'u5', publisherName: '码农小张', publisherAvatar: '', stock: 1, status: 'approved', createdAt: daysAgo(3) },
  { id: '10', title: '瑜伽垫+拉力带套装', description: '宿舍就能做瑜伽！垫子8mm厚，拉力带三根不同阻力。', category: '运动器材', points: 40, images: [img('紫色瑜伽垫 弹力带 地板')], publisherId: 'u6', publisherName: '时尚学姐', publisherAvatar: '', stock: 2, status: 'approved', createdAt: daysAgo(7) },
  { id: '11', title: '收纳箱三件套 透明款', description: '宿舍整理神器，三个不同尺寸，可叠加。', category: '生活用品', points: 20, images: [img('透明收纳箱 整齐堆放 整洁收纳')], publisherId: 'u3', publisherName: '生活小能手', publisherAvatar: '', stock: 6, status: 'approved', createdAt: daysAgo(4) },
  { id: '12', title: '帆布双肩包 军绿色', description: '复古风帆布包，容量大，可以放15寸笔记本。', category: '服饰鞋包', points: 50, images: [img('军绿色帆布双肩包 白色背景 干净')], publisherId: 'u4', publisherName: '运动健将', publisherAvatar: '', stock: 2, status: 'approved', createdAt: daysAgo(5) },
];

const wallet: WalletData = {
  userId: 'currentUser',
  balance: 520,
  weeklyChanges: [
    { date: '06-09', change: 30 },
    { date: '06-10', change: -45 },
    { date: '06-11', change: 80 },
    { date: '06-12', change: -20 },
    { date: '06-13', change: 50 },
    { date: '06-14', change: -30 },
    { date: '06-15', change: 65 },
  ],
  transactions: [
    { id: 't1', type: 'income', amount: 80, description: '发布物品获得积分', createdAt: daysAgo(0) },
    { id: 't2', type: 'expense', amount: 30, description: '交换高等数学教材', createdAt: daysAgo(0) },
    { id: 't3', type: 'income', amount: 50, description: '分享物品获得奖励积分', createdAt: daysAgo(1) },
    { id: 't4', type: 'expense', amount: 45, description: '交换宜家台灯组合', createdAt: daysAgo(2) },
    { id: 't5', type: 'income', amount: 30, description: '发布物品获得积分', createdAt: daysAgo(3) },
    { id: 't6', type: 'income', amount: 65, description: '每日签到奖励', createdAt: daysAgo(3) },
    { id: 't7', type: 'expense', amount: 20, description: '交换收纳箱三件套', createdAt: daysAgo(4) },
    { id: 't8', type: 'income', amount: 50, description: '分享物品获得奖励积分', createdAt: daysAgo(5) },
    { id: 't9', type: 'income', amount: 120, description: '发布物品获得积分', createdAt: daysAgo(6) },
    { id: 't10', type: 'expense', amount: 60, description: '交换哑铃套装', createdAt: daysAgo(7) },
  ],
};

app.get('/api/items', (req: Request, res: Response<ApiResponse>) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 8;
  const approvedItems = items.filter(i => i.status === 'approved');
  const total = approvedItems.length;
  const start = (page - 1) * limit;
  const end = start + limit;
  res.json({
    success: true,
    data: {
      items: approvedItems.slice(start, end),
      total,
      page,
      limit,
      hasMore: end < total,
    },
  });
});

app.get('/api/items/:id', (req: Request, res: Response<ApiResponse>) => {
  const item = items.find(i => i.id === req.params.id);
  if (!item) {
    res.status(404).json({ success: false, error: '物品不存在' });
    return;
  }
  res.json({ success: true, data: { item } });
});

app.post('/api/items', (req: Request, res: Response<ApiResponse>) => {
  const body = req.body as Partial<Item>;
  const newItem: Item = {
    id: uuidv4(),
    title: body.title || '',
    description: body.description || '',
    category: body.category || '其他',
    points: body.points || 0,
    images: body.images || [],
    publisherId: 'currentUser',
    publisherName: '我',
    publisherAvatar: '',
    stock: body.stock || 1,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  items.unshift(newItem);
  res.json({ success: true, data: { item: newItem } });
});

app.post('/api/upload', upload.single('file'), (req: Request, res: Response<ApiResponse>) => {
  if (!req.file) {
    res.status(400).json({ success: false, error: '没有上传文件' });
    return;
  }
  res.json({ success: true, data: { url: `/uploads/${req.file.filename}` } });
});

app.get('/api/wallet/:userId', (_req: Request, res: Response<ApiResponse>) => {
  res.json({ success: true, data: { wallet } });
});

app.get('/api/health', (_req: Request, res: Response<ApiResponse>) => {
  res.status(200).json({ success: true, data: { message: 'ok' } });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});
