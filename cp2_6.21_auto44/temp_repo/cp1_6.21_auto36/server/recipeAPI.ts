import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { recipes } from './store';
import { Recipe, Comment } from '../src/types';

const router = express.Router();

router.get('/', (_req, res) => {
  const search = _req.query.search as string;
  if (search) {
    const s = search.toLowerCase();
    const filtered = recipes.filter(
      r => r.name.toLowerCase().includes(s) ||
           r.description.toLowerCase().includes(s) ||
           r.tags.some(t => t.toLowerCase().includes(s)) ||
           r.ingredients.some(i => i.name.toLowerCase().includes(s))
    );
    return res.json(filtered);
  }
  res.json(recipes);
});

router.get('/:id', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) return res.status(404).json({ error: '食谱不存在' });
  res.json(recipe);
});

router.post('/', (req, res) => {
  const now = new Date().toISOString();
  const body = req.body as Partial<Recipe>;
  const newRecipe: Recipe = {
    id: uuidv4(),
    name: body.name || '新食谱',
    coverImage: body.coverImage || '',
    description: body.description || '',
    prepTime: body.prepTime || 0,
    cookTime: body.cookTime || 0,
    totalTime: (body.prepTime || 0) + (body.cookTime || 0),
    difficulty: body.difficulty || 'easy',
    servings: body.servings || 1,
    ingredients: body.ingredients?.map(i => ({ ...i, id: i.id || uuidv4() })) || [],
    steps: (body.steps || []).map((s, idx) => ({ ...s, id: s.id || uuidv4(), order: s.order || idx + 1 })),
    author: body.author || '匿名用户',
    createdAt: now,
    updatedAt: now,
    averageRating: 0,
    totalRatings: 0,
    tags: body.tags || [],
    comments: [],
  };
  recipes.push(newRecipe);
  res.status(201).json(newRecipe);
});

router.put('/:id', (req, res) => {
  const idx = recipes.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '食谱不存在' });
  const body = req.body as Partial<Recipe>;
  recipes[idx] = {
    ...recipes[idx],
    ...body,
    totalTime: (body.prepTime ?? recipes[idx].prepTime) + (body.cookTime ?? recipes[idx].cookTime),
    updatedAt: new Date().toISOString(),
  };
  res.json(recipes[idx]);
});

router.delete('/:id', (req, res) => {
  const idx = recipes.findIndex(r => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: '食谱不存在' });
  recipes.splice(idx, 1);
  res.json({ message: '删除成功' });
});

router.post('/:id/comments', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) return res.status(404).json({ error: '食谱不存在' });
  const body = req.body as Partial<Comment>;
  const newComment: Comment = {
    id: uuidv4(),
    recipeId: recipe.id,
    userId: body.userId || uuidv4(),
    userName: body.userName || '匿名用户',
    content: body.content || '',
    rating: body.rating || 0,
    createdAt: new Date().toISOString(),
    parentId: body.parentId,
  };

  if (body.parentId) {
    const addReply = (comments: Comment[]): boolean => {
      for (const c of comments) {
        if (c.id === body.parentId) {
          c.replies = c.replies || [];
          c.replies.push(newComment);
          return true;
        }
        if (c.replies && addReply(c.replies)) return true;
      }
      return false;
    };
    if (!addReply(recipe.comments)) {
      return res.status(404).json({ error: '父评论不存在' });
    }
  } else {
    recipe.comments.unshift(newComment);
  }

  if (newComment.rating > 0 && !newComment.parentId) {
    const validRatings = recipe.comments.filter(c => !c.parentId && c.rating > 0).map(c => c.rating);
    recipe.totalRatings = validRatings.length;
    recipe.averageRating = recipe.totalRatings > 0
      ? validRatings.reduce((a, b) => a + b, 0) / recipe.totalRatings
      : 0;
  }

  recipe.updatedAt = new Date().toISOString();
  res.status(201).json(newComment);
});

router.get('/:id/comments', (req, res) => {
  const recipe = recipes.find(r => r.id === req.params.id);
  if (!recipe) return res.status(404).json({ error: '食谱不存在' });
  const sorted = [...recipe.comments].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(sorted);
});

export default router;
