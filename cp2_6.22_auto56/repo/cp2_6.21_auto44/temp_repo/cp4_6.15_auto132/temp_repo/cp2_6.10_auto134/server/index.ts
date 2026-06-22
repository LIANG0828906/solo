import express from 'express';
import cors from 'cors';

interface Goods {
  id: string;
  name: string;
  unitPrice: number;
  stock: number;
  quarterSales: number;
  color: string;
  pattern?: string;
  unit: string;
}

interface Transaction {
  id: string;
  goodsId: string;
  goodsName: string;
  buyerName: string;
  buyerOrigin: '波斯' | '大食' | '拜占庭' | '大唐';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  tax: number;
  currency: '铜钱' | '波斯银币' | '拜占庭金币';
  currencyAmount: number;
  timestamp: number;
  timeStr: string;
}

const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15);
};

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let goods: Goods[] = [
  { id: generateId(), name: '波斯锦', unitPrice: 1200, stock: 45, quarterSales: 100, color: '#a83232', pattern: 'gold-stripe', unit: '匹' },
  { id: generateId(), name: '胡椒', unitPrice: 850, stock: 8, quarterSales: 30, color: '#c07040', pattern: 'jar', unit: '罐' },
  { id: generateId(), name: '乳香', unitPrice: 320, stock: 15, quarterSales: 60, color: '#8b7355', pattern: 'bag', unit: '袋' },
  { id: generateId(), name: '香料', unitPrice: 560, stock: 28, quarterSales: 45, color: '#9932cc', pattern: 'powder', unit: '盒' },
  { id: generateId(), name: '琉璃珠', unitPrice: 180, stock: 120, quarterSales: 200, color: '#1257b0', pattern: 'bead', unit: '串' },
  { id: generateId(), name: '安息香', unitPrice: 420, stock: 35, quarterSales: 50, color: '#d4a24e', pattern: 'stick', unit: '束' },
  { id: generateId(), name: '犀角杯', unitPrice: 3500, stock: 12, quarterSales: 15, color: '#8b4513', pattern: 'cup', unit: '只' },
  { id: generateId(), name: '翡翠指环', unitPrice: 2200, stock: 18, quarterSales: 25, color: '#50c878', pattern: 'ring', unit: '枚' },
  { id: generateId(), name: '龙涎香', unitPrice: 8800, stock: 5, quarterSales: 8, color: '#696969', pattern: 'stone', unit: '块' },
  { id: generateId(), name: '玫瑰水', unitPrice: 680, stock: 22, quarterSales: 40, color: '#ff69b4', pattern: 'bottle', unit: '瓶' },
  { id: generateId(), name: '丁香', unitPrice: 280, stock: 55, quarterSales: 80, color: '#8b0000', pattern: 'bud', unit: '斤' },
  { id: generateId(), name: '没药', unitPrice: 450, stock: 30, quarterSales: 55, color: '#a0522d', pattern: 'resin', unit: '斤' },
];

let transactions: Transaction[] = [
  {
    id: generateId(),
    goodsId: goods[0].id,
    goodsName: '波斯锦',
    buyerName: '阿里',
    buyerOrigin: '波斯',
    quantity: 3,
    unitPrice: 1200,
    totalPrice: 3600,
    tax: 72,
    currency: '波斯银币',
    currencyAmount: 45,
    timestamp: Date.now() - 3600000 * 2,
    timeStr: '未时三刻',
  },
  {
    id: generateId(),
    goodsId: goods[1].id,
    goodsName: '胡椒',
    buyerName: '易卜拉欣',
    buyerOrigin: '大食',
    quantity: 2,
    unitPrice: 850,
    totalPrice: 1700,
    tax: 34,
    currency: '拜占庭金币',
    currencyAmount: 4.05,
    timestamp: Date.now() - 3600000,
    timeStr: '申时二刻',
  },
  {
    id: generateId(),
    goodsId: goods[2].id,
    goodsName: '乳香',
    buyerName: '康国商人',
    buyerOrigin: '波斯',
    quantity: 5,
    unitPrice: 320,
    totalPrice: 1600,
    tax: 32,
    currency: '铜钱',
    currencyAmount: 1600,
    timestamp: Date.now() - 1800000,
    timeStr: '酉时一刻',
  },
];

app.get('/api/goods', (_req, res) => {
  res.json(goods);
});

app.get('/api/goods/:id', (req, res) => {
  const item = goods.find((g) => g.id === req.params.id);
  if (!item) {
    res.status(404).json({ error: 'Goods not found' });
    return;
  }
  res.json(item);
});

app.get('/api/transactions', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 200;
  const goodsName = (req.query.goodsName as string) || '';
  const buyerOrigin = (req.query.buyerOrigin as string) || '';

  let filtered = [...transactions];
  
  if (goodsName) {
    filtered = filtered.filter((t) => t.goodsName.includes(goodsName));
  }
  if (buyerOrigin) {
    filtered = filtered.filter((t) => t.buyerOrigin === buyerOrigin);
  }

  filtered.sort((a, b) => b.timestamp - a.timestamp);

  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginated = filtered.slice(start, end);

  res.json({
    transactions: paginated,
    total: filtered.length,
    page,
    pageSize,
  });
});

app.post('/api/transactions', (req, res) => {
  const tx = req.body as Transaction;
  transactions.unshift(tx);
  
  const goodsItem = goods.find((g) => g.id === tx.goodsId);
  if (goodsItem) {
    goodsItem.stock -= tx.quantity;
    goodsItem.quarterSales += tx.quantity;
  }

  res.json(tx);
});

app.listen(PORT, () => {
  console.log(`西市胡商账簿后端服务已启动: http://localhost:${PORT}`);
});
