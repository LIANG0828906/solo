import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { User, Card, VoteState, VoteHistory, ClientToServerEvents, ServerToClientEvents } from '../src/client/types';

interface Room {
  id: string;
  creatorId: string;
  users: Map<string, User>;
  cards: Card[];
  currentVote: VoteState | null;
  voteHistory: VoteHistory[];
}

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map<string, Room>();

const getRoom = (roomId: string): Room | undefined => {
  return rooms.get(roomId);
};

const createRoom = (roomId: string, creatorId: string): Room => {
  const room: Room = {
    id: roomId,
    creatorId,
    users: new Map(),
    cards: [],
    currentVote: null,
    voteHistory: [],
  };
  rooms.set(roomId, room);
  return room;
};

const broadcastToRoom = <Ev extends keyof ServerToClientEvents>(
  roomId: string,
  event: Ev,
  data: Parameters<ServerToClientEvents[Ev]>[0]
) => {
  (io.to(roomId).emit as (event: Ev, data: Parameters<ServerToClientEvents[Ev]>[0]) => void)(event, data);
};

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('room:join', (data) => {
    const { roomId, nickname, isCreator } = data;
    
    if (!/^\d{4}$/.test(roomId)) {
      socket.emit('room:error', { message: '房间号必须是4位数字' });
      return;
    }

    if (!nickname.trim()) {
      socket.emit('room:error', { message: '昵称不能为空' });
      return;
    }

    let room = getRoom(roomId);
    
    if (isCreator) {
      if (room) {
        socket.emit('room:error', { message: '房间已存在，请加入房间' });
        return;
      }
      room = createRoom(roomId, socket.id);
    } else {
      if (!room) {
        socket.emit('room:error', { message: '房间不存在，请先创建房间' });
        return;
      }
    }

    const user: User = {
      id: uuidv4(),
      socketId: socket.id,
      nickname: nickname.trim(),
      isCreator,
      roomId,
    };

    room.users.set(socket.id, user);
    socket.join(roomId);

    const usersArray = Array.from(room.users.values());
    
    socket.emit('room:joined', {
      roomId,
      users: usersArray,
      cards: room.cards,
      voteState: room.currentVote,
    });

    socket.to(roomId).emit('user:joined', { user });

    console.log(`User ${nickname} ${isCreator ? 'created' : 'joined'} room ${roomId}`);
  });

  socket.on('card:add', (data) => {
    const { roomId, content, nickname } = data;
    const room = getRoom(roomId);
    
    if (!room) {
      socket.emit('room:error', { message: '房间不存在' });
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent.length > 140) {
      socket.emit('room:error', { message: '内容长度必须在1-140字之间' });
      return;
    }

    const card: Card = {
      id: uuidv4(),
      content: trimmedContent,
      nickname,
      roomId,
      createdAt: Date.now(),
    };

    room.cards.push(card);
    broadcastToRoom(roomId, 'card:added', { card });

    console.log(`Card added to room ${roomId}: ${trimmedContent.substring(0, 30)}...`);
  });

  socket.on('card:delete', (data) => {
    const { roomId, cardId } = data;
    const room = getRoom(roomId);
    
    if (!room) {
      socket.emit('room:error', { message: '房间不存在' });
      return;
    }

    const user = room.users.get(socket.id);
    if (!user || !user.isCreator) {
      socket.emit('room:error', { message: '仅管理员可删除卡片' });
      return;
    }

    room.cards = room.cards.filter(card => card.id !== cardId);
    broadcastToRoom(roomId, 'card:deleted', { cardId });

    console.log(`Card ${cardId} deleted from room ${roomId}`);
  });

  socket.on('vote:open', (data) => {
    const { roomId, cardIds } = data;
    const room = getRoom(roomId);
    
    if (!room) {
      socket.emit('room:error', { message: '房间不存在' });
      return;
    }

    const user = room.users.get(socket.id);
    if (!user || !user.isCreator) {
      socket.emit('room:error', { message: '仅管理员可开启投票' });
      return;
    }

    if (room.currentVote?.isOpen) {
      socket.emit('room:error', { message: '已有进行中的投票' });
      return;
    }

    if (cardIds.length < 2) {
      socket.emit('room:error', { message: '至少需要2个选项' });
      return;
    }

    const validCardIds = cardIds.filter(id => 
      room.cards.some(card => card.id === id)
    );

    if (validCardIds.length < 2) {
      socket.emit('room:error', { message: '选择的卡片无效' });
      return;
    }

    const votes: Record<string, number> = {};
    validCardIds.forEach(id => { votes[id] = 0; });

    const voteState: VoteState = {
      isOpen: true,
      cardIds: validCardIds,
      votes,
      userVotes: {},
      totalVotes: 0,
      startedAt: Date.now(),
    };

    room.currentVote = voteState;
    broadcastToRoom(roomId, 'vote:opened', { voteState });

    console.log(`Vote opened in room ${roomId} with ${validCardIds.length} options`);
  });

  socket.on('vote:cast', (data) => {
    const { roomId, cardId } = data;
    const room = getRoom(roomId);
    
    if (!room || !room.currentVote?.isOpen) {
      socket.emit('room:error', { message: '投票未开启' });
      return;
    }

    if (!room.currentVote.cardIds.includes(cardId)) {
      socket.emit('room:error', { message: '无效的投票选项' });
      return;
    }

    const userVotes = room.currentVote.userVotes[socket.id] || [];
    const hasVoted = userVotes.includes(cardId);

    if (hasVoted) {
      room.currentVote.userVotes[socket.id] = userVotes.filter(id => id !== cardId);
      room.currentVote.votes[cardId] = Math.max(0, room.currentVote.votes[cardId] - 1);
      room.currentVote.totalVotes = Math.max(0, room.currentVote.totalVotes - 1);
    } else {
      if (userVotes.length >= 3) {
        socket.emit('room:error', { message: '每人最多投3票' });
        return;
      }
      room.currentVote.userVotes[socket.id] = [...userVotes, cardId];
      room.currentVote.votes[cardId] = (room.currentVote.votes[cardId] || 0) + 1;
      room.currentVote.totalVotes += 1;
    }

    broadcastToRoom(roomId, 'vote:updated', {
      votes: room.currentVote.votes,
      totalVotes: room.currentVote.totalVotes,
    });

    console.log(`Vote cast in room ${roomId} for card ${cardId} by ${socket.id}`);
  });

  socket.on('vote:close', (data) => {
    const { roomId } = data;
    const room = getRoom(roomId);
    
    if (!room) {
      socket.emit('room:error', { message: '房间不存在' });
      return;
    }

    const user = room.users.get(socket.id);
    if (!user || !user.isCreator) {
      socket.emit('room:error', { message: '仅管理员可关闭投票' });
      return;
    }

    if (!room.currentVote) {
      socket.emit('room:error', { message: '没有进行中的投票' });
      return;
    }

    const options = room.currentVote.cardIds.map(cardId => {
      const card = room.cards.find(c => c.id === cardId);
      return {
        cardId,
        content: card?.content || '',
        votes: room.currentVote!.votes[cardId] || 0,
      };
    });

    const history: VoteHistory = {
      id: uuidv4(),
      roomId,
      options,
      totalVotes: room.currentVote.totalVotes,
      startedAt: room.currentVote.startedAt,
      endedAt: Date.now(),
    };

    room.voteHistory.unshift(history);
    room.currentVote = null;

    broadcastToRoom(roomId, 'vote:closed', { history });

    console.log(`Vote closed in room ${roomId}, total votes: ${history.totalVotes}`);
  });

  socket.on('history:get', (data) => {
    const { roomId } = data;
    const room = getRoom(roomId);
    
    if (!room) {
      socket.emit('room:error', { message: '房间不存在' });
      return;
    }

    socket.emit('history:list', { history: room.voteHistory });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    rooms.forEach((room, roomId) => {
      const user = room.users.get(socket.id);
      if (user) {
        room.users.delete(socket.id);
        
        socket.to(roomId).emit('user:left', { userId: user.id });
        
        if (room.users.size === 0) {
          setTimeout(() => {
            const currentRoom = rooms.get(roomId);
            if (currentRoom && currentRoom.users.size === 0) {
              rooms.delete(roomId);
              console.log(`Room ${roomId} deleted due to inactivity`);
            }
          }, 60000);
        }
        
        console.log(`User ${user.nickname} left room ${roomId}`);
      }
    });
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});
