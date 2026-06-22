import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

const dataDir = path.join(process.cwd(), 'server', 'data');
const nodesPath = path.join(dataDir, 'nodes.json');
const relationsPath = path.join(dataDir, 'relations.json');

interface NodeData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

interface RelationData {
  id: string;
  source: string;
  target: string;
  type: string;
}

const readJSON = (filePath: string): any[] => {
  try {
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writeJSON = (filePath: string, data: any[]): void => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

app.get('/api/nodes', (_req, res) => {
  const nodes = readJSON(nodesPath);
  res.json(nodes);
});

app.post('/api/nodes', (req, res) => {
  const nodes = readJSON(nodesPath) as NodeData[];
  const { title, content, tags } = req.body;
  const newNode: NodeData = {
    id: uuidv4(),
    title: title || '新笔记',
    content: content || '',
    tags: tags || [],
    createdAt: new Date().toISOString()
  };
  nodes.push(newNode);
  writeJSON(nodesPath, nodes);
  res.status(201).json(newNode);
});

app.put('/api/nodes/:id', (req, res) => {
  const nodes = readJSON(nodesPath) as NodeData[];
  const { id } = req.params;
  const index = nodes.findIndex(n => n.id === id);
  if (index === -1) {
    res.status(404).json({ error: '节点不存在' });
    return;
  }
  nodes[index] = { ...nodes[index], ...req.body, id };
  writeJSON(nodesPath, nodes);
  res.json(nodes[index]);
});

app.delete('/api/nodes/:id', (req, res) => {
  const nodes = readJSON(nodesPath) as NodeData[];
  const relations = readJSON(relationsPath) as RelationData[];
  const { id } = req.params;
  const newNodes = nodes.filter(n => n.id !== id);
  const newRelations = relations.filter(r => r.source !== id && r.target !== id);
  writeJSON(nodesPath, newNodes);
  writeJSON(relationsPath, newRelations);
  res.json({ success: true });
});

app.get('/api/relations', (_req, res) => {
  const relations = readJSON(relationsPath);
  res.json(relations);
});

app.post('/api/relations', (req, res) => {
  const relations = readJSON(relationsPath) as RelationData[];
  const { source, target, type } = req.body;
  const exists = relations.some(
    r => r.source === source && r.target === target && r.type === type
  );
  if (exists) {
    res.status(400).json({ error: '关系已存在' });
    return;
  }
  const newRelation: RelationData = {
    id: uuidv4(),
    source,
    target,
    type: type || '引用'
  };
  relations.push(newRelation);
  writeJSON(relationsPath, relations);
  res.status(201).json(newRelation);
});

app.delete('/api/relations/:id', (req, res) => {
  const relations = readJSON(relationsPath) as RelationData[];
  const { id } = req.params;
  const newRelations = relations.filter(r => r.id !== id);
  writeJSON(relationsPath, newRelations);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
