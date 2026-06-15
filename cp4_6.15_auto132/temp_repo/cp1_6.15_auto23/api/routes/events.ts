import { Router } from 'express';
import type { Request, Response } from 'express';
import { dataStore } from '../models/dataStore.js';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const events = dataStore.getEvents().map(e => {
    const book = dataStore.getBook(e.bookId);
    const votes = dataStore.getEventVotes(e.id) || [];
    return { ...e, book, voteResults: votes };
  });
  res.json({ success: true, data: events });
});

router.post('/', (req: Request, res: Response) => {
  const { bookId, chapterRange, suggestedTime, status, timeOptions } = req.body;
  if (!bookId || !chapterRange || !suggestedTime || !timeOptions) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const event = dataStore.addEvent({
    bookId,
    chapterRange,
    suggestedTime,
    status: status || 'suggested',
    timeOptions,
  });
  res.status(201).json({ success: true, data: event });
});

router.put('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const event = dataStore.updateEvent(id, req.body);
  if (!event) {
    res.status(404).json({ success: false, error: '活动不存在' });
    return;
  }
  res.json({ success: true, data: event });
});

router.get('/:id/votes', (req: Request, res: Response) => {
  const { id } = req.params;
  const results = dataStore.getEventVotes(id);
  if (!results) {
    res.status(404).json({ success: false, error: '活动不存在' });
    return;
  }
  res.json({ success: true, data: results });
});

router.post('/:id/votes', (req: Request, res: Response) => {
  const { id } = req.params;
  const { memberId, timeOption } = req.body;
  if (!memberId || !timeOption) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const vote = dataStore.addVote(id, memberId, timeOption);
  if (!vote) {
    res.status(404).json({ success: false, error: '活动不存在' });
    return;
  }
  const results = dataStore.getEventVotes(id);
  res.json({ success: true, data: { vote, results } });
});

export default router;
