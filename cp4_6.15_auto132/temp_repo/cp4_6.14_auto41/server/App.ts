import express from 'express';
import cors from 'cors';
import routes from './Routes';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Bidding Platform Server running at http://localhost:${PORT}`);
  console.log(`📁 API endpoints available at /api/*`);
});
