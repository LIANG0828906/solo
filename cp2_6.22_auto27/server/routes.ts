import { Router, Request, Response } from 'express';
import {
  createRecipe,
  getRecipeById,
  getRecipes,
  searchRecipes,
  getRecipesByIngredients,
  createComment,
  getCommentsByRecipeId,
  toggleFavorite,
  getFavoritesByUserId,
  getAllTags,
  addIngredients,
  addSteps,
  addTags,
  isFavorited,
} from './db';
import { register, login, getCurrentUser, authenticateToken, type AuthRequest } from './auth';

const router = Router();

router.post('/api/auth/register', register);
router.post('/api/auth/login', login);
router.get('/api/auth/me', authenticateToken, getCurrentUser);

router.get('/api/recipes', (req: Request, res: Response): void => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 10));
  const tag = req.query.tag as string | undefined;

  try {
    const result = getRecipes(page, limit, tag);
    res.json({
      recipes: result.recipes,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    });
  } catch {
    res.status(500).json({ error: '获取食谱列表失败' });
  }
});

router.get('/api/recipes/search', (req: Request, res: Response): void => {
  const q = req.query.q as string;
  if (!q || q.trim().length === 0) {
    res.status(400).json({ error: '搜索关键词不能为空' });
    return;
  }

  try {
    const recipes = searchRecipes(q.trim());
    res.json({ recipes });
  } catch {
    res.status(500).json({ error: '搜索失败' });
  }
});

router.get('/api/recipes/match', (req: Request, res: Response): void => {
  const ingredientsParam = req.query.ingredients as string;
  if (!ingredientsParam || ingredientsParam.trim().length === 0) {
    res.status(400).json({ error: '请提供食材列表' });
    return;
  }

  try {
    const ingredients = ingredientsParam
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);
    const recipes = getRecipesByIngredients(ingredients);
    res.json({ recipes });
  } catch {
    res.status(500).json({ error: '匹配食谱失败' });
  }
});

router.get('/api/recipes/:id', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的食谱ID' });
    return;
  }

  try {
    const recipe = getRecipeById(id);
    if (!recipe) {
      res.status(404).json({ error: '食谱不存在' });
      return;
    }
    res.json({ recipe });
  } catch {
    res.status(500).json({ error: '获取食谱详情失败' });
  }
});

router.post('/api/recipes', authenticateToken, (req: AuthRequest, res: Response): void => {
  const { title, description, image, prep_time, cook_time, servings, difficulty, ingredients, steps, tags } = req.body;

  if (!title || title.trim().length === 0) {
    res.status(400).json({ error: '食谱标题不能为空' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  try {
    const recipeId = createRecipe({
      title: title.trim(),
      description: description?.trim() || null,
      image: image || null,
      prep_time: prep_time ? parseInt(prep_time) : null,
      cook_time: cook_time ? parseInt(cook_time) : null,
      servings: servings ? parseInt(servings) : null,
      difficulty: difficulty || null,
      user_id: req.user.id,
    });

    if (ingredients && Array.isArray(ingredients) && ingredients.length > 0) {
      addIngredients(
        recipeId,
        ingredients.map((ing: { name: string; amount?: string }) => ({
          name: ing.name,
          amount: ing.amount,
        }))
      );
    }

    if (steps && Array.isArray(steps) && steps.length > 0) {
      addSteps(
        recipeId,
        steps.map((step: { step_order: number; description: string }, index: number) => ({
          step_order: step.step_order ?? index + 1,
          description: step.description,
        }))
      );
    }

    if (tags && Array.isArray(tags) && tags.length > 0) {
      addTags(
        recipeId,
        tags.map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0)
      );
    }

    const recipe = getRecipeById(recipeId);
    res.status(201).json({ recipe });
  } catch {
    res.status(500).json({ error: '创建食谱失败' });
  }
});

router.get('/api/recipes/:id/comments', (req: Request, res: Response): void => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的食谱ID' });
    return;
  }

  try {
    const recipe = getRecipeById(id);
    if (!recipe) {
      res.status(404).json({ error: '食谱不存在' });
      return;
    }
    const comments = getCommentsByRecipeId(id);
    res.json({ comments });
  } catch {
    res.status(500).json({ error: '获取评论失败' });
  }
});

router.post('/api/recipes/:id/comments', authenticateToken, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的食谱ID' });
    return;
  }

  const { content, rating } = req.body;
  if (!content || content.trim().length === 0) {
    res.status(400).json({ error: '评论内容不能为空' });
    return;
  }

  if (rating !== undefined && (rating < 1 || rating > 5)) {
    res.status(400).json({ error: '评分必须在1-5之间' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  try {
    const recipe = getRecipeById(id);
    if (!recipe) {
      res.status(404).json({ error: '食谱不存在' });
      return;
    }

    createComment(id, req.user.id, content.trim(), rating);
    const comments = getCommentsByRecipeId(id);
    res.status(201).json({ comments });
  } catch {
    res.status(500).json({ error: '发表评论失败' });
  }
});

router.post('/api/recipes/:id/favorite', authenticateToken, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的食谱ID' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  try {
    const recipe = getRecipeById(id);
    if (!recipe) {
      res.status(404).json({ error: '食谱不存在' });
      return;
    }

    const result = toggleFavorite(req.user.id, id);
    res.json({ favorited: result.favorited });
  } catch {
    res.status(500).json({ error: '操作失败' });
  }
});

router.get('/api/users/favorites', authenticateToken, (req: AuthRequest, res: Response): void => {
  if (!req.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  try {
    const recipes = getFavoritesByUserId(req.user.id);
    const recipesWithFav = recipes.map((recipe) => ({
      ...recipe,
      is_favorited: true,
    }));
    res.json({ recipes: recipesWithFav });
  } catch {
    res.status(500).json({ error: '获取收藏列表失败' });
  }
});

router.get('/api/tags', (_req: Request, res: Response): void => {
  try {
    const tags = getAllTags();
    res.json({ tags });
  } catch {
    res.status(500).json({ error: '获取标签失败' });
  }
});

router.get('/api/recipes/:id/is-favorited', authenticateToken, (req: AuthRequest, res: Response): void => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    res.status(400).json({ error: '无效的食谱ID' });
    return;
  }

  if (!req.user) {
    res.status(401).json({ error: '未登录' });
    return;
  }

  try {
    const favorited = isFavorited(req.user.id, id);
    res.json({ favorited });
  } catch {
    res.status(500).json({ error: '获取收藏状态失败' });
  }
});

export default router;
