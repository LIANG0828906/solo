import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

type BookStatus = 'to-read' | 'reading' | 'finished';

interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number;
  currentPage: number;
  status: BookStatus;
  startDate: string | null;
  lastReadMinutes: number;
  createdAt: string;
}

interface Note {
  id: string;
  bookId: string;
  content: string;
  createdAt: string;
}

interface ReadingSession {
  id: string;
  bookId: string;
  date: string;
  minutes: number;
}

interface PresetBook {
  title: string;
  author: string;
  coverUrl: string;
  totalPages: number;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const PRESET_COVERS = [
  'linear-gradient(135deg,#8B2500 0%,#A52A2A 50%,#5C1A00 100%)',
  'linear-gradient(135deg,#1A3C34 0%,#2E4A2A 50%,#0D2818 100%)',
  'linear-gradient(135deg,#2C1810 0%,#4A2C17 50%,#1A0F08 100%)',
  'linear-gradient(135deg,#3D2914 0%,#6B4423 50%,#2A1A0A 100%)',
  'linear-gradient(135deg,#4A0E0E 0%,#7A1E1E 50%,#2A0606 100%)',
  'linear-gradient(135deg,#0E2F4A 0%,#1E4A7A 50%,#061628 100%)',
  'linear-gradient(135deg,#3D1F4A 0%,#6A3582 50%,#1E0E28 100%)',
  'linear-gradient(135deg,#4A3A14 0%,#8B6914 50%,#2A2008 100%)',
  'linear-gradient(135deg,#5C1A1A 0%,#8B2525 50%,#3A0D0D 100%)',
  'linear-gradient(135deg,#232F1A 0%,#3D5C2A 50%,#0F180A 100%)',
  'linear-gradient(135deg,#1C1C3D 0%,#2E2E5C 50%,#0C0C1A 100%)',
  'linear-gradient(135deg,#4A2A0A 0%,#8B5E3C 50%,#2A1804 100%)',
  'linear-gradient(135deg,#2E1A2E 0%,#5C355C 50%,#150815 100%)',
  'linear-gradient(135deg,#0A2A2A 0%,#1A4A4A 50%,#021515 100%)',
  'linear-gradient(135deg,#4A4A14 0%,#8B8B25 50%,#2A2A08 100%)',
  'linear-gradient(135deg,#1A0E2E 0%,#3A1E5C 50%,#080518 100%)',
  'linear-gradient(135deg,#3A2E1A 0%,#6B5C3D 50%,#1E180E 100%)',
  'linear-gradient(135deg,#2A0E1E 0%,#5C1E3A 50%,#120410 100%)',
  'linear-gradient(135deg,#1E2A3A 0%,#354A6B 50%,#08151E 100%)',
  'linear-gradient(135deg,#F5E6C8 0%,#E8D4A8 50%,#C9A86C 100%)',
];

const PRESET_BOOKS: PresetBook[] = [
  { title: '红楼梦', author: '曹雪芹', coverUrl: PRESET_COVERS[0], totalPages: 1606 },
  { title: '三国演义', author: '罗贯中', coverUrl: PRESET_COVERS[1], totalPages: 1200 },
  { title: '西游记', author: '吴承恩', coverUrl: PRESET_COVERS[2], totalPages: 1008 },
  { title: '水浒传', author: '施耐庵', coverUrl: PRESET_COVERS[3], totalPages: 1200 },
  { title: '百年孤独', author: '马尔克斯', coverUrl: PRESET_COVERS[4], totalPages: 360 },
  { title: '1984', author: '乔治·奥威尔', coverUrl: PRESET_COVERS[5], totalPages: 328 },
  { title: '追忆似水年华', author: '普鲁斯特', coverUrl: PRESET_COVERS[6], totalPages: 4200 },
  { title: '战争与和平', author: '托尔斯泰', coverUrl: PRESET_COVERS[7], totalPages: 1225 },
  { title: '罪与罚', author: '陀思妥耶夫斯基', coverUrl: PRESET_COVERS[8], totalPages: 670 },
  { title: '傲慢与偏见', author: '简·奥斯汀', coverUrl: PRESET_COVERS[9], totalPages: 432 },
  { title: '简爱', author: '夏洛蒂·勃朗特', coverUrl: PRESET_COVERS[10], totalPages: 532 },
  { title: '巴黎圣母院', author: '雨果', coverUrl: PRESET_COVERS[11], totalPages: 550 },
  { title: '悲惨世界', author: '雨果', coverUrl: PRESET_COVERS[12], totalPages: 1463 },
  { title: '活着', author: '余华', coverUrl: PRESET_COVERS[13], totalPages: 191 },
  { title: '围城', author: '钱钟书', coverUrl: PRESET_COVERS[14], totalPages: 359 },
  { title: '白鹿原', author: '陈忠实', coverUrl: PRESET_COVERS[15], totalPages: 684 },
  { title: '平凡的世界', author: '路遥', coverUrl: PRESET_COVERS[16], totalPages: 1627 },
  { title: '挪威的森林', author: '村上春树', coverUrl: PRESET_COVERS[17], totalPages: 384 },
  { title: '追风筝的人', author: '胡赛尼', coverUrl: PRESET_COVERS[18], totalPages: 362 },
  { title: '小王子', author: '圣埃克苏佩里', coverUrl: PRESET_COVERS[19], totalPages: 97 },
];

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return ymd(d);
}

