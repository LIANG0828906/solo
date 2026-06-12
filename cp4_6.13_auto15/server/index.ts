import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface BookMark {
  id: string;
  title: string;
  author: string;
  excerpt: string;
  note?: string;
  rating: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let bookmarks: BookMark[] = [
  {
    id: uuidv4(),
    title: '活着',
    author: '余华',
    excerpt: '人是为活着本身而活着的，而不是为了活着之外的任何事物所活着。',
    note: '这句话道出了生命的本质，简单却深刻。',
    rating: 5,
    tags: ['文学', '人生'],
    createdAt: new Date('2024-01-15').toISOString(),
    updatedAt: new Date('2024-01-15').toISOString(),
  },
  {
    id: uuidv4(),
    title: '小王子',
    author: '安托万·德·圣-埃克苏佩里',
    excerpt: '真正重要的东西，眼睛是看不见的。只有用心才能看清。',
    note: '经典中的经典，每次读都有新的感悟。',
    rating: 5,
    tags: ['童话', '哲理'],
    createdAt: new Date('2024-02-20').toISOString(),
    updatedAt: new Date('2024-02-20').toISOString(),
  },
  {
    id: uuidv4(),
    title: '人类简史',
    author: '尤瓦尔·赫拉利',
    excerpt: '金钱是有史以来最普遍也最有效的互信系统。',
    note: '从人类学角度看待金钱的本质，非常有意思。',
    rating: 4,
    tags: ['历史', '社科'],
    createdAt: new Date('2024-03-10').toISOString(),
    updatedAt: new Date('2024-03-10').toISOString(),
  },
  {
    id: uuidv4(),
    title: '百年孤独',
    author: '加西亚·马尔克斯',
    excerpt: '生命中曾经有过的所有灿烂，原来终究都需要用寂寞来偿还。',
    rating: 5,
    tags: ['文学', '魔幻现实'],
    createdAt: new Date('2024-03-25').toISOString(),
    updatedAt: new Date('2024-03-25').toISOString(),
  },
  {
    id: uuidv4(),
    title: '思考，快与慢',
    author: '丹尼尔·卡尼曼',
    excerpt: '我们对自己认为熟知的事物确信不疑，这显然是不对的。',
    note: '系统1和系统2的思维模式，值得反复阅读。',
    rating: 4,
    tags: ['心理', '认知'],
    createdAt: new Date('2024-04-05').toISOString(),
    updatedAt: new Date('2024-04-05').toISOString(),
  },
  {
    id: uuidv4(),
    title: '月亮与六便士',
    author: '毛姆',
    excerpt: '满地都是六便士，他却抬头看见了月亮。',
    note: '追求理想与现实的抉择，引人深思。',
    rating: 5,
    tags: ['文学', '理想'],
    createdAt: new Date('2024-04-18').toISOString(),
    updatedAt: new Date('2024-04-18').toISOString(),
  },
];

app.get('/api/bookmarks', (_req, res) => {
  res.json(bookmarks);
});

app.get('/api/bookmarks/:id', (req, res) => {
  const bookmark = bookmarks.find((b) => b.id === req.params.id);
  if (!bookmark) {
    res.status(404).json({ error: 'Bookmark not found' });
    return;
  }
  res.json(bookmark);
});

app.post('/api/bookmarks', (req, res) => {
  const { title, author, excerpt, note, rating, tags } = req.body;

  if (!title || !author || !excerpt || rating === undefined) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  if (excerpt.length > 500) {
    res.status(400).json({ error: 'Excerpt exceeds 500 characters' });
    return;
  }

  if (rating < 1 || rating > 5) {
    res.status(400).json({ error: 'Rating must be between 1 and 5' });
    return;
  }

  if (tags && tags.length > 3) {
    res.status(400).json({ error: 'Maximum 3 tags allowed' });
    return;
  }

  const now = new Date().toISOString();
  const newBookmark: BookMark = {
    id: uuidv4(),
    title,
    author,
    excerpt,
    note,
    rating,
    tags: tags || [],
    createdAt: now,
    updatedAt: now,
  };

  bookmarks.unshift(newBookmark);
  res.status(201).json(newBookmark);
});

app.put('/api/bookmarks/:id', (req, res) => {
  const index = bookmarks.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Bookmark not found' });
    return;
  }

  const { title, author, excerpt, note, rating, tags } = req.body;

  if (excerpt && excerpt.length > 500) {
    res.status(400).json({ error: 'Excerpt exceeds 500 characters' });
    return;
  }

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    res.status(400).json({ error: 'Rating must be between 1 and 5' });
    return;
  }

  if (tags && tags.length > 3) {
    res.status(400).json({ error: 'Maximum 3 tags allowed' });
    return;
  }

  const updatedBookmark: BookMark = {
    ...bookmarks[index],
    ...(title !== undefined && { title }),
    ...(author !== undefined && { author }),
    ...(excerpt !== undefined && { excerpt }),
    ...(note !== undefined && { note }),
    ...(rating !== undefined && { rating }),
    ...(tags !== undefined && { tags }),
    updatedAt: new Date().toISOString(),
  };

  bookmarks[index] = updatedBookmark;
  res.json(updatedBookmark);
});

app.delete('/api/bookmarks/:id', (req, res) => {
  const index = bookmarks.findIndex((b) => b.id === req.params.id);
  if (index === -1) {
    res.status(404).json({ error: 'Bookmark not found' });
    return;
  }

  bookmarks.splice(index, 1);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
