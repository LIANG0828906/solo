import express from 'express';
import cors from 'cors';
import { recipes, matchRecipe } from './recipes.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/recipes', (_req, res) => {
  res.json(recipes);
});

app.post('/api/match', (req, res) => {
  const { ingredients, temperature } = req.body;
  if (!Array.isArray(ingredients) || typeof temperature !== 'number') {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  const result = matchRecipe(ingredients, temperature);
  res.json(result);
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Alchemy server running on port ${PORT}`);
});
