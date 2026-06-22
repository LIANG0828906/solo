import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import type { Recipe, Ingredient } from '../types';
import { mockRecipes } from '../data/mockData';

const router = Router();

let recipes: Recipe[] = [...mockRecipes];

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

const parseIngredients = (value: string | string[] | undefined): Ingredient[] => {
  if (!value) return [];
  const str = Array.isArray(value) ? value[0] : value;
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
};

const parseTags = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  const str = Array.isArray(value) ? value[0] : value;
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
};

const isInCookTimeRange = (cookTime: number, range: string | undefined): boolean => {
  if (!range) return true;
  switch (range) {
    case 'under10':
      return cookTime < 10;
    case '10to30':
      return cookTime >= 10 && cookTime <= 30;
    case '30to60':
      return cookTime > 30 && cookTime <= 60;
    case 'over60':
      return cookTime > 60;
    default:
      return true;
  }
};

router.get('/', (req: Request, res: Response) => {
  const { search, tags, cookTimeRange } = req.query;
  let result = [...recipes];

  if (search && typeof search === 'string') {
    const keyword = search.toLowerCase();
    result = result.filter(recipe => {
      const nameMatch = recipe.name.toLowerCase().includes(keyword);
      const ingredientMatch = recipe.ingredients.some(
        ing => ing.name.toLowerCase().includes(keyword)
      );
      return nameMatch || ingredientMatch;
    });
  }

  if (tags && typeof tags === 'string') {
    const tagList = tags.split(',').filter(Boolean);
    if (tagList.length > 0) {
      result = result.filter(recipe =>
        tagList.some(tag => recipe.tags.includes(tag))
      );
    }
  }

  if (cookTimeRange && typeof cookTimeRange === 'string') {
    result = result.filter(recipe => isInCookTimeRange(recipe.cookTime, cookTimeRange));
  }

  result.sort((a, b) => b.createdAt - a.createdAt);

  res.json(result);
});

router.get('/search/suggestions', (req: Request, res: Response) => {
  const { keyword } = req.query;
  if (!keyword || typeof keyword !== 'string' || keyword.trim() === '') {
    return res.json([]);
  }

  const kw = keyword.toLowerCase();
  const suggestions = recipes
    .filter(r => r.name.toLowerCase().includes(kw))
    .slice(0, 5)
    .map(r => r.name);

  res.json(suggestions);
});

router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const recipe = recipes.find(r => r.id === id);
  if (!recipe) {
    return res.status(404).json({ error: '食谱不存在' });
  }
  res.json(recipe);
});

router.post('/', upload.single('coverImage'), (req: Request, res: Response) => {
  const { name, steps, cookTime } = req.body;
  const ingredients = parseIngredients(req.body.ingredients);
  const tags = parseTags(req.body.tags);

  if (!name) {
    return res.status(400).json({ error: '食谱名称不能为空' });
  }

  let coverImage = '';
  if (req.file) {
    coverImage = `/uploads/${req.file.filename}`;
  }

  const newRecipe: Recipe = {
    id: uuidv4(),
    name: String(name),
    coverImage,
    ingredients,
    steps: String(steps || ''),
    tags,
    cookTime: Number(cookTime) || 30,
    createdAt: Date.now(),
    isFavorite: false
  };

  recipes.unshift(newRecipe);
  res.status(201).json(newRecipe);
});

router.put('/:id', upload.single('coverImage'), (req: Request, res: Response) => {
  const { id } = req.params;
  const index = recipes.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '食谱不存在' });
  }

  const { name, steps, cookTime } = req.body;
  const ingredients = parseIngredients(req.body.ingredients);
  const tags = parseTags(req.body.tags);

  const existing = recipes[index];
  let coverImage = existing.coverImage;
  if (req.file) {
    coverImage = `/uploads/${req.file.filename}`;
  }

  const updated: Recipe = {
    ...existing,
    name: name ? String(name) : existing.name,
    coverImage,
    ingredients: ingredients.length > 0 ? ingredients : existing.ingredients,
    steps: steps !== undefined ? String(steps) : existing.steps,
    tags: tags.length > 0 ? tags : existing.tags,
    cookTime: cookTime !== undefined ? Number(cookTime) : existing.cookTime
  };

  recipes[index] = updated;
  res.json(updated);
});

router.delete('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = recipes.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: '食谱不存在' });
  }
  recipes.splice(index, 1);
  res.json({ success: true });
});

export default router;
