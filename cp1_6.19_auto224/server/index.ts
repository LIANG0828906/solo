import express, { Request, Response } from 'express';
import cors from 'cors';
import { dataStore } from './dataStore';
import { matchRecipes, recipes } from './recipeMatcher';
import { Ingredient, RecommendRequest, ShoppingItem, ShoppingList } from './types';

const app = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

app.get('/api/ingredients', (_req: Request, res: Response<Ingredient[]>) => {
  res.json(dataStore.getIngredients());
});

app.post('/api/ingredients', (req: Request<{}, {}, Omit<Ingredient, 'id'>>, res: Response<Ingredient>) => {
  const newIngredient = dataStore.addIngredient(req.body);
  res.status(201).json(newIngredient);
});

app.put('/api/ingredients/:id', (req: Request<{ id: string }, {}, Partial<Ingredient>>, res: Response<Ingredient>) => {
  const updated = dataStore.updateIngredient(req.params.id, req.body);
  if (!updated) {
    res.status(404).send();
    return;
  }
  res.json(updated);
});

app.delete('/api/ingredients/:id', (req: Request<{ id: string }>, res: Response) => {
  const deleted = dataStore.deleteIngredient(req.params.id);
  if (!deleted) {
    res.status(404).send();
    return;
  }
  res.status(204).send();
});

app.post('/api/recipes', (req: Request<{}, {}, RecommendRequest>, res: Response) => {
  const { ingredients, preferences } = req.body;
  const validIngredients = Array.isArray(ingredients) ? ingredients : dataStore.getIngredients();
  const matched = matchRecipes(validIngredients, preferences, recipes);
  res.json(matched);
});

app.post('/api/shopping-list', (req: Request<{}, {}, { items: ShoppingItem[] }>, res: Response<ShoppingList>) => {
  const list = dataStore.addShoppingList(req.body.items || []);
  res.status(201).json(list);
});

app.get('/api/shopping-list/:id', (req: Request<{ id: string }>, res: Response<ShoppingList>) => {
  const list = dataStore.getShoppingListByIdOrShareId(req.params.id);
  if (!list) {
    res.status(404).send();
    return;
  }
  res.json(list);
});

app.listen(PORT, () => {
  console.log(`智能冰箱食谱推荐后端服务器运行在 http://localhost:${PORT}`);
});
