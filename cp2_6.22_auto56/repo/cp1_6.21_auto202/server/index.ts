import express from 'express';
import cors from 'cors';
import terrainRouter from './routes/terrain';
import markersRouter from './routes/markers';

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors());
app.use(express.json());

app.use('/api', terrainRouter);
app.use('/api', markersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[server] Geological Sandbox Server running on port ${PORT}`);
  console.log(`[server] API endpoints: /api/terrain, /api/markers`);
});
