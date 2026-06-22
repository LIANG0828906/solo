import { Router, type Request, type Response } from 'express';
import store from '../data/store.js';
import type { Recipe } from '../data/store.js';

const router = Router();

interface RecipeWithMatch extends Recipe {
  matchScore: number;
  matchedIngredients: string[];
  missingIngredients: string[];
}

router.get('/', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    data: store.recipes,
  });
});

router.get('/recommend', (req: Request, res: Response): void => {
  const { ingredients } = req.query;

  let inventoryNames: string[] = [];

  if (typeof ingredients === 'string') {
    try {
      inventoryNames = JSON.parse(ingredients) as string[];
    } catch {
      inventoryNames = ingredients.split(',').map((s) => s.trim());
    }
  } else if (Array.isArray(ingredients)) {
    inventoryNames = ingredients.map((i) => String(i).trim());
  }

  if (inventoryNames.length === 0) {
    inventoryNames = store.inventory.map((item) => item.name);
  }

  const inventorySet = new Set(inventoryNames.map((n) => n.toLowerCase()));

  const recommended: RecipeWithMatch[] = store.recipes.map((recipe) => {
    const recipeIngredientNames = recipe.ingredients.map((ing) => ing.name.toLowerCase());
    const matched: string[] = [];
    const missing: string[] = [];

    recipe.ingredients.forEach((ing) => {
      if (inventorySet.has(ing.name.toLowerCase())) {
        matched.push(ing.name);
      } else {
        missing.push(ing.name);
      }
    });

    const matchScore = recipeIngredientNames.length > 0
      ? Math.round((matched.length / recipeIngredientNames.length) * 100)
      : 0;

    return {
      ...recipe,
      matchScore,
      matchedIngredients: matched,
      missingIngredients: missing,
    };
  });

  recommended.sort((a, b) => b.matchScore - a.matchScore);

  res.status(200).json({
    success: true,
    data: recommended,
  });
});

router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const recipe = store.recipes.find((r) => r.id === id);

  if (!recipe) {
    res.status(404).json({
      success: false,
      error: '菜谱不存在',
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: recipe,
  });
});

export default router;
