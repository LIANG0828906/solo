import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Book, Exchange, Message } from './types';

const app = express();
const PORT = 3001;
const JWT_SECRET = 'your-secret-key';

app.use(cors());
app.use(express.json());

const users: User[] = [];
const books: Book[] = [];
const exchanges: Exchange[] = [];
const messages: Message[] = [];

interface AuthRequest extends Request {
  userId?: string;
}

const verifyToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: '无效的认证令牌' });
  }
};

app.post('/api/register', async (req: Request, res: Response) => {
  const { username, email, password, avatar } = req.body;
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ error: '邮箱已被注册' });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user: User = {
    id: Date.now().toString(),
    username,
    email,
    passwordHash,
    avatar: avatar || ''
  };
  users.push(user);
  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

app.post('/api/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(400).json({ error: '用户不存在' });
  }
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return res.status(400).json({ error: '密码错误' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
  const { passwordHash: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

app.get('/api/books', (req: Request, res: Response) => {
  res.json(books);
});

app.post('/api/books', verifyToken, (req: AuthRequest, res: Response) => {
  const { title, author, category, coverUrl, condition, description, status } = req.body;
  const book: Book = {
    id: Date.now().toString(),
    ownerId: req.userId!,
    title,
    author,
    category,
    coverUrl: coverUrl || '',
    condition,
    description: description || '',
    createdAt: new Date().toISOString(),
    status: status || 'available'
  };
  books.push(book);
  res.json(book);
});

app.put('/api/books/:id', verifyToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const bookIndex = books.findIndex(b => b.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({ error: '书籍不存在' });
  }
  if (books[bookIndex].ownerId !== req.userId) {
    return res.status(403).json({ error: '无权限修改' });
  }
  books[bookIndex] = { ...books[bookIndex], ...req.body, updatedAt: new Date().toISOString() };
  res.json(books[bookIndex]);
});

app.delete('/api/books/:id', verifyToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const bookIndex = books.findIndex(b => b.id === id);
  if (bookIndex === -1) {
    return res.status(404).json({ error: '书籍不存在' });
  }
  if (books[bookIndex].ownerId !== req.userId) {
    return res.status(403).json({ error: '无权限删除' });
  }
  books.splice(bookIndex, 1);
  res.json({ message: '删除成功' });
});

app.get('/api/books/user', verifyToken, (req: AuthRequest, res: Response) => {
  const userBooks = books.filter(b => b.ownerId === req.userId);
  res.json(userBooks);
});

app.get('/api/exchanges', verifyToken, (req: AuthRequest, res: Response) => {
  const userExchanges = exchanges.filter(e => e.requesterId === req.userId || e.ownerId === req.userId);
  res.json(userExchanges);
});

app.post('/api/exchanges', verifyToken, (req: AuthRequest, res: Response) => {
  const { targetBookId } = req.body;
  const book = books.find(b => b.id === targetBookId);
  if (!book) {
    return res.status(404).json({ error: '书籍不存在' });
  }
  const exchange: Exchange = {
    id: Date.now().toString(),
    requesterId: req.userId!,
    targetBookId,
    ownerId: book.ownerId,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  exchanges.push(exchange);

  const message: Message = {
    id: (Date.now() + 1).toString(),
    userId: book.ownerId,
    content: `收到新的交换请求`,
    type: 'exchange_request',
    isRead: false,
    createdAt: new Date().toISOString(),
    relatedExchangeId: exchange.id
  };
  messages.push(message);

  res.json(exchange);
});

app.put('/api/exchanges/:id', verifyToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const exchangeIndex = exchanges.findIndex(e => e.id === id);
  if (exchangeIndex === -1) {
    return res.status(404).json({ error: '交换请求不存在' });
  }
  const exchange = exchanges[exchangeIndex];
  if (exchange.ownerId !== req.userId && exchange.requesterId !== req.userId) {
    return res.status(403).json({ error: '无权限修改' });
  }
  exchanges[exchangeIndex] = { ...exchange, status, updatedAt: new Date().toISOString() };

  const recipientId = exchange.requesterId === req.userId ? exchange.ownerId : exchange.requesterId;
  const message: Message = {
    id: (Date.now() + 1).toString(),
    userId: recipientId,
    content: `交换请求状态已更新为: ${status}`,
    type: 'exchange_update',
    isRead: false,
    createdAt: new Date().toISOString(),
    relatedExchangeId: exchange.id
  };
  messages.push(message);

  res.json(exchanges[exchangeIndex]);
});

app.get('/api/messages', verifyToken, (req: AuthRequest, res: Response) => {
  const userMessages = messages.filter(m => m.userId === req.userId);
  res.json(userMessages);
});

app.put('/api/messages/read', verifyToken, (req: AuthRequest, res: Response) => {
  messages.forEach(m => {
    if (m.userId === req.userId) {
      m.isRead = true;
    }
  });
  res.json({ message: '所有消息已标记为已读' });
});

app.put('/api/messages/:id/read', verifyToken, (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const message = messages.find(m => m.id === id && m.userId === req.userId);
  if (!message) {
    return res.status(404).json({ error: '消息不存在' });
  }
  message.isRead = true;
  res.json(message);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export { app, users, books, exchanges, messages };