const today = new Date();
const sampleBooks: Book[] = [
  {
    id: uuidv4(),
    title: '1984',
    author: '乔治·奥威尔',
    coverUrl: PRESET_BOOKS[5].coverUrl,
    totalPages: 328,
    currentPage: 186,
    status: 'reading',
    startDate: daysAgo(12),
    lastReadMinutes: 45,
    createdAt: daysAgo(20),
  },
  {
    id: uuidv4(),
    title: '活着',
    author: '余华',
    coverUrl: PRESET_BOOKS[13].coverUrl,
    totalPages: 191,
    currentPage: 191,
    status: 'finished',
    startDate: daysAgo(25),
    lastReadMinutes: 30,
    createdAt: daysAgo(30),
  },
  {
    id: uuidv4(),
    title: '百年孤独',
    author: '马尔克斯',
    coverUrl: PRESET_BOOKS[4].coverUrl,
    totalPages: 360,
    currentPage: 0,
    status: 'to-read',
    startDate: null,
    lastReadMinutes: 0,
    createdAt: daysAgo(5),
  },
  {
    id: uuidv4(),
    title: '小王子',
    author: '圣埃克苏佩里',
    coverUrl: PRESET_BOOKS[19].coverUrl,
    totalPages: 97,
    currentPage: 97,
    status: 'finished',
    startDate: daysAgo(40),
    lastReadMinutes: 15,
    createdAt: daysAgo(45),
  },
  {
    id: uuidv4(),
    title: '挪威的森林',
    author: '村上春树',
    coverUrl: PRESET_BOOKS[17].coverUrl,
    totalPages: 384,
    currentPage: 120,
    status: 'reading',
    startDate: daysAgo(6),
    lastReadMinutes: 60,
    createdAt: daysAgo(10),
  },
];

const books: Book[] = [...sampleBooks];
const notes: Note[] = [
  { id: uuidv4(), bookId: sampleBooks[1].id, content: '福贵的一生让人心碎，但生命的韧性令人动容。', createdAt: daysAgo(22) },
  { id: uuidv4(), bookId: sampleBooks[0].id, content: '老大哥在看着你 —— 关于监控社会的预言正在成为现实。', createdAt: daysAgo(8) },
  { id: uuidv4(), bookId: sampleBooks[3].id, content: '所有的大人都曾经是小孩，虽然只有少数人记得。', createdAt: daysAgo(35) },
];
const sessions: ReadingSession[] = [];

for (let i = 0; i < 21; i++) {
  const day = daysAgo(i);
  if (i === 3 || i === 9) continue;
  const min = Math.floor(Math.random() * 80) + 15;
  sessions.push({
    id: uuidv4(),
    bookId: sampleBooks[i % sampleBooks.length].id,
    date: day,
    minutes: min,
  });
}

app.get('/api/preset-books', (_req: Request, res: Response) => {
  res.json(PRESET_BOOKS);
});

app.get('/api/books', (_req: Request, res: Response) => {
  res.json(books);
});

app.post('/api/books', (req: Request, res: Response) => {
  const { title, author, coverUrl, totalPages, currentPage = 0, status = 'to-read' } = req.body || {};
  if (!title || !author || !coverUrl || !totalPages) {
    return res.status(400).json({ error: '缺少必填字段' });
  }
  const newBook: Book = {
    id: uuidv4(),
    title: String(title),
    author: String(author),
    coverUrl: String(coverUrl),
    totalPages: Number(totalPages),
    currentPage: Number(currentPage) || 0,
    status: (status as BookStatus) || 'to-read',
    startDate: status === 'reading' ? ymd(new Date()) : status === 'finished' ? ymd(new Date()) : null,
    lastReadMinutes: 0,
    createdAt: new Date().toISOString(),
  };
  books.unshift(newBook);
  res.status(201).json(newBook);
});

