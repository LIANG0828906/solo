import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import router from './routes.js';
import { seedData } from './services.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api', router);

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

seedData();

app.listen(PORT, () => {
  console.log(`📚 Book Drifting Server running on http://localhost:${PORT}`);
});
