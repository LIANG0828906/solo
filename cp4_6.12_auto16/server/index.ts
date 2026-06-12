import express from 'express';
import cors from 'cors';
import { initDB } from './db';
import instrumentRoutes from './routes/instruments';
import orderRoutes from './routes/orders';

const app = express();
const PORT = 3001;

initDB();

app.use(cors());
app.use(express.json());

app.use('/api', instrumentRoutes);
app.use('/api', orderRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
