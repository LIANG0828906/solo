import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

interface Flashcard {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: string;
}

interface DataStore {
  cards: Flashcard[];
}

interface ReviewRating {
  cardId: string;
  rating: 0 | 1 | 2;
}

function readData(): DataStore {
  const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(rawData);
}

function writeData(data: DataStore): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function calculateNextReview(card: Flashcard, rating: 0 | 1 | 2): Flashcard {
  let { interval, repetitions, easeFactor } = card;
  
  const quality = rating === 0 ? 0 : rating === 1 ? 3 : 5;
  
  if (quality < 3) {
    repetitions = 0;
    interval = 1;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }
  
  easeFactor = easeFactor + (0.1 - (2 - rating) * (0.08 + (2 - rating) * 0.02));
  
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }
  
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);
  
  return {
    ...card,
    interval,
    repetitions,
    easeFactor,
    nextReviewDate: nextReviewDate.toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function createNewCard(title: string, content: string, tags: string[]): Flashcard {
  const now = new Date();
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + 1);
  
  return {
    id: uuidv4(),
    title,
    content,
    tags,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    interval: 1,
    repetitions: 0,
    easeFactor: 2.5,
    nextReviewDate: nextReview.toISOString()
  };
}

app.get('/api/cards', (_req: Request, res: Response) => {
  try {
    const data = readData();
    res.json({ success: true, data: data.cards });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch cards' });
  }
});

app.get('/api/cards/:id', (req: Request, res: Response) => {
  try {
    const data = readData();
    const card = data.cards.find(c => c.id === req.params.id);
    
    if (!card) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    res.json({ success: true, data: card });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch card' });
  }
});

app.post('/api/cards', (req: Request, res: Response) => {
  try {
    const { title, content, tags } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }
    
    if (title.length > 50) {
      return res.status(400).json({ success: false, error: 'Title must be 50 characters or less' });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ success: false, error: 'Content must be 500 characters or less' });
    }
    
    if (tags && tags.length > 3) {
      return res.status(400).json({ success: false, error: 'Maximum 3 tags allowed' });
    }
    
    const validTags = tags || [];
    for (const tag of validTags) {
      if (!tag.startsWith('#')) {
        return res.status(400).json({ success: false, error: 'Tags must start with #' });
      }
    }
    
    const data = readData();
    const newCard = createNewCard(title, content, validTags);
    data.cards.unshift(newCard);
    writeData(data);
    
    res.status(201).json({ success: true, data: newCard });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to create card' });
  }
});

app.put('/api/cards/:id', (req: Request, res: Response) => {
  try {
    const { title, content, tags } = req.body;
    const data = readData();
    const cardIndex = data.cards.findIndex(c => c.id === req.params.id);
    
    if (cardIndex === -1) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    if (!title || !content) {
      return res.status(400).json({ success: false, error: 'Title and content are required' });
    }
    
    if (title.length > 50) {
      return res.status(400).json({ success: false, error: 'Title must be 50 characters or less' });
    }
    
    if (content.length > 500) {
      return res.status(400).json({ success: false, error: 'Content must be 500 characters or less' });
    }
    
    if (tags && tags.length > 3) {
      return res.status(400).json({ success: false, error: 'Maximum 3 tags allowed' });
    }
    
    const validTags = tags || [];
    for (const tag of validTags) {
      if (!tag.startsWith('#')) {
        return res.status(400).json({ success: false, error: 'Tags must start with #' });
      }
    }
    
    const updatedCard: Flashcard = {
      ...data.cards[cardIndex],
      title,
      content,
      tags: validTags,
      updatedAt: new Date().toISOString()
    };
    
    data.cards[cardIndex] = updatedCard;
    writeData(data);
    
    res.json({ success: true, data: updatedCard });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update card' });
  }
});

app.delete('/api/cards/:id', (req: Request, res: Response) => {
  try {
    const data = readData();
    const cardIndex = data.cards.findIndex(c => c.id === req.params.id);
    
    if (cardIndex === -1) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    data.cards.splice(cardIndex, 1);
    writeData(data);
    
    res.json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to delete card' });
  }
});

app.get('/api/review/due', (_req: Request, res: Response) => {
  try {
    const data = readData();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const dueCards = data.cards.filter(card => {
      const nextReview = new Date(card.nextReviewDate);
      nextReview.setHours(0, 0, 0, 0);
      return nextReview <= now;
    });
    
    res.json({ success: true, data: dueCards });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch due cards' });
  }
});

app.post('/api/review/rate', (req: Request, res: Response) => {
  try {
    const { cardId, rating } = req.body as ReviewRating;
    
    if (rating !== 0 && rating !== 1 && rating !== 2) {
      return res.status(400).json({ success: false, error: 'Invalid rating. Must be 0, 1, or 2' });
    }
    
    const data = readData();
    const cardIndex = data.cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      return res.status(404).json({ success: false, error: 'Card not found' });
    }
    
    const updatedCard = calculateNextReview(data.cards[cardIndex], rating);
    data.cards[cardIndex] = updatedCard;
    writeData(data);
    
    res.json({ success: true, data: updatedCard });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to rate card' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
