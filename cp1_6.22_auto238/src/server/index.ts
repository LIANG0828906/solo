import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  defaultDyeMaterials,
  defaultRecipes,
  DyeMaterial,
  Recipe,
  RecipeStep,
  blendDyeColors,
  calculateRecipeCompletion,
} from '../data/recipes.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let recipes: Recipe[] = [...defaultRecipes];
let materials: DyeMaterial[] = [...defaultDyeMaterials];

function cloneRecipeSteps(steps: RecipeStep[]): RecipeStep[] {
  return steps.map((s) => ({ ...s, id: uuidv4() }));
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/recipes', (req, res) => {
  const { search = '', material = '', dyeType = '' } = req.query;
  let result = recipes;

  if (search) {
    const keyword = String(search).toLowerCase();
    result = result.filter(
      (r) =>
        r.name.toLowerCase().includes(keyword) ||
        r.description.toLowerCase().includes(keyword)
    );
  }

  if (material) {
    const matKeyword = String(material).toLowerCase();
    result = result.filter((r) =>
      r.steps.some((s) => s.materialName.toLowerCase().includes(matKeyword))
    );
  }

  if (dyeType && dyeType !== 'all') {
    result = result.filter((r) => r.dyeType === dyeType);
  }

  result = result.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  res.json(result);
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: '配方不存在' });
  }
  res.json(recipe);
});

app.post('/api/recipes', (req, res) => {
  const data = req.body as Partial<Recipe>;
  const steps = (data.steps || []).map((s) => ({ ...s, id: uuidv4() }));
  const now = new Date().toISOString();
  const newRecipe: Recipe = {
    id: uuidv4(),
    name: data.name || '未命名配方',
    description: data.description || '',
    dyeType: data.dyeType || 'direct',
    fabricType: data.fabricType || '棉',
    steps,
    createdAt: now,
    updatedAt: now,
    completion: calculateRecipeCompletion(steps),
  };
  recipes.unshift(newRecipe);
  res.status(201).json(newRecipe);
});

app.put('/api/recipes/:id', (req, res) => {
  const index = recipes.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '配方不存在' });
  }
  const data = req.body as Partial<Recipe>;
  const steps = (data.steps || recipes[index].steps).map((s, i) => ({
    ...s,
    id: s.id || uuidv4(),
  }));
  const updated: Recipe = {
    ...recipes[index],
    name: data.name || recipes[index].name,
    description: data.description ?? recipes[index].description,
    dyeType: data.dyeType || recipes[index].dyeType,
    fabricType: data.fabricType || recipes[index].fabricType,
    steps,
    updatedAt: new Date().toISOString(),
    completion: calculateRecipeCompletion(steps),
  };
  recipes[index] = updated;
  res.json(updated);
});

app.delete('/api/recipes/:id', (req, res) => {
  const index = recipes.findIndex((r) => r.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: '配方不存在' });
  }
  recipes.splice(index, 1);
  res.status(204).send();
});

app.post('/api/recipes/:id/copy', (req, res) => {
  const original = recipes.find((r) => r.id === req.params.id);
  if (!original) {
    return res.status(404).json({ error: '配方不存在' });
  }
  const now = new Date().toISOString();
  const copy: Recipe = {
    id: uuidv4(),
    name: `${original.name} - 副本`,
    description: original.description,
    dyeType: original.dyeType,
    fabricType: original.fabricType,
    steps: cloneRecipeSteps(original.steps),
    createdAt: now,
    updatedAt: now,
    completion: original.completion,
  };
  recipes.unshift(copy);
  res.status(201).json(copy);
});

app.get('/api/recipes/:id/color', (req, res) => {
  const recipe = recipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: '配方不存在' });
  }
  const color = blendDyeColors(recipe.steps, materials);
  res.json({ recipe, color });
});

app.get('/api/materials', (_req, res) => {
  res.json(materials);
});

app.post('/api/materials', (req, res) => {
  const data = req.body as Partial<DyeMaterial>;
  const newMat: DyeMaterial = {
    id: uuidv4(),
    name: data.name || '自定义染材',
    source: data.source || '用户添加',
    defaultColor: data.defaultColor || { r: 150, g: 150, b: 150 },
    lightfastness: data.lightfastness ?? 5,
    pHMin: data.pHMin ?? 4,
    pHMax: data.pHMax ?? 8,
    type: data.type || 'mordant',
    isCustom: true,
  };
  materials.push(newMat);
  res.status(201).json(newMat);
});

app.post('/api/preview/color', (req, res) => {
  const { steps = [] } = req.body as { steps: RecipeStep[] };
  const color = blendDyeColors(steps, materials);
  res.json({ color });
});

app.listen(PORT, () => {
  console.log(`Plant Dye API server running at http://localhost:${PORT}`);
});

export default app;
