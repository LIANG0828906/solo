import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { initDb } from './db/index.js';
import customersRouter from './routes/customers.js';
import receiptsRouter from './routes/receipts.js';
import statementsRouter from './routes/statements.js';
import dashboardRouter from './routes/dashboard.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() }
  });
});

app.use('/api/customers', customersRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/statements', statementsRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

async function startServer() {
  try {
    await initDb();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
