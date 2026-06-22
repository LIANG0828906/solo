import express from 'express';
import cors from 'cors';
import bookmarks from './data.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/bookmarks', (req, res) => {
  const { search, tag } = req.query;
  
  let result = [...bookmarks];
  
  if (search && typeof search === 'string') {
    const keyword = search.toLowerCase();
    result = result.filter(b => 
      b.title.toLowerCase().includes(keyword) || 
      b.summary.toLowerCase().includes(keyword)
    );
  }
  
  if (tag && typeof tag === 'string') {
    result = result.filter(b => b.tags.includes(tag));
  }
  
  res.json(result);
});

app.get('/api/tags', (_req, res) => {
  const tagSet = new Set();
  bookmarks.forEach(b => b.tags.forEach(t => tagSet.add(t)));
  res.json(Array.from(tagSet).sort());
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
