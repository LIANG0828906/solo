import { Router, Request, Response } from 'express';
import { createJsonRepository } from '../utils/jsonFileRepository';

interface Book {
  id: string;
  category: string;
  price: number;
}

interface User {
  id: string;
  role: string;
}

interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  createdAt: string;
}

const router = Router();
const bookRepo = createJsonRepository<Book>('books.json');
const userRepo = createJsonRepository<User>('users.json');
const orderRepo = createJsonRepository<Order>('orders.json');

router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const books = await bookRepo.read();
    const users = await userRepo.read();
    const orders = await orderRepo.read();
    
    const totalBooks = books.length;
    const totalUsers = users.filter(u => u.role === 'user').length;
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthOrders = orders.filter(o => o.createdAt >= monthStart);
    const monthlySales = monthOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    
    const salesTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString();
      const dayOrders = orders.filter(
        o => o.createdAt >= dayStart && o.createdAt < nextDayStr
      );
      salesTrend.push({
        date: date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        sales: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
      });
    }
    
    const categoryCount: Record<string, number> = {};
    books.forEach(book => {
      categoryCount[book.category] = (categoryCount[book.category] || 0) + 1;
    });
    
    const categoryDistribution = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / books.length) * 100).toFixed(1),
    }));
    
    res.json({
      success: true,
      data: {
        totalBooks,
        totalUsers,
        monthlySales,
        salesTrend,
        categoryDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取统计数据失败' });
  }
});

export default router;
