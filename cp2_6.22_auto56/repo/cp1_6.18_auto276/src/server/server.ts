import express from 'express';
import cors from 'cors';
import low from 'lowdb';
import FileSync from 'lowdb/adapters/FileSync';
import path from 'path';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, '../../db.json');
const adapter = new FileSync(dbPath);
const db = low(adapter);

interface Seat {
  id: number;
  row: number;
  col: number;
  isBooked: boolean;
  customerName?: string;
  phone?: string;
  partySize?: number;
}

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
}

interface OrderItem {
  menuItemId: number;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  id: string;
  seatId: number;
  items: OrderItem[];
  status: 'received' | 'cooking' | 'completed';
  createdAt: string;
}

interface DBSchema {
  seats: Seat[];
  menu: MenuItem[];
  orders: Order[];
}

const initializeSeats = (): Seat[] => {
  const seats: Seat[] = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      seats.push({
        id: row * 10 + col + 1,
        row,
        col,
        isBooked: false
      });
    }
  }
  return seats;
};

const initializeMenu = (): MenuItem[] => [
  {
    id: 1,
    name: '宫保鸡丁',
    description: '经典川菜，鸡肉嫩滑，花生酥脆',
    price: 48,
    category: '热菜'
  },
  {
    id: 2,
    name: '麻婆豆腐',
    description: '麻辣鲜香，豆腐软嫩入味',
    price: 32,
    category: '热菜'
  },
  {
    id: 3,
    name: '凉拌黄瓜',
    description: '清爽开胃，蒜香十足',
    price: 18,
    category: '凉菜'
  },
  {
    id: 4,
    name: '红烧狮子头',
    description: '淮扬名菜，肉质鲜嫩多汁',
    price: 58,
    category: '热菜'
  },
  {
    id: 5,
    name: '蛋炒饭',
    description: '粒粒分明，蛋香浓郁',
    price: 22,
    category: '主食'
  },
  {
    id: 6,
    name: '珍珠奶茶',
    description: '香浓奶茶配Q弹珍珠',
    price: 16,
    category: '饮品'
  },
  {
    id: 7,
    name: '糖醋里脊',
    description: '酸甜可口，外酥里嫩',
    price: 42,
    category: '热菜'
  },
  {
    id: 8,
    name: '水果拼盘',
    description: '时令水果，新鲜甜美',
    price: 38,
    category: '甜点'
  }
];

db.defaults({
  seats: initializeSeats(),
  menu: initializeMenu(),
  orders: []
}).write();

const getSeats = (): Seat[] => db.get('seats').value() as Seat[];
const getMenu = (): MenuItem[] => db.get('menu').value() as MenuItem[];
const getOrders = (): Order[] => db.get('orders').value() as Order[];

app.get('/api/seatings', (_req, res) => {
  const seats = getSeats();
  res.json(seats);
});

app.post('/api/booking', (req, res) => {
  const { seatId, customerName, phone, partySize } = req.body;

  if (!seatId || !customerName || !phone || !partySize) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const seats = getSeats();
  const seat = seats.find((s) => s.id === seatId);

  if (!seat) {
    return res.status(404).json({ error: '座位不存在' });
  }

  if (seat.isBooked) {
    return res.status(400).json({ error: '座位已被预订' });
  }

  const updatedSeat: Seat = {
    ...seat,
    isBooked: true,
    customerName,
    phone,
    partySize
  };

  const seatIndex = seats.findIndex((s) => s.id === seatId);
  seats[seatIndex] = updatedSeat;

  (db as any).set('seats', seats).write();

  res.json(updatedSeat);
});

app.get('/api/menu', (_req, res) => {
  const menu = getMenu();
  res.json(menu);
});

app.post('/api/orders', (req, res) => {
  const { seatId, items } = req.body;

  if (!seatId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  const menu = getMenu();
  const orders = getOrders();

  const orderId = `ORD${Date.now()}`;
  const orderItems: OrderItem[] = items.map((item: { menuItemId: number; quantity: number }) => {
    const menuItem = menu.find((m) => m.id === item.menuItemId);
    return {
      menuItemId: item.menuItemId,
      name: menuItem?.name || '',
      price: menuItem?.price || 0,
      quantity: item.quantity
    };
  });

  const newOrder: Order = {
    id: orderId,
    seatId,
    items: orderItems,
    status: 'received',
    createdAt: new Date().toISOString()
  };

  orders.push(newOrder);
  (db as any).set('orders', orders).write();

  setTimeout(() => {
    const currentOrders = getOrders();
    const order = currentOrders.find((o) => o.id === orderId);
    if (order && order.status === 'received') {
      order.status = 'cooking';
      (db as any).set('orders', currentOrders).write();
    }
  }, 5000);

  setTimeout(() => {
    const currentOrders = getOrders();
    const order = currentOrders.find((o) => o.id === orderId);
    if (order && order.status === 'cooking') {
      order.status = 'completed';
      (db as any).set('orders', currentOrders).write();
    }
  }, 15000);

  res.json({ orderId, ...newOrder });
});

app.get('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  const orders = getOrders();
  const order = orders.find((o) => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }

  res.json(order);
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
