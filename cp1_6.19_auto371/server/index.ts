import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { optimizeRoute, AddressInput } from './routeOptimizer.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface Bouquet {
  id: string;
  name: string;
  price: number;
  emoji: string;
  color: string;
  description: string;
  meaning: string;
  pairing: string;
}

const bouquets: Bouquet[] = [
  {
    id: 'b1', name: '玫瑰花束', price: 49.9, emoji: '🌹', color: '#E53935',
    description: '精选12朵红玫瑰，搭配尤加利叶，热烈而优雅。',
    meaning: '红玫瑰象征热烈的爱情与真挚的承诺，是表白与纪念日的首选。',
    pairing: '搭配巧克力礼盒或香槟，营造浪漫氛围。'
  },
  {
    id: 'b2', name: '百合花束', price: 59.9, emoji: '🪷', color: '#FAFAFA',
    description: '3枝多头香水百合，清香淡雅，花朵饱满。',
    meaning: '百合寓意百年好合、纯洁高雅，适合送给长辈或祝贺新婚。',
    pairing: '搭配精美花瓶，让花香常伴左右。'
  },
  {
    id: 'b3', name: '郁金香花束', price: 39.9, emoji: '🌷', color: '#EC407A',
    description: '10枝粉色郁金香，线条优美，春意盎然。',
    meaning: '郁金香代表永恒的祝福与高雅的爱，粉色更添温柔。',
    pairing: '搭配手写贺卡，传递细腻心意。'
  },
  {
    id: 'b4', name: '向日葵花束', price: 35.9, emoji: '🌻', color: '#FDD835',
    description: '5朵大花向日葵，阳光灿烂，充满活力。',
    meaning: '向日葵象征阳光、希望与忠诚，适合鼓励与祝福。',
    pairing: '搭配小熊公仔，可爱加倍。'
  },
  {
    id: 'b5', name: '康乃馨花束', price: 45.9, emoji: '🌺', color: '#F48FB1',
    description: '12朵粉色康乃馨，温婉柔和，馨香满溢。',
    meaning: '康乃馨是母亲之花，代表感恩、敬爱与祝福。',
    pairing: '搭配保温杯，送给妈妈最贴心。'
  },
  {
    id: 'b6', name: '满天星花束', price: 29.9, emoji: '💐', color: '#CE93D8',
    description: '大束白色满天星，如星河般梦幻，浪漫至极。',
    meaning: '满天星寓意真心喜欢、甘做配角的爱，低调而深情。',
    pairing: '搭配香薰蜡烛，营造梦幻空间。'
  },
  {
    id: 'b7', name: '紫罗兰花束', price: 55.9, emoji: '💜', color: '#7E57C2',
    description: '8枝紫色紫罗兰，高贵神秘，芬芳迷人。',
    meaning: '紫罗兰象征永恒的美丽与质朴的美德，代表高贵之爱。',
    pairing: '搭配丝巾礼盒，优雅升级。'
  },
  {
    id: 'b8', name: '雏菊花束', price: 33.9, emoji: '🌼', color: '#FFF9C4',
    description: '15朵白色小雏菊，清新可爱，元气满满。',
    meaning: '雏菊代表天真、纯洁与深藏的爱，是友谊的象征。',
    pairing: '搭配手工饼干，甜蜜又温暖。'
  },
];

interface OrderItem {
  bouquetId: string;
  bouquetName: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  items: OrderItem[];
  recipientName: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  timeSlot: string;
  status: 'pending' | 'delivering' | 'completed';
  createdAt: string;
}

const orders: Order[] = [];

const addressDatabase: { name: string; lat: number; lng: number }[] = [
  { name: '中山路88号', lat: 31.2304, lng: 121.4737 },
  { name: '南京东路100号', lat: 31.2357, lng: 121.4750 },
  { name: '淮海中路200号', lat: 31.2235, lng: 121.4692 },
  { name: '人民广场15号', lat: 31.2300, lng: 121.4700 },
  { name: '外滩18号', lat: 31.2400, lng: 121.4900 },
  { name: '陆家嘴环路50号', lat: 31.2397, lng: 121.5016 },
  { name: '徐家汇路66号', lat: 31.1953, lng: 121.4470 },
  { name: '静安寺路120号', lat: 31.2240, lng: 121.4476 },
  { name: '长宁路78号', lat: 31.2200, lng: 121.4100 },
  { name: '浦东大道300号', lat: 31.2350, lng: 121.5100 },
  { name: '延安西路55号', lat: 31.2150, lng: 121.4400 },
  { name: '西藏南路22号', lat: 31.2100, lng: 121.4800 },
  { name: '复兴东路168号', lat: 31.2180, lng: 121.4850 },
  { name: '北京西路99号', lat: 31.2320, lng: 121.4550 },
  { name: '福州路45号', lat: 31.2340, lng: 121.4720 },
];

app.get('/api/bouquets', (_req, res) => {
  res.json(bouquets);
});

app.post('/api/orders', (req, res) => {
  const { items, recipientName, phone, address, lat, lng, timeSlot } = req.body;
  if (!items || !recipientName || !phone || !address || !timeSlot) {
    res.status(400).json({ error: '缺少必填字段' });
    return;
  }
  const order: Order = {
    id: uuidv4().slice(0, 8).toUpperCase(),
    items,
    recipientName,
    phone,
    address,
    lat: lat || 31.2304 + (Math.random() - 0.5) * 0.05,
    lng: lng || 121.4737 + (Math.random() - 0.5) * 0.05,
    timeSlot,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  res.json(order);
});

app.get('/api/orders', (_req, res) => {
  res.json(orders);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find(o => o.id === id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  order.status = status;
  res.json(order);
});

app.post('/api/optimize-route', (req, res) => {
  const { pendingOrders } = req.body as { pendingOrders: Order[] };
  if (!pendingOrders || pendingOrders.length === 0) {
    res.json([]);
    return;
  }
  const addresses: AddressInput[] = pendingOrders.map(o => ({
    orderId: o.id,
    address: o.address,
    lat: o.lat,
    lng: o.lng,
  }));
  const startTime = Date.now();
  const result = optimizeRoute(addresses);
  const elapsed = Date.now() - startTime;
  console.log(`Route optimization completed in ${elapsed}ms for ${addresses.length} addresses`);
  res.json(result);
});

app.get('/api/addresses', (req, res) => {
  const q = (req.query.q as string || '').toLowerCase();
  const suggestions = addressDatabase
    .filter(a => a.name.includes(q))
    .slice(0, 5)
    .map(a => ({ name: a.name, lat: a.lat, lng: a.lng }));
  res.json(suggestions);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
