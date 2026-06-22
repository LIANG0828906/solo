import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { WorldManager, BlockData, BlockType } from './WorldManager';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const worldManager = new WorldManager();

interface PlayerData {
  id: string;
  nickname: string;
  avatarColor: string;
  position: { x: number; y: number; z: number };
}

const NICKNAMES = [
  '方块达人', '建筑师', '创意大师', '小小建造师', '积木玩家',
  '梦想家', '工程师', '艺术家', '探索者', '创造者',
  '建造师', '设计师', '工匠', '魔术师', '冒险家'
];

const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF69B4', '#32CD32', '#FF4500'
];

function generateNickname(): string {
  return NICKNAMES[Math.floor(Math.random() * NICKNAMES.length)] + Math.floor(Math.random() * 1000);
}

function generateAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

io.on('connection', (socket) => {
  const playerId = uuidv4();
  const nickname = generateNickname();
  const avatarColor = generateAvatarColor();
  
  const player: PlayerData = {
    id: playerId,
    nickname,
    avatarColor,
    position: { x: 0, y: 1, z: 0 }
  };
  
  worldManager.addPlayer(player);

  socket.emit('worldData', {
    blocks: worldManager.getAllBlocks(),
    players: worldManager.getAllPlayers(),
    yourPlayerId: playerId,
    yourNickname: nickname,
    yourAvatarColor: avatarColor
  });

  socket.broadcast.emit('playerJoin', { player });
  io.emit('playerList', { players: worldManager.getAllPlayers() });

  console.log(`[连接] 玩家 ${nickname} (${playerId}) 加入游戏`);

  socket.on('placeBlock', (data: { x: number; y: number; z: number; blockType: BlockType; playerId: string; color?: string }) => {
    const { x, y, z, blockType, playerId: pid, color } = data;
    
    const existingBlock = worldManager.getBlock(x, y, z);
    if (existingBlock) return;
    
    const success = worldManager.setBlock(x, y, z, blockType, color);
    if (success) {
      const block: BlockData = { x: Math.floor(x), y: Math.floor(y), z: Math.floor(z), type: blockType };
      if (color) block.color = color;
      
      io.emit('blockUpdate', {
        x: Math.floor(x),
        y: Math.floor(y),
        z: Math.floor(z),
        blockType: blockType,
        playerId: pid,
        color
      });
      
      console.log(`[放置] 玩家 ${pid} 在 (${x},${y},${z}) 放置 ${blockType}`);
    }
  });

  socket.on('removeBlock', (data: { x: number; y: number; z: number; playerId: string }) => {
    const { x, y, z, playerId: pid } = data;
    
    const block = worldManager.getBlock(x, y, z);
    if (!block) return;
    
    const success = worldManager.removeBlock(x, y, z);
    if (success) {
      io.emit('blockUpdate', {
        x: Math.floor(x),
        y: Math.floor(y),
        z: Math.floor(z),
        blockType: null,
        playerId: pid,
        color: block.color
      });
      
      console.log(`[拆除] 玩家 ${pid} 在 (${x},${y},${z}) 拆除 ${block.type}`);
    }
  });

  socket.on('playerMove', (data: { playerId: string; position: { x: number; y: number; z: number } }) => {
    worldManager.updatePlayerPosition(data.playerId, data.position);
    socket.broadcast.emit('playerMove', data);
  });

  socket.on('disconnect', () => {
    worldManager.removePlayer(playerId);
    socket.broadcast.emit('playerLeave', { playerId });
    io.emit('playerList', { players: worldManager.getAllPlayers() });
    console.log(`[断开] 玩家 ${nickname} (${playerId}) 离开游戏`);
  });
});

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🚀 积木小镇服务器启动成功!`);
  console.log(`📡 监听端口: ${PORT}`);
  console.log(`🌍 世界方块数量: ${worldManager.getAllBlocks().length}`);
});
