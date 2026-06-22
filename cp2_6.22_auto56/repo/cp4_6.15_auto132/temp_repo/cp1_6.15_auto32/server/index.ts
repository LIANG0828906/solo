import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dataStore, Book, ExchangeRequest } from './data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/books', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const sort = (req.query.sort as string) || 'newest';
  const result = dataStore.getBooks(page, limit, sort);
  res.json(result);
});

app.get('/api/books/:id', (req, res) => {
  const book = dataStore.getBookById(req.params.id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  res.json(book);
});

app.post('/api/books', (req, res) => {
  const bookData = req.body as Omit<Book, 'id' | 'createdAt'>;
  const newBook = dataStore.createBook(bookData);
  res.status(201).json({ id: newBook.id });
});

app.put('/api/books/:id', (req, res) => {
  const updates = req.body as Partial<Book>;
  const success = dataStore.updateBook(req.params.id, updates);
  res.json({ success });
});

app.delete('/api/books/:id', (req, res) => {
  const success = dataStore.deleteBook(req.params.id);
  res.json({ success });
});

app.post('/api/books/:id/exchange', (req, res) => {
  const book = dataStore.getBookById(req.params.id);
  if (!book) {
    res.status(404).json({ error: 'Book not found' });
    return;
  }
  const exchangeData = req.body as Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>;
  const newExchange = dataStore.createExchange({ ...exchangeData, bookId: req.params.id });
  res.status(201).json({ id: newExchange.id });
});

app.post('/api/exchanges', (req, res) => {
  const exchangeData = req.body as Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>;
  const newExchange = dataStore.createExchange(exchangeData);
  res.status(201).json({ id: newExchange.id });
});

app.get('/api/user/profile', (req, res) => {
  const profile = dataStore.getUserProfile();
  const userBooks = dataStore.getUserBooks();
  const exchanges = dataStore.getExchangesByUser(profile.id);
  res.json({
    profile,
    stats: {
      totalListings: userBooks.length,
      successfulExchanges: exchanges.filter(e => e.status === 'completed').length,
      rating: profile.rating,
    },
  });
});

app.get('/api/user/books', (req, res) => {
  const books = dataStore.getUserBooks();
  res.json({ books });
});

app.get('/api/user/exchanges', (req, res) => {
  const profile = dataStore.getUserProfile();
  const exchanges = dataStore.getExchangesByUser(profile.id);
  res.json({ exchanges });
});

app.get('/api/user/favorites', (req, res) => {
  const books = dataStore.getFavoriteBooks();
  res.json({ books });
});

app.post('/api/user/favorites/:bookId', (req, res) => {
  const result = dataStore.toggleFavorite(req.params.bookId);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
