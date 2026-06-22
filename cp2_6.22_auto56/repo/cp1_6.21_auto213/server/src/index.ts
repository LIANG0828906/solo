import express from 'express';
import cors from 'cors';
import recipesRouter from './routes/recipes';
import interactionsRouter from './routes/interactions';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/recipes', recipesRouter);
app.use('/api/interactions', interactionsRouter);

app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});

export default app;