app.put('/api/books/:id', (req: Request, res: Response) => {
  const idx = books.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '未找到书籍' });
  const before = books[idx];
  const updated = { ...before, ...req.body };
  if ((req.body.currentPage !== undefined || req.body.status === 'reading') && before.status !== 'reading' && !before.startDate) {
    updated.startDate = ymd(new Date());
  }
  books[idx] = updated;
  if (req.body.currentPage !== undefined && req.body.currentPage > before.currentPage) {
    const diff = req.body.currentPage - before.currentPage;
    sessions.push({
      id: uuidv4(),
      bookId: before.id,
      date: ymd(new Date()),
      minutes: Math.max(5, Math.round(diff * 1.2)),
    });
  }
  res.json(updated);
});

app.delete('/api/books/:id', (req: Request, res: Response) => {
  const idx = books.findIndex((b) => b.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '未找到书籍' });
  books.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/books/:id/notes', (req: Request, res: Response) => {
  res.json(notes.filter((n) => n.bookId === req.params.id));
});

app.post('/api/books/:id/notes', (req: Request, res: Response) => {
  const { content } = req.body || {};
  if (!content) return res.status(400).json({ error: '笔记内容不能为空' });
  const book = books.find((b) => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: '未找到书籍' });
  const note: Note = {
    id: uuidv4(),
    bookId: req.params.id,
    content: String(content),
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  res.status(201).json(note);
});

function computeStreak(): { days: number; active: boolean } {
  const set = new Set(sessions.map((s) => s.date));
  let days = 0;
  let active = true;
  for (let i = 0; i < 60; i++) {
    const d = daysAgo(i);
    if (set.has(d)) {
      days++;
    } else {
      if (i === 0) active = false;
      break;
    }
  }
  return { days, active };
}

app.get('/api/stats/weekly', (_req: Request, res: Response) => {
  const byDate: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) byDate[daysAgo(i)] = 0;
  for (const s of sessions) {
    if (s.date in byDate) byDate[s.date] += s.minutes;
  }
  const dailyMinutes = Object.entries(byDate).map(([date, minutes]) => ({ date, minutes }));
  const weekTotalMinutes = dailyMinutes.reduce((a, b) => a + b.minutes, 0);

  const monthStr = today.toISOString().slice(0, 7);
  let monthFinishedCount = 0;
  for (const b of books) {
    if (b.status === 'finished' && b.startDate && b.startDate.startsWith(monthStr)) {
      monthFinishedCount++;
    }
  }

  const streak = computeStreak();

  res.json({
    weekTotalHours: Number((weekTotalMinutes / 60).toFixed(1)),
    monthFinishedCount,
    streakDays: streak.days,
    streakActive: streak.active,
    dailyMinutes,
  });
});

app.get('/api/stats/report', (req: Request, res: Response) => {
  const weeksAgo = Number(req.query.weeksAgo) || 0;
  const startOffset = weeksAgo * 7 + 6;
  const endOffset = weeksAgo * 7;
  const reportStart = daysAgo(startOffset);
  const reportEnd = daysAgo(endOffset);

  const datesInRange: string[] = [];
  for (let i = startOffset; i >= endOffset; i--) datesInRange.push(daysAgo(i));

  const dailyBreakdown = datesInRange.map((date) => {
    const min = sessions.filter((s) => s.date === date).reduce((a, b) => a + b.minutes, 0);
    const noteCount = notes.filter((n) => n.createdAt.startsWith(date)).length;
    return { date, minutes: min, noteCount };
  });
  const totalMinutes = dailyBreakdown.reduce((a, b) => a + b.minutes, 0);
  const bookIdsInRange = new Set(sessions.filter((s) => datesInRange.includes(s.date)).map((s) => s.bookId));
  const booksRead = books.filter((b) => bookIdsInRange.has(b.id)).map((b) => b.title);
  const totalNotes = dailyBreakdown.reduce((a, b) => a + b.noteCount, 0);

  res.json({
    dateRange: { start: reportStart, end: reportEnd },
    dailyBreakdown,
    totalHours: Number((totalMinutes / 60).toFixed(1)),
    booksRead,
    totalNotes,
  });
});

app.listen(PORT, () => {
  console.log(`📚 Virtual Bookshelf API running on http://localhost:${PORT}`);
});
