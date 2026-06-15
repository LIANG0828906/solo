import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { createJsonRepository } from '../utils/jsonFileRepository';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
}

interface Borrow {
  id: string;
  userId: string;
  bookId: string;
  book: Book;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'borrowed' | 'returned' | 'overdue';
  lateFee: number;
}

const router = Router();
const borrowRepo = createJsonRepository<Borrow>('borrows.json');

const calculateLateFee = (dueDate: string, returnDate: string): number => {
  const due = new Date(dueDate);
  const returned = new Date(returnDate);
  const diffDays = Math.ceil((returned.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays) * 0.5;
};

const updateOverdueStatus = (borrow: Borrow): Borrow => {
  if (borrow.status === 'returned') return borrow;
  const now = new Date();
  const due = new Date(borrow.dueDate);
  if (now > due) {
    const lateFee = calculateLateFee(borrow.dueDate, now.toISOString());
    return { ...borrow, status: 'overdue', lateFee };
  }
  return borrow;
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const borrows = await borrowRepo.read();
    const userBorrows = borrows.filter(b => b.userId === userId).map(updateOverdueStatus);
    res.json({ success: true, data: userBorrows });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取借阅列表失败' });
  }
});

router.get('/admin', async (_req: Request, res: Response) => {
  try {
    const borrows = await borrowRepo.read();
    const updatedBorrows = borrows.map(updateOverdueStatus);
    res.json({ success: true, data: updatedBorrows });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取借阅列表失败' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, bookId, book } = req.body;
    
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const newBorrow: Borrow = {
      id: uuidv4(),
      userId,
      bookId,
      book,
      borrowDate: borrowDate.toISOString(),
      dueDate: dueDate.toISOString(),
      status: 'borrowed',
      lateFee: 0,
    };
    
    const borrow = await borrowRepo.add(newBorrow);
    res.json({ success: true, data: borrow });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建借阅记录失败' });
  }
});

router.put('/:id/renew', async (req: Request, res: Response) => {
  try {
    const borrow = await borrowRepo.findById(req.params.id);
    if (!borrow) {
      return res.status(404).json({ success: false, error: '借阅记录不存在' });
    }
    
    const currentDueDate = new Date(borrow.dueDate);
    const newDueDate = new Date(currentDueDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const updated = await borrowRepo.update(req.params.id, {
      dueDate: newDueDate.toISOString(),
      status: 'borrowed',
      lateFee: 0,
    });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: '续借失败' });
  }
});

router.put('/:id/return', async (req: Request, res: Response) => {
  try {
    const borrow = await borrowRepo.findById(req.params.id);
    if (!borrow) {
      return res.status(404).json({ success: false, error: '借阅记录不存在' });
    }
    
    const returnDate = new Date().toISOString();
    const lateFee = calculateLateFee(borrow.dueDate, returnDate);
    
    const updated = await borrowRepo.update(req.params.id, {
      returnDate,
      status: 'returned',
      lateFee,
    });
    
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: '归还失败' });
  }
});

export default router;
