import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { PetService } from './services/PetService';
import { FriendService } from './services/FriendService';
import { CheckInService } from './services/CheckInService';
import { initWSService, getWSService } from './websocket/WSService';
import type { InteractionType, ItemType } from './types';

const app = express();
const server = createServer(app);
const PORT = 3001;

app.use(cors());
app.use(express.json());

initWSService(server);

const getUserIdHeader = (req: express.Request): string | null => {
  const userId = req.headers['x-user-id'];
  return typeof userId === 'string' ? userId : null;
};

app.post('/api/pet/create', (req, res) => {
  const { name, color, userId } = req.body;
  
  if (!name || !color || !userId) {
    return res.status(400).json({ success: false, error: '缺少必要参数' });
  }

  const pet = PetService.createPet(userId, name, color);
  res.json({ success: true, data: { pet, userId } });
});

app.get('/api/pet/state', (req, res) => {
  const userId = getUserIdHeader(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  const pet = PetService.getPet(userId);
  if (!pet) {
    return res.status(404).json({ success: false, error: '宠物不存在' });
  }

  res.json({ success: true, data: pet });
});

app.post('/api/pet/interact', (req, res) => {
  const userId = getUserIdHeader(req);
  const { type } = req.body as { type: InteractionType };

  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  if (!type || !['feed', 'clean', 'play'].includes(type)) {
    return res.status(400).json({ success: false, error: '无效的交互类型' });
  }

  const result = PetService.interact(userId, type);
  if (!result) {
    return res.status(400).json({ success: false, error: '操作失败，宠物可能生病或不存在' });
  }

  const wsService = getWSService();
  if (wsService) {
    const pet = PetService.getPet(userId);
    if (pet) {
      wsService.broadcastStateUpdate(userId, pet);
    }
  }

  res.json({ success: true, data: result });
});

app.get('/api/friends', (req, res) => {
  const userId = getUserIdHeader(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  const friends = FriendService.getFriends(userId);
  res.json({ success: true, data: friends });
});

app.post('/api/friends/search', (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, error: '缺少用户ID' });
  }

  const user = FriendService.searchUser(id);
  if (!user) {
    return res.status(404).json({ success: false, error: '用户不存在' });
  }

  res.json({ success: true, data: user });
});

app.post('/api/friends/request', (req, res) => {
  const userId = getUserIdHeader(req);
  const { toId } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  if (!toId) {
    return res.status(400).json({ success: false, error: '缺少目标用户ID' });
  }

  const success = FriendService.sendRequest(userId, toId);
  res.json({ success, message: success ? '申请已发送' : '申请发送失败' });
});

app.post('/api/friends/accept', (req, res) => {
  const userId = getUserIdHeader(req);
  const { friendId } = req.body;

  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  if (!friendId) {
    return res.status(400).json({ success: false, error: '缺少好友ID' });
  }

  const success = FriendService.acceptRequest(userId, friendId);
  res.json({ success, message: success ? '已接受好友申请' : '接受失败' });
});

app.get('/api/friends/requests', (req, res) => {
  const userId = getUserIdHeader(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  const requests = FriendService.getFriendRequests(userId);
  res.json({ success: true, data: requests });
});

app.get('/api/friends/:id', (req, res) => {
  const userId = getUserIdHeader(req);
  const friendId = req.params.id;

  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  const friend = FriendService.getFriendDetail(userId, friendId);
  if (!friend) {
    return res.status(404).json({ success: false, error: '好友不存在或不是好友' });
  }

  res.json({ success: true, data: friend });
});

app.post('/api/friends/:id/help', (req, res) => {
  const userId = getUserIdHeader(req);
  const friendId = req.params.id;
  const { type } = req.body as { type: InteractionType };

  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  if (!type || !['feed', 'clean', 'play'].includes(type)) {
    return res.status(400).json({ success: false, error: '无效的帮助类型' });
  }

  const result = PetService.helpFriend(userId, friendId, type);
  if (!result) {
    return res.status(400).json({ success: false, error: '帮助失败' });
  }

  const wsService = getWSService();
  if (wsService) {
    const friendPet = PetService.getPet(friendId);
    if (friendPet) {
      wsService.broadcastFriendUpdate(friendId, { 
        type: 'help', 
        fromUserId: userId,
        pet: friendPet 
      });
    }
  }

  res.json({ success: true, data: result });
});

app.get('/api/checkin/status', (req, res) => {
  const userId = getUserIdHeader(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  const status = CheckInService.getCheckInStatus(userId);
  res.json({ success: true, data: status });
});

app.post('/api/checkin', (req, res) => {
  const userId = getUserIdHeader(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  const result = CheckInService.checkIn(userId);
  if (!result.success) {
    return res.status(400).json({ success: false, error: '今日已签到' });
  }

  res.json({ success: true, data: result });
});

app.get('/api/backpack', (req, res) => {
  const userId = getUserIdHeader(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  const backpack = CheckInService.getBackpack(userId);
  res.json({ success: true, data: backpack });
});

app.post('/api/items/:type/use', (req, res) => {
  const userId = getUserIdHeader(req);
  const itemType = req.params.type as ItemType;

  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  const validTypes: ItemType[] = ['energyJuice', 'magicShampoo', 'luxuryFood', 'playToy'];
  if (!validTypes.includes(itemType)) {
    return res.status(400).json({ success: false, error: '无效的道具类型' });
  }

  const result = PetService.useItem(userId, itemType);
  if (!result) {
    return res.status(400).json({ success: false, error: '使用失败，道具不足或宠物生病' });
  }

  const wsService = getWSService();
  if (wsService) {
    const pet = PetService.getPet(userId);
    if (pet) {
      wsService.broadcastStateUpdate(userId, pet);
    }
  }

  res.json({ success: true, data: result });
});

app.get('/api/user/info', (req, res) => {
  const userId = getUserIdHeader(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: '未授权' });
  }

  const pet = PetService.getPet(userId);
  const checkInStatus = CheckInService.getCheckInStatus(userId);
  const backpack = CheckInService.getBackpack(userId);

  res.json({
    success: true,
    data: {
      userId,
      pet,
      friendliness: 0,
      checkInStreak: checkInStatus.streak,
      backpack,
    },
  });
});

server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket 运行在 ws://localhost:${PORT}/ws`);
});
