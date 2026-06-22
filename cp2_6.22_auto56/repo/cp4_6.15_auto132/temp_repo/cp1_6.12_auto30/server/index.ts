import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import type { GraphNode, GraphLink, NodeType, LinkType } from '../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, 'data');
const NODES_FILE = path.join(DATA_DIR, 'nodes.json');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');

app.use(express.json());

const ensureDataFiles = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(NODES_FILE)) {
    const initialNodes: GraphNode[] = [
      {
        id: 'node-1',
        type: 'concept' as NodeType,
        title: '知识图谱',
        content: '# 知识图谱\n\n知识图谱是一种**结构化的语义知识库**，用于以符号形式描述物理世界中的概念及其相互关系。\n\n## 核心要素\n- 实体（节点）\n- 关系（边）\n- 属性',
        x: 400,
        y: 300,
      },
      {
        id: 'node-2',
        type: 'article' as NodeType,
        title: '知识图谱构建方法',
        content: '# 知识图谱构建方法\n\n本文介绍了知识图谱的**构建流程**和关键技术。\n\n## 主要步骤\n1. 知识抽取\n2. 知识融合\n3. 知识推理',
        x: 600,
        y: 200,
      },
      {
        id: 'node-3',
        type: 'question' as NodeType,
        title: '如何实现实体链接？',
        content: '# 问题\n\n在知识图谱构建中，**实体链接**是关键步骤，如何高效准确地实现？\n\n## 可能的方案\n- 基于规则的方法\n- 机器学习方法\n- 深度学习方法',
        x: 200,
        y: 200,
      },
      {
        id: 'node-4',
        type: 'person' as NodeType,
        title: '张三',
        content: '# 张三\n\n知识图谱领域研究者，专注于**自然语言处理**和知识抽取。\n\n## 研究方向\n- 知识抽取\n- 实体链接\n- 关系抽取',
        x: 500,
        y: 450,
      },
    ];
    fs.writeFileSync(NODES_FILE, JSON.stringify(initialNodes, null, 2));
  }
  if (!fs.existsSync(LINKS_FILE)) {
    const initialLinks: GraphLink[] = [
      { id: 'link-1', source: 'node-1', target: 'node-2', type: 'references' as LinkType },
      { id: 'link-2', source: 'node-2', target: 'node-3', type: 'contains' as LinkType },
      { id: 'link-3', source: 'node-4', target: 'node-2', type: 'inspired_by' as LinkType },
    ];
    fs.writeFileSync(LINKS_FILE, JSON.stringify(initialLinks, null, 2));
  }
};

const readNodes = (): GraphNode[] => {
  ensureDataFiles();
  return JSON.parse(fs.readFileSync(NODES_FILE, 'utf-8'));
};

const writeNodes = (nodes: GraphNode[]) => {
  fs.writeFileSync(NODES_FILE, JSON.stringify(nodes, null, 2));
};

const readLinks = (): GraphLink[] => {
  ensureDataFiles();
  return JSON.parse(fs.readFileSync(LINKS_FILE, 'utf-8'));
};

const writeLinks = (links: GraphLink[]) => {
  fs.writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2));
};

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.get('/api/graph', (req, res) => {
  try {
    const nodes = readNodes();
    const links = readLinks();
    res.json({ nodes, links });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load graph data' });
  }
});

app.get('/api/nodes', (req, res) => {
  try {
    const nodes = readNodes();
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load nodes' });
  }
});

app.post('/api/nodes', (req, res) => {
  try {
    const { type, title, content, x, y } = req.body;
    if (!type || !title) {
      return res.status(400).json({ error: 'Type and title are required' });
    }
    const nodes = readNodes();
    const newNode: GraphNode = {
      id: uuidv4(),
      type,
      title,
      content: content || '',
      x: x ?? Math.random() * 600 + 100,
      y: y ?? Math.random() * 400 + 100,
    };
    nodes.push(newNode);
    writeNodes(nodes);
    res.json(newNode);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create node' });
  }
});

app.put('/api/nodes/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const nodes = readNodes();
    const index = nodes.findIndex(n => n.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Node not found' });
    }
    nodes[index] = { ...nodes[index], ...updates };
    writeNodes(nodes);
    res.json(nodes[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update node' });
  }
});

app.delete('/api/nodes/:id', (req, res) => {
  try {
    const { id } = req.params;
    let nodes = readNodes();
    const nodeIndex = nodes.findIndex(n => n.id === id);
    if (nodeIndex === -1) {
      return res.status(404).json({ error: 'Node not found' });
    }
    nodes = nodes.filter(n => n.id !== id);
    writeNodes(nodes);

    let links = readLinks();
    links = links.filter(l => l.source !== id && l.target !== id);
    writeLinks(links);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete node' });
  }
});

app.get('/api/links', (req, res) => {
  try {
    const links = readLinks();
    res.json(links);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load links' });
  }
});

app.post('/api/links', (req, res) => {
  try {
    const { source, target, type } = req.body;
    if (!source || !target || !type) {
      return res.status(400).json({ error: 'Source, target and type are required' });
    }
    const links = readLinks();
    const exists = links.some(l =>
      (l.source === source && l.target === target) ||
      (l.source === target && l.target === source)
    );
    if (exists) {
      return res.status(400).json({ error: 'Link already exists' });
    }
    const newLink: GraphLink = {
      id: uuidv4(),
      source,
      target,
      type,
    };
    links.push(newLink);
    writeLinks(links);
    res.json(newLink);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create link' });
  }
});

app.put('/api/links/:id', (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const links = readLinks();
    const index = links.findIndex(l => l.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Link not found' });
    }
    links[index] = { ...links[index], ...updates };
    writeLinks(links);
    res.json(links[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update link' });
  }
});

app.delete('/api/links/:id', (req, res) => {
  try {
    const { id } = req.params;
    let links = readLinks();
    const linkIndex = links.findIndex(l => l.id === id);
    if (linkIndex === -1) {
      return res.status(404).json({ error: 'Link not found' });
    }
    links = links.filter(l => l.id !== id);
    writeLinks(links);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  ensureDataFiles();
});
