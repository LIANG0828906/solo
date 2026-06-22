import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.use(cors());
app.use(express.json());

const DISH_POOL = [
  { name: '宫保鸡丁', emoji: '🍗', station: 'wok', cookTime: 480 },
  { name: '麻婆豆腐', emoji: '🌶️', station: 'wok', cookTime: 420 },
  { name: '鱼香肉丝', emoji: '🥩', station: 'wok', cookTime: 540 },
  { name: '糖醋里脊', emoji: '🍖', station: 'wok', cookTime: 600 },
  { name: '烤羊排', emoji: '🍖', station: 'grill', cookTime: 900 },
  { name: '烤鸡翅', emoji: '🍗', station: 'grill', cookTime: 600 },
  { name: '烤牛排', emoji: '🥩', station: 'grill', cookTime: 840 },
  { name: '烤串', emoji: '🍢', station: 'grill', cookTime: 480 },
  { name: '凉拌黄瓜', emoji: '🥒', station: 'cold', cookTime: 180 },
  { name: '口水鸡', emoji: '🐔', station: 'cold', cookTime: 300 },
  { name: '拍黄瓜', emoji: '🥒', station: 'cold', cookTime: 180 },
  { name: '凉拌木耳', emoji: '🍄', station: 'cold', cookTime: 240 },
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateOrder(id) {
  const dishCount = randomInt(2, 5);
  const dishes = [];
  const usedDishes = new Set();
  let maxCookTime = 0;

  for (let i = 0; i < dishCount; i++) {
    let dishIndex;
    do {
      dishIndex = randomInt(0, DISH_POOL.length - 1);
    } while (usedDishes.has(dishIndex));
    usedDishes.add(dishIndex);
    const dish = DISH_POOL[dishIndex];
    const quantity = randomInt(1, 3);
    dishes.push({
      name: dish.name,
      emoji: dish.emoji,
      quantity,
      station: dish.station,
      cookTime: dish.cookTime,
    });
    if (dish.cookTime > maxCookTime) {
      maxCookTime = dish.cookTime;
    }
  }

  const statuses = ['pending', 'cooking', 'finishing', 'completed'];
  const statusWeights = [0.4, 0.35, 0.15, 0.1];
  let random = Math.random();
  let status = 'pending';
  for (let i = 0; i < statuses.length; i++) {
    if (random < statusWeights[i]) {
      status = statuses[i];
      break;
    }
    random -= statusWeights[i];
  }

  const now = Date.now();
  const baseRemaining = status === 'completed'
    ? 0
    : status === 'pending'
    ? maxCookTime + randomInt(60, 300)
    : status === 'cooking'
    ? maxCookTime * 0.6
    : maxCookTime * 0.2;

  const assignedStation = status === 'pending' ? null : dishes[randomInt(0, dishes.length - 1)].station;

  return {
    id,
    tableNumber: String(randomInt(1, 30)),
    status,
    dishes,
    priority: randomInt(1, 10),
    assignedStation,
    createdAt: now - randomInt(0, 1800000),
    estimatedFinishAt: now + baseRemaining * 1000,
    remainingTime: Math.floor(baseRemaining),
  };
}

let orders = [];
let orderIdCounter = 1;

function generateId() {
  return 'ORD' + String(orderIdCounter++).padStart(4, '0');
}

for (let i = 0; i < 25; i++) {
  const id = generateId();
  orders.push(generateOrder(id));
}

let stations = [
  {
    type: 'wok',
    name: '炒锅',
    color: '#0ea5e9',
    load: 0,
    activeOrders: [],
  },
  {
    type: 'grill',
    name: '烤炉',
    color: '#f97316',
    load: 0,
    activeOrders: [],
  },
  {
    type: 'cold',
    name: '冷盘',
    color: '#22c55e',
    load: 0,
    activeOrders: [],
  },
];

function calculateStationLoads() {
  stations.forEach((station) => {
    const activeInStation = orders.filter(
      (o) =>
        (o.status === 'cooking' || o.status === 'finishing') &&
        o.assignedStation === station.type
    );
    station.activeOrders = activeInStation.map((o) => o.id);
    station.load = Math.min(100, activeInStation.length * 25 + Math.random() * 15);

    const pendingForStation = orders
      .filter(
        (o) => o.status === 'pending' && o.dishes.some((d) => d.station === station.type)
      )
      .sort((a, b) => b.priority - a.priority);
    if (station.load > 80 && pendingForStation.length > 0) {
      station.recommendedOrderId = pendingForStation[0].id;
    } else {
      delete station.recommendedOrderId;
    }
  });
}

calculateStationLoads();

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const id = generateId();
  const newOrder = generateOrder(id);
  orders.unshift(newOrder);
  calculateStationLoads();
  io.emit('order:created', newOrder);
  io.emit('stations:updated', stations);
  res.status(201).json(newOrder);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

app.put('/api/orders/:id', (req, res) => {
  const index = orders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '订单不存在' });
  }
  orders[index] = { ...orders[index], ...req.body, id: orders[index].id };
  calculateStationLoads();
  io.emit('order:updated', orders[index]);
  io.emit('stations:updated', stations);
  res.json(orders[index]);
});

