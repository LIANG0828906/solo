import express from 'express';
import cors from 'cors';
import { JSONFilePreset } from 'lowdb/node';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type Category = 'programming' | 'history' | 'life' | 'other';
type ReviewInterval = 1 | 3 | 7 | 14 | 30;
type MemoryLevel = 'forgot' | 'hard' | 'normal' | 'easy';
type LinkType = 'same-category' | 'cross-category' | 'manual';

interface Card {
  id: string;
  title: string;
  category: Category;
  content: string;
  reviewInterval: ReviewInterval;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  linkedCardIds: string[];
}

interface CardLink {
  id: string;
  sourceId: string;
  targetId: string;
  type: LinkType;
  createdAt: string;
}

interface DbSchema {
  cards: Card[];
  links: CardLink[];
}

const defaultData: DbSchema = { cards: [], links: [] };

const dbPath = path.join(__dirname, 'db.json');

const VALID_INTERVALS: ReviewInterval[] = [1, 3, 7, 14, 30];

function calculateNextInterval(currentInterval: number, memoryLevel: MemoryLevel): ReviewInterval {
  const multiplier: Record<MemoryLevel, number> = {
    forgot: 0.5,
    hard: 0.8,
    normal: 1.0,
    easy: 1.5,
  };
  const newInterval = Math.round(currentInterval * multiplier[memoryLevel]);
  return VALID_INTERVALS.reduce((prev, curr) =>
    Math.abs(curr - newInterval) < Math.abs(prev - newInterval) ? curr : prev
  );
}

function determineLinkType(sourceCategory: Category, targetCategory: Category): LinkType {
  if (sourceCategory === targetCategory) return 'same-category';
  return 'cross-category';
}

