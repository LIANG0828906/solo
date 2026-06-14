import { Router } from 'express';
import type { Request, Response } from 'express';
import { dataStore } from '../models/dataStore.js';

const router = Router();

router.get('/book/:bookId', (req: Request, res: Response) => {
  const { bookId } = req.params;
  const topics = dataStore.getBookTopics(bookId).map(t => {
    const creator = dataStore.getMember(t.creatorId);
    return { ...t, creator };
  });
  res.json({ success: true, data: topics });
});

router.post('/book/:bookId', (req: Request, res: Response) => {
  const { bookId } = req.params;
  const { title, creatorId } = req.body;
  if (!title || !creatorId) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const topic = dataStore.addTopic({
    bookId,
    title,
    creatorId,
  });
  const creator = dataStore.getMember(creatorId);
  res.status(201).json({ success: true, data: { ...topic, creator } });
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const topic = dataStore.getTopic(id);
  if (!topic) {
    res.status(404).json({ success: false, error: '话题不存在' });
    return;
  }
  const creator = dataStore.getMember(topic.creatorId);
  const replyDetails = topic.replies.map(r => {
    const member = dataStore.getMember(r.memberId);
    const mentions = r.mentionIds.map(mid => dataStore.getMember(mid)).filter(Boolean);
    return { ...r, member, mentions };
  });
  res.json({ success: true, data: { ...topic, creator, replyDetails } });
});

router.post('/:id/replies', (req: Request, res: Response) => {
  const { id } = req.params;
  const { memberId, content, mentionIds } = req.body;
  if (!memberId || !content) {
    res.status(400).json({ success: false, error: '缺少必要参数' });
    return;
  }
  const topic = dataStore.getTopic(id);
  if (!topic) {
    res.status(404).json({ success: false, error: '话题不存在' });
    return;
  }
  const reply = dataStore.addReply({
    topicId: id,
    memberId,
    content,
    mentionIds: mentionIds || [],
  });
  const member = dataStore.getMember(memberId);
  const mentions = (mentionIds || []).map((mid: string) => dataStore.getMember(mid)).filter(Boolean);
  res.status(201).json({ success: true, data: { ...reply, member, mentions } });
});

export default router;
