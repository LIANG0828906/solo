import express from 'express';
import { getRecipes, getRecipeById, updateFavorite, getShoppingListHistory, getFavoriteCount } from '../data/store';

const router = express.Router();

router.get('/', (_req, res) => {
  const recipes = getRecipes();
  res.json({ recipes });
});

router.get('/stats', (_req, res) => {
  const favoriteCount = getFavoriteCount();
  const history = getShoppingListHistory();
  res.json({ favoriteCount, shoppingListHistory: history });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const recipe = getRecipeById(id);
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  res.json({ recipe });
});

router.post('/:id/favorite', (req, res) => {
  const { id } = req.params;
  const { isFavorite } = req.body;
  const recipe = updateFavorite(id, isFavorite);
  if (!recipe) {
    res.status(404).json({ error: 'Recipe not found' });
    return;
  }
  res.json({ recipe });
});

export default router;
