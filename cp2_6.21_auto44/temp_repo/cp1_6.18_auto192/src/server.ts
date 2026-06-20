import express, { Request, Response } from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const DATA_DIR = path.resolve(__dirname, '..', 'data');

app.use(cors());
app.use(express.json());

const MOVIES_FILE = path.join(DATA_DIR, 'movies.json');
const REVIEWS_FILE = path.join(DATA_DIR, 'reviews.json');

interface Movie {
  id: string;
  title: string;
  year: number;
  director: string;
  poster: string;
  overview: string;
}

interface Review {
  id: string;
  movieId: string;
  text: string;
  rating: number;
  createdAt: string;
}

function readJSONFile<T>(filePath: string): T {
  const data = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(data) as T;
}

function writeJSONFile<T>(filePath: string, data: T): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

app.get('/api/movies/search', (req: Request, res: Response) => {
  const q = (req.query.q as string) || '';
  const movies = readJSONFile<Movie[]>(MOVIES_FILE);
  
  if (!q.trim()) {
    return res.json(movies);
  }
  
  const query = q.toLowerCase();
  const filtered = movies.filter(
    (m) =>
      m.title.toLowerCase().includes(query) ||
      m.director.toLowerCase().includes(query) ||
      m.year.toString().includes(query)
  );
  
  res.json(filtered);
});

app.get('/api/movies/:id', (req: Request, res: Response) => {
  const movies = readJSONFile<Movie[]>(MOVIES_FILE);
  const movie = movies.find((m) => m.id === req.params.id);
  
  if (!movie) {
    return res.status(404).json({ error: '电影未找到' });
  }
  
  res.json(movie);
});

app.get('/api/reviews', (req: Request, res: Response) => {
  const movieId = req.query.movieId as string;
  const reviews = readJSONFile<Review[]>(REVIEWS_FILE);
  
  if (movieId) {
    const filtered = reviews.filter((r) => r.movieId === movieId);
    return res.json(filtered);
  }
  
  res.json(reviews);
});

app.get('/api/reviews/stats', (req: Request, res: Response) => {
  const movieId = req.query.movieId as string;
  const reviews = readJSONFile<Review[]>(REVIEWS_FILE);
  
  if (!movieId) {
    return res.status(400).json({ error: '缺少movieId参数' });
  }
  
  const movieReviews = reviews.filter((r) => r.movieId === movieId);
  
  if (movieReviews.length === 0) {
    return res.json({ averageRating: 0, totalReviews: 0 });
  }
  
  const totalRating = movieReviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalRating / movieReviews.length;
  
  res.json({
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: movieReviews.length,
  });
});

app.post('/api/reviews', (req: Request, res: Response) => {
  const { movieId, text, rating } = req.body;
  
  if (!movieId || !text || !rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: '参数无效' });
  }
  
  const reviews = readJSONFile<Review[]>(REVIEWS_FILE);
  const newReview: Review = {
    id: uuidv4(),
    movieId,
    text,
    rating,
    createdAt: new Date().toISOString(),
  };
  
  reviews.push(newReview);
  writeJSONFile(REVIEWS_FILE, reviews);
  
  res.status(201).json(newReview);
});

app.put('/api/reviews/:id', (req: Request, res: Response) => {
  const { text, rating } = req.body;
  const reviews = readJSONFile<Review[]>(REVIEWS_FILE);
  const index = reviews.findIndex((r) => r.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '影评未找到' });
  }
  
  if (text !== undefined) {
    reviews[index].text = text;
  }
  if (rating !== undefined && rating >= 1 && rating <= 5) {
    reviews[index].rating = rating;
  }
  
  writeJSONFile(REVIEWS_FILE, reviews);
  res.json(reviews[index]);
});

app.delete('/api/reviews/:id', (req: Request, res: Response) => {
  const reviews = readJSONFile<Review[]>(REVIEWS_FILE);
  const index = reviews.findIndex((r) => r.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: '影评未找到' });
  }
  
  reviews.splice(index, 1);
  writeJSONFile(REVIEWS_FILE, reviews);
  
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`影评聚焦后端服务器运行在 http://localhost:${PORT}`);
});
