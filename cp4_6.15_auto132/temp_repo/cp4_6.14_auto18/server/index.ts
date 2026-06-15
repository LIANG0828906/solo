import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

type Difficulty = 'easy' | 'medium' | 'hard';

interface ReviewRecord {
  date: string;
  difficulty: Difficulty;
  score: number;
}

interface Card {
  id: string;
  front: string;
  back: string;
  tags: string[];
  initialDifficulty: Difficulty;
  currentInterval: number;
  nextReviewDate: string;
  reviewHistory: ReviewRecord[];
  createdAt: string;
}

interface ReviewStats {
  todayReviewed: number;
  averageRecallScore: number;
  dueCardsCount: number;
  dailyReviewCounts: { date: string; count: number }[];
}

const BASE_INTERVAL = 1.5;

function getInitialInterval(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 1;
    case 'medium':
      return 1.5;
    case 'hard':
      return 2;
    default:
      return 1;
  }
}

function calculateNextInterval(
  currentInterval: number,
  difficulty: Difficulty,
  initialDifficulty: Difficulty
): number {
  const initialInterval = getInitialInterval(initialDifficulty);
  
  switch (difficulty) {
    case 'easy':
      return Math.max(currentInterval * 2, initialInterval * BASE_INTERVAL);
    case 'medium':
      return Math.max(currentInterval * BASE_INTERVAL, initialInterval);
    case 'hard':
      return initialInterval;
    default:
      return initialInterval;
  }
}

function getDifficultyScore(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 5;
    case 'medium':
      return 3;
    case 'hard':
      return 1;
    default:
      return 3;
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + Math.ceil(days));
  return result;
}

function isOverdue(nextReviewDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reviewDate = new Date(nextReviewDate);
  reviewDate.setHours(0, 0, 0, 0);
  return reviewDate < today;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, '..', 'data', 'cards.json');

app.use(cors());
app.use(express.json());

function ensureDataFileExists(): void {
  const dataDir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2));
  }
}

function readCards(): Card[] {
  ensureDataFileExists();
  try {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data) as Card[];
  } catch {
    return [];
  }
}

function writeCards(cards: Card[]): void {
  ensureDataFileExists();
  fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2));
}

function getTodayDateString(): string {
  return formatDate(new Date());
}

function getPast7Days(): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    dates.push(formatDate(date));
  }
  return dates;
}

app.get('/api/cards', (_req, res) => {
  try {
    const cards = readCards();
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read cards' });
  }
});

app.get('/api/cards/due', (_req, res) => {
  try {
    const cards = readCards();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueCards = cards.filter(card => {
      const nextReview = new Date(card.nextReviewDate);
      nextReview.setHours(0, 0, 0, 0);
      return nextReview <= today;
    });
    
    dueCards.sort((a, b) => 
      new Date(a.nextReviewDate).getTime() - new Date(b.nextReviewDate).getTime()
    );
    
    res.json(dueCards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get due cards' });
  }
});

app.get('/api/cards/:id', (req, res) => {
  try {
    const cards = readCards();
    const card = cards.find(c => c.id === req.params.id);
    if (!card) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read card' });
  }
});

app.post('/api/cards', (req, res) => {
  try {
    const { front, back, tags, initialDifficulty } = req.body as {
      front: string;
      back: string;
      tags: string[];
      initialDifficulty: Difficulty;
    };

    if (!front || !back || !initialDifficulty) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const initialInterval = getInitialInterval(initialDifficulty);
    const nextReviewDate = formatDate(addDays(new Date(), initialInterval));

    const newCard: Card = {
      id: uuidv4(),
      front,
      back,
      tags: tags || [],
      initialDifficulty,
      currentInterval: initialInterval,
      nextReviewDate,
      reviewHistory: [],
      createdAt: formatDate(new Date())
    };

    const cards = readCards();
    cards.push(newCard);
    writeCards(cards);
    
    res.status(201).json(newCard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create card' });
  }
});

app.put('/api/cards/:id', (req, res) => {
  try {
    const cards = readCards();
    const index = cards.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    cards[index] = { ...cards[index], ...req.body };
    writeCards(cards);
    res.json(cards[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update card' });
  }
});

app.delete('/api/cards/:id', (req, res) => {
  try {
    const cards = readCards();
    const filtered = cards.filter(c => c.id !== req.params.id);
    if (filtered.length === cards.length) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }
    writeCards(filtered);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete card' });
  }
});

app.post('/api/cards/:id/review', (req, res) => {
  try {
    const { difficulty } = req.body as { difficulty: Difficulty };
    if (!difficulty) {
      res.status(400).json({ error: 'Difficulty is required' });
      return;
    }

    const cards = readCards();
    const index = cards.findIndex(c => c.id === req.params.id);
    if (index === -1) {
      res.status(404).json({ error: 'Card not found' });
      return;
    }

    const card = cards[index];
    const nextInterval = calculateNextInterval(
      card.currentInterval,
      difficulty,
      card.initialDifficulty
    );
    const nextReviewDate = formatDate(addDays(new Date(), nextInterval));
    
    const reviewRecord: ReviewRecord = {
      date: getTodayDateString(),
      difficulty,
      score: getDifficultyScore(difficulty)
    };

    const updatedCard: Card = {
      ...card,
      currentInterval: nextInterval,
      nextReviewDate,
      reviewHistory: [...card.reviewHistory, reviewRecord]
    };

    cards[index] = updatedCard;
    writeCards(cards);
    res.json(updatedCard);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update review' });
  }
});

app.get('/api/stats', (_req, res) => {
  try {
    const cards = readCards();
    const today = getTodayDateString();
    const past7Days = getPast7Days();

    let todayReviewed = 0;
    let dueCardsCount = 0;
    const dailyCounts: { date: string; count: number }[] = past7Days.map(date => ({
      date,
      count: 0
    }));

    const alpha = 0.3;
    let weightedAverage = 0;
    const sortedReviews: ReviewRecord[] = [];

    cards.forEach(card => {
      if (isOverdue(card.nextReviewDate)) {
        dueCardsCount++;
      }

      card.reviewHistory.forEach(record => {
        if (record.date === today) {
          todayReviewed++;
        }

        const dayIndex = past7Days.indexOf(record.date);
        if (dayIndex !== -1) {
          dailyCounts[dayIndex].count++;
        }

        sortedReviews.push(record);
      });
    });

    sortedReviews.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sortedReviews.length > 0) {
      weightedAverage = sortedReviews[0].score;
      for (let i = 1; i < sortedReviews.length; i++) {
        weightedAverage = alpha * sortedReviews[i].score + (1 - alpha) * weightedAverage;
      }
    }

    const stats: ReviewStats = {
      todayReviewed,
      averageRecallScore: sortedReviews.length > 0 ? weightedAverage : 0,
      dueCardsCount,
      dailyReviewCounts: dailyCounts
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

app.get('/api/export', (_req, res) => {
  try {
    const cards = readCards();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="knowledge-cards-${getTodayDateString()}.json"`);
    res.json(cards);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export data' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
