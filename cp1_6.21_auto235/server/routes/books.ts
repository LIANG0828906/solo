import { Router, Request, Response } from 'express';
import multer from 'multer';

const router = Router();
const upload = multer({ dest: 'uploads/' });

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  originalPrice: number;
  currentPrice: number;
  cover?: string;
  description: string;
  seller: {
    id: string;
    username: string;
    rating: number;
  };
  status: 'online' | 'offline';
  circulationCount: number;
  circulationHistory: Array<{
    id: string;
    time: string;
    fromUser: string;
    toUser: string;
    rating: number;
    comment?: string;
  }>;
}

const mockBooks: Book[] = [
  {
    id: '1',
    title: '高等数学（第七版）上册',
    author: '同济大学数学系',
    isbn: '9787040396638',
    originalPrice: 42.5,
    currentPrice: 18,
    description: '书本保存良好，少量笔记，不影响阅读。',
    seller: { id: '2', username: '学霸小李', rating: 4.8 },
    status: 'online',
    circulationCount: 5,
    circulationHistory: [
      {
        id: 'h1',
        time: '2024-03-15 14:30',
        fromUser: '小明同学',
        toUser: '学霸小李',
        rating: 5,
        comment: '书本很新，交易很愉快！',
      },
      {
        id: 'h2',
        time: '2023-09-01 10:20',
        fromUser: '学姐小红',
        toUser: '小明同学',
        rating: 4,
        comment: '书本质量不错',
      },
    ],
  },
  {
    id: '2',
    title: '线性代数及其应用',
    author: 'David C. Lay',
    isbn: '9787111561012',
    originalPrice: 69,
    currentPrice: 25,
    description: '九成新，几乎无笔记。',
    seller: { id: '3', username: '书虫小王', rating: 4.5 },
    status: 'online',
    circulationCount: 3,
    circulationHistory: [],
  },
];

router.get('/search', (req: Request, res: Response) => {
  const { q } = req.query;
  const query = (q as string) || '';

  const results = mockBooks.filter(
    (book) =>
      !query ||
      book.title.toLowerCase().includes(query.toLowerCase()) ||
      book.author.toLowerCase().includes(query.toLowerCase()) ||
      book.isbn.includes(query)
  );

  setTimeout(() => {
    res.json(results);
  }, 100);
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const book = mockBooks.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  setTimeout(() => {
    res.json(book);
  }, 200);
});

router.post('/', upload.single('cover'), (req: Request, res: Response) => {
  const { title, author, isbn, originalPrice, currentPrice, description, sellerId, sellerName } =
    req.body;

  const newBook: Book = {
    id: String(Date.now()),
    title,
    author,
    isbn,
    originalPrice: parseFloat(originalPrice),
    currentPrice: parseFloat(currentPrice),
    description,
    cover: req.file?.filename,
    seller: { id: sellerId, username: sellerName, rating: 0 },
    status: 'online',
    circulationCount: 0,
    circulationHistory: [],
  };

  mockBooks.push(newBook);
  res.status(201).json(newBook);
});

router.put('/:id/toggle-status', (req: Request, res: Response) => {
  const { id } = req.params;
  const book = mockBooks.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  book.status = book.status === 'online' ? 'offline' : 'online';
  res.json(book);
});

router.put('/:id', upload.single('cover'), (req: Request, res: Response) => {
  const { id } = req.params;
  const book = mockBooks.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const { title, author, isbn, originalPrice, currentPrice, description } = req.body;

  if (title) book.title = title;
  if (author) book.author = author;
  if (isbn) book.isbn = isbn;
  if (originalPrice) book.originalPrice = parseFloat(originalPrice);
  if (currentPrice) book.currentPrice = parseFloat(currentPrice);
  if (description) book.description = description;
  if (req.file?.filename) book.cover = req.file.filename;

  res.json(book);
});

export default router;
