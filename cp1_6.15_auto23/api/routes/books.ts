import { Router } from 'express';
import type { Request, Response } from 'express';
import { dataStore } from '../models/dataStore.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const books = dataStore.getBooks();
  const enriched = books.map(b => ({
    ...b,
    readersCount: b.readerIds.length,
  }));
  res.json({ success: true, data: enriched });
});

router.post('/', (req: Request, res: Response) => {
  const { title, author, coverUrl, description, isbn, totalChapters } = req.body;
  if (!title || !author) {
    res.status(400).json({ success: false, error: '书名和作者为必填项' });
    return;
  }
  const book = dataStore.addBook({
    title,
    author,
    coverUrl: coverUrl || '',
    description: description || '',
    isbn: isbn || '',
    totalChapters: totalChapters || 20,
  });
  res.status(201).json({ success: true, data: { ...book, readersCount: 1 } });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const book = dataStore.getBook(id);
  if (!book) {
    res.status(404).json({ success: false, error: '书籍不存在' });
    return;
  }
  const readers = dataStore.getBookReaders(id);
  const progress = dataStore.getBookProgress(id);
  const checkIns = dataStore.getBookCheckIns(id);
  const topics = dataStore.getBookTopics(id).map(t => {
    const { replies, ...rest } = t;
    return rest;
  });
  res.json({
    success: true,
    data: {
      ...book,
      readers,
      progress,
      checkIns,
      topics,
      readersCount: readers.length,
    },
  });
});

router.get('/:id/progress', (req: Request, res: Response) => {
  const { id } = req.params;
  const book = dataStore.getBook(id);
  if (!book) {
    res.status(404).json({ success: false, error: '书籍不存在' });
    return;
  }
  const progress = dataStore.getBookProgress(id).map(p => {
    const member = dataStore.getMember(p.memberId);
    return { ...p, member };
  });
  res.json({ success: true, data: progress });
});

router.post('/:id/progress', (req: Request, res: Response) => {
  const { id } = req.params;
  const { memberId, currentChapter, status } = req.body;
  const book = dataStore.getBook(id);
  if (!book) {
    res.status(404).json({ success: false, error: '书籍不存在' });
    return;
  }
  if (!memberId || currentChapter == null) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const progress = dataStore.updateOrCreateProgress({
    memberId,
    bookId: id,
    currentChapter,
    totalChapters: book.totalChapters,
    status: status || (currentChapter === 0 ? 'not_started' : currentChapter >= book.totalChapters ? 'completed' : 'reading'),
  });
  res.json({ success: true, data: progress });
});

router.get('/:id/checkins', (req: Request, res: Response) => {
  const { id } = req.params;
  const book = dataStore.getBook(id);
  if (!book) {
    res.status(404).json({ success: false, error: '书籍不存在' });
    return;
  }
  const checkIns = dataStore.getBookCheckIns(id).map(c => ({
    ...c,
    member: dataStore.getMember(c.memberId),
  }));
  res.json({ success: true, data: checkIns });
});

router.post('/:id/checkins', (req: Request, res: Response) => {
  const { id } = req.params;
  const { memberId, chapter, thought } = req.body;
  const book = dataStore.getBook(id);
  if (!book) {
    res.status(404).json({ success: false, error: '书籍不存在' });
    return;
  }
  if (!memberId || chapter == null) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const checkIn = dataStore.addCheckIn({
    memberId,
    bookId: id,
    chapter,
    thought: thought || '',
  });
  const member = dataStore.getMember(memberId);
  res.status(201).json({ success: true, data: { ...checkIn, member } });
});

export default router;
