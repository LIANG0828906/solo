import express from 'express';
import cors from 'cors';
import objectivesRouter from './routes/objectives.ts';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'OKR Tracker API is running' });
});

app.use('/api/objectives', objectivesRouter);

app.use((req, res) => {
  res.status(404).json({ success: false, error: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`OKR Tracker API server is running on http://localhost:${PORT}`);
});