app.delete('/api/orders/:id', (req, res) => {
  const index = orders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '订单不存在' });
  }
  const deleted = orders.splice(index, 1)[0];
  calculateStationLoads();
  io.emit('order:deleted', deleted.id);
  io.emit('stations:updated', stations);
  res.json({ success: true });
});

app.get('/api/stations', (req, res) => {
  calculateStationLoads();
  res.json(stations);
});

app.get('/api/stations/:type/recommend', (req, res) => {
  const station = stations.find((s) => s.type === req.params.type);
  if (!station) {
    return res.status(404).json({ error: '档口不存在' });
  }
  const pendingForStation = orders
    .filter(
      (o) => o.status === 'pending' && o.dishes.some((d) => d.station === station.type)
    )
    .sort((a, b) => b.priority - a.priority);
  res.json(pendingForStation.slice(0, 5));
});

app.post('/api/stations/:type/lock', (req, res) => {
  const station = stations.find((s) => s.type === req.params.type);
  if (!station) {
    return res.status(404).json({ error: '档口不存在' });
  }
  const { orderId } = req.body;
  const order = orders.find((o) => o.id === orderId);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  order.assignedStation = station.type;
  calculateStationLoads();
  io.emit('order:updated', order);
  io.emit('stations:updated', stations);
  res.json({ success: true });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.emit('orders:initial', orders);
  socket.emit('stations:updated', stations);

  socket.on('order:move', ({ orderId, newStatus, newIndex }) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const oldIndex = orders.findIndex((o) => o.id === orderId);
    if (oldIndex > -1) {
      orders.splice(oldIndex, 1);
    }
    order.status = newStatus;
    if (newStatus === 'completed') {
      order.remainingTime = 0;
    }
    const statusOrders = orders.filter((o) => o.status === newStatus);
    const insertIndex = Math.min(newIndex ?? statusOrders.length, statusOrders.length);
    const otherOrders = orders.filter((o) => o.status !== newStatus);
    statusOrders.splice(insertIndex, 0, order);
    orders = [...otherOrders, ...statusOrders];

    calculateStationLoads();
    io.emit('order:updated', order);
    io.emit('stations:updated', stations);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

setInterval(() => {
  let hasChanges = false;
  orders.forEach((order) => {
    order.remainingTime = Math.max(0, order.remainingTime - 1);
    if (order.status !== 'completed' && order.remainingTime <= 0) {
      order.status = 'completed';
      order.remainingTime = 0;
      hasChanges = true;
    } else if (
      order.status === 'cooking' &&
      order.remainingTime <= 180 &&
      order.remainingTime > 0
    ) {
      order.status = 'finishing';
      hasChanges = true;
    }
  });

  if (hasChanges) {
    calculateStationLoads();
    io.emit(
      'orders:tick',
      orders.map((o) => ({ id: o.id, remainingTime: o.remainingTime, status: o.status }))
    );
    io.emit('stations:updated', stations);
  } else {
    io.emit(
      'orders:tick',
      orders.map((o) => ({ id: o.id, remainingTime: o.remainingTime }))
    );
  }
}, 1000);

setInterval(() => {
  if (Math.random() > 0.7) {
    const id = generateId();
    const newOrder = generateOrder(id);
    orders.unshift(newOrder);
    calculateStationLoads();
    io.emit('order:created', newOrder);
    io.emit('stations:updated', stations);
  }
}, 15000);

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
