import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  orderNo: string;
  customerName: string;
  phone: string;
  estimatedArrival: string;
  notes: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  estimatedWaitMinutes: number;
  createdAt: string;
  confirmedAt?: string;
}

let orders: Order[] = [];

function generateOrderNo(): string {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD${dateStr}${random}`;
}

function calculateWaitTime(itemsLength: number): number {
  const baseWait = 10;
  const perItemWait = 3;
  const randomFactor = Math.floor(Math.random() * 6);
  return baseWait + itemsLength * perItemWait + randomFactor;
}

function getTimeSlot(date: Date): string {
  const hours = date.getHours();
  const minutes = Math.floor(date.getMinutes() / 15) * 15;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

router.get('/', (_req: Request, res: Response) => {
  res.json(orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { customerName, phone, estimatedArrival, notes, items } = req.body;

    if (!customerName || !customerName.trim()) {
      return res.status(400).json({ error: '请输入顾客姓名' });
    }
    if (!phone || !phone.trim()) {
      return res.status(400).json({ error: '请输入联系方式' });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ error: '请至少选择一道菜品' });
    }
    if (notes && notes.length > 200) {
      return res.status(400).json({ error: '备注最多200字' });
    }

    const totalAmount = items.reduce(
      (sum: number, item: OrderItem) => sum + item.price * item.quantity,
      0
    );

    const totalQuantity = items.reduce(
      (sum: number, item: OrderItem) => sum + item.quantity,
      0
    );

    const newOrder: Order = {
      id: uuidv4(),
      orderNo: generateOrderNo(),
      customerName: customerName.trim(),
      phone: phone.trim(),
      estimatedArrival: estimatedArrival || new Date(Date.now() + 30 * 60000).toISOString(),
      notes: notes || '',
      items,
      totalAmount: Math.round(totalAmount * 100) / 100,
      status: 'pending',
      estimatedWaitMinutes: calculateWaitTime(totalQuantity),
      createdAt: new Date().toISOString(),
    };

    orders.push(newOrder);
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: '创建订单失败' });
  }
});

router.put('/:id/confirm', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { confirmedArrival } = req.body;
    const order = orders.find((o) => o.id === id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态不允许确认' });
    }

    order.status = 'confirmed';
    order.confirmedAt = new Date().toISOString();
    if (confirmedArrival) {
      order.estimatedArrival = confirmedArrival;
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: '确认订单失败' });
  }
});

router.put('/:id/reject', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = orders.find((o) => o.id === id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: '订单状态不允许拒绝' });
    }

    order.status = 'rejected';

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: '拒绝订单失败' });
  }
});

router.put('/:id/cancel', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = orders.find((o) => o.id === id);

    if (!order) {
      return res.status(404).json({ error: '订单不存在' });
    }

    if (order.status === 'confirmed') {
      return res.status(400).json({ error: '订单已确认，无法取消' });
    }

    order.status = 'cancelled';

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: '取消订单失败' });
  }
});

router.get('/stats', (_req: Request, res: Response) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= today && o.status !== 'rejected' && o.status !== 'cancelled');

    const totalOrders = todayOrders.length;
    const totalRevenue = todayOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const slots: { [key: string]: number } = {};
    for (let h = 8; h <= 22; h++) {
      for (let m = 0; m < 60; m += 15) {
        const slot = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        slots[slot] = 0;
      }
    }

    todayOrders.forEach((order) => {
      const slot = getTimeSlot(new Date(order.createdAt));
      if (slots[slot] !== undefined) {
        slots[slot]++;
      }
    });

    const lineChartData = Object.entries(slots)
      .map(([time, count]) => ({ time, orders: count }))
      .filter((_, i) => i % 2 === 0 || Object.values(slots).some((v) => v > 0));

    const dishCounts: { [key: string]: { name: string; count: number; revenue: number } } = {};
    todayOrders.forEach((order) => {
      order.items.forEach((item) => {
        if (!dishCounts[item.menuItemId]) {
          dishCounts[item.menuItemId] = { name: item.name, count: 0, revenue: 0 };
        }
        dishCounts[item.menuItemId].count += item.quantity;
        dishCounts[item.menuItemId].revenue += item.price * item.quantity;
      });
    });

    const barChartData = Object.values(dishCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((dish, index) => ({
        name: dish.name,
        count: dish.count,
        revenue: Math.round(dish.revenue * 100) / 100,
        fill: index === 0 ? '#F59E0B' : index === 1 ? '#10B981' : index === 2 ? '#6366F1' : '#94A3B8',
      }));

    res.json({
      totalOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      lineChartData,
      barChartData,
    });
  } catch (err) {
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

export default router;
