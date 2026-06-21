import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.join(__dirname, 'data.json');

const app = express();
app.use(cors());
app.use(express.json());

function readData() {
  const raw = fs.readFileSync(DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

app.get('/api/books', (req, res) => {
  const data = readData();
  res.json({ success: true, data: data.books });
});

app.get('/api/books/:bookId/excerpts', (req, res) => {
  const { bookId } = req.params;
  const data = readData();
  const excerpts = data.excerpts
    .filter(e => e.bookId === bookId)
    .sort((a, b) => a.order - b.order);
  res.json({ success: true, data: excerpts });
});

app.post('/api/books/:bookId/excerpts', (req, res) => {
  const { bookId } = req.params;
  const { content, insight, tags, order } = req.body;
  const data = readData();

  const newExcerpt = {
    id: uuidv4(),
    bookId,
    content,
    insight,
    tags,
    order: order ?? data.excerpts.filter(e => e.bookId === bookId).length,
    createdAt: new Date().toISOString()
  };

  data.excerpts.push(newExcerpt);
  writeData(data);
  res.json({ success: true, data: newExcerpt });
});

app.delete('/api/excerpts/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const excerpt = data.excerpts.find(e => e.id === id);
  
  if (!excerpt) {
    return res.status(404).json({ success: false, error: 'Excerpt not found' });
  }

  data.excerpts = data.excerpts.filter(e => e.id !== id);
  
  data.excerpts
    .filter(e => e.bookId === excerpt.bookId && e.order > excerpt.order)
    .forEach(e => e.order--);

  writeData(data);
  res.json({ success: true });
});

app.put('/api/excerpts/:id/reorder', (req, res) => {
  const { id } = req.params;
  const { order } = req.body;
  const data = readData();
  const excerpt = data.excerpts.find(e => e.id === id);

  if (!excerpt) {
    return res.status(404).json({ success: false, error: 'Excerpt not found' });
  }

  const oldOrder = excerpt.order;
  const newOrder = order;

  data.excerpts
    .filter(e => e.bookId === excerpt.bookId)
    .forEach(e => {
      if (e.id === id) {
        e.order = newOrder;
      } else if (oldOrder < newOrder && e.order > oldOrder && e.order <= newOrder) {
        e.order--;
      } else if (oldOrder > newOrder && e.order >= newOrder && e.order < oldOrder) {
        e.order++;
      }
    });

  writeData(data);
  res.json({ success: true });
});

app.get('/api/books/:bookId/tags', (req, res) => {
  const { bookId } = req.params;
  const data = readData();
  const excerpts = data.excerpts.filter(e => e.bookId === bookId);
  
  const tagCount = {};
  excerpts.forEach(e => {
    e.tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    });
  });

  const tags = Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count);

  res.json({ success: true, data: tags });
});

const PORT = 3002;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
