import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const members = [
  {
    id: 'm1',
    name: '张小明',
    avatar: 'https://i.pravatar.cc/150?img=1',
    role: '会长'
  },
  {
    id: 'm2',
    name: '李雨桐',
    avatar: 'https://i.pravatar.cc/150?img=5',
    role: '管理员'
  },
  {
    id: 'm3',
    name: '王浩然',
    avatar: 'https://i.pravatar.cc/150?img=12',
    role: '成员'
  },
  {
    id: 'm4',
    name: '陈思琪',
    avatar: 'https://i.pravatar.cc/150?img=20',
    role: '成员'
  },
  {
    id: 'm5',
    name: '刘子涵',
    avatar: 'https://i.pravatar.cc/150?img=33',
    role: '成员'
  }
];

const books = [
  {
    id: 'b1',
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    cover: 'https://picsum.photos/seed/book1/300/400',
    status: 'borrowed',
    currentHolderId: 'm2',
    readingProgress: 65
  },
  {
    id: 'b2',
    title: '三体',
    author: '刘慈欣',
    cover: 'https://picsum.photos/seed/book2/300/400',
    status: 'available',
    currentHolderId: null,
    readingProgress: 100
  },
  {
    id: 'b3',
    title: '活着',
    author: '余华',
    cover: 'https://picsum.photos/seed/book3/300/400',
    status: 'in_transit',
    currentHolderId: 'm3',
    readingProgress: 40
  },
  {
    id: 'b4',
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    cover: 'https://picsum.photos/seed/book4/300/400',
    status: 'available',
    currentHolderId: null,
    readingProgress: 0
  },
  {
    id: 'b5',
    title: '追风筝的人',
    author: '卡勒德·胡赛尼',
    cover: 'https://picsum.photos/seed/book5/300/400',
    status: 'borrowed',
    currentHolderId: 'm4',
    readingProgress: 80
  }
];

const borrowRecords = [
  {
    id: 'r1',
    bookId: 'b1',
    fromMemberId: 'm1',
    toMemberId: 'm2',
    borrowDate: '2026-05-20',
    type: 'borrow',
    note: '期待已久的魔幻现实主义巨作'
  },
  {
    id: 'r2',
    bookId: 'b1',
    fromMemberId: 'm2',
    toMemberId: 'm2',
    borrowDate: '2026-05-25',
    returnDate: '2026-06-05',
    type: 'return',
    note: '已经读完，非常精彩'
  },
  {
    id: 'r3',
    bookId: 'b3',
    fromMemberId: 'm1',
    toMemberId: 'm3',
    borrowDate: '2026-06-01',
    type: 'borrow',
    note: '余华的经典作品'
  },
  {
    id: 'r4',
    bookId: 'b5',
    fromMemberId: 'm3',
    toMemberId: 'm4',
    borrowDate: '2026-05-28',
    type: 'borrow',
    note: '阿富汗的动人故事'
  }
];

const readingNotes = [
  {
    id: 'n1',
    bookId: 'b1',
    memberId: 'm2',
    content: '第一章就让我沉浸其中，布恩迪亚家族的故事太有吸引力了。',
    timestamp: '2026-05-22T10:30:00Z'
  },
  {
    id: 'n2',
    bookId: 'b1',
    memberId: 'm2',
    content: '马孔多的兴衰让我感慨万千，孤独是每个人的宿命。',
    timestamp: '2026-05-28T15:20:00Z'
  },
  {
    id: 'n3',
    bookId: 'b3',
    memberId: 'm3',
    content: '福贵的一生让人唏嘘，活着本身就是最大的意义。',
    timestamp: '2026-06-03T09:15:00Z'
  }
];

app.get('/api/members', (_req, res) => {
  res.json(members);
});

app.get('/api/members/:id', (req, res) => {
  const member = members.find((m) => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: 'Member not found' });
  res.json(member);
});

app.get('/api/members/:id/borrow-history', (req, res) => {
  const history = borrowRecords.filter(
    (r) => r.toMemberId === req.params.id || r.fromMemberId === req.params.id
  );
  res.json(history);
});

app.get('/api/books', (_req, res) => {
  res.json(books);
});

app.get('/api/books/:id', (req, res) => {
  const book = books.find((b) => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

app.get('/api/books/:id/borrow-history', (req, res) => {
  const history = borrowRecords.filter((r) => r.bookId === req.params.id);
  res.json(history);
});

app.get('/api/books/:id/notes', (req, res) => {
  const notes = readingNotes.filter((n) => n.bookId === req.params.id);
  res.json(notes);
});

app.patch('/api/books/:id/progress', (req, res) => {
  const book = books.find((b) => b.id === req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  const progress = req.body.progress;
  if (progress < 0 || progress > 100) {
    return res.status(400).json({ error: 'Progress must be between 0 and 100' });
  }
  book.readingProgress = progress;
  res.json(book);
});

app.post('/api/borrow-records', (req, res) => {
  const { bookId, fromMemberId, toMemberId, borrowDate, returnDate, type, note } =
    req.body;
  const newRecord = {
    id: uuidv4(),
    bookId,
    fromMemberId,
    toMemberId,
    borrowDate,
    returnDate,
    type,
    note
  };
  borrowRecords.push(newRecord);

  const book = books.find((b) => b.id === bookId);
  if (book) {
    if (type === 'borrow') {
      book.currentHolderId = toMemberId;
      book.status = 'borrowed';
    } else if (type === 'return') {
      book.currentHolderId = null;
      book.status = 'available';
    }
  }

  res.status(201).json(newRecord);
});

app.post('/api/reading-notes', (req, res) => {
  const { bookId, memberId, content } = req.body;
  const newNote = {
    id: uuidv4(),
    bookId,
    memberId,
    content,
    timestamp: new Date().toISOString()
  };
  readingNotes.push(newNote);
  res.status(201).json(newNote);
});

app.listen(PORT, () => {
  console.log(`Book Club API server running on port ${PORT}`);
});
