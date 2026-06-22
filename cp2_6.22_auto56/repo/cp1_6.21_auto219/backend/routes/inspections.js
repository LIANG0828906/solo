import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { upload } from '../upload.js';

const router = express.Router();

let inspections = [
  {
    id: 'INS001',
    deviceId: 'DEV001',
    deviceName: '1号车间数控机床A-001',
    userId: 'U004',
    items: ['温度', '压力', '噪音', '振动', '外观'],
    abnormalItems: ['温度', '噪音'],
    description: '温度偏高，机器运转有异常噪音',
    photos: [],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'INS002',
    deviceId: 'DEV002',
    deviceName: '2号车间注塑机B-002',
    userId: 'U004',
    items: ['温度', '压力', '噪音', '振动', '外观'],
    abnormalItems: [],
    description: '',
    photos: [],
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'INS003',
    deviceId: 'DEV003',
    deviceName: '3号车间空压机C-003',
    userId: 'U004',
    items: ['温度', '压力', '噪音', '振动', '外观'],
    abnormalItems: ['振动'],
    description: '机身振动较大，建议检查底座固定',
    photos: [],
    createdAt: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
];

router.get('/', (req, res) => {
  const { deviceId, startDate, endDate, search } = req.query;
  let result = [...inspections];

  if (deviceId) {
    result = result.filter((i) => i.deviceId === deviceId);
  }

  if (search) {
    const keyword = String(search).toLowerCase();
    result = result.filter((i) =>
      i.deviceName.toLowerCase().includes(keyword)
    );
  }

  if (startDate) {
    result = result.filter(
      (i) => new Date(i.createdAt) >= new Date(String(startDate))
    );
  }
  if (endDate) {
    const end = new Date(String(endDate));
    end.setHours(23, 59, 59, 999);
    result = result.filter((i) => new Date(i.createdAt) <= end);
  }

  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  res.json(result);
});

router.get('/:id', (req, res) => {
  const inspection = inspections.find((i) => i.id === req.params.id);
  if (!inspection) {
    return res.status(404).json({ error: '巡检记录不存在' });
  }
  res.json(inspection);
});

router.post('/', upload.array('photos', 3), (req, res) => {
  const { deviceId, deviceName, userId, items, abnormalItems, description } =
    req.body;

  const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
  const parsedAbnormal =
    typeof abnormalItems === 'string' ? JSON.parse(abnormalItems) : abnormalItems;

  const photos = req.files
    ? req.files.map((f) => `/uploads/${f.filename}`)
    : [];

  const newInspection = {
    id: `INS${Date.now()}`,
    deviceId,
    deviceName,
    userId,
    items: parsedItems,
    abnormalItems: parsedAbnormal,
    description: description || '',
    photos,
    createdAt: new Date().toISOString(),
  };

  inspections.unshift(newInspection);
  res.status(201).json(newInspection);
});

router.delete('/:id', (req, res) => {
  const index = inspections.findIndex((i) => i.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '巡检记录不存在' });
  }
  inspections.splice(index, 1);
  res.json({ message: '删除成功' });
});

export default router;
