import express from 'express';
import cors from 'cors';
import filesRouter from './routes/files.js';
import authRouter from './routes/auth.js';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', filesRouter);
app.use('/api', authRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Audio Mixer Server is running' });
});

app.listen(PORT, () => {
  console.log(`Audio Mixer Server running on http://localhost:${PORT}`);
});

export default app;
