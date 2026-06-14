const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const makeThumb = (prompt) =>
  `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square_hd`;

const rooms = [
  {
    id: 'r1',
    name: '客厅',
    status: 'in_progress',
    totalBudget: 80000,
    spent: 45000,
    thumbnail: makeThumb('北欧风格现代客厅暖木色地板米白沙发装修效果图'),
    order: 0,
    updatedAt: '2026-06-10',
  },
  {
    id: 'r2',
    name: '厨房',
    status: 'in_progress',
    totalBudget: 50000,
    spent: 28000,
    thumbnail: makeThumb('北欧简约厨房暖木色橱柜米白色台面装修效果图'),
    order: 1,
    updatedAt: '2026-06-12',
  },
  {
    id: 'r3',
    name: '主卧',
    status: 'not_started',
    totalBudget: 60000,
    spent: 0,
    thumbnail: makeThumb('北欧卧室暖木色大床米白墙面简约装修效果图'),
    order: 2,
    updatedAt: '2026-06-08',
  },
  {
    id: 'r4',
    name: '卫生间',
    status: 'completed',
    totalBudget: 25000,
    spent: 24500,
    thumbnail: makeThumb('北欧简约卫生间米白色瓷砖暖木色收纳柜装修效果图'),
    order: 3,
    updatedAt: '2026-06-05',
  },
];

const budgetCategories = [
  ...[
    { id: 'c1', roomId: 'r1', name: '装修人工', allocated: 25000 },
    { id: 'c2', roomId: 'r1', name: '材料', allocated: 30000 },
    { id: 'c3', roomId: 'r1', name: '家具', allocated: 18000 },
    { id: 'c4', roomId: 'r1', name: '软装', allocated: 7000 },
    { id: 'c5', roomId: 'r2', name: '装修人工', allocated: 15000 },
    { id: 'c6', roomId: 'r2', name: '材料', allocated: 22000 },
    { id: 'c7', roomId: 'r2', name: '家具', allocated: 10000 },
    { id: 'c8', roomId: 'r2', name: '软装', allocated: 3000 },
    { id: 'c9', roomId: 'r3', name: '装修人工', allocated: 18000 },
    { id: 'c10', roomId: 'r3', name: '材料', allocated: 20000 },
    { id: 'c11', roomId: 'r3', name: '家具', allocated: 15000 },
    { id: 'c12', roomId: 'r3', name: '软装', allocated: 7000 },
    { id: 'c13', roomId: 'r4', name: '装修人工', allocated: 8000 },
    { id: 'c14', roomId: 'r4', name: '材料', allocated: 14000 },
    { id: 'c15', roomId: 'r4', name: '家具', allocated: 2000 },
    { id: 'c16', roomId: 'r4', name: '软装', allocated: 1000 },
  ].map((c) => ({ ...c, spent: 0, items: [] })),
];

const budgetItems = [
  { id: 'bi1', categoryId: 'c1', amount: 8000, date: '2026-06-02', note: '拆墙及清运', receipt: '' },
  { id: 'bi2', categoryId: 'c1', amount: 12000, date: '2026-06-08', note: '水电工人工费', receipt: '' },
  { id: 'bi3', categoryId: 'c1', amount: 5000, date: '2026-06-10', note: '泥瓦工人工费', receipt: '' },
  { id: 'bi4', categoryId: 'c2', amount: 15000, date: '2026-06-03', note: '地板及瓷砖材料', receipt: '' },
  { id: 'bi5', categoryId: 'c2', amount: 5000, date: '2026-06-09', note: '腻子及乳胶漆', receipt: '' },
  { id: 'bi6', categoryId: 'c3', amount: 0, date: '2026-06-15', note: '待采购', receipt: '' },
  { id: 'bi7', categoryId: 'c5', amount: 6000, date: '2026-06-04', note: '水电工人工费', receipt: '' },
  { id: 'bi8', categoryId: 'c5', amount: 4000, date: '2026-06-11', note: '橱柜安装人工费', receipt: '' },
  { id: 'bi9', categoryId: 'c6', amount: 10000, date: '2026-06-05', note: '橱柜柜体材料', receipt: '' },
  { id: 'bi10', categoryId: 'c6', amount: 8000, date: '2026-06-12', note: '台面及五金配件', receipt: '' },
  { id: 'bi11', categoryId: 'c13', amount: 8000, date: '2026-05-28', note: '水电及防水施工', receipt: '' },
  { id: 'bi12', categoryId: 'c14', amount: 14000, date: '2026-06-02', note: '瓷砖及卫浴设备', receipt: '' },
  { id: 'bi13', categoryId: 'c15', amount: 2500, date: '2026-06-05', note: '浴室柜', receipt: '' },
];

