import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import batchRoutes from './routes/batches.js';
import './db.js';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api', batchRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'BeanTrace API is running' });
});

app.listen(PORT, () => {
  console.log(`BeanTrace server running on http://localhost:${PORT}`);
});

export default app;
