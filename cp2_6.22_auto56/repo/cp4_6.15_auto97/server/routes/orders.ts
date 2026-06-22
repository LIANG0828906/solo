import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createJsonRepository } from '../utils/jsonFileRepository';

interface Book {
  id: string;
  title: string;
  author: string;
  price: number;
  coverUrl: string;
}

interface CartItem {
  bookId: string;
  book: Book;
  quantity: number;
}

interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipping' | 'delivered';
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
  };
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

const router = Router();
const orderRepo = createJsonRepository<Order>('orders.json');

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const orders = await orderRepo.read();
    const userOrders = orders.filter(o => o.userId === userId);
    res.json({ success: true, data: userOrders });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const order = await orderRepo.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取订单详情失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { items, address, paymentMethod } = req.body;
    const userId = req.headers['x-user-id'] as string || 'u001';
    
    const totalAmount = items.reduce(
      (sum: number, item: CartItem) => sum + item.book.price * item.quantity,
      0
    );
    
    const newOrder: Order = {
      id: uuidv4(),
      userId,
      items,
      totalAmount,
      status: 'pending',
      shippingAddress: address,
      paymentMethod,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const order = await orderRepo.add(newOrder);
    
    setTimeout(async () => {
      await orderRepo.update(order.id, { status: 'paid', updatedAt: new Date().toISOString() });
    }, 1000);
    
    setTimeout(async () => {
      await orderRepo.update(order.id, { status: 'shipping', updatedAt: new Date().toISOString() });
    }, 2000);
    
    setTimeout(async () => {
      await orderRepo.update(order.id, { status: 'delivered', updatedAt: new Date().toISOString() });
    }, 3000);
    
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: '提交订单失败' });
  }
});

router.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await orderRepo.update(req.params.id, { status, updatedAt: new Date().toISOString() });
    if (!order) {
      return res.status(404).json({ success: false, error: '订单不存在' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新订单状态失败' });
  }
});

export default router;
