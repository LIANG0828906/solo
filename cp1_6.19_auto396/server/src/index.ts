import express from 'express';
import cors from 'cors';
import { Recipe } from '../../src/types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let recipes: Recipe[] = [];

app.get('/api/recipes', (req, res) => {
  const { search } = req.query;
  let result = [...recipes];

  if (search && typeof search === 'string') {
    const kw = search.toLowerCase();
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(kw) ||
        r.baseColor.name.toLowerCase().includes(kw) ||
        r.addColors.some((ac) => ac.color.name.toLowerCase().includes(kw))
    );
  }

  result.sort((a, b) => {
    if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
    return b.createdAt - a.createdAt;
  });

  res.json(result);
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    res.status(404).json({ error: '配方不存在' });
    return;
  }
  res.json(recipe);
});

app.post('/api/recipes', (req, res) => {
  const recipe = req.body as Recipe;
  if (!recipe || !recipe.id) {
    res.status(400).json({ error: '无效的配方数据' });
    return;
  }
  recipes.push(recipe);
  res.status(201).json(recipe);
});

app.patch('/api/recipes/:id', (req, res) => {
  const idx = recipes.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: '配方不存在' });
    return;
  }
  recipes[idx] = { ...recipes[idx], ...req.body };
  res.json(recipes[idx]);
});

app.put('/api/recipes/:id', (req, res) => {
  const idx = recipes.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: '配方不存在' });
    return;
  }
  recipes[idx] = req.body as Recipe;
  res.json(recipes[idx]);
});

app.delete('/api/recipes/:id', (req, res) => {
  const idx = recipes.findIndex((r) => r.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: '配方不存在' });
    return;
  }
  const deleted = recipes.splice(idx, 1)[0];
  res.json(deleted);
});

app.listen(PORT, () => {
  console.log(`🎨 Watercolor Palette API server running on http://localhost:${PORT}`);
});
