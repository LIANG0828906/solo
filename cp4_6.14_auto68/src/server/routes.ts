import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type { MenuItem, Order, Promotion, Stats, OrderItem } from '../client/api';

const router = Router();

let menuItems: MenuItem[] = [
  { id: uuidv4(), name: '宫保鸡丁', category: '主菜', price: 38, description: '经典川菜，鸡肉鲜嫩，花生酥脆', isRecommended: true, icon: '🍲' },
  { id: uuidv4(), name: '红烧肉', category: '主菜', price: 58, description: '肥而不腻，入口即化', isRecommended: true, icon: '🍲' },
  { id: uuidv4(), name: '清蒸鲈鱼', category: '主菜', price: 88, description: '新鲜鲈鱼，清蒸保留原味', isRecommended: false, icon: '🍲' },
  { id: uuidv4(), name: '麻婆豆腐', category: '主菜', price: 28, description: '麻辣鲜香，豆腐嫩滑', isRecommended: false, icon: '🍲' },
  { id: uuidv4(), name: '薯条', category: '小食', price: 18, description: '金黄酥脆，配番茄酱', isRecommended: false, icon: '🍟' },
  { id: uuidv4(), name: '鸡米花', category: '小食', price: 22, description: '外酥里嫩，香辣可口', isRecommended: true, icon: '🍟' },
  { id: uuidv4(), name: '洋葱圈', category: '小食', price: 16, description: '香脆可口，洋葱味浓', isRecommended: false, icon: '🍟' },
  { id: uuidv4(), name: '提拉米苏', category: '甜品', price: 32, description: '意式经典，咖啡香浓', isRecommended: true, icon: '🍰' },
  { id: uuidv4(), name: '芒果布丁', category: '甜品', price: 18, description: '新鲜芒果，口感丝滑', isRecommended: false, icon: '🍰' },
  { id: uuidv4(), name: '杨枝甘露', category: '甜品', price: 25, description: '港式经典，椰香浓郁', isRecommended: true, icon: '🍰' },
  { id: uuidv4(), name: '珍珠奶茶', category: '饮品', price: 15, description: '香浓奶茶，Q弹珍珠', isRecommended: true, icon: '🥤' },
  { id: uuidv4(), name: '柠檬水', category: '饮品', price: 10, description: '清新爽口，解腻必备', isRecommended: false, icon: '🥤' },
  { id: uuidv4(), name: '美式咖啡', category: '饮品', price: 20, description: '现磨咖啡，香气四溢', isRecommended: false, icon: '🥤' },
];

const generateOrderItems = (): OrderItem[] => {
  const items: OrderItem[] = [];
  const numItems = Math.floor(Math.random() * 3) + 1;
  const shuffled = [...menuItems].sort(() => Math.random() - 0.5);
  for (let i = 0; i < numItems; i++) {
    const item = shuffled[i];
    items.push({
      menuId: item.id,
      name: item.name,
      price: item.price,
      quantity: Math.floor(Math.random() * 2) + 1,
    });
  }
  return items;
};

const customerNames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', '郑十一', '冯十二'];
const statuses: Order['status'][] = ['待确认', '制作中', '配送中', '已完成', '已取消'];

let orders: Order[] = Array.from({ length: 15 }, (_, i) => {
  const items = generateOrderItems();
  return {
    id: uuidv4(),
    customerName: customerNames[i % customerNames.length],
    items,
    totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    status: statuses[i % statuses.length],
    createdAt: new Date(Date.now() - Math.random() * 86400000).toISOString(),
  };
});

let promotions: Promotion[] = [
  {
    id: uuidv4(),
    name: '新开业全场8折',
    discountType: 'percentage',
    discountValue: 80,
    startDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    applicableItems: [],
    isActive: true,
  },
  {
    id: uuidv4(),
    name: '甜品满50减10',
    discountType: 'fixed',
    discountValue: 10,
    startDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    applicableItems: menuItems.filter((item) => item.category === '甜品').map((item) => item.id),
    isActive: true,
  },
  {
    id: uuidv4(),
    name: '冬季热饮特惠',
    discountType: 'percentage',
    discountValue: 90,
    startDate: new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0],
    endDate: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    applicableItems: menuItems.filter((item) => item.category === '饮品').map((item) => item.id),
    isActive: false,
  },
];

router.get('/menu', (_req: Request, res: Response<MenuItem[]>) => {
  res.json(menuItems);
});

router.post('/menu', (req: Request<unknown, MenuItem, Omit<MenuItem, 'id'>>, res: Response<MenuItem>) => {
  const newItem: MenuItem = {
    ...req.body,
    id: uuidv4(),
  };
  menuItems.push(newItem);
  res.status(201).json(newItem);
});

router.put('/menu/:id', (req: Request<{ id: string }, MenuItem, Partial<MenuItem>>, res: Response<MenuItem>) => {
  const { id } = req.params;
  const index = menuItems.findIndex((item) => item.id === id);
  if (index === -1) {
    res.status(404).json({ error: '菜品不存在' } as unknown as MenuItem);
    return;
  }
  menuItems[index] = { ...menuItems[index], ...req.body };
  res.json(menuItems[index]);
});

router.delete('/menu/delete/:id', (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  const index = menuItems.findIndex((item) => item.id === id);
  if (index === -1) {
    res.status(404).json({ error: '菜品不存在' });
    return;
  }
  menuItems.splice(index, 1);
  res.json({ success: true });
});

router.get('/orders', (_req: Request, res: Response<Order[]>) => {
  res.json(orders);
});

router.put('/orders/:id/status', (req: Request<{ id: string }, Order, { status: Order['status'] }>, res: Response<Order>) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find((o) => o.id === id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' } as unknown as Order);
    return;
  }
  order.status = status;
  res.json(order);
});

router.get('/promotions', (_req: Request, res: Response<Promotion[]>) => {
  res.json(promotions);
});

router.post('/promotions', (req: Request<unknown, Promotion, Omit<Promotion, 'id' | 'isActive'> & { isActive?: boolean }>, res: Response<Promotion>) => {
  const newPromotion: Promotion = {
    isActive: true,
    ...req.body,
    id: uuidv4(),
  };
  promotions.push(newPromotion);
  res.status(201).json(newPromotion);
});

router.put('/promotions/:id/toggle', (req: Request<{ id: string }>, res: Response<Promotion>) => {
  const { id } = req.params;
  const promotion = promotions.find((p) => p.id === id);
  if (!promotion) {
    res.status(404).json({ error: '活动不存在' } as unknown as Promotion);
    return;
  }
  promotion.isActive = !promotion.isActive;
  res.json(promotion);
});

router.get('/stats', (_req: Request, res: Response<Stats>) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today);
  const totalSales = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
  const pendingOrders = orders.filter((o) => o.status !== '已完成' && o.status !== '已取消').length;
  const popularItemClicks = Math.floor(Math.random() * 30) + 70;

  res.json({
    todayOrders: todayOrders.length,
    totalSales: Math.round(totalSales * 100) / 100,
    popularItemClicks,
    pendingOrders,
  });
});

export default router;
