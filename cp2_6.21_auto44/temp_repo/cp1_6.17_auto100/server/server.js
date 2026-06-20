import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3111;

app.use(cors());
app.use(express.json());

const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD'
];

const presetUsers = [
  { id: 'user-1', nickname: '墨雨清风', avatarColor: '#FF6B6B', isOnline: true, editingNodeId: null },
  { id: 'user-2', nickname: '星辰执笔', avatarColor: '#4ECDC4', isOnline: true, editingNodeId: null },
  { id: 'user-3', nickname: '云梦书生', avatarColor: '#45B7D1', isOnline: true, editingNodeId: null },
  { id: 'user-4', nickname: '月下墨客', avatarColor: '#96CEB4', isOnline: true, editingNodeId: null },
  { id: 'user-5', nickname: '烟雨无痕', avatarColor: '#FFEAA7', isOnline: true, editingNodeId: null }
];

let users = JSON.parse(JSON.stringify(presetUsers));

let stories = [
  {
    id: 'node-1',
    text: '在一个遥远的王国，一位年轻的冒险者踏上了寻找传说中宝藏的旅程。他站在十字路口，面前有两条路延伸向远方。',
    parentId: null,
    childrenIds: ['node-2', 'node-3'],
    lockOwner: null,
    lockOwnerName: null,
    lockExpireAt: null,
    createdAt: Date.now() - 100000
  },
  {
    id: 'node-2',
    text: '冒险者选择了左边那条穿过幽暗森林的小路。树木遮天蔽日，空气中弥漫着神秘的气息。突然，他听到了微弱的呼救声。',
    parentId: 'node-1',
    childrenIds: ['node-4', 'node-5'],
    lockOwner: null,
    lockOwnerName: null,
    lockExpireAt: null,
    createdAt: Date.now() - 90000
  },
  {
    id: 'node-3',
    text: '冒险者选择了右边那条通往山脉的道路。山路崎岖险峻，但远处山顶隐约可见一座古老的城堡轮廓。',
    parentId: 'node-1',
    childrenIds: ['node-6'],
    lockOwner: null,
    lockOwnerName: null,
    lockExpireAt: null,
    createdAt: Date.now() - 80000
  },
  {
    id: 'node-4',
    text: '冒险者循着呼救声深入森林，发现一只受伤的小狐狸被困在猎人的陷阱中。它的眼中满是恐惧和祈求。',
    parentId: 'node-2',
    childrenIds: [],
    lockOwner: null,
    lockOwnerName: null,
    lockExpireAt: null,
    createdAt: Date.now() - 70000
  },
  {
    id: 'node-5',
    text: '冒险者决定忽略呼救声，继续前进。他知道在这片危险的森林中，好奇心可能会断送性命。',
    parentId: 'node-2',
    childrenIds: [],
    lockOwner: null,
    lockOwnerName: null,
    lockExpireAt: null,
    createdAt: Date.now() - 60000
  },
  {
    id: 'node-6',
    text: '经过艰难的攀登，冒险者终于到达了城堡门前。大门紧闭，门上刻着奇怪的符文，似乎在等待着什么。',
    parentId: 'node-3',
    childrenIds: [],
    lockOwner: null,
    lockOwnerName: null,
    lockExpireAt: null,
    createdAt: Date.now() - 50000
  }
];

const releaseExpiredLocks = () => {
  const now = Date.now();
  stories.forEach(node => {
    if (node.lockExpireAt && node.lockExpireAt < now) {
      const user = users.find(u => u.id === node.lockOwner);
      if (user) user.editingNodeId = null;
      node.lockOwner = null;
      node.lockOwnerName = null;
      node.lockExpireAt = null;
    }
  });
};

app.get('/api/users', (req, res) => {
  releaseExpiredLocks();
  res.json(users);
});

