import express from 'express';
import cors from 'cors';
import crypto from 'crypto';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface StoredMovie {
  id: string;
  title: string;
  year: number;
  director: string;
  rating: number;
  review: string;
  posterColor: string;
  watchDate: string;
  order: number;
}

let moviesDatabase: StoredMovie[] = [];

function hashStringToColor(str: string): string {
  const hash = crypto.createHash('md5').update(str).digest('hex');
  const r = parseInt(hash.substring(0, 2), 16);
  const g = parseInt(hash.substring(2, 4), 16);
  const b = parseInt(hash.substring(4, 6), 16);
  const adjustedR = Math.round(r * 0.4 + 80);
  const adjustedG = Math.round(g * 0.4 + 80);
  const adjustedB = Math.round(b * 0.4 + 80);
  return `rgb(${adjustedR}, ${adjustedG}, ${adjustedB})`;
}

app.get('/api/poster', (req, res) => {
  const title = req.query.title as string;
  const year = Number(req.query.year) || new Date().getFullYear();

  if (!title) {
    return res.status(400).json({ error: '电影名称不能为空' });
  }

  const posterColor = hashStringToColor(title + year);
  const currentYear = new Date().getFullYear();
  const groupYear = year <= currentYear ? year : currentYear;

  res.json({
    posterColor,
    groupYear
  });
});

app.post('/api/movies', (req, res) => {
  const { id, title, year, director, rating, review, posterColor, watchDate, order } = req.body;
  const newMovie: StoredMovie = {
    id,
    title,
    year,
    director,
    rating,
    review,
    posterColor,
    watchDate: watchDate || new Date().toISOString().split('T')[0],
    order: order ?? moviesDatabase.length
  };
  moviesDatabase.push(newMovie);
  res.status(201).json(newMovie);
});

app.get('/api/movies', (_req, res) => {
  res.json(moviesDatabase);
});

app.put('/api/movies/:id', (req, res) => {
  const { id } = req.params;
  const index = moviesDatabase.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '电影不存在' });
  }
  moviesDatabase[index] = { ...moviesDatabase[index], ...req.body };
  res.json(moviesDatabase[index]);
});

app.delete('/api/movies/:id', (req, res) => {
  const { id } = req.params;
  const index = moviesDatabase.findIndex(m => m.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '电影不存在' });
  }
  const deleted = moviesDatabase.splice(index, 1)[0];
  res.json(deleted);
});

app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
