import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

interface BookList {
  id: string;
  name: string;
  description: string;
  bookIds: string[];
  createdAt: string;
}

interface BorrowRecord {
  id: string;
  bookId: string;
  borrowerName: string;
  borrowDate: string;
  expectedReturnDate: string;
  actualReturnDate: string | null;
  returned: boolean;
}

const lists: Map<string, BookList> = new Map();
const borrows: Map<string, BorrowRecord> = new Map();

function initSampleData() {
  const l1id = uuidv4();
  lists.set(l1id, {
    id: l1id, name: '待读清单', description: '想要阅读的书籍',
    bookIds: [], createdAt: '2025-01-01',
  });
  const l2id = uuidv4();
  lists.set(l2id, {
    id: l2id, name: '已读佳作', description: '已经读完的好书',
    bookIds: [], createdAt: '2025-01-01',
  });
  const l3id = uuidv4();
  lists.set(l3id, {
    id: l3id, name: '科幻专辑', description: '科幻类书籍收藏',
    bookIds: [], createdAt: '2025-02-15',
  });

  const bid1 = uuidv4();
  borrows.set(bid1, {
    id: bid1, bookId: '', borrowerName: '张三',
    borrowDate: '2025-04-10', expectedReturnDate: '2025-05-10',
    actualReturnDate: '2025-05-08', returned: true,
  });
}
initSampleData();

router.get('/lists', (_req: Request, res: Response) => {
  res.json(Array.from(lists.values()));
});

router.post('/lists', (req: Request, res: Response) => {
  const { name, description } = req.body;
  if (!name) { res.status(400).json({ error: '书单名称不能为空' }); return; }
  const id = uuidv4();
  const list: BookList = {
    id, name, description: description || '',
    bookIds: [], createdAt: new Date().toISOString().split('T')[0],
  };
  lists.set(id, list);
  res.status(201).json(list);
});

router.put('/lists/:id', (req: Request, res: Response) => {
  const list = lists.get(req.params.id);
  if (!list) { res.status(404).json({ error: '书单未找到' }); return; }
  const { name, description, bookIds } = req.body;
  if (name !== undefined) list.name = name;
  if (description !== undefined) list.description = description;
  if (bookIds !== undefined) list.bookIds = bookIds;
  lists.set(req.params.id, list);
  res.json(list);
});

router.delete('/lists/:id', (req: Request, res: Response) => {
  const deleted = lists.delete(req.params.id);
  if (!deleted) { res.status(404).json({ error: '书单未找到' }); return; }
  res.json({ success: true });
});

router.post('/lists/:id/books', (req: Request, res: Response) => {
  const list = lists.get(req.params.id);
  if (!list) { res.status(404).json({ error: '书单未找到' }); return; }
  const { bookId } = req.body;
  if (!bookId) { res.status(400).json({ error: '书籍ID不能为空' }); return; }
  if (!list.bookIds.includes(bookId)) list.bookIds.push(bookId);
  lists.set(req.params.id, list);
  res.json(list);
});

router.delete('/lists/:id/books/:bookId', (req: Request, res: Response) => {
  const list = lists.get(req.params.id);
  if (!list) { res.status(404).json({ error: '书单未找到' }); return; }
  list.bookIds = list.bookIds.filter(bid => bid !== req.params.bookId);
  lists.set(req.params.id, list);
  res.json(list);
});

router.put('/lists/:id/books/reorder', (req: Request, res: Response) => {
  const list = lists.get(req.params.id);
  if (!list) { res.status(404).json({ error: '书单未找到' }); return; }
  const { bookIds } = req.body;
  if (!Array.isArray(bookIds)) { res.status(400).json({ error: 'bookIds必须为数组' }); return; }
  list.bookIds = bookIds;
  lists.set(req.params.id, list);
  res.json(list);
});

router.get('/borrows', (_req: Request, res: Response) => {
  res.json(Array.from(borrows.values()));
});

router.post('/borrows', (req: Request, res: Response) => {
  const { bookId, borrowerName, borrowDate, expectedReturnDate } = req.body;
  if (!bookId || !borrowerName) { res.status(400).json({ error: '缺少必要字段' }); return; }
  const id = uuidv4();
  const record: BorrowRecord = {
    id, bookId, borrowerName,
    borrowDate: borrowDate || new Date().toISOString().split('T')[0],
    expectedReturnDate: expectedReturnDate || '',
    actualReturnDate: null, returned: false,
  };
  borrows.set(id, record);
  res.status(201).json(record);
});

router.put('/borrows/:id/return', (req: Request, res: Response) => {
  const record = borrows.get(req.params.id);
  if (!record) { res.status(404).json({ error: '借还记录未找到' }); return; }
  record.returned = true;
  record.actualReturnDate = new Date().toISOString().split('T')[0];
  borrows.set(req.params.id, record);
  res.json(record);
});

router.get('/borrows/book/:bookId', (req: Request, res: Response) => {
  const history = Array.from(borrows.values()).filter(b => b.bookId === req.params.bookId);
  res.json(history);
});

router.get('/stats', (_req: Request, res: Response) => {
  res.json({ totalRequests: borrows.size, totalLists: lists.size });
});

export default router;
