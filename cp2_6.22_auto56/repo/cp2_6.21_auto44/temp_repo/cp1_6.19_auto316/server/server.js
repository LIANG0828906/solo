import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const BOOK_TITLES = [
  '百年孤独', '红楼梦', '三体', '活着', '围城',
  '平凡的世界', '追风筝的人', '小王子', '1984', '霍乱时期的爱情',
  '挪威的森林', '白夜行', '人间失格', '解忧杂货店', '月亮与六便士',
  '局外人', '了不起的盖茨比', '飘', '傲慢与偏见', '呼啸山庄',
  '简爱', '悲惨世界', '巴黎圣母院', '老人与海', '动物农场',
  '美丽新世界', '瓦尔登湖', '海底两万里', '八十天环游地球', '时间简史',
  '人类简史', '未来简史', '枪炮病菌与钢铁', '自私的基因', '物种起源',
  '国富论', '资本论', '理想国', '乌合之众', '梦的解析',
  '苏菲的世界', '存在与时间', '查拉图斯特拉如是说', '沉思录', '道德经',
  '论语', '史记', '三国演义', '水浒传', '西游记',
];

const COLORS = [
  '#6A1B9A', '#1565C0', '#2E7D32', '#C62828', '#E65100',
  '#4E342E', '#37474F', '#00695C', '#AD1457', '#4527A0',
  '#283593', '#1B5E20', '#BF360C', '#FF6F00', '#33691E',
  '#0D47A1', '#880E4F', '#311B92', '#004D40', '#827717',
  '#9E9D24', '#F57F17', '#FF8F00', '#E65100', '#6D4C41',
  '#546E7A', '#00838F', '#6A1B9A', '#C62828', '#1565C0',
  '#2E7D32', '#AD1457', '#4527A0', '#283593', '#1B5E20',
  '#BF360C', '#FF6F00', '#33691E', '#0D47A1', '#880E4F',
  '#311B92', '#004D40', '#827717', '#9E9D24', '#F57F17',
  '#FF8F00', '#4E342E', '#37474F', '#00695C', '#E65100',
];

function generateAuctions() {
  const now = Date.now();
  return BOOK_TITLES.map((title, i) => {
    const startPrice = Math.floor(Math.random() * 50 + 10);
    const buyNowPrice = startPrice + Math.floor(Math.random() * 80 + 30);
    const duration = Math.floor(Math.random() * 7200 + 1800) * 1000;
    const sellerNames = ['书虫小李', '藏书家', '阅读达人', '旧书坊', '书缘阁', '墨香斋'];
    return {
      id: uuidv4(),
      title,
      description: `《${title}》九成新，品相良好，无批注无划线。`,
      startPrice,
      currentHighestBid: startPrice,
      currentHighestBidder: null,
      buyNowPrice,
      sellerName: sellerNames[i % sellerNames.length],
      sellerId: `seller-${i}`,
      color: COLORS[i],
      startTime: now,
      endTime: now + duration,
      status: 'active',
    };
  });
}

let auctions = generateAuctions();
const bidHistories = {};
const negotiations = {};

auctions.forEach((a) => {
  bidHistories[a.id] = [];
  negotiations[a.id] = [];
});

app.get('/api/auctions', (req, res) => {
  res.json(auctions.filter((a) => a.status === 'active'));
});

app.get('/api/auctions/:id', (req, res) => {
  const auction = auctions.find((a) => a.id === req.params.id);
  if (!auction) return res.status(404).json({ error: 'Not found' });
  res.json({
    auction,
    bids: bidHistories[auction.id] || [],
    negotiations: negotiations[auction.id] || [],
  });
});

io.on('connection', (socket) => {
  const { nickname } = socket.handshake.query;
  socket.data.nickname = nickname || '匿名';
  socket.data.userId = socket.id;

  socket.on('join-auction', (auctionId) => {
    socket.join(`auction-${auctionId}`);
  });

  socket.on('leave-auction', (auctionId) => {
    socket.leave(`auction-${auctionId}`);
  });

  socket.on('place-bid', ({ auctionId, amount, bidder }) => {
    const auction = auctions.find((a) => a.id === auctionId);
    if (!auction || auction.status !== 'active') {
      socket.emit('bid-error', { message: '拍卖不存在或已结束' });
      return;
    }
    if (amount <= auction.currentHighestBid) {
      socket.emit('bid-error', { message: '出价必须高于当前最高价' });
      return;
    }

    auction.currentHighestBid = amount;
    auction.currentHighestBidder = bidder;

    const bid = {
      id: uuidv4(),
      auctionId,
      bidder,
      bidderId: socket.id,
      amount,
      time: Date.now(),
    };
    bidHistories[auctionId].push(bid);

    if (amount >= auction.buyNowPrice) {
      auction.status = 'sold';
      auction.soldPrice = amount;
      auction.soldTo = bidder;
      io.to(`auction-${auctionId}`).emit('auction-sold', {
        auctionId,
        title: auction.title,
        amount,
        buyer: bidder,
      });
      io.emit('auction-updated', auction);
    } else {
      io.to(`auction-${auctionId}`).emit('new-bid', { bid, auction });
      io.emit('auction-updated', auction);
    }
  });

  socket.on('send-negotiation', ({ auctionId, amount, message, from }) => {
    const auction = auctions.find((a) => a.id === auctionId);
    if (!auction || auction.status !== 'active') return;

    const neg = {
      id: uuidv4(),
      auctionId,
      from,
      fromId: socket.id,
      to: auction.sellerName,
      toId: auction.sellerId,
      amount,
      message,
      status: 'pending',
      time: Date.now(),
    };
    negotiations[auctionId].push(neg);

    io.to(`auction-${auctionId}`).emit('new-negotiation', neg);
    io.to(`auction-${auctionId}`).emit('negotiation-notification', {
      auctionId,
      from,
      amount,
      negId: neg.id,
    });
  });

  socket.on('accept-negotiation', ({ auctionId, negId }) => {
    const auction = auctions.find((a) => a.id === auctionId);
    if (!auction || auction.status !== 'active') return;

    const negList = negotiations[auctionId];
    const neg = negList.find((n) => n.id === negId);
    if (!neg || neg.status !== 'pending') return;

    neg.status = 'accepted';
    auction.status = 'sold';
    auction.soldPrice = neg.amount;
    auction.soldTo = neg.from;

    io.to(`auction-${auctionId}`).emit('negotiation-accepted', {
      auctionId,
      negId,
      amount: neg.amount,
      buyer: neg.from,
    });
    io.to(`auction-${auctionId}`).emit('auction-sold', {
      auctionId,
      title: auction.title,
      amount: neg.amount,
      buyer: neg.from,
    });
    io.emit('auction-updated', auction);
  });

  socket.on('reject-negotiation', ({ auctionId, negId }) => {
    const negList = negotiations[auctionId];
    const neg = negList.find((n) => n.id === negId);
    if (!neg || neg.status !== 'pending') return;

    neg.status = 'rejected';
    io.to(`auction-${auctionId}`).emit('negotiation-rejected', {
      auctionId,
      negId,
    });
  });

  socket.on('disconnect', () => {});
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
