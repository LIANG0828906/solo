import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import booksRouter from './routes/books.js';
import lendingRouter from './routes/lending.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', booksRouter);
app.use('/api', lendingRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Library API is running' });
});

app.listen(PORT, () => {
  console.log(`Library server is running on http://localhost:${PORT}`);
});

export default app;
