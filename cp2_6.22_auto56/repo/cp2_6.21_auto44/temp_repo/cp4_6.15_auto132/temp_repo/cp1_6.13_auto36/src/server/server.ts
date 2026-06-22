import express, { Request, Response } from 'express';
import cors from 'cors';
import eventRoutes from './routes/eventRoutes';
import checkinRoutes from './routes/checkinRoutes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/events', eventRoutes);
app.use('/api/checkins', checkinRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, req: Request, res: Response) => {
  console.error('Server error:', err);
  res.status(500).json({ message: '服务器内部错误' });
});

app.listen(PORT, () => {
  console.log(`🚀 EventSnap server is running on port ${PORT}`);
  console.log(`📍 API endpoint: http://localhost:${PORT}/api`);
  console.log(`📋 Events: http://localhost:${PORT}/api/events`);
  console.log(`✅ Check-ins: http://localhost:${PORT}/api/checkins`);
});
