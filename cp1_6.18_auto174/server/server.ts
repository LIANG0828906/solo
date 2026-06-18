import express from 'express';
import cors from 'cors';
import capsuleRoutes from './routes/capsuleRoutes.js';
import { startScheduler } from './engine/schedulerEngine.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', capsuleRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Emotion Time Capsule API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startScheduler();
  console.log('Scheduler started');
});

export default app;
