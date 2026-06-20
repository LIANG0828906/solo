import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Order, OrderStatus, OrderItem, SIZE_PRICES, PrintSize } from '../types';

const router = Router();

const UPLOADS_DIR = path.resolve(__dirname, '../../../uploads');
const DB_PATH = path.join(UPLOADS_DIR, 'orders.json');

function readOrders(): Order[] {
  if (!fs.existsSync(DB_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
  } catch {
    return [];
  }
}

function writeOrders(orders: Order[]) {
  fs.writeFileSync(DB_PATH, JSON.stringify(orders, null, 2));
}

function calculateItemPrice(size: PrintSize, quantity: number): { unitPrice: number; subtotal: number } {
  const unitPrice = SIZE_PRICES[size];
  const subtotal = Number((unitPrice * quantity).toFixed(2));
  return { unitPrice, subtotal };
}

router.get('/', (_req: Request, res: Response) => {
  const orders = readOrders().sort((a, b) => b.createdAt - a.createdAt);
  res.json({ success: true, orders });
});

router.post('/', (req: Request, res: Response) => {
  try {
    const { items, customerName, customerPhone } = req.body as {
      items: Array<{
        photoId: string;
        photoUrl: string;
        size: PrintSize;
        quantity: number;
      }>;
      customerName: string;
      customerPhone: string;
    };

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: '订单为空' });
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({ success: false, error: '请填写客户信息' });
    }

    const orderItems: OrderItem[] = items.map(item => {
      if (item.quantity < 1 || item.quantity > 10) {
        throw new Error('数量必须在 1-10 之间');
      }
      const { unitPrice, subtotal } = calculateItemPrice(item.size, item.quantity);
      return {
        photoId: item.photoId,
        photoUrl: item.photoUrl,
        size: item.size,
        quantity: item.quantity,
        unitPrice,
        subtotal
      };
    });

    const totalPrice = Number(orderItems.reduce((sum, item) => sum + item.subtotal, 0).toFixed(2));

    const order: Order = {
      id: uuidv4(),
      items: orderItems,
      totalPrice,
      status: 'pending',
      createdAt: Date.now(),
      customerName,
      customerPhone
    };

    const orders = readOrders();
    orders.push(order);
    writeOrders(orders);

    res.json({ success: true, order });
  } catch (err) {
    console.error('创建订单失败:', err);
    const message = err instanceof Error ? err.message : '创建订单失败';
    res.status(500).json({ success: false, error: message });
  }
});

router.put('/:orderId/status', (req: Request, res: Response) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body as { status: OrderStatus };

    const validStatuses: OrderStatus[] = ['pending', 'printing', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: '无效的订单状态' });
    }

    const orders = readOrders();
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex === -1) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }

    orders[orderIndex] = { ...orders[orderIndex], status };
    writeOrders(orders);

    res.json({ success: true, order: orders[orderIndex] });
  } catch (err) {
    console.error('更新订单状态失败:', err);
    res.status(500).json({ success: false, error: '更新订单状态失败' });
  }
});

export default router;
