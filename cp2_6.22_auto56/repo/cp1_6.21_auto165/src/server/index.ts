import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

interface Meme {
  id: string;
  content: string;
  tags: string[];
  author: string;
  likes: number;
  timestamp: number;
}

const app = express();
const PORT = 9876;

app.use(cors());
app.use(express.json());

let memes: Meme[] = [
  {
    id: uuidv4(),
    content: '今天的 bug 比头发还多 🤣',
    tags: ['今日梗', '吐槽'],
    author: '小明',
    likes: 12,
    timestamp: Date.now() - 1000 * 60 * 30,
  },
  {
    id: uuidv4(),
    content: '你永远可以相信周五下午的生产力！',
    tags: ['金句'],
    author: 'Lisa',
    likes: 8,
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: uuidv4(),
    content: '代码写得好，下班回家早；代码写得烂，加班到天亮',
    tags: ['冷笑话', '吐槽'],
    author: '阿强',
    likes: 15,
    timestamp: Date.now() - 1000 * 60 * 60 * 5,
  },
  {
    id: uuidv4(),
    content: '大家辛苦了！这个版本上线后我们一起去团建 🎉',
    tags: ['暖心'],
    author: '王经理',
    likes: 20,
    timestamp: Date.now() - 1000 * 60 * 60 * 8,
  },
  {
    id: uuidv4(),
    content: '为什么程序员喜欢黑暗模式？因为 light attracts bugs！',
    tags: ['冷笑话'],
    author: 'Tom',
    likes: 6,
    timestamp: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: uuidv4(),
    content: '你的努力，团队都看在眼里。继续加油！💪',
    tags: ['暖心'],
    author: '张总',
    likes: 18,
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: uuidv4(),
    content: '需求改了第三遍了，我已经开始怀疑人生了',
    tags: ['今日梗', '吐槽'],
    author: '小美',
    likes: 9,
    timestamp: Date.now() - 1000 * 60 * 60 * 36,
  },
  {
    id: uuidv4(),
    content: '技术债务就像滚雪球，越滚越大，直到雪崩',
    tags: ['金句', '吐槽'],
    author: '老陈',
    likes: 11,
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
  },
];

app.get('/api/memes', (_req, res) => {
  const sorted = [...memes].sort((a, b) => b.timestamp - a.timestamp);
  res.json(sorted);
});

app.post('/api/memes', (req, res) => {
  const { content, tags, author } = req.body;

  if (!content || !author) {
    return res.status(400).json({ error: '内容和作者不能为空' });
  }

  if (content.length > 100) {
    return res.status(400).json({ error: '内容不能超过100字' });
  }

  const newMeme: Meme = {
    id: uuidv4(),
    content: String(content),
    tags: Array.isArray(tags) ? tags : [],
    author: String(author),
    likes: 0,
    timestamp: Date.now(),
  };

  memes.unshift(newMeme);
  res.status(201).json(newMeme);
});

app.post('/api/memes/:id/like', (req, res) => {
  const { id } = req.params;
  const meme = memes.find(m => m.id === id);

  if (!meme) {
    return res.status(404).json({ error: '妙语不存在' });
  }

  meme.likes += 1;
  res.json({ id: meme.id, likes: meme.likes });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
