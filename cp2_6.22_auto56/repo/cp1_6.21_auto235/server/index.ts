import express from 'express';
import cors from 'cors';
import booksRouter from './routes/books';
import usersRouter from './routes/users';
import messagesRouter from './routes/messages';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/books', booksRouter);
app.use('/api/users', usersRouter);
app.use('/api/messages', messagesRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
