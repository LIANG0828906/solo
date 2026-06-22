import express from 'express';
import cors from 'cors';
import clientRoutes from './modules/clients/clientRoutes.js';
import exerciseRoutes from './modules/exercises/exerciseRoutes.js';
import trainingPlanRoutes from './modules/training/trainingPlanRoutes.js';
import trackingRoutes from './modules/tracking/trackingRoutes.js';
import reportingRoutes from './modules/reporting/reportingRoutes.js';
import { getDb } from './shared/db.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/clients', clientRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/trainingPlans', trainingPlanRoutes);
app.use('/api/sessions', trackingRoutes);
app.use('/api/reports', reportingRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: '服务器内部错误' });
});

getDb().then(() => {
  console.log('Database initialized');
}).catch((err) => {
  console.error('Database initialization failed:', err);
});

export default app;