async function main() {
  const db = await JSONFilePreset<DbSchema>(dbPath, defaultData);

  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/api/cards', (req, res) => {
    const { search, category } = req.query;
    let cards = db.data.cards;
    if (category && category !== 'all') {
      cards = cards.filter((c) => c.category === category);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      cards = cards.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q)
      );
    }
    res.json({ success: true, data: cards });
  });

  app.get('/api/cards/due/today', (_req, res) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dueCards = db.data.cards.filter((c) => {
      const nextReview = new Date(c.nextReviewAt);
      nextReview.setHours(0, 0, 0, 0);
      return nextReview <= now;
    });
    res.json({ success: true, data: dueCards });
  });

  app.get('/api/cards/:id', (req, res) => {
    const card = db.data.cards.find((c) => c.id === req.params.id);
    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }
    res.json({ success: true, data: card });
  });

  app.post('/api/cards', async (req, res) => {
    const { title, category, content, reviewInterval, linkedCardIds } = req.body;
    if (!title || !category || !content) {
      res.status(400).json({ success: false, error: 'Title, category, and content are required' });
      return;
    }
    const now = new Date().toISOString();
    const interval: ReviewInterval = reviewInterval || 1;
    const card: Card = {
      id: uuidv4(),
      title,
      category,
      content,
      reviewInterval: interval,
      lastReviewedAt: null,
      nextReviewAt: new Date(Date.now() + interval * 86400000).toISOString(),
      reviewCount: 0,
      createdAt: now,
      updatedAt: now,
      linkedCardIds: linkedCardIds || [],
    };
    db.data.cards.push(card);

    for (const targetId of card.linkedCardIds) {
      const targetCard = db.data.cards.find((c) => c.id === targetId);
      if (targetCard) {
        const link: CardLink = {
          id: uuidv4(),
          sourceId: card.id,
          targetId,
          type: determineLinkType(card.category, targetCard.category),
          createdAt: now,
        };
        db.data.links.push(link);
        if (!targetCard.linkedCardIds.includes(card.id)) {
          targetCard.linkedCardIds.push(card.id);
        }
      }
    }

    await db.write();
    res.status(201).json({ success: true, data: card });
  });

  app.put('/api/cards/:id', async (req, res) => {
    const idx = db.data.cards.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }
    const card = db.data.cards[idx];
    const { title, category, content, reviewInterval, linkedCardIds } = req.body;
    const now = new Date().toISOString();

    if (title !== undefined) card.title = title;
    if (category !== undefined) card.category = category;
    if (content !== undefined) card.content = content;
    if (reviewInterval !== undefined) card.reviewInterval = reviewInterval;
    card.updatedAt = now;

    if (linkedCardIds !== undefined) {
      const removedIds = card.linkedCardIds.filter((id) => !linkedCardIds.includes(id));
      const addedIds = linkedCardIds.filter((id: string) => !card.linkedCardIds.includes(id));

      for (const removedId of removedIds) {
        db.data.links = db.data.links.filter(
          (l) => !((l.sourceId === card.id && l.targetId === removedId) || (l.sourceId === removedId && l.targetId === card.id))
        );
        const targetCard = db.data.cards.find((c) => c.id === removedId);
        if (targetCard) {
          targetCard.linkedCardIds = targetCard.linkedCardIds.filter((id) => id !== card.id);
        }
      }

      for (const addedId of addedIds) {
        const targetCard = db.data.cards.find((c) => c.id === addedId);
        if (targetCard) {
          const link: CardLink = {
            id: uuidv4(),
            sourceId: card.id,
            targetId: addedId,
            type: determineLinkType(card.category, targetCard.category),
            createdAt: now,
          };
          db.data.links.push(link);
          if (!targetCard.linkedCardIds.includes(card.id)) {
            targetCard.linkedCardIds.push(card.id);
          }
        }
      }
      card.linkedCardIds = linkedCardIds;
    }

    await db.write();
    res.json({ success: true, data: card });
  });

  app.delete('/api/cards/:id', async (req, res) => {
    const idx = db.data.cards.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }
    const cardId = req.params.id;
    db.data.cards.splice(idx, 1);
    db.data.links = db.data.links.filter(
      (l) => l.sourceId !== cardId && l.targetId !== cardId
    );
    for (const c of db.data.cards) {
      c.linkedCardIds = c.linkedCardIds.filter((id) => id !== cardId);
    }
    await db.write();
    res.json({ success: true });
  });

  app.put('/api/cards/:id/review', async (req, res) => {
    const idx = db.data.cards.findIndex((c) => c.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }
    const { memoryLevel } = req.body as { memoryLevel: MemoryLevel };
    if (!memoryLevel) {
      res.status(400).json({ success: false, error: 'memoryLevel is required' });
      return;
    }
    const card = db.data.cards[idx];
    const now = new Date();
    const newInterval = calculateNextInterval(card.reviewInterval, memoryLevel);
    card.reviewInterval = newInterval;
    card.lastReviewedAt = now.toISOString();
    card.nextReviewAt = new Date(now.getTime() + newInterval * 86400000).toISOString();
    card.reviewCount += 1;
    card.updatedAt = now.toISOString();
    await db.write();
    res.json({ success: true, data: card });
  });

  app.post('/api/cards/:id/links', async (req, res) => {
    const card = db.data.cards.find((c) => c.id === req.params.id);
    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }
    const { targetCardId } = req.body;
    if (!targetCardId) {
      res.status(400).json({ success: false, error: 'targetCardId is required' });
      return;
    }
    const targetCard = db.data.cards.find((c) => c.id === targetCardId);
    if (!targetCard) {
      res.status(404).json({ success: false, error: 'Target card not found' });
      return;
    }
    if (card.linkedCardIds.includes(targetCardId)) {
      res.status(400).json({ success: false, error: 'Link already exists' });
      return;
    }
    const now = new Date().toISOString();
    const link: CardLink = {
      id: uuidv4(),
      sourceId: card.id,
      targetId,
      type: determineLinkType(card.category, targetCard.category),
      createdAt: now,
    };
    db.data.links.push(link);
    card.linkedCardIds.push(targetCardId);
    if (!targetCard.linkedCardIds.includes(card.id)) {
      targetCard.linkedCardIds.push(card.id);
    }
    await db.write();
    res.status(201).json({ success: true, data: link });
  });

  app.delete('/api/cards/:id/links/:targetId', async (req, res) => {
    const card = db.data.cards.find((c) => c.id === req.params.id);
    if (!card) {
      res.status(404).json({ success: false, error: 'Card not found' });
      return;
    }
    const targetId = req.params.targetId;
    db.data.links = db.data.links.filter(
      (l) => !((l.sourceId === card.id && l.targetId === targetId) || (l.sourceId === targetId && l.targetId === card.id))
    );
    card.linkedCardIds = card.linkedCardIds.filter((id) => id !== targetId);
    const targetCard = db.data.cards.find((c) => c.id === targetId);
    if (targetCard) {
      targetCard.linkedCardIds = targetCard.linkedCardIds.filter((id) => id !== card.id);
    }
    await db.write();
    res.json({ success: true });
  });

  app.get('/api/cards/links/graph', (_req, res) => {
    const nodes = db.data.cards.map((card) => ({
      id: card.id,
      title: card.title,
      category: card.category,
      linkCount: card.linkedCardIds.length,
    }));
    const links = db.data.links.map((link) => ({
      source: link.sourceId,
      target: link.targetId,
      type: link.type,
      value: link.type === 'same-category' ? 3 : link.type === 'manual' ? 2 : 1,
    }));
    res.json({ success: true, data: { nodes, links } });
  });

  const PORT = 3001;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
