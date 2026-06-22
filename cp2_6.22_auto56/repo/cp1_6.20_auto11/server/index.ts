import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { Snippet, CreateSnippetDto } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'snippets.json');

app.use(cors());
app.use(express.json());

function readData(): Snippet[] {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const content = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(content) as Snippet[];
  } catch (err) {
    console.error('Failed to read data:', err);
    return [];
  }
}

function writeData(snippets: Snippet[]) {
  const dir = path.dirname(DATA_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(snippets, null, 2), 'utf-8');
}

function seedInitialData() {
  const existing = readData();
  if (existing.length > 0) return;

  const seed: Snippet[] = [
    {
      id: uuidv4(),
      title: 'React useDebounce Hook',
      code: `import { useState, useEffect } from 'react';\n\nexport function useDebounce<T>(value: T, delay: number): T {\n  const [debouncedValue, setDebouncedValue] = useState<T>(value);\n\n  useEffect(() => {\n    const handler = setTimeout(() => {\n      setDebouncedValue(value);\n    }, delay);\n\n    return () => {\n      clearTimeout(handler);\n    };\n  }, [value, delay]);\n\n  return debouncedValue;\n}`,
      language: 'TypeScript',
      tags: ['React', '工具函数'],
      likes: 42,
      favorites: 18,
      isLiked: false,
      isFavorited: false,
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: uuidv4(),
      title: '快速排序算法',
      code: `function quickSort(arr: number[]): number[] {\n  if (arr.length <= 1) return arr;\n  \n  const pivot = arr[Math.floor(arr.length / 2)];\n  const left = arr.filter(x => x < pivot);\n  const middle = arr.filter(x => x === pivot);\n  const right = arr.filter(x => x > pivot);\n  \n  return [...quickSort(left), ...middle, ...quickSort(right)];\n}\n\nconsole.log(quickSort([3, 6, 8, 10, 1, 2, 1]));`,
      language: 'TypeScript',
      tags: ['算法'],
      likes: 128,
      favorites: 56,
      isLiked: false,
      isFavorited: false,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Python 列表推导式技巧',
      code: `# 条件过滤\nnumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]\nevens = [x for x in numbers if x % 2 == 0]\n\n# 嵌套推导\nmatrix = [[1, 2, 3], [4, 5, 6], [7, 8, 9]]\nflat = [num for row in matrix for num in row]\n\n# 字典推导式\nwords = ['hello', 'world', 'python']\nword_lengths = {word: len(word) for word in words}\n\nprint(evens, flat, word_lengths)`,
      language: 'Python',
      tags: ['Python', '工具函数'],
      likes: 95,
      favorites: 42,
      isLiked: false,
      isFavorited: false,
      createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    },
    {
      id: uuidv4(),
      title: 'CSS Flex 居中布局',
      code: `.center-container {\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  min-height: 100vh;\n}\n\n.flex-between {\n  display: flex;\n  justify-content: space-between;\n  align-items: center;\n  gap: 16px;\n}\n\n.flex-wrap-grid {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}\n\n.flex-wrap-grid > * {\n  flex: 1 1 280px;\n  max-width: 100%;\n}`,
      language: 'CSS',
      tags: ['CSS技巧'],
      likes: 203,
      favorites: 89,
      isLiked: false,
      isFavorited: false,
      createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    },
    {
      id: uuidv4(),
      title: 'JavaScript 防抖与节流',
      code: `// 防抖\nfunction debounce(fn, delay = 300) {\n  let timer = null;\n  return function (...args) {\n    if (timer) clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n\n// 节流\nfunction throttle(fn, interval = 300) {\n  let lastTime = 0;\n  return function (...args) {\n    const now = Date.now();\n    if (now - lastTime >= interval) {\n      lastTime = now;\n      fn.apply(this, args);\n    }\n  };\n}`,
      language: 'JavaScript',
      tags: ['工具函数', '性能优化'],
      likes: 312,
      favorites: 156,
      isLiked: false,
      isFavorited: false,
      createdAt: new Date(Date.now() - 86400000 * 15).toISOString(),
    },
    {
      id: uuidv4(),
      title: 'Node.js Express 错误处理中间件',
      code: `class AppError extends Error {\n  constructor(message, statusCode) {\n    super(message);\n    this.statusCode = statusCode;\n    this.isOperational = true;\n  }\n}\n\nconst notFound = (req, res, next) => {\n  next(new AppError(\`Not Found - \${req.originalUrl}\`, 404));\n};\n\nconst errorHandler = (err, req, res, next) => {\n  const statusCode = err.statusCode || 500;\n  res.status(statusCode).json({\n    success: false,\n    message: err.message,\n    stack: process.env.NODE_ENV === 'production' ? null : err.stack,\n  });\n};\n\nexport { AppError, notFound, errorHandler };`,
      language: 'JavaScript',
      tags: ['Node.js', '设计模式'],
      likes: 87,
      favorites: 34,
      isLiked: false,
      isFavorited: false,
      createdAt: new Date(Date.now() - 86400000 * 20).toISOString(),
    },
  ];

  writeData(seed);
}

