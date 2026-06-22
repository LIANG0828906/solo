import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface Book {
  id: string;
  title: string;
  author: string;
  category: '小说' | '科普' | '历史' | '哲学' | '艺术' | '其他';
  startDate: string;
  endDate: string;
  rating: number;
  review: string;
}

const books: Book[] = [
  {
    id: uuidv4(),
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    category: '小说',
    startDate: '2026-01-10',
    endDate: '2026-02-15',
    rating: 5,
    review: '魔幻现实主义的巅峰之作，布恩迪亚家族的百年兴衰令人叹为观止。',
  },
  {
    id: uuidv4(),
    title: '时间简史',
    author: '史蒂芬·霍金',
    category: '科普',
    startDate: '2026-03-01',
    endDate: '2026-03-28',
    rating: 4,
    review: '深入浅出地讲解了宇宙的起源和时间的本质，虽然有些地方还是不太懂。',
  },
  {
    id: uuidv4(),
    title: '万历十五年',
    author: '黄仁宇',
    category: '历史',
    startDate: '2026-04-05',
    endDate: '2026-04-30',
    rating: 5,
    review: '大历史观的独特视角，从一个看似平淡的年份看明朝的兴衰。',
  },
  {
    id: uuidv4(),
    title: '活着',
    author: '余华',
    category: '小说',
    startDate: '2026-05-10',
    endDate: '2026-05-20',
    rating: 5,
    review: '福贵的一生让人动容，活着本身就是最大的意义。',
  },
  {
    id: uuidv4(),
    title: '苏菲的世界',
    author: '乔斯坦·贾德',
    category: '哲学',
    startDate: '2026-02-01',
    endDate: '2026-02-28',
    rating: 4,
    review: '哲学入门的绝佳读物，以小说的形式讲述西方哲学史。',
  },
  {
    id: uuidv4(),
    title: '艺术的故事',
    author: '贡布里希',
    category: '艺术',
    startDate: '2026-01-15',
    endDate: '2026-02-20',
    rating: 5,
    review: '从史前洞穴壁画到现代艺术，全面而生动地讲述了艺术发展的历程。',
  },
  {
    id: uuidv4(),
    title: '三体',
    author: '刘慈欣',
    category: '小说',
    startDate: '2026-03-10',
    endDate: '2026-04-10',
    rating: 5,
    review: '中国科幻的里程碑，黑暗森林法则让人细思极恐。',
  },
  {
    id: uuidv4(),
    title: '自私的基因',
    author: '理查德·道金斯',
    category: '科普',
    startDate: '2026-04-15',
    endDate: '2026-05-10',
    rating: 4,
    review: '从基因的角度重新理解生命的本质，观点震撼。',
  },
  {
    id: uuidv4(),
    title: '明朝那些事儿',
    author: '当年明月',
    category: '历史',
    startDate: '2026-05-15',
    endDate: '2026-06-10',
    rating: 4,
    review: '用通俗的语言讲述明朝历史，让历史变得有趣好读。',
  },
  {
    id: uuidv4(),
    title: '追风筝的人',
    author: '卡勒德·胡赛尼',
    category: '其他',
    startDate: '2026-06-01',
    endDate: '2026-06-15',
    rating: 5,
    review: '关于救赎和友情的故事，那句"为你，千千万万遍"让人泪目。',
  },
];

router.get('/books', (req: Request, res: Response) => {
  const { q } = req.query;

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    const filtered = books.filter(
      (book) =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
    );
    return res.json(filtered);
  }

  res.json(books);
});

router.post('/books', (req: Request, res: Response) => {
  const { title, author, category, startDate, endDate, rating, review } = req.body;

  if (!title || !author) {
    return res.status(400).json({ error: '书名和作者是必填项' });
  }

  const newBook: Book = {
    id: uuidv4(),
    title,
    author,
    category: category || '其他',
    startDate: startDate || '',
    endDate: endDate || '',
    rating: rating || 0,
    review: review || '',
  };

  books.unshift(newBook);
  res.status(201).json(newBook);
});

router.get('/books/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const book = books.find((b) => b.id === id);

  if (!book) {
    return res.status(404).json({ error: '书籍不存在' });
  }

  res.json(book);
});

export default router;
