import express from 'express';
import cors from 'cors';
import {
  initializeData,
  getPickingRecords,
  getRecentPickingRecords,
  createPickingRecord,
  updatePickingRecord,
  deletePickingRecord,
  getProcessingRecords,
  getProcessingQueue,
  createProcessingRecord,
  updateProcessingRecord,
  incrementStirCount,
  completeProcessing,
  getTastingRecords,
  createTastingRecord,
  updateTastingRecord,
  getOrders,
  createOrder,
  updateOrderStatus,
  getGlobalStats,
  getInventory,
  getAvailableQuantity,
} from './data';
import type {
  PickingRecord,
  ProcessingRecord,
  TastingRecord,
  Order,
  TeaVariety,
  AromaType,
  OrderStatus,
} from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface ValidationError {
  field: string;
  message: string;
}

function validatePickingData(data: Partial<PickingRecord>): ValidationError[] {
  const errors: ValidationError[] = [];
  const validVarieties: TeaVariety[] = ['龙井', '碧螺春', '铁观音', '普洱', '大红袍'];
  const validAreas = ['东区', '西区', '南区', '北区'];

  if (data.variety !== undefined && !validVarieties.includes(data.variety)) {
    errors.push({ field: 'variety', message: '无效的茶叶品种' });
  }
  if (data.pickTime !== undefined && isNaN(new Date(data.pickTime).getTime())) {
    errors.push({ field: 'pickTime', message: '无效的采摘时间' });
  }
  if (data.picker !== undefined && (!data.picker || data.picker.trim().length === 0)) {
    errors.push({ field: 'picker', message: '采摘人不能为空' });
  }
  if (data.weight !== undefined && (typeof data.weight !== 'number' || data.weight <= 0)) {
    errors.push({ field: 'weight', message: '采摘重量必须大于0' });
  }
  if (data.area !== undefined && !validAreas.includes(data.area)) {
    errors.push({ field: 'area', message: '无效的采摘区域' });
  }

  return errors;
}

function validateProcessingData(data: Partial<ProcessingRecord>): ValidationError[] {
  const errors: ValidationError[] = [];

  if (data.temperature !== undefined && (typeof data.temperature !== 'number' || data.temperature < 80 || data.temperature > 300)) {
    errors.push({ field: 'temperature', message: '炒制温度必须在80-300°C之间' });
  }
  if (data.duration !== undefined && (typeof data.duration !== 'number' || data.duration < 5 || data.duration > 60)) {
    errors.push({ field: 'duration', message: '炒制时长必须在5-60分钟之间' });
  }

  return errors;
}

function validateTastingData(data: Partial<TastingRecord>): ValidationError[] {
  const errors: ValidationError[] = [];

  const validateScore = (value: number | undefined, field: string, name: string) => {
    if (value !== undefined && (typeof value !== 'number' || value < 0 || value > 10)) {
      errors.push({ field, message: `${name}必须在0-10分之间` });
    }
  };

  validateScore(data.appearance, 'appearance', '外观评分');
  validateScore(data.liquor, 'liquor', '汤色评分');
  validateScore(data.aroma, 'aroma', '香气评分');
  validateScore(data.taste, 'taste', '滋味评分');
  validateScore(data.leaf, 'leaf', '叶底评分');

  if (data.comment !== undefined && data.comment.length > 200) {
    errors.push({ field: 'comment', message: '评价不能超过200字' });
  }

  return errors;
}

function validateOrderData(data: Partial<Order>): ValidationError[] {
  const errors: ValidationError[] = [];
  const validShipping = ['陆运', '海运', '空运'];

  if (data.variety !== undefined) {
    const validVarieties: TeaVariety[] = ['龙井', '碧螺春', '铁观音', '普洱', '大红袍'];
    if (!validVarieties.includes(data.variety)) {
      errors.push({ field: 'variety', message: '无效的茶叶品种' });
    }
  }
  if (data.quantity !== undefined && (typeof data.quantity !== 'number' || data.quantity < 0.5)) {
    errors.push({ field: 'quantity', message: '订购数量最小为0.5斤' });
  }
  if (data.shippingMethod !== undefined && !validShipping.includes(data.shippingMethod)) {
    errors.push({ field: 'shippingMethod', message: '无效的发货方式' });
  }

  return errors;
}

app.get('/api/picking', async (_req, res) => {
  try {
    const records = await getPickingRecords();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取采摘记录失败' });
  }
});

app.get('/api/picking/recent', async (_req, res) => {
  try {
    const records = await getRecentPickingRecords();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取最近采摘记录失败' });
  }
});

