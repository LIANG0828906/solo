import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  Activity,
  DiscountRule,
  Product,
  SalesHistory,
  mockProducts,
  generateSalesHistory,
  generateMockActivities,
} from '../src/data/mockData';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

let activities: Activity[] = generateMockActivities();
const salesHistory: SalesHistory[] = generateSalesHistory(60);

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/products', (req: Request, res: Response) => {
  const { search, category } = req.query;
  let result = [...mockProducts];

  if (category && category !== 'all') {
    result = result.filter((p) => p.category === category);
  }

  if (search && typeof search === 'string' && search.trim()) {
    const keyword = search.trim().toLowerCase();
    result = result.filter(
      (p) =>
        p.name.toLowerCase().includes(keyword) ||
        p.category.toLowerCase().includes(keyword)
    );
  }

  res.json(result);
});

app.get('/api/activities', (req: Request, res: Response) => {
  const { status } = req.query;
  let result = [...activities];

  if (status && status !== 'all') {
    result = result.filter((a) => a.status === status);
  }

  const now = new Date();
  result = result.map((a) => {
    if (a.status === 'paused') return a;
    const start = new Date(a.startTime);
    const end = new Date(a.endTime);
    let newStatus: Activity['status'];
    if (start > now) newStatus = 'pending';
    else if (end < now) newStatus = 'ended';
    else newStatus = 'ongoing';
    return { ...a, status: newStatus };
  });
  activities = result;

  res.json(result);
});

app.get('/api/activities/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const activity = activities.find((a) => a.id === id);

  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  res.json(activity);
});

app.post('/api/activities', (req: Request, res: Response) => {
  const body = req.body as Partial<Activity> & {
    name: string;
    startTime: string;
    endTime: string;
    discountType: Activity['discountType'];
    rules: DiscountRule[];
    products: Product[];
  };

  if (!body.name || !body.startTime || !body.endTime || !body.discountType) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  const now = new Date();
  const start = new Date(body.startTime);
  const end = new Date(body.endTime);
  let status: Activity['status'];
  if (start > now) status = 'pending';
  else if (end < now) status = 'ended';
  else status = 'ongoing';

  const newActivity: Activity = {
    id: uuidv4(),
    name: body.name,
    startTime: body.startTime,
    endTime: body.endTime,
    discountType: body.discountType,
    rules: body.rules.map((r) => ({ ...r, id: r.id || uuidv4() })),
    products: body.products || [],
    buyGiftProduct: body.buyGiftProduct || null,
    status,
    stats: {
      participants: 0,
      orders: 0,
      totalDiscount: 0,
      revenue: 0,
      profit: 0,
      roi: 0,
    },
    funnelData: {
      views: 0,
      coupons: 0,
      orders: 0,
      payments: 0,
    },
    productSales: [],
  };

  activities.unshift(newActivity);
  res.status(201).json(newActivity);
});

app.put('/api/activities/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const body = req.body as Partial<Activity>;
  const index = activities.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '活动不存在' });
  }

  activities[index] = {
    ...activities[index],
    ...body,
    id,
  };

  res.json(activities[index]);
});

app.delete('/api/activities/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = activities.findIndex((a) => a.id === id);

  if (index === -1) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const deleted = activities.splice(index, 1)[0];
  res.json({ message: '删除成功', activity: deleted });
});

app.post('/api/activities/:id/pause', (req: Request, res: Response) => {
  const { id } = req.params;
  const activity = activities.find((a) => a.id === id);

  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  if (activity.status !== 'ongoing') {
    return res.status(400).json({ error: '只有进行中的活动可以暂停' });
  }

  activity.status = 'paused';
  res.json({ message: '活动已暂停', activity });
});

app.post('/api/activities/:id/resume', (req: Request, res: Response) => {
  const { id } = req.params;
  const activity = activities.find((a) => a.id === id);

  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  if (activity.status !== 'paused') {
    return res.status(400).json({ error: '只有暂停的活动可以恢复' });
  }

  activity.status = 'ongoing';
  res.json({ message: '活动已恢复', activity });
});

