import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import net from 'net';
import { execSync } from 'child_process';

const app = express();

const checkPortAvailable = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
};

const killProcessOnPort = (port) => {
  try {
    if (process.platform === 'win32') {
      const result = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = result.trim().split('\n');
      for (const line of lines) {
        const match = line.match(/LISTENING\s+(\d+)/);
        if (match) {
          const pid = match[1];
          if (pid !== '4') {
            try {
              execSync(`taskkill /F /PID ${pid}`);
              console.log(`Killed process ${pid} on port ${port}`);
            } catch (e) { /* ignore */ }
          }
        }
      }
    } else {
      execSync(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`);
    }
  } catch (e) { /* ignore */ }
};

const findAvailablePort = async (startPort) => {
  let port = startPort;
  while (port < startPort + 100) {
    let available = await checkPortAvailable(port);
    if (!available) {
      killProcessOnPort(port);
      available = await checkPortAvailable(port);
    }
    if (available) return port;
    port++;
  }
  return startPort;
};

const categories = ['语文', '数学', '英语', '科学', '历史', '其他'];

app.use(cors());
app.use(express.json());

let cards = [
  {
    id: uuidv4(),
    question: '什么是勾股定理？',
    answer: '在直角三角形中，两条直角边的平方和等于斜边的平方，即 a² + b² = c²',
    category: '数学',
    difficulty: 2,
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    reviewCount: 3,
    lastReviewDate: new Date(Date.now() - 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() + 86400000).toISOString(),
    rememberCount: 2,
  },
  {
    id: uuidv4(),
    question: '"床前明月光"的下一句是什么？',
    answer: '疑是地上霜',
    category: '语文',
    difficulty: 1,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    reviewCount: 5,
    lastReviewDate: new Date(Date.now() - 3600000).toISOString(),
    nextReviewDate: new Date(Date.now() + 86400000 * 3).toISOString(),
    rememberCount: 5,
  },
  {
    id: uuidv4(),
    question: '光合作用的化学方程式是什么？',
    answer: '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂（光照、叶绿体）',
    category: '科学',
    difficulty: 4,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    reviewCount: 1,
    lastReviewDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    nextReviewDate: new Date().toISOString(),
    rememberCount: 0,
  },
  {
    id: uuidv4(),
    question: '中国古代四大发明是什么？',
    answer: '造纸术、印刷术、火药、指南针',
    category: '历史',
    difficulty: 2,
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    reviewCount: 0,
    lastReviewDate: null,
    nextReviewDate: null,
    rememberCount: 0,
  },
  {
    id: uuidv4(),
    question: 'What is the past tense of "go"?',
    answer: 'went',
    category: '英语',
    difficulty: 1,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    reviewCount: 2,
    lastReviewDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    nextReviewDate: new Date().toISOString(),
    rememberCount: 2,
  },
  {
    id: uuidv4(),
    question: '水的化学式是什么？',
    answer: 'H₂O',
    category: '科学',
    difficulty: 1,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    reviewCount: 0,
    lastReviewDate: null,
    nextReviewDate: null,
    rememberCount: 0,
  },
  {
    id: uuidv4(),
    question: '太阳系有几大行星？分别是？',
    answer: '8大行星：水星、金星、地球、火星、木星、土星、天王星、海王星',
    category: '科学',
    difficulty: 3,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    reviewCount: 4,
    lastReviewDate: new Date(Date.now() - 86400000).toISOString(),
    nextReviewDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    rememberCount: 3,
  },
  {
    id: uuidv4(),
    question: '圆周率π约等于多少？',
    answer: '约等于 3.1415926535',
    category: '数学',
    difficulty: 2,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    reviewCount: 6,
    lastReviewDate: new Date().toISOString(),
    nextReviewDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    rememberCount: 6,
  },
];

const getToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const calculateNextReview = (card, remembered) => {
  const now = new Date();
  let nextDate = new Date(now);

  if (!card.lastReviewDate) {
    nextDate.setDate(nextDate.getDate() + 1);
  } else if (remembered) {
    const lastReview = new Date(card.lastReviewDate);
    const prevNext = card.nextReviewDate ? new Date(card.nextReviewDate) : new Date(card.createdAt);
    const prevInterval = Math.max(1, Math.round((prevNext - lastReview) / 86400000));
    const factor = 2 - card.difficulty * 0.15;
    const newInterval = Math.max(1, Math.round(prevInterval * factor));
    nextDate.setDate(nextDate.getDate() + newInterval);
  } else {
    nextDate.setDate(nextDate.getDate() + 1);
  }

  return nextDate.toISOString();
};

app.get('/api/cards', (req, res) => {
  res.json(cards);
});

app.get('/api/cards/:id', (req, res) => {
  const card = cards.find((c) => c.id === req.params.id);
  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }
  res.json(card);
});

app.post('/api/cards', (req, res) => {
  const { question, answer, category, difficulty } = req.body;
  if (!question || !answer || !category || !difficulty) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const newCard = {
    id: uuidv4(),
    question,
    answer,
    category,
    difficulty: Number(difficulty),
    createdAt: new Date().toISOString(),
    reviewCount: 0,
    lastReviewDate: null,
    nextReviewDate: null,
    rememberCount: 0,
  };
  cards.unshift(newCard);
  res.status(201).json(newCard);
});

app.put('/api/cards/:id', (req, res) => {
  const index = cards.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Card not found' });
  }
  const { remembered } = req.body;
  if (remembered === undefined) {
    return res.status(400).json({ error: 'Missing remembered field' });
  }
  const card = cards[index];
  card.reviewCount += 1;
  card.lastReviewDate = new Date().toISOString();
  if (remembered) {
    card.rememberCount += 1;
  }
  card.nextReviewDate = calculateNextReview(card, remembered);
  cards[index] = card;
  res.json(card);
});

app.delete('/api/cards/:id', (req, res) => {
  const index = cards.findIndex((c) => c.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Card not found' });
  }
  cards.splice(index, 1);
  res.json({ success: true });
});

app.get('/api/cards/review/due', (req, res) => {
  const today = getToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueCards = cards.filter((card) => {
    if (!card.nextReviewDate) return true;
    const nextReview = new Date(card.nextReviewDate);
    return nextReview < tomorrow;
  });

  dueCards.sort((a, b) => a.difficulty - b.difficulty);
  res.json(dueCards);
});

app.get('/api/stats', (req, res) => {
  const total = cards.length;
  const reviewed = cards.filter((c) => c.reviewCount > 0).length;

  const today = getToday();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayReviewed = cards.filter((c) => {
    if (!c.lastReviewDate) return false;
    const last = new Date(c.lastReviewDate);
    return last >= today && last < tomorrow;
  }).length;

  const totalReviews = cards.reduce((sum, c) => sum + c.reviewCount, 0);
  const totalRemembered = cards.reduce((sum, c) => sum + c.rememberCount, 0);
  const rememberRate = totalReviews > 0 ? totalRemembered / totalReviews : 0;

  const categoryCounts = {};
  categories.forEach((cat) => {
    categoryCounts[cat] = cards.filter((c) => c.category === cat).length;
  });

  res.json({
    total,
    reviewed,
    todayReviewed,
    rememberRate,
    categoryCounts,
  });
});

const bootServer = async () => {
  const PORT = await findAvailablePort(3001);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

bootServer();
