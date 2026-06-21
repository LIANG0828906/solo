import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

interface BookmarkNode {
  id: string;
  type: 'folder' | 'bookmark';
  title: string;
  url?: string;
  parentId: string | null;
  children: BookmarkNode[];
  tags: string[];
  source?: string;
  createdAt: number;
  updatedAt: number;
}

interface UndoOperation {
  action: 'create' | 'update' | 'delete' | 'move';
  before: BookmarkNode | BookmarkNode[] | null;
  after: BookmarkNode | BookmarkNode[] | null;
  timestamp: number;
}

interface SearchMatch {
  id: string;
  title: string;
  url?: string;
  tags: string[];
  matches: { field: string; indices: number[] }[];
}

const nodes: Map<string, BookmarkNode> = new Map();
const rootIds: string[] = [];
const tagIndex: Map<string, Set<string>> = new Map();
const urlIndex: Map<string, string> = new Map();
const undoStack: UndoOperation[] = [];

function normalizeUrl(url: string): string {
  try {
    let normalized = url.trim().toLowerCase();
    normalized = normalized.replace(/\/+$/, '');
    normalized = normalized.replace(/^https?:\/\//, '');
    return normalized;
  } catch {
    return url.trim().toLowerCase();
  }
}

function getDomainFromUrl(url: string): string {
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function getAutoTags(url: string): string[] {
  const domain = getDomainFromUrl(url).toLowerCase();
  const tags: string[] = [];
  const rules: { keyword: string; tag: string }[] = [
    { keyword: 'github', tag: 'github' },
    { keyword: 'gist.github', tag: 'github' },
    { keyword: 'youtube', tag: 'youtube' },
    { keyword: 'youtu.be', tag: 'youtube' },
    { keyword: 'news', tag: 'news' },
    { keyword: 'cnn', tag: 'news' },
    { keyword: 'bbc', tag: 'news' },
    { keyword: 'nytimes', tag: 'news' },
    { keyword: 'theguardian', tag: 'news' },
    { keyword: 'docs', tag: 'docs' },
    { keyword: 'documentation', tag: 'docs' },
    { keyword: 'mdn', tag: 'docs' },
    { keyword: 'dev.to', tag: 'dev' },
    { keyword: 'stackoverflow', tag: 'dev' },
    { keyword: 'stackexchange', tag: 'dev' },
    { keyword: 'dev', tag: 'dev' },
    { keyword: 'medium', tag: 'blog' },
    { keyword: 'blog', tag: 'blog' },
    { keyword: 'wordpress', tag: 'blog' },
    { keyword: 'amazon', tag: 'shop' },
    { keyword: 'taobao', tag: 'shop' },
    { keyword: 'tmall', tag: 'shop' },
    { keyword: 'jd.com', tag: 'shop' },
    { keyword: 'ebay', tag: 'shop' },
    { keyword: 'shop', tag: 'shop' },
    { keyword: 'bilibili', tag: 'video' },
    { keyword: 'vimeo', tag: 'video' },
    { keyword: 'video', tag: 'video' },
    { keyword: 'tiktok', tag: 'video' },
    { keyword: 'douyin', tag: 'video' },
    { keyword: 'spotify', tag: 'music' },
    { keyword: 'music', tag: 'music' },
    { keyword: 'netease', tag: 'music' },
    { keyword: 'qq.com/music', tag: 'music' },
    { keyword: 'twitter', tag: 'social' },
    { keyword: 'x.com', tag: 'social' },
    { keyword: 'facebook', tag: 'social' },
    { keyword: 'instagram', tag: 'social' },
    { keyword: 'weibo', tag: 'social' },
    { keyword: 'linkedin', tag: 'social' },
    { keyword: 'social', tag: 'social' },
    { keyword: 'chatgpt', tag: 'ai' },
    { keyword: 'openai', tag: 'ai' },
    { keyword: 'claude', tag: 'ai' },
    { keyword: 'anthropic', tag: 'ai' },
    { keyword: 'gemini', tag: 'ai' },
    { keyword: 'bard', tag: 'ai' },
    { keyword: 'midjourney', tag: 'ai' },
    { keyword: 'ai', tag: 'ai' },
  ];
  for (const rule of rules) {
    if (domain.includes(rule.keyword) || url.toLowerCase().includes(rule.keyword)) {
      if (!tags.includes(rule.tag)) {
        tags.push(rule.tag);
      }
    }
  }
  return tags;
}

function stringSimilarity(a: string, b: string): number {
  const s1 = a.toLowerCase().trim();
  const s2 = b.toLowerCase().trim();
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  const set1 = new Set(s1.split(''));
  const set2 = new Set(s2.split(''));
  let matches = 0;
  for (const char of set1) {
    if (set2.has(char)) matches++;
  }
  const union = new Set([...set1, ...set2]).size;
  const charSimilarity = union === 0 ? 0 : matches / union;
  const len1 = s1.length;
  const len2 = s2.length;
  const maxLen = Math.max(len1, len2);
  const lenSimilarity = 1 - Math.abs(len1 - len2) / maxLen;
  let commonPrefix = 0;
  for (let i = 0; i < Math.min(len1, len2); i++) {
    if (s1[i] === s2[i]) commonPrefix++;
    else break;
  }
  const prefixSimilarity = commonPrefix / maxLen;
  return (charSimilarity * 0.4 + lenSimilarity * 0.2 + prefixSimilarity * 0.4);
}

function buildTree(): BookmarkNode[] {
  const result: BookmarkNode[] = [];
  const nodeMap = new Map<string, BookmarkNode>();
  for (const [id, node] of nodes) {
    nodeMap.set(id, { ...node, children: [] });
  }
  for (const [id, node] of nodeMap) {
    if (node.parentId === null) {
      result.push(node);
    } else {
      const parent = nodeMap.get(node.parentId);
      if (parent) {
        parent.children.push(node);
      }
    }
  }
  const sortNodes = (arr: BookmarkNode[]) => {
    arr.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.title.localeCompare(b.title);
    });
    for (const node of arr) {
      if (node.children.length > 0) {
        sortNodes(node.children);
      }
    }
  };
  sortNodes(result);
  return result;
}

