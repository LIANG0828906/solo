import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import Datastore from 'nedb';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import type { GraphNode, GraphEdge, KnowledgeGraph, Note, HistorySnapshot } from '../types';

const app = express();
const PORT = 3001;
const MAX_HISTORY = 50;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const notesDB = new Datastore({ filename: path.join(DATA_DIR, 'notes.db'), autoload: true });
const graphDB = new Datastore({ filename: path.join(DATA_DIR, 'graph.db'), autoload: true });
const historyDB = new Datastore({ filename: path.join(DATA_DIR, 'history.db'), autoload: true });

const TECH_TERMS = [
  'React', 'TypeScript', 'JavaScript', 'Node.js', 'Express', 'D3.js', 'Vue', 'Angular',
  'Python', 'Java', 'Go', 'Rust', 'Docker', 'Kubernetes', 'MongoDB', 'MySQL', 'PostgreSQL',
  'Redis', 'GraphQL', 'REST', 'API', 'Git', 'Linux', 'Nginx', 'AWS', 'GCP', 'Azure',
  'Vite', 'Webpack', 'Babel', 'npm', 'yarn', 'pnpm', 'Jest', 'Mocha', 'Cypress',
  'Redux', 'Zustand', 'MobX', 'Tailwind', 'Sass', 'LESS', 'WebGL', 'Canvas', 'SVG',
  'HTTP', 'HTTPS', 'WebSocket', 'TCP', 'UDP', 'OAuth', 'JWT', 'SSL', 'TLS',
  '微服务', '单体架构', '事件驱动', 'CQRS', 'DDD', 'MVC', 'MVVM', '设计模式',
  '算法', '数据结构', '机器学习', '深度学习', '神经网络', 'AI', 'LLM', 'RAG',
];

const RELATION_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /(?:属于|归类于|是.*的一种|是一种)/g, label: '属于' },
  { pattern: /(?:依赖|基于|需要|取决于|使用|运用)/g, label: '依赖' },
  { pattern: /(?:影响|决定|导致|造成|引起)/g, label: '影响' },
  { pattern: /(?:包含|包括|由.*组成|含有)/g, label: '包含' },
  { pattern: /(?:改进|优化|提升|增强)/g, label: '改进' },
  { pattern: /(?:替代|替换|取代)/g, label: '替代' },
  { pattern: /(?:关联|相关|联系)/g, label: '关联' },
  { pattern: /(?:学习|研究|掌握)/g, label: '学习' },
];

