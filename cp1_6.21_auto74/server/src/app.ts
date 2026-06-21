import express, { Request, Response } from 'express';
import cors from 'cors';
import { recipeStore, Recipe } from './recipeStore';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/recipes', (req: Request, res: Response) => {
  const { keyword } = req.query;
  if (keyword && typeof keyword === 'string') {
    res.json(recipeStore.search(keyword));
  } else {
    res.json(recipeStore.getAll());
  }
});

app.get('/api/recipes/:id', (req: Request, res: Response) => {
  const recipe = recipeStore.getById(req.params.id);
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  res.json(recipe);
});

app.post('/api/recipes', (req: Request, res: Response) => {
  const { name, image, difficulty, cookTime, ingredients, steps, category } = req.body;
  if (!name || !image || difficulty === undefined || !cookTime || !ingredients || !steps || !category) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const newRecipe = recipeStore.create({
    name,
    image,
    difficulty,
    cookTime,
    ingredients,
    steps,
    category
  });
  res.status(201).json(newRecipe);
});

app.put('/api/recipes/:id', (req: Request, res: Response) => {
  const updated = recipeStore.update(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  res.json(updated);
});

app.delete('/api/recipes/:id', (req: Request, res: Response) => {
  const success = recipeStore.delete(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  res.status(204).send();
});

app.patch('/api/recipes/:id/favorite', (req: Request, res: Response) => {
  const updated = recipeStore.toggleFavorite(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  res.json(updated);
});

app.listen(PORT, () => {
  console.log(`Recipe server running on http://localhost:${PORT}`);
});

export default app;
