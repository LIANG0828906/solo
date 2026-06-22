import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

app.use(cors());
app.use(express.json());

const PORT = 3001;

interface FabricItem {
  fabricId: string;
  metersNeeded: number;
}

interface Order {
  id: string;
  customerName: string;
  sketchUrl: string;
  fabricItems: FabricItem[];
  status: '设计中' | '生产中' | '已完成';
  createdAt: string;
}

interface Fabric {
  id: string;
  name: string;
  color: string;
  totalMeters: number;
  supplier: string;
  threshold: number;
}

interface DashboardStats {
  totalOrders: number;
  inProductionOrders: number;
  lowStockFabrics: number;
}

let fabrics: Fabric[] = [];
let orders: Order[] = [];
const wsClients = new Set<WebSocket>();

const broadcast = (event: string, data: any) => {
  const message = JSON.stringify({ event, data });
  wsClients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

const checkStockAlert = (fabric: Fabric) => {
  if (fabric.totalMeters < fabric.threshold) {
    const alert = {
      fabricId: fabric.id,
      fabricName: fabric.name,
      currentStock: fabric.totalMeters,
      threshold: fabric.threshold,
      message: `面料 "${fabric.name}" 库存不足，当前库存: ${fabric.totalMeters}米，阈值: ${fabric.threshold}米`,
      timestamp: new Date().toISOString(),
    };
    console.warn('[库存告警]', alert.message);
    broadcast('fabricAlerts', alert);
  }
};

const deductStock = (items: FabricItem[]) => {
  items.forEach((item) => {
    const fabric = fabrics.find((f) => f.id === item.fabricId);
    if (fabric) {
      fabric.totalMeters = Math.max(0, fabric.totalMeters - item.metersNeeded);
      checkStockAlert(fabric);
    }
  });
};

const restoreStock = (items: FabricItem[]) => {
  items.forEach((item) => {
    const fabric = fabrics.find((f) => f.id === item.fabricId);
    if (fabric) {
      fabric.totalMeters += item.metersNeeded;
    }
  });
};

wss.on('connection', (ws) => {
  console.log('WebSocket 客户端已连接');
  wsClients.add(ws);

  ws.on('close', () => {
    console.log('WebSocket 客户端已断开连接');
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket 错误:', error);
    wsClients.delete(ws);
  });
});

app.get('/api/orders', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  const paginatedOrders = orders.slice(startIndex, endIndex);
  const total = orders.length;

  res.json({
    data: paginatedOrders,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

app.post('/api/orders', (req: Request, res: Response) => {
  try {
    const { customerName, fabricItems, sketchUrl } = req.body;

    if (!customerName || !fabricItems || !Array.isArray(fabricItems) || fabricItems.length === 0) {
      return res.status(400).json({ error: '客户名称和面料清单不能为空' });
    }

    for (const item of fabricItems) {
      const fabric = fabrics.find((f) => f.id === item.fabricId);
      if (!fabric) {
        return res.status(400).json({ error: `面料ID ${item.fabricId} 不存在` });
      }
      if (fabric.totalMeters < item.metersNeeded) {
        return res.status(400).json({
          error: `面料 "${fabric.name}" 库存不足，需要 ${item.metersNeeded}米，当前库存 ${fabric.totalMeters}米`,
        });
      }
    }

    deductStock(fabricItems);

    const newOrder: Order = {
      id: uuidv4(),
      customerName,
      sketchUrl: sketchUrl || 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20design%20sketch&image_size=square',
      fabricItems,
      status: '设计中',
      createdAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    broadcast('orderUpdates', { type: 'created', order: newOrder });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({ error: '创建订单失败' });
  }
});

app.put('/api/orders/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses: Array<'设计中' | '生产中' | '已完成'> = ['设计中', '生产中', '已完成'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' });
    }

    const orderIndex = orders.findIndex((o) => o.id === id);
    if (orderIndex === -1) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const oldStatus = orders[orderIndex].status;
    orders[orderIndex].status = status;

    if (oldStatus !== status) {
      broadcast('orderUpdates', {
        type: 'statusChanged',
        order: orders[orderIndex],
        oldStatus,
        newStatus: status,
      });
    }

    res.json(orders[orderIndex]);
  } catch (error) {
    console.error('更新订单失败:', error);
    res.status(500).json({ error: '更新订单失败' });
  }
});