function extractTextFromMarkdown(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]*`/g, ' ')
    .replace(/!\[.*?\]\(.*?\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#+\s+/gm, ' ')
    .replace(/^[-*+]\s+/gm, ' ')
    .replace(/^\d+\.\s+/gm, ' ')
    .replace(/[>_*~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTitle(content: string): string {
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) return titleMatch[1].trim();
  const firstLine = content.split('\n').find(l => l.trim().length > 0);
  return firstLine ? firstLine.trim().slice(0, 50) : '未命名笔记';
}

function detectEntityType(label: string): GraphNode['type'] {
  if (/^(?:张|李|王|赵|刘|陈|杨|黄|周|吴|徐|孙|胡|朱|高|林|何|郭|马|罗)/.test(label) ||
      /^[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)*$/.test(label) && label.length > 3) {
    return 'person';
  }
  const lowerLabel = label.toLowerCase();
  if (TECH_TERMS.some(t => t.toLowerCase() === lowerLabel || lowerLabel.includes(t.toLowerCase()))) {
    return 'tech';
  }
  if (/(?:项目|系统|平台|应用|APP|App|产品)/.test(label)) {
    return 'project';
  }
  if (/(?:算法|模式|模型|架构|理论|方法|原则)/.test(label)) {
    return 'concept';
  }
  return 'other';
}

function extractKeywords(text: string): string[] {
  const keywords: Set<string> = new Set();
  
  for (const term of TECH_TERMS) {
    if (text.includes(term)) {
      keywords.add(term);
    }
  }
  
  const cjkPattern = /[\u4e00-\u9fa5]{2,8}/g;
  let match;
  while ((match = cjkPattern.exec(text)) !== null) {
    const word = match[0];
    if (!/^(?:的|了|和|与|及|或|在|是|为|对|从|到|把|被|让|给|向|往|由|于|以|因|为|所|以|不|也|都|就|又|还|再|很|更|最|这|那|哪|什|么|怎|样|如|果|虽|然|但|是|而|且|并|如|其|实|非|常|一|个|些|每|各|某|其|他|我|你|他|她|它|我|们|你|们|他|们)$/.test(word)) {
      keywords.add(word);
    }
  }
  
  const codePattern = /[A-Z][a-zA-Z0-9]+(?:[A-Z][a-zA-Z0-9]+)*|\b[a-z]+(?:[-_][a-z]+)+\b/g;
  while ((match = codePattern.exec(text)) !== null) {
    const word = match[0];
    if (word.length >= 3 && !/^(?:the|and|for|with|from|into|about|than|then|this|that|these|those|have|has|had|will|would|could|should|may|might|must|shall|can|need|dare|ought|used)$/i.test(word)) {
      keywords.add(word);
    }
  }
  
  return Array.from(keywords).slice(0, 50);
}

function extractRelations(text: string, entities: string[]): Array<{ source: string; target: string; label: string; count: number }> {
  const relations: Array<{ source: string; target: string; label: string; count: number }> = [];
  const relationMap = new Map<string, { label: string; count: number }>();
  
  const sentences = text.split(/[。！？.!?;\n]+/);
  
  for (const sentence of sentences) {
    const sentenceEntities = entities.filter(e => sentence.includes(e));
    
    if (sentenceEntities.length >= 2) {
      for (const { pattern, label } of RELATION_PATTERNS) {
        if (pattern.test(sentence)) {
          for (let i = 0; i < sentenceEntities.length; i++) {
            for (let j = 0; j < sentenceEntities.length; j++) {
              if (i !== j) {
                const source = sentenceEntities[i];
                const target = sentenceEntities[j];
                const key = `${source}__${target}__${label}`;
                const existing = relationMap.get(key);
                if (existing) {
                  existing.count++;
                } else {
                  relationMap.set(key, { label, count: 1 });
                }
              }
            }
          }
        }
      }
      
      for (let i = 0; i < sentenceEntities.length; i++) {
        for (let j = i + 1; j < sentenceEntities.length; j++) {
          const key = `${sentenceEntities[i]}__${sentenceEntities[j]}__cooccur`;
          const reverseKey = `${sentenceEntities[j]}__${sentenceEntities[i]}__cooccur`;
          if (!relationMap.has(key) && !relationMap.has(reverseKey)) {
            relationMap.set(key, { label: '共现', count: 1 });
          } else {
            const existing = relationMap.get(key) || relationMap.get(reverseKey);
            if (existing) existing.count++;
          }
        }
      }
    }
  }
  
  for (const [key, value] of relationMap.entries()) {
    const [source, target, label] = key.split('__');
    relations.push({ source, target, label: value.label === 'cooccur' ? '共现' : value.label, count: value.count });
  }
  
  return relations;
}

function computeSemanticSimilarity(text1: string, text2: string, fullText: string): number {
  const words1 = new Set(extractKeywords(text1));
  const words2 = new Set(extractKeywords(text2));
  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);
  if (union.size === 0) return 0;
  return intersection.size / union.size;
}

function parseNoteToGraph(content: string, existingGraph?: KnowledgeGraph): { graph: KnowledgeGraph; note: Note } {
  const noteId = uuidv4();
  const now = Date.now();
  const title = extractTitle(content);
  const text = extractTextFromMarkdown(content);
  const keywords = extractKeywords(text);
  
  const note: Note = {
    id: noteId,
    content,
    createdAt: now,
    updatedAt: now,
    title,
  };
  
  const currentGraph = existingGraph || { nodes: [], edges: [] };
  const nodeMap = new Map<string, GraphNode>();
  const edgeMap = new Map<string, GraphEdge>();
  
  for (const node of currentGraph.nodes) {
    nodeMap.set(node.label, { ...node, notes: node.notes ? [...node.notes] : [] });
  }
  
  for (const edge of currentGraph.edges) {
    const sourceLabel = typeof edge.source === 'string' ? edge.source : (edge.source as GraphNode).label;
    const targetLabel = typeof edge.target === 'string' ? edge.target : (edge.target as GraphNode).label;
    edgeMap.set(`${sourceLabel}__${targetLabel}__${edge.label}`, {
      ...edge,
      source: sourceLabel,
      target: targetLabel,
    });
  }
  
  for (const keyword of keywords) {
    if (!nodeMap.has(keyword)) {
      nodeMap.set(keyword, {
        id: uuidv4(),
        label: keyword,
        type: detectEntityType(keyword),
        notes: [noteId],
        summary: `从笔记"${title}"中提取的实体`,
      });
    } else {
      const node = nodeMap.get(keyword)!;
      if (!node.notes) node.notes = [];
      if (!node.notes.includes(noteId)) {
        node.notes.push(noteId);
      }
    }
  }
  
  const keywordLabels = keywords;
  const extractedRelations = extractRelations(text, keywordLabels);
  
  const allNodeLabels = Array.from(nodeMap.keys());
  
  for (const rel of extractedRelations) {
    const key = `${rel.source}__${rel.target}__${rel.label}`;
    const reverseKey = `${rel.target}__${rel.source}__${rel.label}`;
    
    if (edgeMap.has(key)) {
      const existing = edgeMap.get(key)!;
      existing.cooccurrenceCount += rel.count;
    } else if (edgeMap.has(reverseKey)) {
      const existing = edgeMap.get(reverseKey)!;
      existing.cooccurrenceCount += rel.count;
    } else {
      const similarity = computeSemanticSimilarity(rel.source, rel.target, text);
      const baseStrength = Math.min(1, (rel.count * 0.2) + similarity);
      
      edgeMap.set(key, {
        id: uuidv4(),
        source: rel.source,
        target: rel.target,
        label: rel.label,
        strength: baseStrength,
        cooccurrenceCount: rel.count,
      });
    }
  }
  
  const nodes = Array.from(nodeMap.values());
  let edges = Array.from(edgeMap.values());
  
  if (edges.length > 0) {
    const maxCount = Math.max(...edges.map(e => e.cooccurrenceCount));
    edges = edges.map(e => ({
      ...e,
      strength: Math.min(1, (e.cooccurrenceCount / maxCount) * 0.7 + e.strength * 0.3),
    }));
  }
  
  const labelToId = new Map(nodes.map(n => [n.label, n.id]));
  edges = edges.map(e => ({
    ...e,
    source: labelToId.get(typeof e.source === 'string' ? e.source : (e.source as GraphNode).label) || e.source,
    target: labelToId.get(typeof e.target === 'string' ? e.target : (e.target as GraphNode).label) || e.target,
  }));
  
  return {
    graph: { nodes, edges },
    note,
  };
}

async function getCurrentGraph(): Promise<KnowledgeGraph> {
  return new Promise((resolve, reject) => {
    graphDB.findOne({ id: 'current' }, (err, doc) => {
      if (err) return reject(err);
      if (doc) {
        resolve(doc.graph as KnowledgeGraph);
      } else {
        resolve({ nodes: [], edges: [] });
      }
    });
  });
}

async function saveGraph(graph: KnowledgeGraph): Promise<void> {
  return new Promise((resolve, reject) => {
    graphDB.update({ id: 'current' }, { id: 'current', graph }, { upsert: true }, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function saveNote(note: Note): Promise<void> {
  return new Promise((resolve, reject) => {
    notesDB.insert(note, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

async function createSnapshot(graph: KnowledgeGraph, description?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    notesDB.find({}, (err, notes) => {
      if (err) return reject(err);
      
      const snapshotId = uuidv4();
      const snapshot: HistorySnapshot = {
        id: snapshotId,
        timestamp: Date.now(),
        graph: JSON.parse(JSON.stringify(graph)),
        notes: notes as Note[],
        description,
      };
      
      historyDB.insert(snapshot, (insertErr) => {
        if (insertErr) return reject(insertErr);
        
        historyDB.find({}).sort({ timestamp: 1 }).exec((findErr, allSnapshots) => {
          if (findErr) return reject(findErr);
          
          const count = allSnapshots.length;
          if (count > MAX_HISTORY) {
            const toDelete = allSnapshots.slice(0, count - MAX_HISTORY);
            const idsToDelete = toDelete.map(s => s._id);
            historyDB.remove({ _id: { $in: idsToDelete } }, { multi: true }, (removeErr) => {
              if (removeErr) return reject(removeErr);
              resolve(snapshotId);
            });
          } else {
            resolve(snapshotId);
          }
        });
      });
    });
  });
}

app.post('/api/notes', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: '笔记内容不能为空' });
    }
    
    const existingGraph = await getCurrentGraph();
    const { graph, note } = parseNoteToGraph(content, existingGraph);
    
    await saveNote(note);
    await saveGraph(graph);
    const snapshotId = await createSnapshot(graph, `解析笔记: ${note.title}`);
    
    res.json({ graph, note, snapshotId });
  } catch (error) {
    console.error('Error parsing note:', error);
    res.status(500).json({ error: '解析笔记失败' });
  }
});

app.get('/api/graph', async (req, res) => {
  try {
    const graph = await getCurrentGraph();
    res.json(graph);
  } catch (error) {
    console.error('Error getting graph:', error);
    res.status(500).json({ error: '获取图谱失败' });
  }
});

app.post('/api/graph/update', async (req, res) => {
  try {
    const { graph } = req.body as { graph: KnowledgeGraph };
    if (!graph || !Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
      return res.status(400).json({ error: '无效的图谱数据' });
    }
    
    const cleanGraph: KnowledgeGraph = {
      nodes: graph.nodes.map(n => ({
        id: n.id,
        label: n.label,
        type: n.type,
        category: n.category,
        notes: n.notes,
        summary: n.summary,
      })),
      edges: graph.edges.map(e => ({
        id: e.id,
        source: typeof e.source === 'object' ? (e.source as GraphNode).id : e.source,
        target: typeof e.target === 'object' ? (e.target as GraphNode).id : e.target,
        label: e.label,
        strength: e.strength,
        cooccurrenceCount: e.cooccurrenceCount,
      })),
    };
    
    await saveGraph(cleanGraph);
    const snapshotId = await createSnapshot(cleanGraph, '手动编辑图谱');
    
    res.json({ success: true, snapshotId });
  } catch (error) {
    console.error('Error updating graph:', error);
    res.status(500).json({ error: '保存图谱失败' });
  }
});

app.get('/api/history', async (req, res) => {
  try {
    historyDB.find({}).sort({ timestamp: -1 }).limit(MAX_HISTORY).exec((err, docs) => {
      if (err) {
        console.error('Error getting history:', err);
        return res.status(500).json({ error: '获取历史版本失败' });
      }
      const snapshots = docs.map(d => ({
        id: (d as any).id,
        timestamp: (d as any).timestamp,
        description: (d as any).description,
        graph: (d as any).graph,
        notes: (d as any).notes,
      })) as HistorySnapshot[];
      res.json(snapshots);
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: '获取历史版本失败' });
  }
});

app.post('/api/history/rollback', async (req, res) => {
  try {
    const { snapshotId } = req.body as { snapshotId: string };
    if (!snapshotId) {
      return res.status(400).json({ error: '快照ID不能为空' });
    }
    
    historyDB.findOne({ id: snapshotId }, async (err, doc) => {
      if (err) {
        console.error('Error finding snapshot:', err);
        return res.status(500).json({ error: '查找快照失败' });
      }
      if (!doc) {
        return res.status(404).json({ error: '快照不存在' });
      }
      
      const snapshot = doc as any;
      await saveGraph(snapshot.graph as KnowledgeGraph);
      await createSnapshot(snapshot.graph as KnowledgeGraph, `回退到版本: ${snapshot.description || snapshotId.slice(0, 8)}`);
      
      res.json({ success: true, graph: snapshot.graph });
    });
  } catch (error) {
    console.error('Error rolling back:', error);
    res.status(500).json({ error: '回退版本失败' });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Knowledge Graph Server running on http://localhost:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
});
