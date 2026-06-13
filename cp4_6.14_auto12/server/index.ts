import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

export interface Book {
  id: string;
  title: string;
  author: string;
  tags: string[];
  ownerId: string;
  ownerName: string;
  isExchanged: boolean;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  preferences: string[];
  recentlyRead: string[];
  clickedTags: { [tag: string]: number };
  books: Book[];
}

export interface ExchangeRequest {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string;
  toUserId: string;
  offeredBookId: string;
  offeredBookTitle: string;
  requestedBookId: string;
  requestedBookTitle: string;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled';
  createdAt: number;
}

export interface Notification {
  id: string;
  userId: string;
  message: string;
  createdAt: number;
  read: boolean;
}

const TAGS = ['科幻', '文学', '编程', '历史', '哲学', '经济', '艺术', '心理学', '传记', '悬疑'];

const sampleUsers: User[] = [
  {
    id: 'user-1',
    name: '小明',
    avatar: '#FFB6C1',
    preferences: ['科幻', '编程', '悬疑'],
    recentlyRead: ['三体', '编码'],
    clickedTags: {},
    books: [
      { id: 'book-1-1', title: '三体', author: '刘慈欣', tags: ['科幻', '文学'], ownerId: 'user-1', ownerName: '小明', isExchanged: false },
      { id: 'book-1-2', title: '编码', author: 'Charles Petzold', tags: ['编程', '科技'], ownerId: 'user-1', ownerName: '小明', isExchanged: false },
      { id: 'book-1-3', title: '嫌疑人X的献身', author: '东野圭吾', tags: ['悬疑', '文学'], ownerId: 'user-1', ownerName: '小明', isExchanged: false },
    ],
  },
  {
    id: 'user-2',
    name: '小红',
    avatar: '#87CEEB',
    preferences: ['文学', '艺术', '哲学'],
    recentlyRead: ['百年孤独', '小王子'],
    clickedTags: {},
    books: [
      { id: 'book-2-1', title: '百年孤独', author: '马尔克斯', tags: ['文学', '历史'], ownerId: 'user-2', ownerName: '小红', isExchanged: false },
      { id: 'book-2-2', title: '小王子', author: '圣埃克苏佩里', tags: ['文学', '哲学'], ownerId: 'user-2', ownerName: '小红', isExchanged: false },
      { id: 'book-2-3', title: '艺术的故事', author: '贡布里希', tags: ['艺术', '历史'], ownerId: 'user-2', ownerName: '小红', isExchanged: false },
      { id: 'book-2-4', title: '苏菲的世界', author: '乔斯坦·贾德', tags: ['哲学', '文学'], ownerId: 'user-2', ownerName: '小红', isExchanged: false },
    ],
  },
  {
    id: 'user-3',
    name: '小李',
    avatar: '#98FB98',
    preferences: ['历史', '经济', '传记'],
    recentlyRead: ['人类简史', '乔布斯传'],
    clickedTags: {},
    books: [
      { id: 'book-3-1', title: '人类简史', author: '尤瓦尔·赫拉利', tags: ['历史', '哲学'], ownerId: 'user-3', ownerName: '小李', isExchanged: false },
      { id: 'book-3-2', title: '乔布斯传', author: '沃尔特·艾萨克森', tags: ['传记', '科技'], ownerId: 'user-3', ownerName: '小李', isExchanged: false },
      { id: 'book-3-3', title: '国富论', author: '亚当·斯密', tags: ['经济', '哲学'], ownerId: 'user-3', ownerName: '小李', isExchanged: false },
      { id: 'book-3-4', title: '万历十五年', author: '黄仁宇', tags: ['历史'], ownerId: 'user-3', ownerName: '小李', isExchanged: false },
    ],
  },
  {
    id: 'user-4',
    name: '小王',
    avatar: '#DDA0DD',
    preferences: ['心理学', '哲学', '文学'],
    recentlyRead: ['思考，快与慢', '乌合之众'],
    clickedTags: {},
    books: [
      { id: 'book-4-1', title: '思考，快与慢', author: '丹尼尔·卡尼曼', tags: ['心理学', '经济'], ownerId: 'user-4', ownerName: '小王', isExchanged: false },
      { id: 'book-4-2', title: '乌合之众', author: '古斯塔夫·勒庞', tags: ['心理学', '历史'], ownerId: 'user-4', ownerName: '小王', isExchanged: false },
      { id: 'book-4-3', title: '自卑与超越', author: '阿尔弗雷德·阿德勒', tags: ['心理学'], ownerId: 'user-4', ownerName: '小王', isExchanged: false },
    ],
  },
  {
    id: 'user-5',
    name: '小张',
    avatar: '#F0E68C',
    preferences: ['编程', '科幻', '艺术'],
    recentlyRead: ['代码整洁之道', '银河系漫游指南'],
    clickedTags: {},
    books: [
      { id: 'book-5-1', title: '代码整洁之道', author: 'Robert C. Martin', tags: ['编程', '科技'], ownerId: 'user-5', ownerName: '小张', isExchanged: false },
      { id: 'book-5-2', title: '银河系漫游指南', author: '道格拉斯·亚当斯', tags: ['科幻', '文学'], ownerId: 'user-5', ownerName: '小张', isExchanged: false },
      { id: 'book-5-3', title: '设计心理学', author: '唐纳德·诺曼', tags: ['心理学', '艺术'], ownerId: 'user-5', ownerName: '小张', isExchanged: false },
    ],
  },
];

