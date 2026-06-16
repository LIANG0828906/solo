import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import type { CreateRecipeDto, UpdateRecipeDto, CreateCollectionDto, UpdateCollectionDto } from './types.js';
import {
  getAllRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getRecipeShoppingList,
  getAllCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  getCollectionShoppingList,
  getStats,
  getRandomRecipes,
} from './data.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/recipes', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const recipes = getAllRecipes();
    res.status(200).json({ success: true, data: recipes });
  } catch (error) {
    next(error);
  }
});

app.get('/api/recipes/random', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const count = parseInt(req.query.count as string, 10) || 3;
    const recipes = getRandomRecipes(count);
    res.status(200).json({ success: true, data: recipes });
  } catch (error) {
    next(error);
  }
});

app.get('/api/recipes/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const recipe = getRecipeById(id);
    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }
    res.status(200).json({ success: true, data: recipe });
  } catch (error) {
    next(error);
  }
});

app.post('/api/recipes', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const dto = req.body as CreateRecipeDto;
    if (!dto.name || !dto.ingredients || !dto.steps) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    const recipe = createRecipe(dto);
    res.status(201).json({ success: true, data: recipe });
  } catch (error) {
    next(error);
  }
});

app.put('/api/recipes/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const dto = req.body as UpdateRecipeDto;
    const recipe = updateRecipe(id, dto);
    if (!recipe) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }
    res.status(200).json({ success: true, data: recipe });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/recipes/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const deleted = deleteRecipe(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Recipe deleted successfully' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/recipes/:id/shopping-list', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const shoppingList = getRecipeShoppingList(id);
    if (!shoppingList) {
      res.status(404).json({ success: false, error: 'Recipe not found' });
      return;
    }
    res.status(200).json({ success: true, data: shoppingList });
  } catch (error) {
    next(error);
  }
});

app.get('/api/collections', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const collections = getAllCollections();
    res.status(200).json({ success: true, data: collections });
  } catch (error) {
    next(error);
  }
});

app.get('/api/collections/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const collection = getCollectionById(id);
    if (!collection) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }
    res.status(200).json({ success: true, data: collection });
  } catch (error) {
    next(error);
  }
});

app.post('/api/collections', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const dto = req.body as CreateCollectionDto;
    if (!dto.name) {
      res.status(400).json({ success: false, error: 'Missing required fields' });
      return;
    }
    const collection = createCollection(dto);
    res.status(201).json({ success: true, data: collection });
  } catch (error) {
    next(error);
  }
});

app.put('/api/collections/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const dto = req.body as UpdateCollectionDto;
    const collection = updateCollection(id, dto);
    if (!collection) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }
    res.status(200).json({ success: true, data: collection });
  } catch (error) {
    next(error);
  }
});

app.delete('/api/collections/:id', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const deleted = deleteCollection(id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }
    res.status(200).json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    next(error);
  }
});

app.get('/api/collections/:id/shopping-list', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { id } = req.params;
    const shoppingList = getCollectionShoppingList(id);
    if (!shoppingList) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }
    res.status(200).json({ success: true, data: shoppingList });
  } catch (error) {
    next(error);
  }
});

app.get('/api/stats', (req: Request, res: Response, next: NextFunction): void => {
  try {
    const stats = getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

app.use((error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Server error:', error);
  res.status(500).json({ success: false, error: 'Server internal error' });
});

app.use((req: Request, res: Response): void => {
  res.status(404).json({ success: false, error: 'API not found' });
});

app.listen(PORT, () => {
  console.log('Server running on http://localhost:3001');
});

export default app;
