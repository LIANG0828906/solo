import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, 'data');
const codesFile = path.join(dataDir, 'codes.json');
const foldersFile = path.join(dataDir, 'folders.json');

function readJSON(filePath: string) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(raw);
}

function writeJSON(filePath: string, data: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/codes', (_req, res) => {
  const codes = readJSON(codesFile);
  res.json(codes);
});

app.get('/api/codes/:id', (req, res) => {
  const codes = readJSON(codesFile);
  const code = codes.find((c: { id: string }) => c.id === req.params.id);
  if (!code) return res.status(404).json({ error: 'Not found' });
  res.json(code);
});

app.post('/api/codes', (req, res) => {
  const codes = readJSON(codesFile);
  const newCode = {
    id: uuidv4(),
    title: req.body.title || '未命名代码',
    language: req.body.language || 'javascript',
    description: req.body.description || '',
    code: req.body.code || '',
    folderId: req.body.folderId || '',
    createdAt: new Date().toISOString(),
  };
  codes.unshift(newCode);
  writeJSON(codesFile, codes);
  res.status(201).json(newCode);
});

app.put('/api/codes/:id', (req, res) => {
  const codes = readJSON(codesFile);
  const idx = codes.findIndex((c: { id: string }) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  codes[idx] = { ...codes[idx], ...req.body, id: codes[idx].id };
  writeJSON(codesFile, codes);
  res.json(codes[idx]);
});

app.delete('/api/codes/:id', (req, res) => {
  let codes = readJSON(codesFile);
  const idx = codes.findIndex((c: { id: string }) => c.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = codes.splice(idx, 1)[0];
  writeJSON(codesFile, codes);
  res.json(deleted);
});

app.get('/api/folders', (_req, res) => {
  const folders = readJSON(foldersFile);
  const codes = readJSON(codesFile);
  const foldersWithCount = folders.map((f: { id: string; name: string; createdAt: string }) => ({
    ...f,
    count: codes.filter((c: { folderId: string }) => c.folderId === f.id).length,
  }));
  res.json(foldersWithCount);
});

app.post('/api/folders', (req, res) => {
  const folders = readJSON(foldersFile);
  const newFolder = {
    id: uuidv4(),
    name: req.body.name || '新文件夹',
    createdAt: new Date().toISOString(),
  };
  folders.push(newFolder);
  writeJSON(foldersFile, folders);
  res.status(201).json({ ...newFolder, count: 0 });
});

app.put('/api/folders/:id', (req, res) => {
  const folders = readJSON(foldersFile);
  const idx = folders.findIndex((f: { id: string }) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  folders[idx] = { ...folders[idx], ...req.body, id: folders[idx].id };
  writeJSON(foldersFile, folders);
  res.json(folders[idx]);
});

app.delete('/api/folders/:id', (req, res) => {
  let folders = readJSON(foldersFile);
  const idx = folders.findIndex((f: { id: string }) => f.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  const deleted = folders.splice(idx, 1)[0];
  writeJSON(foldersFile, folders);
  res.json(deleted);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