budgetItems.forEach((item) => {
  const cat = budgetCategories.find((c) => c.id === item.categoryId);
  if (cat) cat.items.push(item);
});

budgetCategories.forEach((cat) => {
  cat.spent = cat.items.reduce((s, i) => s + i.amount, 0);
});

const tasks = [
  { id: 't1', roomId: 'r1', name: '拆除', assignee: '张工', note: '轻体墙拆除及垃圾清运', plannedStart: '2026-06-01', plannedEnd: '2026-06-03', actualStart: '2026-06-01', actualEnd: '2026-06-03', completed: true },
  { id: 't2', roomId: 'r1', name: '水电', assignee: '李师傅', note: '强弱电、给排水改造', plannedStart: '2026-06-04', plannedEnd: '2026-06-10', actualStart: '2026-06-04', actualEnd: '2026-06-11', completed: true },
  { id: 't3', roomId: 'r1', name: '泥瓦', assignee: '王师傅', note: '铺地砖、墙面找平', plannedStart: '2026-06-11', plannedEnd: '2026-06-18', actualStart: '2026-06-12', actualEnd: null, completed: false },
  { id: 't4', roomId: 'r1', name: '木工', assignee: '赵工', note: '吊顶、背景墙制作', plannedStart: '2026-06-19', plannedEnd: '2026-06-25', actualStart: null, actualEnd: null, completed: false },
  { id: 't5', roomId: 'r1', name: '油漆', assignee: '刘师傅', note: '刮腻子、乳胶漆', plannedStart: '2026-06-26', plannedEnd: '2026-07-03', actualStart: null, actualEnd: null, completed: false },
  { id: 't6', roomId: 'r2', name: '拆除', assignee: '张工', note: '旧橱柜拆除', plannedStart: '2026-06-03', plannedEnd: '2026-06-04', actualStart: '2026-06-03', actualEnd: '2026-06-04', completed: true },
  { id: 't7', roomId: 'r2', name: '水电', assignee: '李师傅', note: '厨房水电点位改造', plannedStart: '2026-06-05', plannedEnd: '2026-06-08', actualStart: '2026-06-05', actualEnd: '2026-06-09', completed: true },
  { id: 't8', roomId: 'r2', name: '泥瓦', assignee: '王师傅', note: '贴墙砖地砖', plannedStart: '2026-06-10', plannedEnd: '2026-06-16', actualStart: '2026-06-10', actualEnd: null, completed: false },
  { id: 't9', roomId: 'r2', name: '橱柜', assignee: '赵工', note: '橱柜安装', plannedStart: '2026-06-20', plannedEnd: '2026-06-24', actualStart: null, actualEnd: null, completed: false },
  { id: 't10', roomId: 'r3', name: '拆除', assignee: '张工', note: '墙面铲除', plannedStart: '2026-07-01', plannedEnd: '2026-07-02', actualStart: null, actualEnd: null, completed: false },
  { id: 't11', roomId: 'r3', name: '水电', assignee: '李师傅', note: '卧室插座及灯位', plannedStart: '2026-07-03', plannedEnd: '2026-07-06', actualStart: null, actualEnd: null, completed: false },
  { id: 't12', roomId: 'r3', name: '泥瓦', assignee: '王师傅', note: '找平及踢脚线', plannedStart: '2026-07-07', plannedEnd: '2026-07-10', actualStart: null, actualEnd: null, completed: false },
  { id: 't13', roomId: 'r3', name: '木工', assignee: '赵工', note: '衣柜及吊顶', plannedStart: '2026-07-11', plannedEnd: '2026-07-18', actualStart: null, actualEnd: null, completed: false },
  { id: 't14', roomId: 'r4', name: '拆除', assignee: '张工', note: '旧卫浴拆除', plannedStart: '2026-05-25', plannedEnd: '2026-05-26', actualStart: '2026-05-25', actualEnd: '2026-05-26', completed: true },
  { id: 't15', roomId: 'r4', name: '水电防水', assignee: '李师傅', note: '水电改造及防水施工', plannedStart: '2026-05-27', plannedEnd: '2026-06-01', actualStart: '2026-05-27', actualEnd: '2026-06-01', completed: true },
  { id: 't16', roomId: 'r4', name: '泥瓦', assignee: '王师傅', note: '墙砖地砖铺贴', plannedStart: '2026-06-02', plannedEnd: '2026-06-06', actualStart: '2026-06-02', actualEnd: '2026-06-06', completed: true },
  { id: 't17', roomId: 'r4', name: '安装', assignee: '赵工', note: '卫浴设备及吊顶安装', plannedStart: '2026-06-07', plannedEnd: '2026-06-10', actualStart: '2026-06-07', actualEnd: '2026-06-10', completed: true },
];