function serializeNode(node: BookmarkNode): BookmarkNode {
  const result: BookmarkNode = { ...node, children: [] };
  for (const [id, n] of nodes) {
    if (n.parentId === node.id) {
      result.children.push(serializeNode(n));
    }
  }
  return result;
}

function parseBookmarkHtml(html: string): { nodes: BookmarkNode[]; rootIds: string[] } {
  const result: BookmarkNode[] = [];
  const roots: string[] = [];
  const stack: { id: string; level: number }[] = [];
  const lines = html.split(/\r?\n/);
  let currentLevel = 0;
  const linkRegex = /<DT><A\s+HREF="([^"]*)"[^>]*>([^<]*)<\/A>/i;
  const folderStartRegex = /<DT><H3[^>]*>([^<]*)<\/H3>/i;
  const folderEndRegex = /<\/DL>/i;
  const dlRegex = /<DL>/i;
  for (const line of lines) {
    const trimmed = line.trim();
    if (dlRegex.test(trimmed)) {
      currentLevel++;
      continue;
    }
    if (folderEndRegex.test(trimmed)) {
      while (stack.length > 0 && stack[stack.length - 1].level >= currentLevel) {
        stack.pop();
      }
      currentLevel--;
      continue;
    }
    const folderMatch = trimmed.match(folderStartRegex);
    if (folderMatch) {
      const title = folderMatch[1].trim();
      const id = uuidv4();
      const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;
      const now = Date.now();
      const node: BookmarkNode = {
        id,
        type: 'folder',
        title,
        parentId,
        children: [],
        tags: [],
        createdAt: now,
        updatedAt: now,
      };
      result.push(node);
      if (parentId === null) roots.push(id);
      stack.push({ id, level: currentLevel });
      continue;
    }
    const linkMatch = trimmed.match(linkRegex);
    if (linkMatch) {
      const url = linkMatch[1].trim();
      const title = linkMatch[2].trim() || url;
      const id = uuidv4();
      const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;
      const now = Date.now();
      const autoTags = getAutoTags(url);
      const node: BookmarkNode = {
        id,
        type: 'bookmark',
        title,
        url,
        parentId,
        children: [],
        tags: autoTags,
        source: 'html-import',
        createdAt: now,
        updatedAt: now,
      };
      result.push(node);
      if (parentId === null) roots.push(id);
      continue;
    }
  }
  return { nodes: result, rootIds: roots };
}