app.get('/api/sales/history', (req: Request, res: Response) => {
  const { days } = req.query;
  const numDays = days ? parseInt(days as string, 10) : 30;
  const result = salesHistory.slice(-numDays);
  res.json(result);
});

interface SimulationParams {
  startTime: string;
  endTime: string;
  discountType: Activity['discountType'];
  rules: DiscountRule[];
  products: Product[];
  trafficGrowth: number;
  conversionRate: number;
  avgOrderValue: number;
}

app.post('/api/simulation/predict', (req: Request, res: Response) => {
  const params = req.body as Partial<SimulationParams>;
  const {
    startTime,
    endTime,
    discountType = 'full_reduction',
    rules = [],
    products = [],
    trafficGrowth = 0.2,
    conversionRate = 0.08,
    avgOrderValue = 280,
  } = params;

  if (!startTime || !endTime) {
    return res.status(400).json({ error: '请提供活动开始和结束时间' });
  }

  const start = new Date(startTime);
  const end = new Date(endTime);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const discountFactor = calculateDiscountFactor(discountType, rules);

  const predictions = [];
  const baseline = [];
  const today = new Date();

  const avgDailyRevenue = salesHistory.slice(-30).reduce((sum, h) => sum + h.revenue, 0) / 30;
  const avgDailyOrders = salesHistory.slice(-30).reduce((sum, h) => sum + h.orders, 0) / 30;

  for (let i = 0; i < days; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];

    const dayOfWeek = date.getDay();
    const weekendFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 1.25 : 1;
    const decayFactor = 1 - (i / days) * 0.3;
    const growthFactor = 1 + trafficGrowth * (1 + Math.sin(i / 2) * 0.3);

    const baseOrders = avgDailyOrders * weekendFactor;
    const baseRevenue = avgDailyRevenue * weekendFactor;

    const predictedOrders = Math.round(baseOrders * growthFactor * decayFactor * (1 + conversionRate * 5));
    const predictedRevenue = Math.round(
      baseRevenue * growthFactor * decayFactor * (1 + conversionRate * 5) * discountFactor
    );
    const predictedProfit = Math.round(predictedRevenue * (0.25 + discountFactor * 0.05));

    predictions.push({
      date: dateStr,
      orders: predictedOrders,
      revenue: predictedRevenue,
      profit: predictedProfit,
    });

    baseline.push({
      date: dateStr,
      orders: Math.round(baseOrders),
      revenue: Math.round(baseRevenue),
      profit: Math.round(baseRevenue * 0.28),
    });
  }

  const summary = {
    totalOrders: predictions.reduce((sum, p) => sum + p.orders, 0),
    baselineOrders: baseline.reduce((sum, p) => sum + p.orders, 0),
    totalRevenue: predictions.reduce((sum, p) => sum + p.revenue, 0),
    baselineRevenue: baseline.reduce((sum, p) => sum + p.revenue, 0),
    totalProfit: predictions.reduce((sum, p) => sum + p.profit, 0),
    baselineProfit: baseline.reduce((sum, p) => sum + p.profit, 0),
    orderGrowth: 0,
    revenueGrowth: 0,
    profitGrowth: 0,
  };

  summary.orderGrowth = summary.baselineOrders > 0
    ? Math.round(((summary.totalOrders - summary.baselineOrders) / summary.baselineOrders) * 10000) / 100
    : 0;
  summary.revenueGrowth = summary.baselineRevenue > 0
    ? Math.round(((summary.totalRevenue - summary.baselineRevenue) / summary.baselineRevenue) * 10000) / 100
    : 0;
  summary.profitGrowth = summary.baselineProfit > 0
    ? Math.round(((summary.totalProfit - summary.baselineProfit) / summary.baselineProfit) * 10000) / 100
    : 0;

  res.json({
    predictions,
    baseline,
    summary,
    discountFactor,
    productCount: products.length,
  });
});

