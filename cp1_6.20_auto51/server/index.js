import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import paletteRoutes from './routes/paletteRoutes.js';
import projectRoutes from './routes/projectRoutes.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/palettes', paletteRoutes);
app.use('/api/projects', projectRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`API endpoints available:`);
  console.log(`  GET    /api/health`);
  console.log(`  GET    /api/palettes`);
  console.log(`  POST   /api/palettes`);
  console.log(`  GET    /api/palettes/:id`);
  console.log(`  PUT    /api/palettes/:id`);
  console.log(`  DELETE /api/palettes/:id`);
  console.log(`  GET    /api/projects`);
  console.log(`  POST   /api/projects`);
  console.log(`  POST   /api/projects/:id/invite`);
  console.log(`  POST   /api/projects/:id/palettes`);
  console.log(`  POST   /api/projects/:id/comments`);
});
