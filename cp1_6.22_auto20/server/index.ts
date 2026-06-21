import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

interface Document {
  id: string;
  title: string;
  summary: string;
  keywords: string[];
  createdAt: number;
}

const documents: Document[] = [];

app.get('/api/documents', (_req, res) => {
  res.json(documents);
});

app.post('/api/documents', (req, res) => {
  const { title, summary, keywords } = req.body;
  if (!title || !summary || !Array.isArray(keywords)) {
    res.status(400).json({ error: 'title, summary, keywords are required' });
    return;
  }
  const doc: Document = {
    id: uuidv4(),
    title: title.slice(0, 100),
    summary: summary.slice(0, 200),
    keywords: keywords.slice(0, 10),
    createdAt: Date.now(),
  };
  documents.push(doc);
  res.status(201).json(doc);
});

app.put('/api/documents/:id', (req, res) => {
  const idx = documents.findIndex(d => d.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  const { title, summary, keywords } = req.body;
  if (title !== undefined) documents[idx].title = title.slice(0, 100);
  if (summary !== undefined) documents[idx].summary = summary.slice(0, 200);
  if (keywords !== undefined) documents[idx].keywords = keywords.slice(0, 10);
  res.json(documents[idx]);
});

app.delete('/api/documents/:id', (req, res) => {
  const idx = documents.findIndex(d => d.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: 'Document not found' });
    return;
  }
  const removed = documents.splice(idx, 1)[0];
  res.json(removed);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