seedInitialData();

app.get('/api/snippets', (req, res) => {
  const {
    search = '',
    tag = '',
    lang = '',
    page = '1',
    limit = '20',
    favorites = 'false',
  } = req.query;

  let snippets = readData();

  if (favorites === 'true') {
    snippets = snippets.filter(s => s.isFavorited);
  }

  if (search) {
    const searchLower = String(search).toLowerCase();
    snippets = snippets.filter(
      s =>
        s.title.toLowerCase().includes(searchLower) ||
        s.code.toLowerCase().includes(searchLower) ||
        s.tags.some(t => t.toLowerCase().includes(searchLower))
    );
  }

  if (tag) {
    snippets = snippets.filter(s => s.tags.includes(String(tag)));
  }

  if (lang) {
    snippets = snippets.filter(s => s.language === lang);
  }

  snippets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const pageNum = parseInt(String(page), 10);
  const limitNum = parseInt(String(limit), 10);
  const start = (pageNum - 1) * limitNum;
  const end = start + limitNum;
  const paginated = snippets.slice(start, end);
  const hasMore = end < snippets.length;

  res.json({
    snippets: paginated,
    total: snippets.length,
    page: pageNum,
    hasMore,
  });
});

app.get('/api/snippets/:id', (req, res) => {
  const snippets = readData();
  const snippet = snippets.find(s => s.id === req.params.id);

  if (!snippet) {
    res.status(404).json({ error: 'Snippet not found' });
    return;
  }

  res.json(snippet);
});

app.post('/api/snippets', (req, res) => {
  const { title, code, language, tags } = req.body as CreateSnippetDto;

  if (!title || !code || !language) {
    res.status(400).json({ error: 'title, code, and language are required' });
    return;
  }

  const newSnippet: Snippet = {
    id: uuidv4(),
    title,
    code,
    language,
    tags: tags || [],
    likes: 0,
    favorites: 0,
    isLiked: false,
    isFavorited: false,
    createdAt: new Date().toISOString(),
  };

  const snippets = readData();
  snippets.unshift(newSnippet);
  writeData(snippets);

  res.status(201).json(newSnippet);
});

app.post('/api/snippets/:id/like', (req, res) => {
  const snippets = readData();
  const index = snippets.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Snippet not found' });
    return;
  }

  const snippet = snippets[index];
  if (snippet.isLiked) {
    snippet.isLiked = false;
    snippet.likes = Math.max(0, snippet.likes - 1);
  } else {
    snippet.isLiked = true;
    snippet.likes += 1;
  }

  snippets[index] = snippet;
  writeData(snippets);

  res.json(snippet);
});

app.post('/api/snippets/:id/favorite', (req, res) => {
  const snippets = readData();
  const index = snippets.findIndex(s => s.id === req.params.id);

  if (index === -1) {
    res.status(404).json({ error: 'Snippet not found' });
    return;
  }

  const snippet = snippets[index];
  if (snippet.isFavorited) {
    snippet.isFavorited = false;
    snippet.favorites = Math.max(0, snippet.favorites - 1);
  } else {
    snippet.isFavorited = true;
    snippet.favorites += 1;
  }

  snippets[index] = snippet;
  writeData(snippets);

  res.json(snippet);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
