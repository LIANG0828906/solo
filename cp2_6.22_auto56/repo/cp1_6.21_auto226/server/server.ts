import express from 'express';
import cors from 'cors';
import inspirationsRouter from './routes/inspirations';
import statsRouter from './routes/stats';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/inspirations', inspirationsRouter);
app.use('/api/stats', statsRouter);

app.listen(PORT, () => {
  console.log(`Inspiration API server running on http://localhost:${PORT}`);
});
