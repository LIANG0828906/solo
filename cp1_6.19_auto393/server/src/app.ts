import express, { Request, Response } from 'express';
import cors from 'cors';
import { Book, Recommendation, getRecommendations } from './recommend';

interface ExchangeRequest {
  id: string;
  bookId: string;
  bookTitle: string;
  fromUser: string;
  toUser: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let books: Book[] = [
  {
    id: '1',
    title: '三体',
    author: '刘慈欣',
    category: '科幻',
    tags: ['科幻', '宇宙', '文明', '物理'],
    description: '中国科幻史上的里程碑之作，讲述人类与外星文明的首次接触。',
    owner: '书友小明',
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: '2',
    title: '活着',
    author: '余华',
    category: '文学',
    tags: ['文学', '人生', '苦难', '现实'],
    description: '讲述一个人和他的命运之间的友情，讲述人如何去承受巨大的苦难。',
    owner: '爱书之人',
    createdAt: '2026-01-14T14:30:00Z'
  },
  {
    id: '3',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    category: '历史',
    tags: ['历史', '人类', '社会', '进化'],
    description: '从认知革命、农业革命到科学革命，讲述人类如何登上食物链顶端。',
    owner: '历史迷',
    createdAt: '2026-01-13T09:20:00Z'
  },
  {
    id: '4',
    title: '代码整洁之道',
    author: 'Robert C. Martin',
    category: '技术',
    tags: ['编程', '代码', '软件工程', '最佳实践'],
    description: '教你如何编写整洁、可维护、优雅的代码，提升代码质量。',
    owner: '程序员老王',
    createdAt: '2026-01-12T16:45:00Z'
  },
  {
    id: '5',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    category: '文学',
    tags: ['文学', '魔幻现实', '家族', '拉美'],
    description: '魔幻现实主义文学的代表作，讲述布恩迪亚家族七代人的传奇故事。',
    owner: '文学爱好者',
    createdAt: '2026-01-11T11:15:00Z'
  },
  {
    id: '6',
    title: '流浪地球',
    author: '刘慈欣',
    category: '科幻',
    tags: ['科幻', '地球', '宇宙', '冒险'],
    description: '太阳即将毁灭，人类开启流浪地球计划，寻找新家园。',
    owner: '科幻迷',
    createdAt: '2026-01-10T13:30:00Z'
  },
  {
    id: '7',
    title: '设计模式',
    author: 'GoF',
    category: '技术',
    tags: ['编程', '设计模式', '架构', '软件工程'],
    description: '软件开发的经典之作，23种设计模式详解。',
    owner: '架构师老李',
    createdAt: '2026-01-09T08:00:00Z'
  },
  {
    id: '8',
    title: '明朝那些事儿',
    author: '当年明月',
    category: '历史',
    tags: ['历史', '明朝', '中国', '趣味历史'],
    description: '以幽默风趣的笔触讲述明朝三百年历史风云。',
    owner: '历史控',
    createdAt: '2026-01-08T15:20:00Z'
  },
  {
    id: '9',
    title: '经济学原理',
    author: '曼昆',
    category: '经济',
    tags: ['经济', '理论', '市场', '政策'],
    description: '经济学入门经典，深入浅出讲解微观和宏观经济学。',
    owner: '财经达人',
    createdAt: '2026-01-07T10:10:00Z'
  },
  {
    id: '10',
    title: '白夜行',
    author: '东野圭吾',
    category: '悬疑',
    tags: ['悬疑', '推理', '日本', '犯罪'],
    description: '东野圭吾推理小说代表作，讲述一段长达十九年的悬疑故事。',
    owner: '推理迷',
    createdAt: '2026-01-06T17:40:00Z'
  }
];

let exchangeRequests: ExchangeRequest[] = [
  {
    id: 'e1',
    bookId: '1',
    bookTitle: '三体',
    fromUser: '爱书之人',
    toUser: '书友小明',
    status: 'pending',
    createdAt: '2026-01-15T12:00:00Z'
  },
  {
    id: 'e2',
    bookId: '3',
    bookTitle: '人类简史',
    fromUser: '书友小明',
    toUser: '历史迷',
    status: 'accepted',
    createdAt: '2026-01-14T10:30:00Z'
  }
];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

app.get('/api/books', (_req: Request, res: Response) => {
  res.json(books);
});

app.get('/api/books/:id', (req: Request, res: Response) => {
  const book = books.find(b => b.id === req.params.id);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  res.json(book);
});

app.post('/api/books', (req: Request, res: Response) => {
  const { title, author, category, tags, description } = req.body;
  
  if (!title || !author || !category || !tags) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const newBook: Book = {
    id: generateId(),
    title,
    author,
    category,
    tags: Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim()),
    description,
    owner: '当前用户',
    createdAt: new Date().toISOString()
  };
  
  books.unshift(newBook);
  res.status(201).json(newBook);
});

app.put('/api/books/:id', (req: Request, res: Response) => {
  const index = books.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  books[index] = { ...books[index], ...req.body };
  res.json(books[index]);
});

app.delete('/api/books/:id', (req: Request, res: Response) => {
  const index = books.findIndex(b => b.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  books.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/recommend/:bookId', (req: Request, res: Response) => {
  const targetBook = books.find(b => b.id === req.params.bookId);
  if (!targetBook) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  const recommendations: Recommendation[] = getRecommendations(targetBook, books);
  res.json(recommendations);
});

app.get('/api/exchanges', (_req: Request, res: Response) => {
  res.json(exchangeRequests);
});

app.post('/api/exchanges', (req: Request, res: Response) => {
  const { bookId, fromUser, toUser } = req.body;
  
  if (!bookId || !fromUser || !toUser) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  const book = books.find(b => b.id === bookId);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }
  
  const newRequest: ExchangeRequest = {
    id: generateId(),
    bookId,
    bookTitle: book.title,
    fromUser,
    toUser,
    status: 'pending',
    createdAt: new Date().toISOString()
  };
  
  exchangeRequests.unshift(newRequest);
  res.status(201).json(newRequest);
});

app.put('/api/exchanges/:id', (req: Request, res: Response) => {
  const index = exchangeRequests.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Exchange request not found' });
  }
  
  const { status } = req.body;
  if (status && !['pending', 'accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  exchangeRequests[index] = { ...exchangeRequests[index], ...req.body };
  res.json(exchangeRequests[index]);
});

app.listen(PORT, () => {
  console.log(`Book exchange server running on port ${PORT}`);
  console.log(`API endpoints:`);
  console.log(`  GET    /api/books`);
  console.log(`  GET    /api/books/:id`);
  console.log(`  POST   /api/books`);
  console.log(`  PUT    /api/books/:id`);
  console.log(`  DELETE /api/books/:id`);
  console.log(`  GET    /api/recommend/:bookId`);
  console.log(`  GET    /api/exchanges`);
  console.log(`  POST   /api/exchanges`);
  console.log(`  PUT    /api/exchanges/:id`);
});

export default app;
