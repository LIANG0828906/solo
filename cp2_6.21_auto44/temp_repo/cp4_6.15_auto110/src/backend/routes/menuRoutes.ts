import { Router, Request, Response } from 'express';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getBookings,
  createBooking,
  updateBookingStatus,
  generatePurchaseList,
} from '../service/menuService';
import { BookingStatus, MenuCategory } from '../../types';

const router = Router();

router.get('/menu', (_req: Request, res: Response) => {
  try {
    const items = getMenuItems();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: '获取菜单失败' });
  }
});

router.post('/menu', (req: Request, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      imageUrl,
      category,
      optionalToppings,
      dailyLimit,
      ingredients,
    } = req.body;

    if (!name || !description || price == null || !category) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const validCategories: MenuCategory[] = ['appetizer', 'main', 'dessert', 'drink'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: '无效的菜品分类' });
    }

    if (Array.isArray(optionalToppings) && optionalToppings.length > 3) {
      return res.status(400).json({ error: '可选配料最多3种' });
    }

    const newItem = createMenuItem({
      name,
      description,
      price: Number(price),
      imageUrl: imageUrl || '',
      category,
      optionalToppings: optionalToppings || [],
      dailyLimit: Number(dailyLimit) || 0,
      ingredients: ingredients || [],
    });

    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: '创建菜品失败' });
  }
});

router.put('/menu/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updated = updateMenuItem(id, req.body);
    if (!updated) {
      return res.status(404).json({ error: '菜品不存在' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: '更新菜品失败' });
  }
});

router.delete('/menu/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = deleteMenuItem(id);
    if (!deleted) {
      return res.status(404).json({ error: '菜品不存在' });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除菜品失败' });
  }
});

router.get('/booking', (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const bookings = getBookings(date as string | undefined);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: '获取预订失败' });
  }
});

router.post('/booking', (req: Request, res: Response) => {
  try {
    const { customerName, phone, date, timeSlot, guestCount, items } = req.body;

    if (!customerName || !phone || !date || !timeSlot || !guestCount || !items || !items.length) {
      return res.status(400).json({ error: '缺少必填字段' });
    }

    const newBooking = createBooking({
      customerName,
      phone,
      date,
      timeSlot,
      guestCount: Number(guestCount),
      items,
    });

    res.status(201).json(newBooking);
  } catch (error: any) {
    res.status(400).json({ error: error.message || '创建预订失败' });
  }
});

router.patch('/booking/:id/status', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses: BookingStatus[] = ['pending', 'confirmed', 'completed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: '无效的预订状态' });
    }

    const updated = updateBookingStatus(id, status);
    if (!updated) {
      return res.status(404).json({ error: '预订不存在' });
    }
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: '更新预订状态失败' });
  }
});

router.post('/purchase', (req: Request, res: Response) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: '缺少日期参数' });
    }
    const purchaseList = generatePurchaseList(date);
    res.json(purchaseList);
  } catch (error) {
    res.status(500).json({ error: '生成采购清单失败' });
  }
});

export default router;
