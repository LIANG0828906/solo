import { Router, Request, Response } from 'express';
import { store } from '../store';
import type { Book } from '../../../shared/types';

const router = Router();

type SSEChannel = {
  send: (data: any, event?: string, id?: string) => void;
};

let sseChannel: SSEChannel | null = null;

export const setInventorySSEChannel = (channel: SSEChannel): void => {
  sseChannel = channel;
};

const broadcastInventoryUpdate = (data: Book | Book[]): void => {
  if (sseChannel) {
    sseChannel.send(
      {
        type: 'inventory_update',
        timestamp: Date.now(),
        data,
      },
      'inventory_update'
    );
  }
};

router.post('/', (req: Request, res: Response): void => {
  try {
    const { title, author, isbn, price, stock, coverUrl, isActive } = req.body;

    if (!title || !author || !isbn || price === undefined || stock === undefined) {
      res.status(400).json({ error: '缺少必填字段' });
      return;
    }

    const newBook = store.addBook({
      title,
      author,
      isbn,
      price: Number(price),
      stock: Number(stock),
      coverUrl: coverUrl || '',
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    broadcastInventoryUpdate(newBook);
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: '创建图书失败' });
  }
});

router.get('/', (_req: Request, res: Response): void => {
  try {
    const books = store.getBooks();
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: '获取图书列表失败' });
  }
});

router.put('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const existingBook = store.getBookById(id);

    if (!existingBook) {
      res.status(404).json({ error: '图书不存在' });
      return;
    }

    const updates: Partial<Book> = {};
    const allowedFields: (keyof Book)[] = ['title', 'author', 'isbn', 'price', 'stock', 'coverUrl', 'isActive'];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'price' || field === 'stock') {
          (updates as any)[field] = Number(req.body[field]);
        } else if (field === 'isActive') {
          (updates as any)[field] = Boolean(req.body[field]);
        } else {
          (updates as any)[field] = req.body[field];
        }
      }
    }

    const updatedBook = store.updateBook(id, updates);
    if (updatedBook) {
      broadcastInventoryUpdate(updatedBook);
      res.json(updatedBook);
    } else {
      res.status(404).json({ error: '图书不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: '更新图书失败' });
  }
});

router.delete('/:id', (req: Request, res: Response): void => {
  try {
    const { id } = req.params;
    const deleted = store.deleteBook(id);

    if (deleted) {
      broadcastInventoryUpdate(store.getBooks());
      res.status(204).send();
    } else {
      res.status(404).json({ error: '图书不存在' });
    }
  } catch (error) {
    res.status(500).json({ error: '删除图书失败' });
  }
});

export default router;
