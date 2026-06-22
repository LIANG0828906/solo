import express from 'express';
import cors from 'cors';
import gameRoutes from './routes/gameRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.use('/api/games', gameRoutes);
app.use('/api/leaderboard', leaderboardRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`🚀 Galactic Empire Server running on port ${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   POST   /api/games       - Save game`);
  console.log(`   GET    /api/games/:id   - Load game`);
  console.log(`   PUT    /api/games/:id   - Update game`);
  console.log(`   GET    /api/leaderboard - Get leaderboard`);
  console.log(`   POST   /api/leaderboard - Add leaderboard entry`);
  console.log(`   DELETE /api/leaderboard/:id - Delete entry`);
});
