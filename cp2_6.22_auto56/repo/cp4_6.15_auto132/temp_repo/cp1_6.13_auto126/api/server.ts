import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors({ origin: 'http://localhost:3000' }));
app.use(bodyParser.json());

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  wordCount: number;
}

interface DataStore {
  notes: Note[];
}

function loadData(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
  return { notes: [] };
}

function saveData(data: DataStore): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

let store = loadData();

function parseLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const titles: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    titles.push(match[1]);
  }
  return titles;
}

function computeWordCount(content: string): number {
  return content.replace(/\[\[[^\]]+\]\]/g, '').replace(/[#*_`>\-\[\]()!]/g, '').trim().length;
}

function extractTags(content: string): string[] {
  const hashRegex = /(?:^|\s)#([a-zA-Z\u4e00-\u9fff][a-zA-Z0-9\u4e00-\u9fff_]*)/g;
  const tags: string[] = [];
  let match;
  while ((match = hashRegex.exec(content)) !== null) {
    tags.push(match[1]);
  }
  return tags;
}

function getIncomingLinks(noteId: string): Note[] {
  const target = store.notes.find(n => n.id === noteId);
  if (!target) return [];
  return store.notes.filter(n => {
    const linkedTitles = parseLinks(n.content);
    return linkedTitles.includes(target.title);
  });
}

function getOutgoingLinks(noteId: string): Note[] {
  const source = store.notes.find(n => n.id === noteId);
  if (!source) return [];
  const linkedTitles = parseLinks(source.content);
  return store.notes.filter(n => linkedTitles.includes(n.title));
}

function getReferenceCount(noteId: string): number {
  return getIncomingLinks(noteId).length;
}

function calculateSimilarity(noteA: Note, noteB: Note): number {
  const tagsA = new Set(noteA.tags);
  const tagsB = new Set(noteB.tags);
  const intersection = new Set([...tagsA].filter(t => tagsB.has(t)));
  const union = new Set([...tagsA, ...tagsB]);
  const tagSimilarity = union.size > 0 ? intersection.size / union.size : 0;

  const outA = getOutgoingLinks(noteA.id);
  const outB = getOutgoingLinks(noteB.id);
  const inA = getIncomingLinks(noteA.id);
  const inB = getIncomingLinks(noteB.id);
  const sharedOut = outA.filter(n => outB.some(m => m.id === n.id)).length;
  const sharedIn = inA.filter(n => inB.some(m => m.id === n.id)).length;
  const linkSimilarity = (sharedOut + sharedIn) > 0 ? (sharedOut + sharedIn) / ((outA.length + outB.length + inA.length + inB.length) || 1) : 0;

  const directLink = outA.some(n => n.id === noteB.id) || inA.some(n => n.id === noteB.id) ? 0.3 : 0;

  return tagSimilarity * 0.4 + linkSimilarity * 0.3 + directLink;
}

// API Routes

app.get('/api/notes', (_req, res) => {
  const sorted = [...store.notes].sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  res.json(sorted);
});

app.get('/api/notes/:id', (req, res) => {
  const note = store.notes.find(n => n.id === req.params.id);
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  const incoming = getIncomingLinks(note.id);
  const outgoing = getOutgoingLinks(note.id);
  res.json({
    ...note,
    links: {
      incoming,
      outgoing,
      incomingCount: incoming.length,
      outgoingCount: outgoing.length,
    },
  });
});

app.post('/api/notes', (req, res) => {
  const { title, content } = req.body;
  if (!title) {
    res.status(400).json({ error: 'Title is required' });
    return;
  }
  const now = new Date().toISOString();
  const note: Note = {
    id: uuidv4(),
    title,
    content: content || '',
    tags: extractTags(content || ''),
    createdAt: now,
    updatedAt: now,
    wordCount: computeWordCount(content || ''),
  };
  store.notes.push(note);
  saveData(store);
  res.status(201).json(note);
});

app.put('/api/notes/:id', (req, res) => {
  const idx = store.notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  const { title, content } = req.body;
  const now = new Date().toISOString();
  store.notes[idx] = {
    ...store.notes[idx],
    title: title !== undefined ? title : store.notes[idx].title,
    content: content !== undefined ? content : store.notes[idx].content,
    tags: content !== undefined ? extractTags(content) : store.notes[idx].tags,
    updatedAt: now,
    wordCount: content !== undefined ? computeWordCount(content) : store.notes[idx].wordCount,
  };
  saveData(store);
  const note = store.notes[idx];
  const incoming = getIncomingLinks(note.id);
  const outgoing = getOutgoingLinks(note.id);
  res.json({
    ...note,
    links: {
      incoming,
      outgoing,
      incomingCount: incoming.length,
      outgoingCount: outgoing.length,
    },
  });
});

app.delete('/api/notes/:id', (req, res) => {
  const idx = store.notes.findIndex(n => n.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  store.notes.splice(idx, 1);
  saveData(store);
  res.json({ success: true });
});

app.get('/api/notes/:id/links', (req, res) => {
  const note = store.notes.find(n => n.id === req.params.id);
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  const incoming = getIncomingLinks(note.id);
  const outgoing = getOutgoingLinks(note.id);
  res.json({
    incoming,
    outgoing,
    incomingCount: incoming.length,
    outgoingCount: outgoing.length,
  });
});

app.get('/api/notes/:id/recommendations', (req, res) => {
  const note = store.notes.find(n => n.id === req.params.id);
  if (!note) {
    res.status(404).json({ error: 'Note not found' });
    return;
  }
  const scored = store.notes
    .filter(n => n.id !== note.id)
    .map(n => {
      const score = calculateSimilarity(note, n);
      let reason = '';
      const sharedTags = note.tags.filter(t => n.tags.includes(t));
      if (sharedTags.length > 0) {
        reason = `共享标签: ${sharedTags.join(', ')}`;
      }
      const outLinks = getOutgoingLinks(note.id);
      const inLinks = getIncomingLinks(note.id);
      if (outLinks.some(l => l.id === n.id)) {
        reason = reason ? reason + '；当前笔记引用了该笔记' : '当前笔记引用了该笔记';
      }
      if (inLinks.some(l => l.id === n.id)) {
        reason = reason ? reason + '；该笔记引用了当前笔记' : '该笔记引用了当前笔记';
      }
      if (!reason) {
        reason = '关联度较高';
      }
      return { note: n, score, reason };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
  res.json(scored);
});

app.get('/api/search', (req, res) => {
  const q = (req.query.q as string || '').toLowerCase().trim();
  if (!q) {
    res.json([]);
    return;
  }
  const results = store.notes
    .map(note => {
      let relevance = 0;
      const matchedFields: string[] = [];
      if (note.title.toLowerCase().includes(q)) {
        relevance += 10;
        matchedFields.push('title');
      }
      if (note.content.toLowerCase().includes(q)) {
        const count = (note.content.toLowerCase().match(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        relevance += count * 2;
        matchedFields.push('content');
      }
      note.tags.forEach(tag => {
        if (tag.toLowerCase().includes(q)) {
          relevance += 5;
          matchedFields.push('tags');
        }
      });
      return { note, relevance, matchedFields };
    })
    .filter(r => r.relevance > 0)
    .sort((a, b) => b.relevance - a.relevance);
  res.json(results);
});

app.get('/api/graph', (_req, res) => {
  const nodes = store.notes.map(note => ({
    id: note.id,
    title: note.title,
    refCount: getReferenceCount(note.id),
  }));
  const links: { source: string; target: string }[] = [];
  store.notes.forEach(note => {
    const linkedTitles = parseLinks(note.content);
    linkedTitles.forEach(title => {
      const target = store.notes.find(n => n.title === title);
      if (target && target.id !== note.id) {
        links.push({ source: note.id, target: target.id });
      }
    });
  });
  res.json({ nodes, links });
});

const initialNotes: { title: string; content: string }[] = [
  {
    title: '知识管理方法论',
    content: '# 知识管理方法论\n\n知识管理是将个人或组织的知识资源进行系统化管理的过程。\n\n## 核心原则\n\n1. **收集**：从多种渠道获取信息 #方法论\n2. **整理**：分类、标签、链接 #组织\n3. **应用**：将知识转化为行动\n4. **分享**：促进知识流通\n\n相关笔记：[[双向链接]]、[[第二大脑]]\n\n> 知识只有被使用，才能真正成为你的知识。',
  },
  {
    title: '双向链接',
    content: '# 双向链接\n\n双向链接是知识图谱笔记系统的核心特性，当笔记A引用笔记B时，B也能自动发现A的引用。\n\n## 优势\n\n- 发现隐藏关联 #方法论\n- 构建知识网络\n- 促进知识复用\n\n使用 `[[笔记标题]]` 语法创建链接。\n\n相关：[[知识管理方法论]]、[[图谱可视化]]',
  },
  {
    title: '第二大脑',
    content: '# 第二大脑\n\n第二大脑是一个外部的知识管理系统，帮助你和你的想法之间的桥梁。\n\n## 为什么需要第二大脑\n\n- 大脑用于思考，而非存储 #效率\n- 信息过载时代需要外部系统\n- 知识的长期积累和复用\n\n构建方法：[[知识管理方法论]]\n\n工具特性：[[双向链接]]、[[图谱可视化]]、[[智能推荐]]',
  },
  {
    title: '图谱可视化',
    content: '# 图谱可视化\n\n图谱可视化将笔记之间的关联以图形方式呈现，帮助直觉理解知识结构。\n\n## 力导向图\n\n- 节点表示笔记\n- 边表示引用关系\n- 节点大小反映被引用次数 #可视化\n\n相关：[[双向链接]]',
  },
  {
    title: '智能推荐',
    content: '# 智能推荐\n\n基于标签相似度和引用关系的综合推荐系统。\n\n## 推荐算法\n\n1. 标签Jaccard相似度（权重40%）\n2. 引用关系相似度（权重30%）\n3. 直接链接加分（权重30%）\n\n相关：[[知识管理方法论]]、[[第二大脑]]',
  },
  {
    title: 'Markdown写作',
    content: '# Markdown写作\n\nMarkdown是一种轻量级标记语言，用纯文本格式编写文档。\n\n## 常用语法\n\n- `#` 标题\n- `**粗体**` 粗体\n- `*斜体*` 斜体\n- `[[链接]]` 双向链接 #写作\n- `#标签` 标签分类\n\n相关：[[双向链接]]、[[知识管理方法论]]',
  },
];

if (store.notes.length === 0) {
  const now = new Date().toISOString();
  initialNotes.forEach((item, i) => {
    const note: Note = {
      id: uuidv4(),
      title: item.title,
      content: item.content,
      tags: extractTags(item.content),
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(Date.now() - i * 60000).toISOString(),
      wordCount: computeWordCount(item.content),
    };
    store.notes.push(note);
  });
  saveData(store);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
