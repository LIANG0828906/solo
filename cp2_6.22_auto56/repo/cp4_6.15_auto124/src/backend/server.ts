import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { books, orders, type Book, type Order, type OrderItem } from './data';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/books', (req, res) => {
  const search = (req.query.search as string) || '';
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 30;
  const category = (req.query.category as string) || '';

  let filtered = [...books];

  if (search) {
    const kw = search.toLowerCase();
    filtered = filtered.filter(
      (b) => b.title.toLowerCase().includes(kw) || b.author.toLowerCase().includes(kw)
    );
  }

  if (category) {
    filtered = filtered.filter((b) => b.category === category);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize);

  res.json({ total, list });
});

app.get('/api/books/:id', (req, res) => {
  const book = books.find((b) => b.id === req.params.id);
  if (!book) {
    res.status(404).json({ error: '图书不存在' });
    return;
  }
  res.json(book);
});

app.get('/api/books/category/:category', (req, res) => {
  const { category } = req.params;
  const list = books.filter((b) => b.category === decodeURIComponent(category));
  res.json({ total: list.length, list });
});

app.get('/api/orders/stats', (_req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter((o) => o.createdAt === today);
  const shippedCount = todayOrders.filter((o) => o.status === 'shipped').length;
  const lowStockCount = books.filter((b) => b.stock < 5).length;

  res.json({
    todayOrders: todayOrders.length,
    shippedCount,
    lowStockCount
  });
});

app.post('/api/orders', (req, res) => {
  const { items, total, customerName } = req.body as {
    items: OrderItem[];
    total: number;
    customerName?: string;
  };

  if (!items || items.length === 0) {
    res.status(400).json({ success: false, message: '订单内容不能为空' });
    return;
  }

  const order: Order = {
    id: uuidv4(),
    items,
    total,
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0],
    customerName
  };

  orders.push(order);

  res.json({
    orderId: order.id,
    success: true,
    message: '订单提交成功！感谢您的购买。'
  });
});

app.patch('/api/books/:id/stock', (req, res) => {
  const { id } = req.params;
  const { stock } = req.body as { stock: number };

  const book = books.find((b) => b.id === id);
  if (!book) {
    res.status(404).json({ error: '图书不存在' });
    return;
  }

  book.stock = Math.max(0, stock);
  res.json(book);
});

app.listen(PORT, () => {
  console.log(`📚 暖光书店后端服务已启动: http://localhost:${PORT}`);
});

export default app;