app.post('/api/picking', async (req, res) => {
  try {
    const errors = validatePickingData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const record = await createPickingRecord(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: '创建采摘记录失败' });
  }
});

app.put('/api/picking/:id', async (req, res) => {
  try {
    const errors = validatePickingData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const record = await updatePickingRecord(req.params.id, req.body);
    if (!record) {
      return res.status(404).json({ error: '采摘记录不存在' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: '更新采摘记录失败' });
  }
});

app.delete('/api/picking/:id', async (req, res) => {
  try {
    const success = await deletePickingRecord(req.params.id);
    if (!success) {
      return res.status(404).json({ error: '采摘记录不存在' });
    }
    res.json({ message: '删除成功' });
  } catch (error) {
    res.status(500).json({ error: '删除采摘记录失败' });
  }
});

app.get('/api/processing', async (_req, res) => {
  try {
    const records = await getProcessingRecords();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取炒制记录失败' });
  }
});

app.get('/api/processing/queue', async (_req, res) => {
  try {
    const records = await getProcessingQueue();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取炒制队列失败' });
  }
});

app.post('/api/processing', async (req, res) => {
  try {
    const errors = validateProcessingData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const record = await createProcessingRecord(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: '创建炒制记录失败' });
  }
});

app.put('/api/processing/:id', async (req, res) => {
  try {
    const errors = validateProcessingData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const record = await updateProcessingRecord(req.params.id, req.body);
    if (!record) {
      return res.status(404).json({ error: '炒制记录不存在' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: '更新炒制记录失败' });
  }
});

app.put('/api/processing/:id/stir', async (req, res) => {
  try {
    const record = await incrementStirCount(req.params.id);
    if (!record) {
      return res.status(404).json({ error: '炒制记录不存在' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: '增加翻炒次数失败' });
  }
});

app.put('/api/processing/:id/complete', async (req, res) => {
  try {
    const { color, aroma } = req.body;
    if (!color || !aroma) {
      return res.status(400).json({ error: '缺少颜色或香气参数' });
    }
    const validAromas: AromaType[] = ['豆香', '栗香', '花香', '蜜香'];
    if (!validAromas.includes(aroma)) {
      return res.status(400).json({ error: '无效的香气类型' });
    }

    const record = await completeProcessing(req.params.id, color, aroma);
    if (!record) {
      return res.status(404).json({ error: '炒制记录不存在' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: '完成炒制失败' });
  }
});

app.get('/api/tasting', async (_req, res) => {
  try {
    const records = await getTastingRecords();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取品鉴记录失败' });
  }
});

app.post('/api/tasting', async (req, res) => {
  try {
    const errors = validateTastingData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const record = await createTastingRecord(req.body);
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: '创建品鉴记录失败' });
  }
});

app.put('/api/tasting/:id', async (req, res) => {
  try {
    const errors = validateTastingData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const record = await updateTastingRecord(req.params.id, req.body);
    if (!record) {
      return res.status(404).json({ error: '品鉴记录不存在' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: '更新品鉴记录失败' });
  }
});

app.get('/api/orders', async (_req, res) => {
  try {
    const records = await getOrders();
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: '获取订单失败' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const errors = validateOrderData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    const result = await createOrder(req.body);
    if ('error' in result) {
      return res.status(400).json({ error: result.error });
    }
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: '创建订单失败' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses: OrderStatus[] = ['待处理', '已发货', '已签收', '超时'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的订单状态' });
    }

    const record = await updateOrderStatus(req.params.id, status);
    if (!record) {
      return res.status(404).json({ error: '订单不存在' });
    }
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: '更新订单状态失败' });
  }
});

app.get('/api/stats', async (_req, res) => {
  try {
    const stats = await getGlobalStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

app.get('/api/inventory', async (_req, res) => {
  try {
    const inventory = await getInventory();
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ error: '获取库存数据失败' });
  }
});

app.get('/api/inventory/:variety', async (req, res) => {
  try {
    const variety = req.params.variety as TeaVariety;
    const validVarieties: TeaVariety[] = ['龙井', '碧螺春', '铁观音', '普洱', '大红袍'];
    if (!validVarieties.includes(variety)) {
      return res.status(400).json({ error: '无效的茶叶品种' });
    }
    const quantity = await getAvailableQuantity(variety);
    res.json({ variety, quantity });
  } catch (error) {
    res.status(500).json({ error: '获取库存数量失败' });
  }
});

async function startServer() {
  await initializeData();
  app.listen(PORT, () => {
    console.log(`\u8336\u5e84\u7ba1\u7406\u7cfb\u7edf\u540e\u7aef\u670d\u52a1\u5668\u8fd0\u884c\u5728 http://localhost:${PORT}`);
  });
}

startServer();