function parseBookmarkJson(jsonStr: string): { nodes: BookmarkNode[]; rootIds: string[] } {
  const result: BookmarkNode[] = [];
  const roots: string[] = [];
  const parsed = JSON.parse(jsonStr);
  const now = Date.now();
  const processNode = (node: any, parentId: string | null) => {
    const id = node.id || uuidv4();
    const type = node.type || (node.url ? 'bookmark' : 'folder');
    const title = node.title || node.name || 'Untitled';
    const bmNode: BookmarkNode = {
      id,
      type,
      title,
      parentId,
      children: [],
      tags: node.tags ? [...node.tags] : [],
      createdAt: node.createdAt || now,
      updatedAt: node.updatedAt || now,
    };
    if (type === 'bookmark' && node.url) {
      bmNode.url = node.url;
      if (bmNode.tags.length === 0) {
        bmNode.tags = getAutoTags(node.url);
      }
    }
    if (node.source) bmNode.source = node.source;
    result.push(bmNode);
    if (parentId === null) roots.push(id);
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        processNode(child, id);
      }
    }
  };
  if (Array.isArray(parsed)) {
    for (const node of parsed) {
      processNode(node, null);
    }
  } else if (parsed.roots && Array.isArray(parsed.roots)) {
    for (const node of parsed.roots) {
      processNode(node, null);
    }
  } else {
    processNode(parsed, null);
  }
  return { nodes: result, rootIds: roots };
}

function generateHtmlExport(nodesList: BookmarkNode[]): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const dateStr = `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>\n`;
  html += `<!-- This is an automatically generated file.\n`;
  html += `     It will be read and overwritten.\n`;
  html += `     DO NOT EDIT! -->\n`;
  html += `<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n`;
  html += `<TITLE>Bookmarks</TITLE>\n`;
  html += `<H1>Bookmarks</H1>\n`;
  html += `<DL><p>\n`;
  const renderNode = (node: BookmarkNode, indent: number) => {
    const prefix = '    '.repeat(indent);
    if (node.type === 'folder') {
      html += `${prefix}<DT><H3>${node.title}</H3>\n`;
      html += `${prefix}<DL><p>\n`;
      const children = Array.from(nodes.values()).filter(n => n.parentId === node.id);
      for (const child of children) {
        renderNode(child, indent + 1);
      }
      html += `${prefix}</DL><p>\n`;
    } else {
      const tags = node.tags.length > 0 ? ` TAGS="${node.tags.join(',')}"` : '';
      html += `${prefix}<DT><A HREF="${node.url || ''}"${tags}>${node.title}</A>\n`;
    }
  };
  const roots = nodesList.filter(n => n.parentId === null);
  for (const root of roots) {
    renderNode(root, 1);
  }
  html += `</DL><p>\n`;
  return html;
}

function generateJsonExport(nodesList: BookmarkNode[]): string {
  const buildSubtree = (parentId: string | null): BookmarkNode[] => {
    const result: BookmarkNode[] = [];
    const children = nodesList.filter(n => n.parentId === parentId);
    for (const child of children) {
      const node: BookmarkNode = { ...child, children: buildSubtree(child.id) };
      result.push(node);
    }
    return result;
  };
  const tree = buildSubtree(null);
  return JSON.stringify({ roots: tree, exportedAt: Date.now() }, null, 2);
}

function addNodeToIndexes(node: BookmarkNode) {
  if (node.url) {
    const normalized = normalizeUrl(node.url);
    urlIndex.set(normalized, node.id);
  }
  for (const tag of node.tags) {
    if (!tagIndex.has(tag)) {
      tagIndex.set(tag, new Set());
    }
    tagIndex.get(tag)!.add(node.id);
  }
}

function removeNodeFromIndexes(node: BookmarkNode) {
  if (node.url) {
    const normalized = normalizeUrl(node.url);
    urlIndex.delete(normalized);
  }
  for (const tag of node.tags) {
    const set = tagIndex.get(tag);
    if (set) {
      set.delete(node.id);
      if (set.size === 0) {
        tagIndex.delete(tag);
      }
    }
  }
}

function getAllDescendants(nodeId: string): string[] {
  const result: string[] = [];
  const collect = (id: string) => {
    result.push(id);
    for (const [nid, node] of nodes) {
      if (node.parentId === id) {
        collect(nid);
      }
    }
  };
  collect(nodeId);
  return result;
}