app.delete('/api/orders/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderIndex = orders.findIndex((o) => o.id === id);

    if (orderIndex === -1) {
      return res.status(404).json({ error: '订单不存在' });
    }

    const deletedOrder = orders[orderIndex];
    restoreStock(deletedOrder.fabricItems);

    orders.splice(orderIndex, 1);
    broadcast('orderUpdates', { type: 'deleted', orderId: id });

    res.json({ message: '订单删除成功，库存已恢复' });
  } catch (error) {
    console.error('删除订单失败:', error);
    res.status(500).json({ error: '删除订单失败' });
  }
});

app.get('/api/fabrics', (req: Request, res: Response) => {
  res.json(fabrics);
});

app.get('/api/fabrics/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const fabric = fabrics.find((f) => f.id === id);

  if (!fabric) {
    return res.status(404).json({ error: '面料不存在' });
  }

  const relatedOrders = orders.filter((order) =>
    order.fabricItems.some((item) => item.fabricId === id)
  );

  res.json({
    ...fabric,
    relatedOrders,
  });
});

app.get('/api/dashboard', (req: Request, res: Response) => {
  const totalOrders = orders.length;
  const inProductionOrders = orders.filter((o) => o.status === '生产中').length;
  const lowStockFabrics = fabrics.filter((f) => f.totalMeters < f.threshold).length;

  res.json({
    totalOrders,
    inProductionOrders,
    lowStockFabrics,
  });
});

const initializeData = () => {
  const fabricData = [
    { name: '纯棉面料', color: '白色', supplier: '上海纺织厂' },
    { name: '涤纶面料', color: '黑色', supplier: '江苏化纤' },
    { name: '丝绸面料', color: '红色', supplier: '杭州丝绸' },
    { name: '羊毛面料', color: '灰色', supplier: '内蒙古毛纺' },
    { name: '亚麻面料', color: '米色', supplier: '黑龙江亚麻' },
    { name: '牛仔面料', color: '蓝色', supplier: '广东牛仔' },
    { name: '灯芯绒面料', color: '棕色', supplier: '山东纺织' },
    { name: '雪纺面料', color: '粉色', supplier: '浙江丝绸' },
    { name: '蕾丝面料', color: '白色', supplier: '福建蕾丝' },
    { name: '针织面料', color: '绿色', supplier: '河南针织' },
    { name: '毛呢面料', color: '灰色', supplier: '河北毛纺' },
    { name: '皮革面料', color: '黑色', supplier: '浙江皮革' },
    { name: '帆布面料', color: '卡其色', supplier: '湖北帆布' },
    { name: '牛津纺面料', color: '蓝色', supplier: '江苏纺织' },
    { name: '泡泡纱面料', color: '紫色', supplier: '上海面料' },
  ];

  for (let i = 0; i < fabricData.length; i++) {
    const fabric: Fabric = {
      id: uuidv4(),
      name: fabricData[i].name,
      color: fabricData[i].color,
      totalMeters: Math.floor(Math.random() * 200) + 10,
      supplier: fabricData[i].supplier,
      threshold: 50,
    };
    fabrics.push(fabric);
  }

  const customerNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '王十二'];
  const statuses: Array<'设计中' | '生产中' | '已完成'> = ['设计中', '生产中', '已完成'];

  for (let i = 0; i < 10; i++) {
    const itemCount = Math.floor(Math.random() * 3) + 1;
    const fabricItems: FabricItem[] = [];
    const usedFabricIds = new Set<string>();

    for (let j = 0; j < itemCount; j++) {
      let fabricIndex = Math.floor(Math.random() * fabrics.length);
      while (usedFabricIds.has(fabrics[fabricIndex].id)) {
        fabricIndex = Math.floor(Math.random() * fabrics.length);
      }
      usedFabricIds.add(fabrics[fabricIndex].id);
      fabricItems.push({
        fabricId: fabrics[fabricIndex].id,
        metersNeeded: Math.floor(Math.random() * 20) + 5,
      });
    }

    deductStock(fabricItems);

    const order: Order = {
      id: uuidv4(),
      customerName: customerNames[i],
      sketchUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20design%20sketch&image_size=square',
      fabricItems,
      status: statuses[i % statuses.length],
      createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    };
    orders.push(order);
  }

  console.log(`初始化数据完成：${fabrics.length} 种面料，${orders.length} 个订单`);
};

setTimeout(() => {
  initializeData();
}, 500);

server.listen(PORT, () => {
  console.log(`服务器正在运行在 http://localhost:${PORT}`);
  console.log(`WebSocket 服务正在运行在 ws://localhost:${PORT}/ws`);
});