const materials = [
  { id: 'm1', roomId: 'r1', name: '强化复合地板', quantity: 60, unitPrice: 180, link: 'https://example.com/floor', purchased: true, category: '材料' },
  { id: 'm2', roomId: 'r1', name: '乳胶漆', quantity: 5, unitPrice: 380, link: 'https://example.com/paint', purchased: true, category: '材料' },
  { id: 'm3', roomId: 'r1', name: '北欧三人沙发', quantity: 1, unitPrice: 5800, link: 'https://example.com/sofa', purchased: false, category: '家具' },
  { id: 'm4', roomId: 'r1', name: '原木茶几', quantity: 1, unitPrice: 2200, link: 'https://example.com/table', purchased: false, category: '家具' },
  { id: 'm5', roomId: 'r1', name: '落地灯', quantity: 2, unitPrice: 680, link: 'https://example.com/lamp', purchased: false, category: '软装' },
  { id: 'm6', roomId: 'r1', name: '亚麻窗帘', quantity: 8, unitPrice: 320, link: 'https://example.com/curtain', purchased: false, category: '软装' },
  { id: 'm7', roomId: 'r2', name: '整体橱柜', quantity: 5, unitPrice: 3500, link: 'https://example.com/cabinet', purchased: true, category: '家具' },
  { id: 'm8', roomId: 'r2', name: '石英石台面', quantity: 5, unitPrice: 800, link: 'https://example.com/counter', purchased: true, category: '材料' },
  { id: 'm9', roomId: 'r2', name: '墙砖', quantity: 40, unitPrice: 120, link: 'https://example.com/wall-tile', purchased: true, category: '材料' },
  { id: 'm10', roomId: 'r2', name: '地砖', quantity: 10, unitPrice: 150, link: 'https://example.com/floor-tile', purchased: true, category: '材料' },
  { id: 'm11', roomId: 'r2', name: '抽油烟机', quantity: 1, unitPrice: 4200, link: 'https://example.com/range', purchased: false, category: '家具' },
  { id: 'm12', roomId: 'r3', name: '实木双人床', quantity: 1, unitPrice: 8800, link: 'https://example.com/bed', purchased: false, category: '家具' },
  { id: 'm13', roomId: 'r3', name: '大衣柜', quantity: 1, unitPrice: 12000, link: 'https://example.com/wardrobe', purchased: false, category: '家具' },
  { id: 'm14', roomId: 'r3', name: '床头柜', quantity: 2, unitPrice: 1200, link: 'https://example.com/nightstand', purchased: false, category: '家具' },
  { id: 'm15', roomId: 'r3', name: '墙纸', quantity: 3, unitPrice: 680, link: 'https://example.com/wallpaper', purchased: false, category: '软装' },
  { id: 'm16', roomId: 'r4', name: '花洒套装', quantity: 1, unitPrice: 1800, link: 'https://example.com/shower', purchased: true, category: '材料' },
  { id: 'm17', roomId: 'r4', name: '坐便器', quantity: 1, unitPrice: 2800, link: 'https://example.com/toilet', purchased: true, category: '材料' },
  { id: 'm18', roomId: 'r4', name: '浴室柜', quantity: 1, unitPrice: 2500, link: 'https://example.com/vanity', purchased: true, category: '家具' },
];

function recalcRoomSpent(roomId) {
  const cats = budgetCategories.filter((c) => c.roomId === roomId);
  const total = cats.reduce((s, c) => s + c.spent, 0);
  const room = rooms.find((r) => r.id === roomId);
  if (room) room.spent = total;
}