let users: User[] = JSON.parse(JSON.stringify(sampleUsers));
let exchangeRequests: ExchangeRequest[] = [];
let notifications: Notification[] = [];

const currentUserId = 'user-1';

function computeBookSimilarity(book: Book, recentlyRead: string[]): number {
  let similarity = 0;
  for (const readTitle of recentlyRead) {
    for (const u of users) {
      const readBook = u.books.find((b) => b.title === readTitle);
      if (readBook) {
        const sharedTags = book.tags.filter((t) => readBook.tags.includes(t));
        similarity += sharedTags.length * 12;
        if (book.author === readBook.author) {
          similarity += 15;
        }
      }
    }
    if (book.title.includes(readTitle) || readTitle.includes(book.title)) {
      similarity += 8;
    }
  }
  return similarity;
}

function recommendBooks(user: User): { book: Book; score: number }[] {
  const userPrefs = new Set(user.preferences);

  const tagWeights: { [tag: string]: number } = {};
  for (const tag of userPrefs) {
    tagWeights[tag] = 1.0;
  }
  for (const tag of Object.keys(user.clickedTags)) {
    const clickCount = user.clickedTags[tag];
    tagWeights[tag] = (tagWeights[tag] || 1.0) * Math.pow(0.95, clickCount);
  }

  const allBooks: Book[] = [];
  for (const u of users) {
    if (u.id !== user.id) {
      for (const book of u.books) {
        if (!book.isExchanged) {
          allBooks.push(book);
        }
      }
    }
  }

  const scored = allBooks.map((book) => {
    let score = 0;

    for (const tag of book.tags) {
      const weight = tagWeights[tag];
      if (weight !== undefined) {
        score += 30 * weight;
      } else {
        score += 5;
      }
    }

    score += computeBookSimilarity(book, user.recentlyRead);

    const owner = users.find((u) => u.id === book.ownerId);
    if (owner) {
      const sharedPrefs = owner.preferences.filter((p) => userPrefs.has(p));
      score += sharedPrefs.length * 5;
    }

    return { book, score: Math.max(0, Math.min(100, Math.round(score))) };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

app.get('/api/tags', (_req: Request, res: Response) => {
  res.json({ tags: TAGS });
});

app.get('/api/user', (_req: Request, res: Response) => {
  const user = users.find((u) => u.id === currentUserId);
  res.json({ user });
});

app.put('/api/user/preferences', (req: Request, res: Response) => {
  const { preferences, recentlyRead } = req.body;
  const user = users.find((u) => u.id === currentUserId);
  if (user) {
    user.preferences = preferences || user.preferences;
    user.recentlyRead = recentlyRead || user.recentlyRead;
  }
  res.json({ user });
});

app.get('/api/recommendations', (req: Request, res: Response) => {
  const user = users.find((u) => u.id === currentUserId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const sortBy = (req.query.sortBy as string) || 'score';
  const scored = recommendBooks(user);
  const top20 = scored.slice(0, 20);

  if (sortBy === 'title') {
    top20.sort((a, b) => a.book.title.localeCompare(b.book.title, 'zh'));
  } else if (sortBy === 'author') {
    top20.sort((a, b) => a.book.author.localeCompare(b.book.author, 'zh'));
  }

  res.json({ recommendations: top20.map((s) => ({ ...s.book, matchScore: s.score })) });
});

app.post('/api/books/click', (req: Request, res: Response) => {
  const { bookId } = req.body;
  const user = users.find((u) => u.id === currentUserId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  let clickedBook: Book | null = null;
  for (const u of users) {
    const found = u.books.find((b) => b.id === bookId);
    if (found) {
      clickedBook = found;
      break;
    }
  }

  if (clickedBook) {
    for (const tag of clickedBook.tags) {
      user.clickedTags[tag] = (user.clickedTags[tag] || 0) + 1;
    }
  }

  res.json({ success: true });
});

app.post('/api/exchange-requests', (req: Request, res: Response) => {
  const { offeredBookId, requestedBookId } = req.body;
  const fromUser = users.find((u) => u.id === currentUserId);
  if (!fromUser) {
    return res.status(404).json({ error: 'From user not found' });
  }

  let requestedBook: Book | null = null;
  let toUserId = '';
  for (const u of users) {
    const found = u.books.find((b) => b.id === requestedBookId);
    if (found) {
      requestedBook = found;
      toUserId = u.id;
      break;
    }
  }

  const offeredBook = fromUser.books.find((b) => b.id === offeredBookId);

  if (!requestedBook || !offeredBook) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const request: ExchangeRequest = {
    id: uuidv4(),
    fromUserId: fromUser.id,
    fromUserName: fromUser.name,
    fromUserAvatar: fromUser.avatar,
    toUserId,
    offeredBookId,
    offeredBookTitle: offeredBook.title,
    requestedBookId,
    requestedBookTitle: requestedBook.title,
    status: 'pending',
    createdAt: Date.now(),
  };

  exchangeRequests.push(request);

  const notif: Notification = {
    id: uuidv4(),
    userId: toUserId,
    message: `${fromUser.name} 向你发起了《${requestedBook.title}》的交换请求`,
    createdAt: Date.now(),
    read: false,
  };
  notifications.push(notif);

  res.json({ request });
});

app.get('/api/exchange-requests', (_req: Request, res: Response) => {
  const userRequests = exchangeRequests.filter(
    (r) => r.fromUserId === currentUserId || r.toUserId === currentUserId
  );
  res.json({ requests: userRequests });
});

app.put('/api/exchange-requests/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;
  const request = exchangeRequests.find((r) => r.id === id);
  if (!request) {
    return res.status(404).json({ error: 'Request not found' });
  }

  request.status = status;

  if (status === 'accepted') {
    const fromUser = users.find((u) => u.id === request.fromUserId);
    const toUser = users.find((u) => u.id === request.toUserId);
    if (fromUser && toUser) {
      const offered = fromUser.books.find((b) => b.id === request.offeredBookId);
      const requested = toUser.books.find((b) => b.id === request.requestedBookId);
      if (offered) offered.isExchanged = true;
      if (requested) requested.isExchanged = true;
    }
  }

  res.json({ request });
});

app.get('/api/notifications', (_req: Request, res: Response) => {
  const userNotifs = notifications
    .filter((n) => n.userId === currentUserId && !n.read)
    .sort((a, b) => b.createdAt - a.createdAt);
  res.json({ notifications: userNotifs });
});

app.put('/api/notifications/:id/read', (req: Request, res: Response) => {
  const { id } = req.params;
  const notif = notifications.find((n) => n.id === id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

app.get('/api/users/:id/books', (req: Request, res: Response) => {
  const { id } = req.params;
  const user = users.find((u) => u.id === id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({ books: user.books.filter((b) => !b.isExchanged) });
});

app.listen(PORT, () => {
  console.log(`Book Exchange API server running on http://localhost:${PORT}`);
});
