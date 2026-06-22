import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const DATA_FILE = path.join(__dirname, 'data.json');

const readData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading data:', e);
  }
  return { orders: [], messages: {} };
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing data:', e);
  }
};

let data = readData();

if (!data.orders || data.orders.length === 0) {
  data = {
    orders: [
      {
        id: '1',
        title: '奶茶凑单 满30减10 还差1人',
        type: 'food',
        totalAmount: 35,
        targetMembers: 3,
        currentMembers: 2,
        deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        creatorId: 'user-1',
        creatorName: '小明',
        creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
        members: [
          { userId: 'user-1', userName: '小明', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming', paymentStatus: 'paid', shareAmount: 11.67 },
          { userId: 'user-2', userName: '小红', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong', paymentStatus: 'pending', shareAmount: 11.67 },
        ],
        status: 'active',
        matchRule: { minAmount: 10, maxMembers: 5, autoRejectBelow: 5 },
        createdAt: new Date().toISOString(),
      },
      {
        id: '2',
        title: '京东凑单 满200减30',
        type: 'shopping',
        totalAmount: 200,
        targetMembers: 4,
        currentMembers: 1,
        deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        creatorId: 'user-3',
        creatorName: '购物达人',
        creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gouwudaren',
        members: [
          { userId: 'user-3', userName: '购物达人', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gouwudaren', paymentStatus: 'paid', shareAmount: 50 },
        ],
        status: 'active',
        matchRule: { minAmount: 30 },
        createdAt: new Date().toISOString(),
      },
      {
        id: '3',
        title: '下班拼车 市区→郊区 每人分摊',
        type: 'carpool',
        totalAmount: 80,
        targetMembers: 4,
        currentMembers: 3,
        deadline: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(),
        creatorId: 'user-4',
        creatorName: '老司机',
        creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laosiji',
        members: [
          { userId: 'user-4', userName: '老司机', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laosiji', paymentStatus: 'paid', shareAmount: 20 },
          { userId: 'user-5', userName: '乘客A', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=passengerA', paymentStatus: 'paid', shareAmount: 20 },
          { userId: 'user-6', userName: '乘客B', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=passengerB', paymentStatus: 'pending', shareAmount: 20 },
        ],
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: '4',
        title: '外卖拼单 麻辣烫 起送25',
        type: 'food',
        totalAmount: 50,
        targetMembers: 3,
        currentMembers: 2,
        deadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
        creatorId: 'user-7',
        creatorName: '吃货小王',
        creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chihuoxiaowang',
        members: [
          { userId: 'user-7', userName: '吃货小王', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chihuoxiaowang', paymentStatus: 'paid', shareAmount: 16.67 },
          { userId: 'user-8', userName: '隔壁小李', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gebixiaoli', paymentStatus: 'received', shareAmount: 16.67 },
        ],
        status: 'active',
        matchRule: { autoRejectBelow: 10 },
        createdAt: new Date().toISOString(),
      },
      {
        id: '5',
        title: '淘宝凑单 跨店满300减50',
        type: 'shopping',
        totalAmount: 300,
        targetMembers: 5,
        currentMembers: 2,
        deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        creatorId: 'user-9',
        creatorName: '省钱小能手',
        creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shengqianxiaonengshou',
        members: [
          { userId: 'user-9', userName: '省钱小能手', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shengqianxiaonengshou', paymentStatus: 'paid', shareAmount: 60 },
          { userId: 'user-10', userName: '剁手党', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=duoshoudang', paymentStatus: 'pending', shareAmount: 60 },
        ],
        status: 'active',
        matchRule: { minAmount: 50, maxMembers: 5 },
        createdAt: new Date().toISOString(),
      },
      {
        id: '6',
        title: '周末拼车去机场',
        type: 'carpool',
        totalAmount: 120,
        targetMembers: 4,
        currentMembers: 1,
        deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        creatorId: 'user-11',
        creatorName: '旅行者',
        creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lvxingzhe',
        members: [
          { userId: 'user-11', userName: '旅行者', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lvxingzhe', paymentStatus: 'paid', shareAmount: 30 },
        ],
        status: 'active',
        createdAt: new Date().toISOString(),
      },
      {
        id: 'h1',
        title: '618淘宝凑单 满300减50',
        type: 'shopping',
        totalAmount: 320,
        targetMembers: 4,
        currentMembers: 4,
        deadline: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        creatorId: 'user-1',
        creatorName: '小明',
        creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
        members: [
          { userId: 'user-1', userName: '小明', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming', paymentStatus: 'received', shareAmount: 80 },
          { userId: 'user-2', userName: '小红', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong', paymentStatus: 'received', shareAmount: 80 },
          { userId: 'user-3', userName: '购物达人', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gouwudaren', paymentStatus: 'received', shareAmount: 80 },
          { userId: 'user-4', userName: '老司机', userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=laosiji', paymentStatus: 'received', shareAmount: 80 },
        ],
        status: 'completed',
        createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'h2',
        title: '上周拼车去机场',
        type: 'carpool',
        totalAmount: 100,
        targetMembers: 4,
        currentMembers: 4,
        deadline: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        creatorId: 'user-2',
        creatorName: '小红',
        creatorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong',
        members: [],
        status: 'archived',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ],
    messages: {
      '1': [
        {
          id: 'msg-1',
          orderId: '1',
          userId: 'user-1',
          userName: '小明',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
          content: '大家好，我想点奶茶，有一起的吗？',
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          type: 'user',
        },
        {
          id: 'msg-2',
          orderId: '1',
          userId: 'user-2',
          userName: '小红',
          userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong',
          content: '我要一杯珍珠奶茶',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          type: 'user',
        },
        {
          id: 'msg-3',
          orderId: '1',
          userId: 'system',
          userName: '系统',
          userAvatar: '',
          content: '还差1人就凑够啦！',
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          type: 'system',
        },
      ],
    },
  };
  writeData(data);
}

const saveData = () => {
  writeData(data);
};

app.get('/api/orders', (req, res) => {
  res.json(data.orders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = data.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const { title, type, totalAmount, targetMembers, deadline, creatorId, creatorName, creatorAvatar, matchRule } = req.body;

  const newOrder = {
    id: uuidv4(),
    title,
    type,
    totalAmount,
    targetMembers,
    deadline,
    creatorId,
    creatorName,
    creatorAvatar,
    currentMembers: 1,
    members: [
      {
        userId: creatorId,
        userName: creatorName,
        userAvatar: creatorAvatar,
        paymentStatus: 'paid',
        shareAmount: totalAmount / targetMembers,
      },
    ],
    status: 'active',
    matchRule: matchRule || {},
    createdAt: new Date().toISOString(),
  };

  data.orders.unshift(newOrder);
  data.messages[newOrder.id] = [];
  saveData();

  io.emit('order-update', newOrder);

  res.json(newOrder);
});

app.post('/api/orders/:id/join', (req, res) => {
  const order = data.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  if (order.status !== 'active') {
    return res.json({ success: false, message: '该拼单已结束' });
  }

  if (order.currentMembers >= order.targetMembers) {
    return res.json({ success: false, message: '人数已满' });
  }

  const { userId, userName, userAvatar } = req.body;

  if (order.members.some((m) => m.userId === userId)) {
    return res.json({ success: false, message: '您已加入该拼单' });
  }

  if (order.matchRule?.autoRejectBelow) {
    const shareAmount = order.totalAmount / order.targetMembers;
    if (shareAmount < order.matchRule.autoRejectBelow) {
      return res.json({ success: false, message: '拼单金额低于发起人设置的最低要求' });
    }
  }

  const shareAmount = order.totalAmount / order.targetMembers;
  order.members.push({
    userId,
    userName,
    userAvatar,
    paymentStatus: 'pending',
    shareAmount,
  });
  order.currentMembers += 1;

  if (order.currentMembers >= order.targetMembers) {
    order.status = 'completed';
    const sysMsg = {
      id: uuidv4(),
      orderId: order.id,
      userId: 'system',
      userName: '系统',
      userAvatar: '',
      content: `🎉 拼单成功！共${order.currentMembers}人参与，人均¥${shareAmount.toFixed(2)}`,
      timestamp: new Date().toISOString(),
      type: 'system',
    };
    if (!data.messages[order.id]) {
      data.messages[order.id] = [];
    }
    data.messages[order.id].push(sysMsg);
    io.emit('new-message', sysMsg);

    io.emit('notification', {
      id: uuidv4(),
      orderId: order.id,
      content: `拼单「${order.title}」已凑单成功！`,
      forAll: true,
      timestamp: new Date().toISOString(),
    });
  } else {
    io.emit('notification', {
      id: uuidv4(),
      orderId: order.id,
      userId: order.creatorId,
      forCreator: true,
      content: `${userName} 申请加入「${order.title}」`,
      timestamp: new Date().toISOString(),
    });
  }

  saveData();
  io.emit('order-update', order);

  res.json({ success: true, order });
});

app.get('/api/orders/:id/messages', (req, res) => {
  const messages = data.messages[req.params.id] || [];
  res.json(messages);
});

app.post('/api/orders/:id/messages', (req, res) => {
  const order = data.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }

  const { userId, userName, userAvatar, content } = req.body;

  const newMessage = {
    id: uuidv4(),
    orderId: req.params.id,
    userId,
    userName,
    userAvatar,
    content,
    timestamp: new Date().toISOString(),
    type: 'user',
  };

  if (!data.messages[req.params.id]) {
    data.messages[req.params.id] = [];
  }
  data.messages[req.params.id].push(newMessage);
  saveData();

  io.emit('new-message', newMessage);

  res.json(newMessage);
});

app.post('/api/orders/:id/payment', (req, res) => {
  const order = data.orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ success: false, message: '订单不存在' });
  }

  const { userId, status } = req.body;
  const member = order.members.find((m) => m.userId === userId);

  if (!member) {
    return res.json({ success: false, message: '您不是该拼单成员' });
  }

  const oldStatus = member.paymentStatus;
  member.paymentStatus = status;

  if (oldStatus !== status) {
    io.emit('order-update', order);
  }

  saveData();
  res.json({ success: true, order });
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3002;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
