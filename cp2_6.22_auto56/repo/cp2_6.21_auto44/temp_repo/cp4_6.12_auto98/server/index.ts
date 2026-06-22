import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';

interface Bidder {
  id: string;
  name: string;
}

interface BidRecord {
  id: string;
  user: string;
  amount: number;
  timestamp: number;
}

interface AuctionRoom {
  id: string;
  name: string;
  startPrice: number;
  bidStep: number;
  currentPrice: number;
  bidders: Bidder[];
  bidHistory: BidRecord[];
  status: 'waiting' | 'active' | 'ended';
  timeLeft: number;
  timer: NodeJS.Timeout | null;
  winner: string | null;
  finalPrice: number | null;
  images: string[];
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map<string, AuctionRoom>();
const AUCTION_DURATION = 60;
const sampleImages = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
  'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&q=80',
  'https://images.unsplash.com/photo-1560343090-f0409e92791a?w=800&q=80',
  'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=800&q=80',
];

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

function createRoom(name: string, startPrice: number, bidStep: number): AuctionRoom {
  const id = generateRoomId();
  const room: AuctionRoom = {
    id,
    name,
    startPrice,
    bidStep,
    currentPrice: startPrice,
    bidders: [],
    bidHistory: [],
    status: 'waiting',
    timeLeft: AUCTION_DURATION,
    timer: null,
    winner: null,
    finalPrice: null,
    images: sampleImages,
  };
  rooms.set(id, room);
  return room;
}

function startAuction(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'waiting') return;

  room.status = 'active';
  room.timer = setInterval(() => {
    room.timeLeft -= 1;
    io.to(roomId).emit('room-state', getRoomState(room));

    if (room.timeLeft <= 0) {
      endAuction(roomId);
    }
  }, 1000);
}

function endAuction(roomId: string): void {
  const room = rooms.get(roomId);
  if (!room || room.timer === null) return;

  clearInterval(room.timer);
  room.timer = null;
  room.status = 'ended';

  if (room.bidHistory.length > 0) {
    const lastBid = room.bidHistory[room.bidHistory.length - 1];
    room.winner = lastBid.user;
    room.finalPrice = lastBid.amount;
  } else {
    room.winner = null;
    room.finalPrice = room.startPrice;
  }

  io.to(roomId).emit('auction-ended', {
    winner: room.winner,
    finalPrice: room.finalPrice,
  });
  io.to(roomId).emit('room-state', getRoomState(room));
}

function getRoomState(room: AuctionRoom) {
  return {
    roomId: room.id,
    roomName: room.name,
    startPrice: room.startPrice,
    bidStep: room.bidStep,
    currentPrice: room.currentPrice,
    bidders: room.bidders,
    bidHistory: room.bidHistory,
    status: room.status,
    timeLeft: room.timeLeft,
    winner: room.winner,
    finalPrice: room.finalPrice,
    images: room.images,
  };
}

function placeBid(roomId: string, userId: string, amount: number): boolean {
  const room = rooms.get(roomId);
  if (!room || room.status !== 'active') return false;

  const bidder = room.bidders.find((b) => b.id === userId);
  if (!bidder) return false;

  const minBid = room.currentPrice + room.bidStep;
  if (amount < minBid) return false;

  const bidRecord: BidRecord = {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 6),
    user: bidder.name,
    amount,
    timestamp: Date.now(),
  };

  room.currentPrice = amount;
  room.bidHistory.push(bidRecord);

  io.to(roomId).emit('bid-placed', bidRecord);
  io.to(roomId).emit('room-state', getRoomState(room));

  return true;
}

io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);

  socket.on('create-room', (data: { roomName: string; startPrice: number; bidStep: number; userName: string }) => {
    const { roomName, startPrice, bidStep, userName } = data;
    const room = createRoom(roomName, startPrice, bidStep);

    const bidder: Bidder = { id: socket.id, name: userName };
    room.bidders.push(bidder);

    socket.join(room.id);
    socket.emit('room-created', { roomId: room.id });

    if (room.status === 'waiting') {
      startAuction(room.id);
    }

    io.to(room.id).emit('room-state', getRoomState(room));
  });

  socket.on('join-room', (data: { roomId: string; userName: string }) => {
    const { roomId, userName } = data;
    const room = rooms.get(roomId.toUpperCase());

    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }

    const existingBidder = room.bidders.find((b) => b.id === socket.id);
    if (!existingBidder) {
      const bidder: Bidder = { id: socket.id, name: userName };
      room.bidders.push(bidder);
    }

    socket.join(room.id);
    socket.emit('room-state', getRoomState(room));
    io.to(room.id).emit('room-state', getRoomState(room));
  });

  socket.on('place-bid', (data: { roomId: string; amount: number }) => {
    const { roomId, amount } = data;
    const success = placeBid(roomId.toUpperCase(), socket.id, amount);

    if (!success) {
      socket.emit('error', { message: '出价失败' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    rooms.forEach((room) => {
      const bidderIndex = room.bidders.findIndex((b) => b.id === socket.id);
      if (bidderIndex !== -1) {
        room.bidders.splice(bidderIndex, 1);
        io.to(room.id).emit('room-state', getRoomState(room));
      }
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Auction server running on port ${PORT}`);
});
