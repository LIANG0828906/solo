import { Router, Request, Response } from 'express';

const router = Router();

interface PublishedBook {
  id: string;
  title: string;
  author: string;
  price: number;
  status: 'online' | 'offline';
  createdAt: string;
}

interface UserRating {
  id: string;
  from: string;
  stars: number;
  comment: string;
  date: string;
}

const mockPublishedBooks: Record<string, PublishedBook[]> = {
  '1': [
    {
      id: 'p1',
      title: '数据结构（C语言版）',
      author: '严蔚敏',
      price: 15,
      status: 'online',
      createdAt: '2024-05-10',
    },
    {
      id: 'p2',
      title: '计算机网络（第七版）',
      author: '谢希仁',
      price: 28,
      status: 'online',
      createdAt: '2024-04-22',
    },
  ],
};

const mockFavorites: Record<string, string[]> = {
  '1': ['1', '2'],
};

const mockRatings: Record<string, UserRating[]> = {
  '1': [
    {
      id: 'r1',
      from: '学姐小红',
      stars: 5,
      comment: '书本很新，卖家很nice，交易很愉快！',
      date: '2024-06-15',
    },
    {
      id: 'r2',
      from: '同学小李',
      stars: 4,
      comment: '书本和描述一致，推荐！',
      date: '2024-05-28',
    },
  ],
};

router.get('/:id/books', (req: Request, res: Response) => {
  const { id } = req.params;
  const books = mockPublishedBooks[id] || [];
  res.json(books);
});

router.get('/:id/favorites', (req: Request, res: Response) => {
  const { id } = req.params;
  const favorites = mockFavorites[id] || [];
  res.json(favorites);
});

router.post('/:id/favorites/:bookId', (req: Request, res: Response) => {
  const { id, bookId } = req.params;
  if (!mockFavorites[id]) {
    mockFavorites[id] = [];
  }
  if (!mockFavorites[id].includes(bookId)) {
    mockFavorites[id].push(bookId);
  }
  res.json({ success: true, favorites: mockFavorites[id] });
});

router.delete('/:id/favorites/:bookId', (req: Request, res: Response) => {
  const { id, bookId } = req.params;
  if (mockFavorites[id]) {
    mockFavorites[id] = mockFavorites[id].filter((b) => b !== bookId);
  }
  res.json({ success: true, favorites: mockFavorites[id] || [] });
});

router.get('/:id/ratings', (req: Request, res: Response) => {
  const { id } = req.params;
  const ratings = mockRatings[id] || [];
  res.json(ratings);
});

router.get('/:id/profile', (req: Request, res: Response) => {
  const { id } = req.params;
  res.json({
    id,
    username: '校园学生',
    email: 'student@campus.edu',
    rating: 4.5,
    completedTrades: 12,
  });
});

export default router;
