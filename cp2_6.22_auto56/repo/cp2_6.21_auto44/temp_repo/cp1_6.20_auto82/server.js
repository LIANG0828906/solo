import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const COLLAB_COLORS = ['#f06292', '#ba68c8', '#ff8a65', '#aed581', '#4dd0e1', '#ffd54f', '#7986cb', '#4db6ac'];
const collaborators = new Map();
const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

function readGraphs() {
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    try {
      return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8'));
    } catch {
      return null;
    }
  }).filter(Boolean);
}

function readGraph(id) {
  const fp = path.join(DATA_DIR, `${id}.json`);
  if (!fs.existsSync(fp)) return null;
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf-8'));
  } catch {
    return null;
  }
}

function writeGraph(graph) {
  fs.writeFileSync(path.join(DATA_DIR, `${graph.id}.json`), JSON.stringify(graph, null, 2));
}

function genRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

function seedIfEmpty() {
  const existing = readGraphs();
  if (existing.length > 0) return;

  const demoGraphs = [
    {
      name: '产品架构示例',
      nodes: [
        { id: 'n1', title: '用户界面层', description: '前端用户交互层，包含Web和移动端', tags: ['前端', 'UI'], color: '#4fc3f7', x: -300, y: -80 },
        { id: 'n2', title: 'API 网关', description: '统一入口，负责路由、鉴权、限流', tags: ['后端', '网关'], color: '#ffb74d', x: 0, y: -80 },
        { id: 'n3', title: '业务服务层', description: '微服务集群，处理核心业务逻辑', tags: ['后端', '服务'], color: '#81c784', x: 300, y: -80 },
        { id: 'n4', title: '数据访问层', description: '数据库访问、缓存、消息队列', tags: ['数据', '存储'], color: '#ce93d8', x: 150, y: 100 },
        { id: 'n5', title: '前端组件库', description: '可复用的React/Vue组件集合', tags: ['前端', '组件'], color: '#4fc3f7', x: -450, y: 100 },
        { id: 'n6', title: '状态管理', description: 'Redux/Zustand全局状态管理方案', tags: ['前端', '状态'], color: '#4fc3f7', x: -150, y: 100 }
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2', type: 'dependency' },
        { id: 'e2', source: 'n2', target: 'n3', type: 'dependency' },
        { id: 'e3', source: 'n3', target: 'n4', type: 'dependency' },
        { id: 'e4', source: 'n5', target: 'n1', type: 'derived' },
        { id: 'e5', source: 'n6', target: 'n1', type: 'related' },
        { id: 'e6', source: 'n4', target: 'n2', type: 'related' }
      ]
    },
    {
      name: '前端学习路线',
      nodes: [
        { id: 'a1', title: 'HTML/CSS', description: '网页结构与样式基础', tags: ['基础'], color: '#4fc3f7', x: -400, y: -60 },
        { id: 'a2', title: 'JavaScript', description: 'ES6+语法与异步编程', tags: ['语言'], color: '#ffb74d', x: -100, y: -60 },
        { id: 'a3', title: 'React 框架', description: '组件化开发与Hooks', tags: ['框架'], color: '#81c784', x: 200, y: -60 },
        { id: 'a4', title: 'TypeScript', description: '类型安全的JavaScript超集', tags: ['语言'], color: '#ce93d8', x: -250, y: 100 },
        { id: 'a5', title: '工程化', description: 'Vite/Webpack构建与CI/CD', tags: ['工具'], color: '#80cbc4', x: 50, y: 100 },
        { id: 'a6', title: '状态管理', description: 'Zustand/Redux全局状态', tags: ['框架'], color: '#fff176', x: 350, y: 100 }
      ],
      edges: [
        { id: 'ea1', source: 'a1', target: 'a2', type: 'derived' },
        { id: 'ea2', source: 'a2', target: 'a3', type: 'dependency' },
        { id: 'ea3', source: 'a2', target: 'a4', type: 'derived' },
        { id: 'ea4', source: 'a4', target: 'a3', type: 'related' },
        { id: 'ea5', source: 'a3', target: 'a5', type: 'related' },
        { id: 'ea6', source: 'a3', target: 'a6', type: 'related' }
      ]
    }
  ];

  const now = Date.now();
  demoGraphs.forEach(demo => {
    const id = uuidv4();
    const nodes = demo.nodes.map(n => ({ ...n, createdAt: now, updatedAt: now }));
    const edges = demo.edges.map(e => ({ ...e, createdAt: now }));
    writeGraph({
      id,
      name: demo.name,
      roomCode: genRoomCode(),
      nodes,
      edges,
      createdAt: now,
      updatedAt: now,
      version: 1
    });
  });
}

seedIfEmpty();

app.get('/api/graphs', (req, res) => {
  const graphs = readGraphs().map(g => ({
    id: g.id,
    name: g.name,
    roomCode: g.roomCode,
    nodes: g.nodes,
    edges: g.edges,
    createdAt: g.createdAt,
    updatedAt: g.updatedAt,
    version: g.version
  }));
  res.json(graphs);
});

app.get('/api/graphs/:id', (req, res) => {
  const g = readGraph(req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  res.json(g);
});

app.post('/api/graphs', (req, res) => {
  const now = Date.now();
  const id = uuidv4();
  const graph = {
    id,
    name: req.body?.name || '未命名图谱',
    roomCode: genRoomCode(),
    nodes: [],
    edges: [],
    createdAt: now,
    updatedAt: now,
    version: 1
  };
  writeGraph(graph);
  res.json(graph);
});

app.put('/api/graphs/:id', (req, res) => {
  const existing = readGraph(req.params.id);
  if (!existing) return res.status(404).json({ error: 'not found' });
  const updated = {
    ...req.body,
    id: existing.id,
    roomCode: existing.roomCode,
    version: (existing.version || 0) + 1,
    updatedAt: Date.now()
  };
  writeGraph(updated);
  res.json(updated);
});

app.get('/api/graphs/:id/poll', (req, res) => {
  const g = readGraph(req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  const clientVersion = Number(req.query.version) || 0;
  const graphCollabs = Array.from((collaborators.get(req.params.id) || new Map()).values())
    .filter(c => Date.now() - c.lastSeen < 15000);
  const response = {
    version: g.version,
    collaborators: graphCollabs
  };
  if (g.version > clientVersion) {
    response.graph = g;
  }
  res.json(response);
});

app.post('/api/graphs/:id/join', (req, res) => {
  const g = readGraph(req.params.id);
  if (!g) return res.status(404).json({ error: 'not found' });
  if (req.body?.roomCode && g.roomCode.toLowerCase() !== String(req.body.roomCode).toLowerCase()) {
    return res.status(403).json({ error: 'invalid room code' });
  }
  if (!collaborators.has(req.params.id)) collaborators.set(req.params.id, new Map());
  const map = collaborators.get(req.params.id);
  const id = uuidv4().slice(0, 8);
  const color = COLLAB_COLORS[map.size % COLLAB_COLORS.length];
  const col = {
    id,
    name: req.body?.userName || '匿名用户',
    color,
    activeNodeId: null,
    lastSeen: Date.now()
  };
  map.set(id, col);
  res.json({ collaboratorId: id, graph: g });
});

app.post('/api/graphs/:id/activity', (req, res) => {
  const map = collaborators.get(req.params.id);
  if (!map) return res.json({ success: false });
  const col = map.get(req.body?.collaboratorId);
  if (col) {
    col.activeNodeId = req.body?.activeNodeId || null;
    col.lastSeen = Date.now();
  }
  res.json({ success: true });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 知识图谱协作后端已启动: http://localhost:${PORT}`);
});
