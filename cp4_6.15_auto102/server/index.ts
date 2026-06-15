import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

const CATEGORIES = ['教材书籍', '电子产品', '生活用品', '运动器材', '服饰鞋包', '其他'];

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const items: Item[] = [
  {
    id: '1',
    title: '高等数学同济第七版（上下册）',
    description: '大一高数教材，上下册全套，笔记不多，保存完好。适合大一新生使用，不用再花高价买新书了。',
    category: '教材书籍',
    points: 30,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=A+set+of+university+math+textbooks+on+a+wooden+desk+clean+minimal&image_size=square',
    ],
    publisherId: 'u1',
    publisherName: '数学小达人',
    publisherAvatar: '',
    stock: 3,
    status: 'approved',
    createdAt: daysAgo(2),
  },
  {
    id: '2',
    title: 'iPad Air 4 64G 绿色',
    description: '自用一年半，无划痕，电池健康度91%，配原装妙控键盘和Apple Pencil。毕业后用不上了，低价转。',
    category: '电子产品',
    points: 280,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Green+iPad+Air+on+white+desk+with+keyboard+clean+product+shot&image_size=square',
    ],
    publisherId: 'u2',
    publisherName: '毕业清仓王',
    publisherAvatar: '',
    stock: 1,
    status: 'approved',
    createdAt: daysAgo(1),
  },
  {
    id: '3',
    title: '宜家台灯+书架组合',
    description: '宿舍必备良品！台灯三档调光，书架五层，搬走带不走，半价出。仅限校内自提。',
    category: '生活用品',
    points: 45,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Ikea+desk+lamp+and+bookshelf+in+dorm+room+warm+lighting&image_size=square',
    ],
    publisherId: 'u3',
    publisherName: '生活小能手',
    publisherAvatar: '',
    stock: 2,
    status: 'approved',
    createdAt: daysAgo(3),
  },
  {
    id: '4',
    title: '哑铃套装 10kg×2',
    description: '疫情期间买的居家健身哑铃，现在办了健身卡用不上了，几乎全新，带防滑握把。',
    category: '运动器材',
    points: 60,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Pair+of+black+dumbbells+10kg+on+floor+mat+fitness+equipment&image_size=square',
    ],
    publisherId: 'u4',
    publisherName: '运动健将',
    publisherAvatar: '',
    stock: 1,
    status: 'approved',
    createdAt: daysAgo(5),
  },
  {
    id: '5',
    title: 'Python编程从入门到实践',
    description: '自学Python的神书！基本全新，只翻了几章。附带课后习题答案打印版。',
    category: '教材书籍',
    points: 25,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Python+programming+book+cover+on+desk+clean+shot&image_size=square',
    ],
    publisherId: 'u5',
    publisherName: '码农小张',
    publisherAvatar: '',
    stock: 5,
    status: 'approved',
    createdAt: daysAgo(1),
  },
  {
    id: '6',
    title: '小米充电宝20000mAh',
    description: '出门旅行必备！支持快充，带两个USB口，白色款，外观九成新。',
    category: '电子产品',
    points: 35,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Xiaomi+white+power+bank+20000mAh+on+desk+clean+product+photo&image_size=square',
    ],
    publisherId: 'u1',
    publisherName: '数学小达人',
    publisherAvatar: '',
    stock: 4,
    status: 'approved',
    createdAt: daysAgo(4),
  },
  {
    id: '7',
    title: '优衣库羽绒服黑色M码',
    description: '去年冬天买的，穿了一个季节，很暖和。洗过一次，没有起球。适合160-170身高。',
    category: '服饰鞋包',
    points: 80,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Black+Uniqlo+down+jacket+on+hanger+clean+product+shot&image_size=square',
    ],
    publisherId: 'u6',
    publisherName: '时尚学姐',
    publisherAvatar: '',
    stock: 1,
    status: 'approved',
    createdAt: daysAgo(2),
  },
  {
    id: '8',
    title: '大学物理实验报告模板全套',
    description: '涵盖所有实验项目，附数据分析和思考题答案。物院学弟学妹的福音。',
    category: '教材书籍',
    points: 15,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Physics+lab+report+notebook+on+desk+with+pen&image_size=square',
    ],
    publisherId: 'u7',
    publisherName: '物理系老司机',
    publisherAvatar: '',
    stock: 10,
    status: 'approved',
    createdAt: daysAgo(6),
  },
  {
    id: '9',
    title: '罗技MX Master 3S 鼠标',
    description: '程序员神器！多设备切换，静音点击，电磁滚轮。用了一个月，手感超好，换电脑了出掉。',
    category: '电子产品',
    points: 120,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Logitech+MX+Master+3S+mouse+on+desk+top+view+clean&image_size=square',
    ],
    publisherId: 'u5',
    publisherName: '码农小张',
    publisherAvatar: '',
    stock: 1,
    status: 'approved',
    createdAt: daysAgo(3),
  },
  {
    id: '10',
    title: '瑜伽垫+拉力带套装',
    description: '宿舍就能做瑜伽！垫子8mm厚，回弹性好，拉力带三根不同阻力。买来只用过两次。',
    category: '运动器材',
    points: 40,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Purple+yoga+mat+with+resistance+bands+on+floor&image_size=square',
    ],
    publisherId: 'u6',
    publisherName: '时尚学姐',
    publisherAvatar: '',
    stock: 2,
    status: 'approved',
    createdAt: daysAgo(7),
  },
  {
    id: '11',
    title: '收纳箱三件套 透明款',
    description: '宿舍整理神器，三个不同尺寸，可叠加。用来放零食、化妆品、文具都很合适。',
    category: '生活用品',
    points: 20,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Transparent+storage+boxes+stacked+neat+organization&image_size=square',
    ],
    publisherId: 'u3',
    publisherName: '生活小能手',
    publisherAvatar: '',
    stock: 6,
    status: 'approved',
    createdAt: daysAgo(4),
  },
  {
    id: '12',
    title: '帆布双肩包 军绿色',
    description: '复古风帆布包，容量大，可以放15寸笔记本。背了半年，越背越有味道。',
    category: '服饰鞋包',
    points: 50,
    images: [
      'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Military+green+canvas+backpack+on+white+background+clean&image_size=square',
    ],
    publisherId: 'u4',
    publisherName: '运动健将',
    publisherAvatar: '',
    stock: 2,
    status: 'approved',
    createdAt: daysAgo(5),
  },
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
    { id: 't1', type: 'income', amount: 80, description: '发布物品「Python编程从入门到实践」获得积分', createdAt: daysAgo(0) },
    { id: 't2', type: 'expense', amount: 30, description: '交换「高等数学同济第七版」', createdAt: daysAgo(0) },
    { id: 't3', type: 'income', amount: 50, description: '分享物品获得奖励积分', createdAt: daysAgo(1) },
    { id: 't4', type: 'expense', amount: 45, description: '交换「宜家台灯+书架组合」', createdAt: daysAgo(2) },
    { id: 't5', type: 'income', amount: 30, description: '发布物品「大学物理实验报告模板」获得积分', createdAt: daysAgo(3) },
    { id: 't6', type: 'income', amount: 65, description: '每日签到奖励', createdAt: daysAgo(3) },
    { id: 't7', type: 'expense', amount: 20, description: '交换「收纳箱三件套」', createdAt: daysAgo(4) },
    { id: 't8', type: 'income', amount: 50, description: '分享物品获得奖励积分', createdAt: daysAgo(5) },
    { id: 't9', type: 'income', amount: 120, description: '发布物品「罗技MX Master 3S」获得积分', createdAt: daysAgo(6) },
    { id: 't10', type: 'expense', amount: 60, description: '交换「哑铃套装」', createdAt: daysAgo(7) },
  ],
};

app.get('/api/items', (_req: Request, res: Response) => {
  const approvedItems = items.filter(i => i.status === 'approved');
  res.json({ items: approvedItems });
});

app.post('/api/items', (req: Request, res: Response) => {
  const body = req.body;
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
  res.json({ item: newItem });
});

app.get('/api/items/:id', (req: Request, res: Response) => {
  const item = items.find(i => i.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: '物品不存在' });
    return;
  }
  res.json({ item });
});

app.get('/api/wallet/:userId', (_req: Request, res: Response) => {
  res.json({ wallet });
});

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});
