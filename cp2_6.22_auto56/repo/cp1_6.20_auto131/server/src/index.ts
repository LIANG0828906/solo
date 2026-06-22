import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { searchBooks, getBookById, getReviewsByBookId } from './bookDataStore';
import { analyzeReviews } from './sentimentAnalyzer';

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.get('/api/search', (req, res) => {
  const query = req.query.q as string;
  if (!query) return res.json([]);
  const results = searchBooks(query);
  res.json(results);
});

app.get('/api/books/:id', (req, res) => {
  const book = getBookById(req.params.id);
  if (!book) return res.status(404).json({ error: 'Book not found' });
  res.json(book);
});

app.post('/api/analyze', (req, res) => {
  const { reviews } = req.body as { reviews: string[] };
  if (!reviews || !Array.isArray(reviews)) return res.status(400).json({ error: 'reviews array required' });
  const result = analyzeReviews(reviews);
  res.json(result);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
