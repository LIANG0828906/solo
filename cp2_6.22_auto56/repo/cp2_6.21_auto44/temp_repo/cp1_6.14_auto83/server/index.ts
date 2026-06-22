import express, { type Request, type Response } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

import authRoutes from './routes/auth.js';
import resourcesRoutes from './routes/resources.js';
import reportsRoutes from './routes/reports.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const uploadsDir = path.join(__dirname, '..', 'uploads');
await fs.mkdir(path.join(uploadsDir, 'thumbnails'), { recursive: true });
await fs.mkdir(path.join(uploadsDir, 'diffs'), { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.use('/api/auth', authRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/reports', reportsRoutes);

app.get('/api/health', (_req: Request, res: Response): void => {
  res.json({ success: true, message: 'PixelVault API running' });
});

app.use((_req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'API not found' });
});

app.listen(PORT, () => {
  console.log(`[server] PixelVault API listening on port ${PORT}`);
});
