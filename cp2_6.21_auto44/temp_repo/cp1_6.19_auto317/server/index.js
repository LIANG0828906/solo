import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let orders = [
  {
    id: uuidv4(),
    customerName: '张先生',
    category: 'wallet',
    size: '标准款 (10x9cm)',
    color: '棕色',
    hardware: '黄铜',
    estimatedHours: 8,
    materialCost: 144,
    status: 'producing',
    leatherType: 'vegetable',
    leatherConsumption: 1.2,
    statusTimestamps: {
      pending: '2026-06-15 10:30:00',
      confirmed: '2026-06-15 14:20:00',
      producing: '2026-06-16 09:00:00',
      completed: null,
      delivered: null
    },
    createdAt: '2026-06-15 10:30:00'
  }
];

let inventory = [
  { id: 'mat-1', name: '植鞣革 - 棕色', type: 'vegetable', area: 25.5, unitPrice: 120, dailyConsumption: 2.5, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'mat-2', name: '植鞣革 - 原色', type: 'vegetable', area: 18.0, unitPrice: 100, dailyConsumption: 2.5, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'mat-3', name: '铬鞣革 - 黑色', type: 'chrome', area: 32.0, unitPrice: 80, dailyConsumption: 3.0, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'mat-4', name: '铬鞣革 - 酒红', type: 'chrome', area: 15.5, unitPrice: 95, dailyConsumption: 3.0, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'mat-5', name: '马臀皮 - 深棕', type: 'shell', area: 8.0, unitPrice: 350, dailyConsumption: 0.8, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') },
  { id: 'mat-6', name: '马臀皮 - 黑色', type: 'shell', area: 6.5, unitPrice: 380, dailyConsumption: 0.8, lastUpdated: format(new Date(), 'yyyy-MM-dd HH:mm:ss') }
];

const calculateEstimatedHours = (category) => {
  const hoursMap = {
    wallet: 8,
    belt: 4,
    backpack: 24,
    cardholder: 3,
    keycase: 2
  };
  return hoursMap[category] || 5;
};

const getLeatherConsumption = (category) => {
  const consumptionMap = {
    wallet: 1.2,
    belt: 0.8,
    backpack: 3.5,
    cardholder: 0.5,
    keycase: 0.3
  };
  return consumptionMap[category] || 1;
};

app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const { customerName, category, size, color, hardware, leatherType } = req.body;
  
  const leatherMaterial = inventory.find(m => m.type === leatherType);
  const unitPrice = leatherMaterial?.unitPrice || 100;
  const estimatedHours = calculateEstimatedHours(category);
  const leatherConsumption = getLeatherConsumption(category);
  const materialCost = leatherConsumption * unitPrice;

  const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const newOrder = {
    id: uuidv4(),
    customerName,
    category,
    size,
    color,
    hardware,
    leatherType,
    estimatedHours,
    materialCost,
    leatherConsumption,
    status: 'pending',
    statusTimestamps: {
      pending: now,
      confirmed: null,
      producing: null,
      completed: null,
      delivered: null
    },
    createdAt: now
  };
  
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  const orderIndex = orders.findIndex(o => o.id === req.params.id);
  
  if (orderIndex === -1) {
    return res.status(404).json({ error: '订单不存在' });
  }

  const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  const order = orders[orderIndex];
  
  if ((order.status === 'confirmed' || order.status === 'pending') && status === 'producing') {
    inventory = inventory.map(m => {
      if (m.type === order.leatherType) {
        return {
          ...m,
          area: Math.max(0, m.area - order.leatherConsumption),
          lastUpdated: now
        };
      }
      return m;
    });
  }

  orders[orderIndex] = {
    ...order,
    status,
    statusTimestamps: {
      ...order.statusTimestamps,
      [status]: now
    }
  };

  res.json(orders[orderIndex]);
});

app.get('/api/inventory', (req, res) => {
  res.json(inventory);
});

app.patch('/api/inventory/:id/consume', (req, res) => {
  const { amount } = req.body;
  const materialIndex = inventory.findIndex(m => m.id === req.params.id);
  
  if (materialIndex === -1) {
    return res.status(404).json({ error: '材料不存在' });
  }

  const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  inventory[materialIndex] = {
    ...inventory[materialIndex],
    area: Math.max(0, inventory[materialIndex].area - amount),
    lastUpdated: now
  };

  res.json(inventory[materialIndex]);
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`皮革工坊 API 服务器运行在 http://localhost:${PORT}`);
});
