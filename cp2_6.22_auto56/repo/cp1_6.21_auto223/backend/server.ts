import express from 'express';
import cors from 'cors';
import projectsRouter from './routes/projects';
import usersRouter from './routes/users';

const app = express();
const PORT = 3099;

app.use(cors());
app.use(express.json());

app.use('/api/projects', projectsRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
