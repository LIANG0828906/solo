import express from 'express';
import cors from 'cors';
import { generateRecommendations } from '../game/engine';
import { GameState } from '../game/types';

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

app.post('/api/recommend', (req, res) => {
  try {
    const gameState = req.body as GameState;
    const startTime = Date.now();
    
    const result = generateRecommendations(gameState);
    
    const elapsed = Date.now() - startTime;
    console.log(`Analysis completed in ${elapsed}ms, ${result.recommendations.length} recommendations`);
    
    res.json(result);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

app.listen(PORT, () => {
  console.log(`Battle AI server running on http://localhost:${PORT}`);
});