function calculateDiscountFactor(type: Activity['discountType'], rules: DiscountRule[]): number {
  if (!rules || rules.length === 0) return 1;

  const sorted = [...rules].sort((a, b) => a.condition - b.condition);

  switch (type) {
    case 'full_reduction': {
      const avgCondition = sorted.reduce((sum, r) => sum + r.condition, 0) / sorted.length;
      const avgDiscount = sorted.reduce((sum, r) => sum + r.discount, 0) / sorted.length;
      const effectiveDiscount = avgDiscount / Math.max(100, avgCondition);
      return 1 - Math.min(0.5, effectiveDiscount * 0.7);
    }
    case 'percentage': {
      const avgDiscount = sorted.reduce((sum, r) => sum + r.discount, 0) / sorted.length;
      return 1 - Math.min(0.5, avgDiscount / 100 * 0.8);
    }
    case 'buy_gift': {
      const last = sorted[sorted.length - 1];
      const ratio = last.discount / last.condition;
      return 1 - Math.min(0.4, ratio * 0.6);
    }
    default:
      return 1;
  }
}

app.get('/api/activities/:id/review', (req: Request, res: Response) => {
  const { id } = req.params;
  const activity = activities.find((a) => a.id === id);

  if (!activity) {
    return res.status(404).json({ error: '活动不存在' });
  }

  const start = new Date(activity.startTime);
  const end = new Date(activity.endTime);
  const activityDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  const historyDays = Math.min(activityDays * 2, 30);
  const preActivityStart = new Date(start);
  preActivityStart.setDate(preActivityStart.getDate() - historyDays);

  const preActivity = salesHistory.filter((h) => {
    const d = new Date(h.date);
    return d >= preActivityStart && d < start;
  });

  const duringActivity = salesHistory.filter((h) => {
    const d = new Date(h.date);
    return d >= start && d <= end;
  });

  const comparison = {
    before: {
      avgDailyRevenue: preActivity.length > 0
        ? Math.round(preActivity.reduce((sum, h) => sum + h.revenue, 0) / preActivity.length)
        : 0,
      avgDailyOrders: preActivity.length > 0
        ? Math.round(preActivity.reduce((sum, h) => sum + h.orders, 0) / preActivity.length)
        : 0,
      totalRevenue: preActivity.reduce((sum, h) => sum + h.revenue, 0),
      totalOrders: preActivity.reduce((sum, h) => sum + h.orders, 0),
    },
    during: {
      avgDailyRevenue: duringActivity.length > 0
        ? Math.round(duringActivity.reduce((sum, h) => sum + h.revenue, 0) / duringActivity.length)
        : activity.stats.revenue / activityDays,
      avgDailyOrders: duringActivity.length > 0
        ? Math.round(duringActivity.reduce((sum, h) => sum + h.orders, 0) / duringActivity.length)
        : activity.stats.orders / activityDays,
      totalRevenue: activity.stats.revenue,
      totalOrders: activity.stats.orders,
    },
  };

  const growth = {
    revenueGrowth: comparison.before.totalRevenue > 0
      ? Math.round(((comparison.during.totalRevenue - comparison.before.totalRevenue) / comparison.before.totalRevenue) * 10000) / 100
      : 0,
    orderGrowth: comparison.before.totalOrders > 0
      ? Math.round(((comparison.during.totalOrders - comparison.before.totalOrders) / comparison.before.totalOrders) * 10000) / 100
      : 0,
  };

  res.json({
    activity,
    comparison,
    growth,
    funnel: activity.funnelData,
    productSales: activity.productSales || [],
  });
});

app.listen(PORT, () => {
  console.log(`促销活动策划平台后端服务已启动: http://localhost:${PORT}`);
});
