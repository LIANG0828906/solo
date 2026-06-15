import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createJsonRepository } from '../utils/jsonFileRepository';

interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher: string;
  price: number;
  stock: number;
  coverUrl: string;
  description: string;
  category: string;
  createdAt: string;
}

const router = Router();
const bookRepo = createJsonRepository<Book>('books.json');

router.get('/', async (_req: Request, res: Response) => {
  try {
    const books = await bookRepo.read();
    res.json({ success: true, data: books });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取图书列表失败' });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string)?.toLowerCase() || '';
    const books = await bookRepo.read();
    const filtered = books.filter(
      book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query) ||
        book.isbn.includes(query)
    );
    res.json({ success: true, data: filtered });
  } catch (error) {
    res.status(500).json({ success: false, error: '搜索图书失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const book = await bookRepo.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, error: '图书不存在' });
    }
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取图书详情失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const newBook: Book = {
      id: uuidv4(),
      ...req.body,
      createdAt: new Date().toISOString(),
    };
    const book = await bookRepo.add(newBook);
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, error: '添加图书失败' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const book = await bookRepo.update(req.params.id, req.body);
    if (!book) {
      return res.status(404).json({ success: false, error: '图书不存在' });
    }
    res.json({ success: true, data: book });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新图书失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const removed = await bookRepo.remove(req.params.id);
    if (!removed) {
      return res.status(404).json({ success: false, error: '图书不存在' });
    }
    res.json({ success: true, data: { removed: true } });
  } catch (error) {
    res.status(500).json({ success: false, error: '删除图书失败' });
  }
});

export default router;
