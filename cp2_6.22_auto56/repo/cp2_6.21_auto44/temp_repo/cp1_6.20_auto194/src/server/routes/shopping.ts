import express from 'express';
import { generateShoppingList } from '../data/store';

const router = express.Router();

router.post('/shopping-list', (req, res) => {
  const { recipeIds } = req.body;
  if (!recipeIds || !Array.isArray(recipeIds) || recipeIds.length === 0) {
    res.status(400).json({ error: 'recipeIds array is required' });
    return;
  }
  const shoppingList = generateShoppingList(recipeIds);
  res.json({ shoppingList });
});

export default router;
