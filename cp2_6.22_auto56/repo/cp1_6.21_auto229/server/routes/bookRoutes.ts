import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  coverUrl: string;
  publishYear: number;
  status: 'reading' | 'read' | 'want' | '';
  rating: number;
  tags: string[];
  addedAt: string;
}

const books: Map<string, Book> = new Map();

function initSampleData() {
  const samples: Omit<Book, 'id' | 'addedAt'>[] = [
    { title: '三体', author: '刘慈欣', isbn: '9787536692930', coverUrl: 'https://trae-api-cn.mchont.guru/api/ide/v1/text_to_image?prompt=Three%20Body%20Problem%20book%20cover%20dark%20sci%20fi&image_size=square', publishYear: 2008, status: 'read', rating: 5, tags: ['科幻', '已读'] },
    { title: '活着', author: '余华', isbn: '9787506365437', coverUrl: 'https://trae-api-cn.mchont.guru/api/ide/v1/text_to_image?prompt=To%20Live%20novel%20book%20cover%20simple&image_size=square', publishYear: 1993, status: 'read', rating: 4, tags: ['文学', '已读'] },
    { title: '百年孤独', author: '加西亚·马尔克斯', isbn: '9787544253994', coverUrl: 'https://trae-api-cn.mchont.guru/api/ide/v1/text_to_image?prompt=One%20Hundred%20Years%20of%20Solitude%20book%20cover&image_size=square', publishYear: 1967, status: 'want', rating: 0, tags: ['文学', '想读'] },
    { title: '银河帝国：基地', author: '艾萨克·阿西莫夫', isbn: '9787536488787', coverUrl: 'https://trae-api-cn.mchont.guru/api/ide/v1/text_to_image?prompt=Foundation%20Asimov%20sci%20fi%20book%20cover&image_size=square', publishYear: 1951, status: 'reading', rating: 0, tags: ['科幻', '在读'] },
    { title: '小王子', author: '安托万·德·圣埃克苏佩里', isbn: '9787020042494', coverUrl: 'https://trae-api-cn.mchont.guru/api/ide/v1/text_to_image?prompt=Little%20Prince%20book%20cover%20stars&image_size=square', publishYear: 1943, status: 'read', rating: 5, tags: ['童话', '已读'] },
  ];
  const dates = ['2025-01-15', '2025-02-20', '2025-03-10', '2025-04-05', '2025-05-18'];
  samples.forEach((s, i) => {
    const id = uuidv4();
    books.set(id, { ...s, id, addedAt: dates[i] });
  });
}
initSampleData();

router.get('/', (_req: Request, res: Response) => {
  const all = Array.from(books.values());
  res.json(all);
});

router.get('/:id', (req: Request, res: Response) => {
  const book = books.get(req.params.id);
  if (!book) { res.status(404).json({ error: '书籍未找到' }); return; }
  res.json(book);
});

router.post('/', (req: Request, res: Response) => {
  const { title, author, isbn, coverUrl, publishYear } = req.body;
  if (!title) { res.status(400).json({ error: '书名不能为空' }); return; }
  const id = uuidv4();
  const book: Book = {
    id, title, author: author || '', isbn: isbn || '',
    coverUrl: coverUrl || '', publishYear: publishYear || 0,
    status: '', rating: 0, tags: [], addedAt: new Date().toISOString().split('T')[0],
  };
  books.set(id, book);
  res.status(201).json(book);
});

router.put('/:id', (req: Request, res: Response) => {
  const book = books.get(req.params.id);
  if (!book) { res.status(404).json({ error: '书籍未找到' }); return; }
  const { status, rating, tags } = req.body;
  if (status !== undefined) book.status = status;
  if (rating !== undefined) book.rating = rating;
  if (tags !== undefined) book.tags = tags;
  books.set(req.params.id, book);
  res.json(book);
});

router.delete('/:id', (req: Request, res: Response) => {
  const deleted = books.delete(req.params.id);
  if (!deleted) { res.status(404).json({ error: '书籍未找到' }); return; }
  res.json({ success: true });
});

export default router;
