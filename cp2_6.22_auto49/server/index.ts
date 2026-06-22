import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import path from 'path';
import {
  getAuctions,
  getAuctionById,
  createAuction,
  placeBid,
  getUser,
  getAllUsers,
  getUserAuctions,
  getUserBids,
  setEventEmitter,
} from './auctionManager';
import type { Auction } from '../src/types';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3001;

app.use(cors());
app.use(express.json());

setEventEmitter((event: string, data: unknown) => {
  io.emit(event, data);
});

app.get('/api/auctions', (_req, res) => {
  const auctions = getAuctions();
  res.json(auctions);
});

app.get('/api/auctions/:id', (req, res) => {
  const auction = getAuctionById(req.params.id);
  if (!auction) {
    res.status(404).json({ error: '拍卖不存在' });
    return;
  }
  res.json(auction);
});

app.post('/api/auctions', (req, res) => {
  const { sellerId, title, author, description, coverUrl, startPrice, durationHours } = req.body;
  if (!sellerId || !title || !author || !coverUrl || !startPrice || !durationHours) {
    res.status(400).json({ error: '缺少必要字段' });
    return;
  }

  const result = createAuction({
    sellerId,
    title,
    author,
    description: description || '',
    coverUrl,
    startPrice: Number(startPrice),
    durationHours: Number(durationHours),
  });

  if ('error' in result) {
    res.status(400).json(result);
    return;
  }

  res.status(201).json(result);
});

app.post('/api/auctions/:id/bid', (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || !amount) {
    res.status(400).json({ error: '缺少用户ID或出价金额' });
    return;
  }

  const result = placeBid(req.params.id, userId, Number(amount));
  if (!result.success) {
    res.status(400).json({ error: result.error });
    return;
  }

  res.json({ success: true, auction: result.auction });
});

app.get('/api/users', (_req, res) => {
  res.json(getAllUsers());
});

app.get('/api/users/:id', (req, res) => {
  const user = getUser(req.params.id);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json(user);
});

app.get('/api/users/:id/auctions', (req, res) => {
  const user = getUser(req.params.id);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json(getUserAuctions(req.params.id));
});

app.get('/api/users/:id/bids', (req, res) => {
  const user = getUser(req.params.id);
  if (!user) {
    res.status(404).json({ error: '用户不存在' });
    return;
  }
  res.json(getUserBids(req.params.id));
});

io.on('connection', (socket: Socket) => {
  console.log('客户端已连接:', socket.id);

  socket.on('auction:bid', (data: { auctionId: string; userId: string; amount: number }) => {
    const result = placeBid(data.auctionId, data.userId, Number(data.amount));
    socket.emit(`auction:bid:response:${data.auctionId}`, result);
  });

  socket.on('auction:subscribe', (auctionId: string) => {
    socket.join(`auction:${auctionId}`);
  });

  socket.on('auction:unsubscribe', (auctionId: string) => {
    socket.leave(`auction:${auctionId}`);
  });

  socket.on('disconnect', () => {
    console.log('客户端已断开:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
