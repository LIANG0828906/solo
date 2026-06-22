import { Router } from 'express';
import { AuthRequest, authMiddleware } from './auth';
import {
  getRecipeById,
  getRecipeList,
  searchRecipes,
  matchRecipesByIngredients,
  createRecipe,
  rateRecipe,
  toggleFavorite,
  isFavorited,
  getComments,
  addComment,
  getSuggestions,
  getRelatedRecipes,
  getAllIngredients,
  RecipeWithAuthor,
  RecipeDetail,
} from './db';

const router = Router();

function transformRecipe(recipe: RecipeWithAuthor | RecipeDetail) {
  return {
    id: recipe.id,
    title: recipe.title,
    description: recipe.description,
    coverImage: recipe.cover_image,
    authorId: recipe.author_id,
    authorName: recipe.author_name,
    authorAvatar: recipe.author_avatar,
    rating: recipe.rating,
    ratingCount: recipe.rating_count,
    favoriteCount: recipe.favorite_count,
    createdAt: recipe.created_at,
    ...('ingredients' in recipe ? {
      ingredients: recipe.ingredients,
      steps: recipe.steps,
      tags: recipe.tags,
    } : {}),
  };
}

router.get('/recipes', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const tag = req.query.tag as string | undefined;

  const recipes = getRecipeList(page, limit, tag);
  const transformed = recipes.map(transformRecipe);

  res.json({
    recipes: transformed,
    total: transformed.length,
    page,
    hasMore: transformed.length === limit,
  });
});

router.get('/recipes/suggestions', (req, res) => {
  const prefix = req.query.prefix as string;
  if (!prefix || prefix.length < 1) {
    return res.json({ suggestions: [] });
  }

  const suggestions = getSuggestions(prefix);
  res.json({ suggestions });
});

router.get('/recipes/search', (req, res) => {
  const q = req.query.q as string;
  if (!q) {
    return res.json({ recipes: [], suggestions: [] });
  }

  const recipes = searchRecipes(q);
  const suggestions = getSuggestions(q);
  const transformed = recipes.map(transformRecipe);

  res.json({
    recipes: transformed,
    suggestions,
  });
});

router.post('/recipes/match-by-ingredients', (req, res) => {
  const { ingredients } = req.body;
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: '请提供食材列表' });
  }

  const results = matchRecipesByIngredients(ingredients);
  const transformed = results.map(r => ({
    recipe: transformRecipe(r.recipe),
    matchScore: r.matchScore,
    matchedIngredients: r.matchedIngredients,
    missingIngredients: r.missingIngredients,
  }));

  res.json({ results: transformed });
});

router.get('/recipes/ingredients', (_req, res) => {
  const ingredients = getAllIngredients();
  res.json({ ingredients });
});

router.get('/recipes/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: '无效的食谱ID' });
  }

  const recipe = getRecipeById(id);
  if (!recipe) {
    return res.status(404).json({ error: '食谱不存在' });
  }

  res.json(transformRecipe(recipe));
});

router.get('/recipes/:id/related', (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: '无效的食谱ID' });
  }

  const recipe = getRecipeById(id);
  if (!recipe) {
    return res.status(404).json({ error: '食谱不存在' });
  }

  const related = getRelatedRecipes(id, recipe.tags);
  const transformed = related.map(transformRecipe);

  res.json({ recipes: transformed });
});

router.post('/recipes', authMiddleware, (req: AuthRequest, res) => {
  const { title, description, coverImage, ingredients, steps, tags } = req.body;

  if (!title || !ingredients || !steps) {
    return res.status(400).json({ error: '请填写完整信息' });
  }

  if (!Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: '请添加至少一种配料' });
  }

  if (!Array.isArray(steps) || steps.length === 0) {
    return res.status(400).json({ error: '请添加至少一个步骤' });
  }

  const recipeId = createRecipe(
    title,
    description || '',
    coverImage || '',
    req.user!.id,
    ingredients,
    steps,
    tags || []
  );

  const recipe = getRecipeById(recipeId);
  res.json(transformRecipe(recipe!));
});

router.post('/recipes/:id/rate', authMiddleware, (req: AuthRequest, res) => {
  const recipeId = parseInt(req.params.id);
  const { rating } = req.body;

  if (isNaN(recipeId)) {
    return res.status(400).json({ error: '无效的食谱ID' });
  }

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: '评分必须在1-5之间' });
  }

  const result = rateRecipe(req.user!.id, recipeId, rating);
  res.json(result);
});

router.post('/recipes/:id/favorite', authMiddleware, (req: AuthRequest, res) => {
  const recipeId = parseInt(req.params.id);

  if (isNaN(recipeId)) {
    return res.status(400).json({ error: '无效的食谱ID' });
  }

  const result = toggleFavorite(req.user!.id, recipeId);
  res.json(result);
});

router.get('/recipes/:id/favorite', authMiddleware, (req: AuthRequest, res) => {
  const recipeId = parseInt(req.params.id);

  if (isNaN(recipeId)) {
    return res.status(400).json({ error: '无效的食谱ID' });
  }

  const favorited = isFavorited(req.user!.id, recipeId);
  res.json({ isFavorited: favorited });
});

router.get('/recipes/:id/comments', (req, res) => {
  const recipeId = parseInt(req.params.id);

  if (isNaN(recipeId)) {
    return res.status(400).json({ error: '无效的食谱ID' });
  }

  const comments = getComments(recipeId);
  const transformed = comments.map(c => ({
    id: c.id,
    recipeId: c.recipe_id,
    userId: c.user_id,
    username: c.username,
    avatar: c.avatar,
    content: c.content,
    createdAt: c.created_at,
  }));

  res.json({ comments: transformed });
});

router.post('/recipes/:id/comments', authMiddleware, (req: AuthRequest, res) => {
  const recipeId = parseInt(req.params.id);
  const { content } = req.body;

  if (isNaN(recipeId)) {
    return res.status(400).json({ error: '无效的食谱ID' });
  }

  if (!content || content.trim().length === 0) {
    return res.status(400).json({ error: '评论内容不能为空' });
  }

  const comment = addComment(req.user!.id, recipeId, content.trim());
  res.json({
    id: comment.id,
    recipeId: comment.recipe_id,
    userId: comment.user_id,
    username: comment.username,
    avatar: comment.avatar,
    content: comment.content,
    createdAt: comment.created_at,
  });
});

export default router;
