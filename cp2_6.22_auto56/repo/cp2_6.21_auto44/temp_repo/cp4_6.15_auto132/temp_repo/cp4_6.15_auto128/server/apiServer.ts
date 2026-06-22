import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
import * as dataStore from '../src/utils/dataStore';
import {
  toPublicCardData,
  calculateAverageRating,
  createAnonymousComment,
  validateTitle,
  validateDescription,
  validateImageUrl,
  getClientIp,
} from './utils';
import {
  initWSServer,
  broadcastCardCreated,
  broadcastRatingUpdated,
  broadcastCommentAdded,
} from './wsServer';
import type {
  InspirationCard,
  Rating,
  Comment,
  PublicCardData,
} from '../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.get('/api/cards', (req, res) => {
  const clientIp = getClientIp(req);
  const allCards = dataStore.getAllCards();
  const publicCards: PublicCardData[] = allCards.map((card) =>
    toPublicCardData(card, clientIp)
  );
  res.json(publicCards);
});

app.get('/api/cards/leaderboard', (req, res) => {
  const clientIp = getClientIp(req);
  const allCards = dataStore.getAllCards();

  const sorted = [...allCards].sort((a, b) => {
    const avgA = calculateAverageRating(a.ratings);
    const avgB = calculateAverageRating(b.ratings);
    if (avgB !== avgA) return avgB - avgA;
    return b.createdAt - a.createdAt;
  });

  const top10 = sorted.slice(0, 10);
  const publicCards = top10.map((card) => toPublicCardData(card, clientIp));
  res.json(publicCards);
});

app.get('/api/cards/:id', (req, res) => {
  const { id } = req.params;
  const clientIp = getClientIp(req);
  const card = dataStore.getCardById(id);

  if (!card) {
    res.status(404).json({ error: '卡片不存在' });
    return;
  }

  res.json(toPublicCardData(card, clientIp));
});

app.post('/api/cards', (req, res) => {
  const { title, description, imageUrl } = req.body as {
    title?: string;
    description?: string;
    imageUrl?: string;
  };

  const titleCheck = validateTitle(title ?? '');
  if (!titleCheck.valid) {
    res.status(400).json({ error: titleCheck.error });
    return;
  }

  const descCheck = validateDescription(description ?? '');
  if (!descCheck.valid) {
    res.status(400).json({ error: descCheck.error });
    return;
  }

  const imgCheck = validateImageUrl(imageUrl ?? '');
  if (!imgCheck.valid) {
    res.status(400).json({ error: imgCheck.error });
    return;
  }

  const newCard: InspirationCard = {
    id: uuidv4(),
    title: title!.trim(),
    description: (description ?? '').trim(),
    imageUrl: imageUrl ? imageUrl.trim() : null,
    ratings: [],
    comments: [],
    createdAt: Date.now(),
  };

  dataStore.addCard(newCard);

  const clientIp = getClientIp(req);
  const publicCard = toPublicCardData(newCard, clientIp);
  broadcastCardCreated(publicCard);

  res.status(201).json(publicCard);
});

app.post('/api/cards/:id/rate', (req, res) => {
  const { id } = req.params;
  const { score } = req.body as { score?: number };
  const clientIp = getClientIp(req);

  if (typeof score !== 'number' || score < 1 || score > 5 || !Number.isInteger(score)) {
    res.status(400).json({ error: '评分必须是1-5的整数' });
    return;
  }

  const existingCard = dataStore.getCardById(id);
  if (!existingCard) {
    res.status(404).json({ error: '卡片不存在' });
    return;
  }

  const alreadyRated = existingCard.ratings.some((r) => r.ip === clientIp);
  if (alreadyRated) {
    res.status(409).json({ error: '您已经对该卡片评过分了' });
    return;
  }

  const newRating: Rating = {
    ip: clientIp,
    score,
    timestamp: Date.now(),
  };

  const updatedCard = dataStore.updateCard(id, (card) => ({
    ...card,
    ratings: [...card.ratings, newRating],
  }));

  if (!updatedCard) {
    res.status(500).json({ error: '评分失败' });
    return;
  }

  const avgRating = calculateAverageRating(updatedCard.ratings);
  broadcastRatingUpdated(id, avgRating, updatedCard.ratings.length);

  res.json({
    success: true,
    averageRating: avgRating,
    ratingCount: updatedCard.ratings.length,
  });
});

app.post('/api/cards/:id/comments', (req, res) => {
  const { id } = req.params;
  const { content } = req.body as { content?: string };

  if (!content || !content.trim()) {
    res.status(400).json({ error: '评论内容不能为空' });
    return;
  }

  if (content.length > 500) {
    res.status(400).json({ error: '评论最多500个字符' });
    return;
  }

  const existingCard = dataStore.getCardById(id);
  if (!existingCard) {
    res.status(404).json({ error: '卡片不存在' });
    return;
  }

  const commentMeta = createAnonymousComment(content.trim(), existingCard.comments.length);
  const newComment: Comment = {
    id: uuidv4(),
    ...commentMeta,
    timestamp: Date.now(),
  };

  const updatedCard = dataStore.updateCard(id, (card) => ({
    ...card,
    comments: [...card.comments, newComment],
  }));

  if (!updatedCard) {
    res.status(500).json({ error: '评论失败' });
    return;
  }

  broadcastCommentAdded(id, newComment, updatedCard.comments.length);

  res.status(201).json({
    success: true,
    comment: newComment,
    commentCount: updatedCard.comments.length,
  });
});

app.delete('/api/cards/:id', (req, res) => {
  const { id } = req.params;
  const deleted = dataStore.deleteCard(id);

  if (!deleted) {
    res.status(404).json({ error: '卡片不存在' });
    return;
  }

  res.json({ success: true });
});

app.use((_req, res) => {
  res.status(404).json({ error: '接口不存在' });
});

const httpServer = createServer(app);
initWSServer(httpServer);

httpServer.listen(PORT, () => {
  console.log(`[Server] API server running on http://localhost:${PORT}`);
  console.log(`[Server] WebSocket endpoint: ws://localhost:${PORT}/ws`);
});

export default app;
