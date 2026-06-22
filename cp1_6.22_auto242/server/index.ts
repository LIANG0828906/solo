import express from 'express';
import cors from 'cors';
import { db } from './db';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/ingredients', (req, res) => {
  res.json(db.getIngredients());
});

app.get('/api/ingredients/:id', (req, res) => {
  const ingredient = db.getIngredientById(req.params.id);
  if (!ingredient) {
    res.status(404).json({ error: '原料不存在' });
    return;
  }
  res.json(ingredient);
});

app.post('/api/ingredients', (req, res) => {
  const newIngredient = db.addIngredient(req.body);
  res.status(201).json(newIngredient);
});

app.put('/api/ingredients/:id', (req, res) => {
  const updated = db.updateIngredient(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: '原料不存在' });
    return;
  }
  res.json(updated);
});

app.delete('/api/ingredients/:id', (req, res) => {
  const success = db.deleteIngredient(req.params.id);
  if (!success) {
    res.status(404).json({ error: '原料不存在' });
    return;
  }
  res.json({ success: true });
});

app.get('/api/recipes', (req, res) => {
  res.json(db.getRecipes());
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = db.getRecipeById(req.params.id);
  if (!recipe) {
    res.status(404).json({ error: '配方不存在' });
    return;
  }
  res.json(recipe);
});

app.post('/api/recipes', (req, res) => {
  const newRecipe = db.addRecipe(req.body);
  res.status(201).json(newRecipe);
});

app.put('/api/recipes/:id', (req, res) => {
  const { versionNote, ...recipeData } = req.body;
  const updated = db.updateRecipe(req.params.id, recipeData, versionNote);
  if (!updated) {
    res.status(404).json({ error: '配方不存在' });
    return;
  }
  res.json(updated);
});

app.get('/api/recipes/:id/versions', (req, res) => {
  const versions = db.getRecipeVersions(req.params.id);
  if (!versions) {
    res.status(404).json({ error: '配方不存在' });
    return;
  }
  res.json(versions);
});

app.post('/api/recipes/:id/rollback/:versionId', (req, res) => {
  const recipe = db.rollbackRecipe(req.params.id, req.params.versionId);
  if (!recipe) {
    res.status(404).json({ error: '配方或版本不存在' });
    return;
  }
  res.json(recipe);
});

app.get('/api/testings', (req, res) => {
  res.json(db.getTestings());
});

app.post('/api/testings', (req, res) => {
  const newTesting = db.addTesting(req.body);
  res.status(201).json(newTesting);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
