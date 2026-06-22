import express from 'express';
import cors from 'cors';
import snippetsRouter from './routes/snippets';
import tagsRouter from './routes/tags';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api/snippets', snippetsRouter);
app.use('/api/tags', tagsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Snippet Catcher API server running on http://localhost:${PORT}`);
});