app.post('/api/users/login', (req, res) => {
  const { nickname, avatarColor } = req.body;
  if (!nickname || nickname.length < 2) {
    return res.status(400).json({ error: '昵称至少需要2个字符' });
  }
  if (!AVATAR_COLORS.includes(avatarColor)) {
    return res.status(400).json({ error: '无效的头像颜色' });
  }
  const newUser = {
    id: uuidv4(),
    nickname,
    avatarColor,
    isOnline: true,
    editingNodeId: null
  };
  users.push(newUser);
  res.json(newUser);
});

app.post('/api/users/:id/logout', (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === id);
  if (!user) {
    return res.status(404).json({ error: '用户不存在' });
  }
  stories.forEach(node => {
    if (node.lockOwner === id) {
      node.lockOwner = null;
      node.lockOwnerName = null;
      node.lockExpireAt = null;
    }
  });
  user.editingNodeId = null;
  user.isOnline = false;
  res.json({ success: true });
});

app.get('/api/stories', (req, res) => {
  releaseExpiredLocks();
  res.json(stories);
});

app.get('/api/stories/:id', (req, res) => {
  releaseExpiredLocks();
  const node = stories.find(n => n.id === req.params.id);
  if (!node) {
    return res.status(404).json({ error: '节点不存在' });
  }
  res.json(node);
});

app.post('/api/stories/:id', (req, res) => {
  releaseExpiredLocks();
  const { id } = req.params;
  const { text, userId, userName } = req.body;
  const node = stories.find(n => n.id === id);
  if (!node) {
    return res.status(404).json({ error: '节点不存在' });
  }
  if (node.lockOwner && node.lockOwner !== userId) {
    return res.status(403).json({ 
      error: '该节点正被其他用户编辑', 
      lockOwnerName: node.lockOwnerName 
    });
  }
  if (text !== undefined) {
    node.text = text;
  }
  if (userId) {
    node.lockOwner = userId;
    node.lockOwnerName = userName || null;
    node.lockExpireAt = Date.now() + 5 * 60 * 1000;
    const user = users.find(u => u.id === userId);
    if (user) user.editingNodeId = id;
  }
  res.json(node);
});

app.post('/api/stories/:id/unlock', (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;
  const node = stories.find(n => n.id === id);
  if (!node) {
    return res.status(404).json({ error: '节点不存在' });
  }
  if (node.lockOwner === userId || !node.lockOwner) {
    node.lockOwner = null;
    node.lockOwnerName = null;
    node.lockExpireAt = null;
    const user = users.find(u => u.id === userId);
    if (user) user.editingNodeId = null;
  }
  res.json(node);
});

app.post('/api/stories/:id/children', (req, res) => {
  releaseExpiredLocks();
  const { id } = req.params;
  const { text, userId, userName } = req.body;
  const parentNode = stories.find(n => n.id === id);
  if (!parentNode) {
    return res.status(404).json({ error: '父节点不存在' });
  }
  const getDepth = (nodeId, depth = 0) => {
    const node = stories.find(n => n.id === nodeId);
    if (!node || !node.parentId) return depth;
    return getDepth(node.parentId, depth + 1);
  };
  const currentDepth = getDepth(id);
  if (currentDepth >= 4) {
    return res.status(400).json({ error: '子分支最多允许5层嵌套' });
  }
  const newNode = {
    id: uuidv4(),
    text: text || '',
    parentId: id,
    childrenIds: [],
    lockOwner: userId || null,
    lockOwnerName: userName || null,
    lockExpireAt: userId ? Date.now() + 5 * 60 * 1000 : null,
    createdAt: Date.now()
  };
  stories.push(newNode);
  parentNode.childrenIds.push(newNode.id);
  if (userId) {
    const user = users.find(u => u.id === userId);
    if (user) user.editingNodeId = newNode.id;
  }
  res.status(201).json(newNode);
});

app.listen(PORT, () => {
  console.log(`分支叙事工坊服务器运行在 http://localhost:3111`);
});
