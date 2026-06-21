import express from 'express';

const router = express.Router();

let orders = [
  {
    id: 'ORD001',
    inspectionId: 'INS001',
    deviceId: 'DEV001',
    deviceName: '1号车间数控机床A-001',
    status: 'processing',
    assigneeId: 'U001',
    assigneeName: '张工程师',
    creatorId: 'U005',
    description: '温度偏高，机器运转有异常噪音',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    assignedAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    completedAt: null,
  },
  {
    id: 'ORD002',
    inspectionId: 'INS003',
    deviceId: 'DEV003',
    deviceName: '3号车间空压机C-003',
    status: 'pending',
    assigneeId: null,
    assigneeName: null,
    creatorId: 'U005',
    description: '机身振动较大，建议检查底座固定',
    createdAt: new Date(Date.now() - 3600000 * 0.5).toISOString(),
    assignedAt: null,
    completedAt: null,
  },
];

router.get('/', (req, res) => {
  const { status, assigneeId } = req.query;
  let result = [...orders];

  if (status) {
    result = result.filter((o) => o.status === status);
  }
  if (assigneeId) {
    result = result.filter((o) => o.assigneeId === assigneeId);
  }

  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json(result);
});

router.get('/:id', (req, res) => {
  const order = orders.find((o) => o.id === req.params.id);
  if (!order) {
    return res.status(404).json({ error: '工单不存在' });
  }
  res.json(order);
});

router.post('/', (req, res) => {
  const { inspectionId, deviceId, deviceName, description, creatorId } =
    req.body;

  const newOrder = {
    id: `ORD${Date.now()}`,
    inspectionId,
    deviceId,
    deviceName,
    status: 'pending',
    assigneeId: null,
    assigneeName: null,
    creatorId,
    description: description || '',
    createdAt: new Date().toISOString(),
    assignedAt: null,
    completedAt: null,
  };

  orders.unshift(newOrder);
  res.status(201).json(newOrder);
});

router.put('/:id', (req, res) => {
  const index = orders.findIndex((o) => o.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '工单不存在' });
  }

  const updates = req.body;

  if (
    updates.assigneeId &&
    updates.assigneeName &&
    orders[index].status === 'pending'
  ) {
    updates.status = 'processing';
    updates.assignedAt = new Date().toISOString();
  }

  if (updates.status === 'completed' && orders[index].status !== 'completed') {
    updates.completedAt = new Date().toISOString();
  }

  orders[index] = { ...orders[index], ...updates };
  res.json(orders[index]);
});

export default router;
