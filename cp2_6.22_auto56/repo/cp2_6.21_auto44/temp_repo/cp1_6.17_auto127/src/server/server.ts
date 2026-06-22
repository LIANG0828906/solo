import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Poem, WeatherTheme } from '../types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let poems: Poem[] = [
  {
    id: uuidv4(),
    title: '春日暖阳',
    content: '阳光透过窗棂\n洒在古老的诗卷上\n墨香与花香交融',
    theme: 'sunny',
    createdAt: new Date().toISOString(),
    likes: 12,
    comments: 3,
  },
  {
    id: uuidv4(),
    title: '夜雨听禅',
    content: '雨滴敲打着青瓦\n如佛钟轻鸣\n洗去尘世的喧嚣',
    theme: 'rainy',
    createdAt: new Date().toISOString(),
    likes: 25,
    comments: 7,
  },
  {
    id: uuidv4(),
    title: '初雪寄思',
    content: '雪花片片飘落\n覆盖了归家的小路\n却掩不住思念',
    theme: 'snowy',
    createdAt: new Date().toISOString(),
    likes: 18,
    comments: 5,
  },
];

app.get('/api/poems', (_req, res) => {
  res.json(poems);
});

app.post('/api/poems', (req, res) => {
  const { title, content, theme } = req.body as { title: string; content: string; theme: WeatherTheme };
  if (!title || !content || !theme) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const newPoem: Poem = {
    id: uuidv4(),
    title,
    content,
    theme,
    createdAt: new Date().toISOString(),
    likes: 0,
    comments: 0,
  };
  poems.unshift(newPoem);
  res.status(201).json(newPoem);
});

app.post('/api/poems/:id/like', (req, res) => {
  const { id } = req.params;
  const poem = poems.find((p) => p.id === id);
  if (!poem) {
    return res.status(404).json({ error: 'Poem not found' });
  }
  poem.likes += 1;
  res.json(poem);
});

app.delete('/api/poems/:id', (req, res) => {
  const { id } = req.params;
  const index = poems.findIndex((p) => p.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Poem not found' });
  }
  poems.splice(index, 1);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`风铃诗笺 API 服务运行在 http://localhost:${PORT}`);
});
