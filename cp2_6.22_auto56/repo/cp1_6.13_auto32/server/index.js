import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let users = [];
let snippets = [];
let favorites = [];

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: '未授权访问' });
  }
  const userId = authHeader.split(' ')[1];
  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(401).json({ success: false, message: '用户不存在' });
  }
  req.user = user;
  next();
};

const seedData = () => {
  const now = new Date().toISOString();

  const user1 = {
    id: uuidv4(),
    username: 'alice',
    password: bcrypt.hashSync('password123', 10),
    createdAt: now,
    updatedAt: now
  };

  const user2 = {
    id: uuidv4(),
    username: 'bob',
    password: bcrypt.hashSync('password123', 10),
    createdAt: now,
    updatedAt: now
  };

  const user3 = {
    id: uuidv4(),
    username: 'charlie',
    password: bcrypt.hashSync('password123', 10),
    createdAt: now,
    updatedAt: now
  };

  users.push(user1, user2, user3);

  const snippet1 = {
    id: uuidv4(),
    title: 'JavaScript 数组去重',
    language: 'javascript',
    content: `function unique(arr) {
  return [...new Set(arr)];
}`,
    visibility: 'public',
    tags: ['数组', '去重', 'ES6'],
    authorId: user1.id,
    authorName: user1.username,
    createdAt: now,
    updatedAt: now
  };

  const snippet2 = {
    id: uuidv4(),
    title: 'React useState Hook',
    language: 'javascript',
    content: `import { useState } from 'react';

function Counter() {
  const [count, setCount] = useState(0);
  return (
    <button onClick={() => setCount(count + 1)}>
      点击次数: {count}
    </button>
  );
}`,
    visibility: 'public',
    tags: ['React', 'Hook', '组件'],
    authorId: user1.id,
    authorName: user1.username,
    createdAt: now,
    updatedAt: now
  };

  const snippet3 = {
    id: uuidv4(),
    title: 'Python 快速排序',
    language: 'python',
    content: `def quicksort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)`,
    visibility: 'public',
    tags: ['排序', '算法', '递归'],
    authorId: user2.id,
    authorName: user2.username,
    createdAt: now,
    updatedAt: now
  };

  const snippet4 = {
    id: uuidv4(),
    title: 'CSS Flexbox 布局',
    language: 'css',
    content: `.container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
}

.item {
  flex: 1;
  min-width: 200px;
}`,
    visibility: 'public',
    tags: ['CSS', '布局', 'Flexbox'],
    authorId: user2.id,
    authorName: user2.username,
    createdAt: now,
    updatedAt: now
  };

  const snippet5 = {
    id: uuidv4(),
    title: 'TypeScript 接口定义',
    language: 'typescript',
    content: `interface User {
  id: string;
  username: string;
  email: string;
  age?: number;
}

function greetUser(user: User): string {
  return \`Hello, \${user.username}!\`;
}`,
    visibility: 'public',
    tags: ['TypeScript', '接口', '类型'],
    authorId: user3.id,
    authorName: user3.username,
    createdAt: now,
    updatedAt: now
  };

  const snippet6 = {
    id: uuidv4(),
    title: 'Node.js 文件读取',
    language: 'javascript',
    content: `const fs = require('fs/promises');

async function readFileAsync(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf8');
    return data;
  } catch (error) {
    console.error('读取文件失败:', error);
    throw error;
  }
}`,
    visibility: 'public',
    tags: ['Node.js', '文件', '异步'],
    authorId: user3.id,
    authorName: user3.username,
    createdAt: now,
    updatedAt: now
  };

  snippets.push(snippet1, snippet2, snippet3, snippet4, snippet5, snippet6);

  favorites.push({
    id: uuidv4(),
    userId: user1.id,
    snippetId: snippet3.id,
    createdAt: now
  });

  favorites.push({
    id: uuidv4(),
    userId: user2.id,
    snippetId: snippet1.id,
    createdAt: now
  });
};

seedData();

app.post('/api/auth/register', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ success: false, message: '用户名长度必须在3-20个字符之间' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: '密码长度至少6位' });
  }

  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).json({ success: false, message: '用户名已存在' });
  }

  const now = new Date().toISOString();
  const newUser = {
    id: uuidv4(),
    username,
    password: bcrypt.hashSync(password, 10),
    createdAt: now,
    updatedAt: now
  };

  users.push(newUser);

  res.status(201).json({
    success: true,
    data: {
      id: newUser.id,
      username: newUser.username,
      createdAt: newUser.createdAt
    },
    message: '注册成功'
  });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: '用户名和密码不能为空' });
  }

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  }

  res.json({
    success: true,
    data: {
      token: user.id,
      user: {
        id: user.id,
        username: user.username
      }
    },
    message: '登录成功'
  });
});

