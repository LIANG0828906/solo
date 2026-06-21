import express from 'express';
import cors from 'cors';
import usersRouter from './routes/users.js';
import poemsRouter from './routes/poems.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/users', usersRouter);
app.use('/api/poems', poemsRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
