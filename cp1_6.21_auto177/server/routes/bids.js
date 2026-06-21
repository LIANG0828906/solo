import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

let bids = [];

const mockUsers = [
  { id: '1', name: '拍卖爱好者', avatar: '🎨' },
  { id: '2', name: '收藏家小王', avatar: '👔' },
  { id: '3', name: '热心市民', avatar: '🌟' },
  { id: '4', name: '神秘买家', avatar: '🎭' },
  { id: '5', name: '鉴赏达人', avatar: '💎' }
];

router.get('/:itemId', (req, res) => {
  const { itemId } = req.params;
  const itemBids = bids
    .filter(bid => bid.itemId === itemId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);
  res.json(itemBids);
});

router.post('/', (req, res) => {
  const { itemId, amount, userId } = req.body;
  if (!itemId || !amount) {
    return res.status(400).json({ error: '物品ID和出价金额不能为空' });
  }
  const user = userId
    ? mockUsers.find(u => u.id === userId) || mockUsers[0]
    : mockUsers[Math.floor(Math.random() * mockUsers.length)];
  
  const newBid = {
    id: uuidv4(),
    itemId,
    amount: Number(amount),
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    createdAt: new Date().toISOString()
  };
  bids.push(newBid);
  res.status(201).json(newBid);
});

export default router;