app.get('/api/snippets', (req, res) => {
  const { search, language } = req.query;

  let result = snippets.filter(s => s.visibility === 'public');

  if (search) {
    const searchLower = search.toLowerCase();
    result = result.filter(s =>
      s.title.toLowerCase().includes(searchLower) ||
      s.content.toLowerCase().includes(searchLower) ||
      s.tags.some(t => t.toLowerCase().includes(searchLower))
    );
  }

  if (language) {
    result = result.filter(s => s.language === language);
  }

  result = result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    data: result
  });
});

app.get('/api/snippets/mine', authMiddleware, (req, res) => {
  const userSnippets = snippets
    .filter(s => s.authorId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({
    success: true,
    data: userSnippets
  });
});

app.get('/api/snippets/:id', (req, res) => {
  const snippet = snippets.find(s => s.id === req.params.id);

  if (!snippet) {
    return res.status(404).json({ success: false, message: '片段不存在' });
  }

  if (snippet.visibility !== 'public') {
    return res.status(404).json({ success: false, message: '片段不存在' });
  }

  res.json({
    success: true,
    data: snippet
  });
});

app.post('/api/snippets', authMiddleware, (req, res) => {
  const { title, language, content, visibility, tags } = req.body;

  if (!title || !language || !content) {
    return res.status(400).json({ success: false, message: '标题、语言和内容不能为空' });
  }

  const now = new Date().toISOString();
  const newSnippet = {
    id: uuidv4(),
    title,
    language,
    content,
    visibility: visibility || 'public',
    tags: tags || [],
    authorId: req.user.id,
    authorName: req.user.username,
    createdAt: now,
    updatedAt: now
  };

  snippets.push(newSnippet);

  res.status(201).json({
    success: true,
    data: newSnippet,
    message: '创建成功'
  });
});

app.put('/api/snippets/:id', authMiddleware, (req, res) => {
  const snippetIndex = snippets.findIndex(s => s.id === req.params.id);

  if (snippetIndex === -1) {
    return res.status(404).json({ success: false, message: '片段不存在' });
  }

  const snippet = snippets[snippetIndex];

  if (snippet.authorId !== req.user.id) {
    return res.status(403).json({ success: false, message: '无权编辑此片段' });
  }

  const { title, language, content, visibility, tags } = req.body;

  const updatedSnippet = {
    ...snippet,
    title: title !== undefined ? title : snippet.title,
    language: language !== undefined ? language : snippet.language,
    content: content !== undefined ? content : snippet.content,
    visibility: visibility !== undefined ? visibility : snippet.visibility,
    tags: tags !== undefined ? tags : snippet.tags,
    updatedAt: new Date().toISOString()
  };

  snippets[snippetIndex] = updatedSnippet;

  res.json({
    success: true,
    data: updatedSnippet,
    message: '更新成功'
  });
});

app.get('/api/favorites', authMiddleware, (req, res) => {
  const userFavorites = favorites.filter(f => f.userId === req.user.id);
  const favoriteSnippets = userFavorites
    .map(f => snippets.find(s => s.id === f.snippetId))
    .filter(s => s && s.visibility === 'public');

  res.json({
    success: true,
    data: favoriteSnippets
  });
});

app.post('/api/favorites/:snippetId', authMiddleware, (req, res) => {
  const snippet = snippets.find(s => s.id === req.params.snippetId);

  if (!snippet) {
    return res.status(404).json({ success: false, message: '片段不存在' });
  }

  const existingFavorite = favorites.find(
    f => f.userId === req.user.id && f.snippetId === req.params.snippetId
  );

  if (existingFavorite) {
    return res.status(400).json({ success: false, message: '已收藏此片段' });
  }

  const now = new Date().toISOString();
  const newFavorite = {
    id: uuidv4(),
    userId: req.user.id,
    snippetId: req.params.snippetId,
    createdAt: now
  };

  favorites.push(newFavorite);

  res.status(201).json({
    success: true,
    data: newFavorite,
    message: '收藏成功'
  });
});

app.delete('/api/favorites/:snippetId', authMiddleware, (req, res) => {
  const favoriteIndex = favorites.findIndex(
    f => f.userId === req.user.id && f.snippetId === req.params.snippetId
  );

  if (favoriteIndex === -1) {
    return res.status(404).json({ success: false, message: '未收藏此片段' });
  }

  favorites.splice(favoriteIndex, 1);

  res.json({
    success: true,
    message: '取消收藏成功'
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
