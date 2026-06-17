import express, { Request, Response } from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import bookRouter from './routes/bookRoutes';
import socialRouter from './routes/socialRoutes';

const app = express();
const PORT = 3001;

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
);

app.use(bodyParser.json());

app.use('/api', bookRouter);
app.use('/api', socialRouter);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Virtual Bookshelf API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;