function isDuplicate(newNode: BookmarkNode, existingNodes: Iterable<BookmarkNode>): BookmarkNode | null {
  if (newNode.type !== 'bookmark' || !newNode.url) return null;
  const newNormalizedUrl = normalizeUrl(newNode.url);
  for (const existing of existingNodes) {
    if (existing.type !== 'bookmark') continue;
    if (existing.url && normalizeUrl(existing.url) === newNormalizedUrl) {
      return existing;
    }
    if (stringSimilarity(existing.title, newNode.title) > 0.85) {
      return existing;
    }
  }
  return null;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/api/import', (req: Request, res: Response) => {
  try {
    const { format, data, targetFolderId } = req.body;
    let parsed: { nodes: BookmarkNode[]; rootIds: string[] };
    if (format === 'html') {
      parsed = parseBookmarkHtml(data);
    } else if (format === 'json') {
      parsed = parseBookmarkJson(data);
    } else {
      res.status(400).json({ success: false, error: 'Unsupported format' });
      return;
    }
    const imported: BookmarkNode[] = [];
    const duplicates: BookmarkNode[] = [];
    const effectiveParentId = targetFolderId || null;
    for (const node of parsed.nodes) {
      if (node.type === 'bookmark') {
        const dup = isDuplicate(node, nodes.values());
        if (dup) {
          duplicates.push(dup);
          continue;
        }
        if (node.tags.length === 0 && node.url) {
          node.tags = getAutoTags(node.url);
        }
      }
      if (effectiveParentId !== null && parsed.rootIds.includes(node.id)) {
        node.parentId = effectiveParentId;
      }
      node.id = uuidv4();
      nodes.set(node.id, node);
      if (node.parentId === null) {
        rootIds.push(node.id);
      }
      addNodeToIndexes(node);
      imported.push(node);
    }
    undoStack.push({
      action: 'create',
      before: null,
      after: imported,
      timestamp: Date.now(),
    });
    res.json({
      success: true,
      imported: imported.length,
      duplicates: duplicates.length,
      bookmarks: imported,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

app.get('/api/bookmarks', (req: Request, res: Response) => {
  res.json({ roots: buildTree() });
});

app.put('/api/bookmarks/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const node = nodes.get(id);
  if (!node) {
    res.status(404).json({ error: 'Node not found' });
    return;
  }
  const before = { ...node, tags: [...node.tags], children: [...node.children] };
  const { title, url, tags, parentId, position } = req.body;
  removeNodeFromIndexes(node);
  if (title !== undefined) node.title = title;
  if (url !== undefined) node.url = url;
  if (tags !== undefined && Array.isArray(tags)) node.tags = tags;
  if (parentId !== undefined) node.parentId = parentId;
  if (position !== undefined) {
    // position handled by buildTree sorting
  }
  node.updatedAt = Date.now();
  addNodeToIndexes(node);
  undoStack.push({
    action: 'update',
    before,
    after: { ...node, tags: [...node.tags], children: [...node.children] },
    timestamp: Date.now(),
  });
  res.json(node);
});

app.delete('/api/bookmarks/:id', (req: Request, res: Response) => {
  const id = req.params.id;
  const node = nodes.get(id);
  if (!node) {
    res.status(404).json({ error: 'Node not found' });
    return;
  }
  const descendants = getAllDescendants(id);
  const deletedNodes: BookmarkNode[] = [];
  for (const did of descendants) {
    const dNode = nodes.get(did);
    if (dNode) {
      removeNodeFromIndexes(dNode);
      deletedNodes.push({ ...dNode });
      nodes.delete(did);
      const rootIdx = rootIds.indexOf(did);
      if (rootIdx !== -1) rootIds.splice(rootIdx, 1);
    }
  }
  undoStack.push({
    action: 'delete',
    before: deletedNodes,
    after: null,
    timestamp: Date.now(),
  });
  res.json({ success: true, deleted: deletedNodes.length });
});

app.post('/api/export', (req: Request, res: Response) => {
  try {
    const { format, scope, folderId } = req.body;
    let exportNodes: BookmarkNode[];
    if (scope === 'folder' && folderId) {
      const descendantIds = getAllDescendants(folderId);
      exportNodes = descendantIds.map(id => nodes.get(id)!).filter(Boolean);
    } else {
      exportNodes = Array.from(nodes.values());
    }
    const timestamp = new Date().toISOString().slice(0, 10);
    let data: string;
    let filename: string;
    if (format === 'html') {
      data = generateHtmlExport(exportNodes);
      filename = `bookmarks_${timestamp}.html`;
    } else {
      data = generateJsonExport(exportNodes);
      filename = `bookmarks_${timestamp}.json`;
    }
    res.json({ format, filename, data });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get('/api/search', (req: Request, res: Response) => {
  const q = (req.query.q as string || '').trim().toLowerCase();
  if (!q) {
    res.json([]);
    return;
  }
  const results: SearchMatch[] = [];
  const findIndices = (text: string, query: string): number[] => {
    const indices: number[] = [];
    const lowerText = text.toLowerCase();
    let idx = lowerText.indexOf(query);
    while (idx !== -1) {
      for (let i = 0; i < query.length; i++) {
        indices.push(idx + i);
      }
      idx = lowerText.indexOf(query, idx + 1);
    }
    return indices;
  };
  for (const node of nodes.values()) {
    if (node.type !== 'bookmark') continue;
    const matches: { field: string; indices: number[] }[] = [];
    const titleMatches = findIndices(node.title, q);
    if (titleMatches.length > 0) {
      matches.push({ field: 'title', indices: titleMatches });
    }
    if (node.url) {
      const urlMatches = findIndices(node.url, q);
      if (urlMatches.length > 0) {
        matches.push({ field: 'url', indices: urlMatches });
      }
    }
    for (const tag of node.tags) {
      if (tag.toLowerCase().includes(q)) {
        matches.push({ field: 'tag', indices: [] });
        break;
      }
    }
    if (matches.length > 0) {
      results.push({
        id: node.id,
        title: node.title,
        url: node.url,
        tags: node.tags,
        matches,
      });
    }
  }
  results.sort((a, b) => {
    const aTitleMatch = a.matches.some(m => m.field === 'title');
    const bTitleMatch = b.matches.some(m => m.field === 'title');
    if (aTitleMatch && !bTitleMatch) return -1;
    if (!aTitleMatch && bTitleMatch) return 1;
    return a.title.localeCompare(b.title);
  });
  res.json(results);
});

function initSampleData() {
  const now = Date.now();
  const devFolder: BookmarkNode = {
    id: uuidv4(),
    type: 'folder',
    title: '开发资源',
    parentId: null,
    children: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  nodes.set(devFolder.id, devFolder);
  rootIds.push(devFolder.id);
  const github: BookmarkNode = {
    id: uuidv4(),
    type: 'bookmark',
    title: 'GitHub',
    url: 'https://github.com',
    parentId: devFolder.id,
    children: [],
    tags: ['github', 'dev'],
    source: 'sample',
    createdAt: now,
    updatedAt: now,
  };
  nodes.set(github.id, github);
  addNodeToIndexes(github);
  const mdn: BookmarkNode = {
    id: uuidv4(),
    type: 'bookmark',
    title: 'MDN Web Docs',
    url: 'https://developer.mozilla.org',
    parentId: devFolder.id,
    children: [],
    tags: ['docs', 'dev'],
    source: 'sample',
    createdAt: now,
    updatedAt: now,
  };
  nodes.set(mdn.id, mdn);
  addNodeToIndexes(mdn);
  const stackoverflow: BookmarkNode = {
    id: uuidv4(),
    type: 'bookmark',
    title: 'Stack Overflow',
    url: 'https://stackoverflow.com',
    parentId: devFolder.id,
    children: [],
    tags: ['dev'],
    source: 'sample',
    createdAt: now,
    updatedAt: now,
  };
  nodes.set(stackoverflow.id, stackoverflow);
  addNodeToIndexes(stackoverflow);
  const aiFolder: BookmarkNode = {
    id: uuidv4(),
    type: 'folder',
    title: 'AI 工具',
    parentId: null,
    children: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  nodes.set(aiFolder.id, aiFolder);
  rootIds.push(aiFolder.id);
  const chatgpt: BookmarkNode = {
    id: uuidv4(),
    type: 'bookmark',
    title: 'ChatGPT',
    url: 'https://chat.openai.com',
    parentId: aiFolder.id,
    children: [],
    tags: ['ai'],
    source: 'sample',
    createdAt: now,
    updatedAt: now,
  };
  nodes.set(chatgpt.id, chatgpt);
  addNodeToIndexes(chatgpt);
  const mediaFolder: BookmarkNode = {
    id: uuidv4(),
    type: 'folder',
    title: '娱乐媒体',
    parentId: null,
    children: [],
    tags: [],
    createdAt: now,
    updatedAt: now,
  };
  nodes.set(mediaFolder.id, mediaFolder);
  rootIds.push(mediaFolder.id);
  const youtube: BookmarkNode = {
    id: uuidv4(),
    type: 'bookmark',
    title: 'YouTube',
    url: 'https://youtube.com',
    parentId: mediaFolder.id,
    children: [],
    tags: ['youtube', 'video'],
    source: 'sample',
    createdAt: now,
    updatedAt: now,
  };
  nodes.set(youtube.id, youtube);
  addNodeToIndexes(youtube);
  const bilibili: BookmarkNode = {
    id: uuidv4(),
    type: 'bookmark',
    title: '哔哩哔哩',
    url: 'https://bilibili.com',
    parentId: mediaFolder.id,
    children: [],
    tags: ['video'],
    source: 'sample',
    createdAt: now,
    updatedAt: now,
  };
  nodes.set(bilibili.id, bilibili);
  addNodeToIndexes(bilibili);
}

initSampleData();

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