function recalcCategorySpent(categoryId) {
  const cat = budgetCategories.find((c) => c.id === categoryId);
  if (cat) {
    cat.spent = cat.items.reduce((s, i) => s + i.amount, 0);
    recalcRoomSpent(cat.roomId);
  }
}

budgetCategories.forEach((c) => recalcCategorySpent(c.id));

app.get('/api/rooms', (_req, res) => {
  res.json(rooms.sort((a, b) => a.order - b.order));
});

app.post('/api/rooms', (req, res) => {
  const newRoom = {
    id: uuidv4(),
    name: req.body.name || '新房间',
    status: 'not_started',
    totalBudget: req.body.totalBudget || 0,
    spent: 0,
    thumbnail: req.body.thumbnail || '',
    order: rooms.length,
    updatedAt: new Date().toISOString().split('T')[0],
  };
  rooms.push(newRoom);
  res.status(201).json(newRoom);
});

app.post('/api/rooms/reorder', (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order)) return res.status(400).json({ error: 'Invalid order' });
  order.forEach(({ id, order: o }) => {
    const room = rooms.find((r) => r.id === id);
    if (room) room.order = o;
  });
  res.json({ ok: true });
});

app.get('/api/rooms/:id/budget', (req, res) => {
  const { id } = req.params;
  const cats = budgetCategories
    .filter((c) => c.roomId === id)
    .map((c) => ({ ...c, items: c.items }));
  res.json(cats);
});

app.post('/api/rooms/:id/budget/items', (req, res) => {
  const { categoryId, amount, date, note, receipt } = req.body;
  const cat = budgetCategories.find((c) => c.id === categoryId);
  if (!cat) return res.status(404).json({ error: 'Category not found' });
  const item = { id: uuidv4(), categoryId, amount, date, note, receipt };
  cat.items.push(item);
  recalcCategorySpent(categoryId);
  res.status(201).json(item);
});

app.put('/api/rooms/:id/budget/items/:itemId', (req, res) => {
  const { itemId } = req.params;
  let item = null;
  for (const cat of budgetCategories) {
    const found = cat.items.find((i) => i.id === itemId);
    if (found) {
      Object.assign(found, req.body);
      item = found;
      recalcCategorySpent(cat.id);
      break;
    }
  }
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

app.delete('/api/rooms/:id/budget/items/:itemId', (req, res) => {
  const { itemId } = req.params;
  for (const cat of budgetCategories) {
    const idx = cat.items.findIndex((i) => i.id === itemId);
    if (idx !== -1) {
      cat.items.splice(idx, 1);
      recalcCategorySpent(cat.id);
      return res.status(204).end();
    }
  }
  res.status(404).json({ error: 'Item not found' });
});

app.get('/api/rooms/:id/tasks', (req, res) => {
  const { id } = req.params;
  res.json(tasks.filter((t) => t.roomId === id));
});

app.post('/api/rooms/:id/tasks', (req, res) => {
  const { id } = req.params;
  const task = { id: uuidv4(), roomId: id, completed: false, actualStart: null, actualEnd: null, ...req.body };
  tasks.push(task);
  res.status(201).json(task);
});

app.put('/api/rooms/:id/tasks/:taskId', (req, res) => {
  const { taskId } = req.params;
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  Object.assign(task, req.body);
  res.json(task);
});

app.get('/api/rooms/:id/materials', (req, res) => {
  const { id } = req.params;
  res.json(materials.filter((m) => m.roomId === id));
});

app.post('/api/rooms/:id/materials', (req, res) => {
  const { id } = req.params;
  const mat = { id: uuidv4(), roomId: id, purchased: false, ...req.body };
  materials.push(mat);
  res.status(201).json(mat);
});

app.put('/api/rooms/:id/materials/:matId', (req, res) => {
  const { matId } = req.params;
  const mat = materials.find((m) => m.id === matId);
  if (!mat) return res.status(404).json({ error: 'Material not found' });
  Object.assign(mat, req.body);
  if (req.body.purchased !== undefined) {
    const room = rooms.find((r) => r.id === mat.roomId);
    if (room && req.body.purchased) {
      room.spent += mat.quantity * mat.unitPrice;
    } else if (room && !req.body.purchased) {
      room.spent -= mat.quantity * mat.unitPrice;
    }
  }
  res.json(mat);
});

app.listen(PORT, () => {
  console.log(`Renovation API server running on http://localhost:${PORT}`);
});
