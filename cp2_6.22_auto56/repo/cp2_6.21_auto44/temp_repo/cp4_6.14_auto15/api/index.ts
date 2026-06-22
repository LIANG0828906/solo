import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { mockRecipes, ingredientDetails, mockComments } from './data/mockRecipes';
import type { Recipe, Comment, IngredientDetail, Cuisine, Difficulty } from './types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/recipes', (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 12;
  const keyword = (req.query.keyword as string)?.toLowerCase() || '';
  const cuisine = req.query.cuisine as string | undefined;
  const difficulty = req.query.difficulty as string | undefined;

  let filtered = [...mockRecipes];

  if (keyword) {
    filtered = filtered.filter((r) => {
      const nameMatch = r.name.toLowerCase().includes(keyword);
      const ingredientMatch = r.ingredients.some((ing) =>
        ing.name.toLowerCase().includes(keyword)
      );
      return nameMatch || ingredientMatch;
    });
  }

  if (cuisine && cuisine !== 'all') {
    filtered = filtered.filter((r) => r.cuisine === cuisine);
  }

  if (difficulty && difficulty !== 'all') {
    filtered = filtered.filter((r) => r.difficulty === difficulty);
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const recipes = filtered.slice(start, end);

  res.json({ recipes, total, page, pageSize });
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = mockRecipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  res.json(recipe);
});

app.get('/api/recipes/:id/comments', (req, res) => {
  const recipeId = req.params.id;
  const comments = mockComments[recipeId] || [];
  res.json(comments);
});

app.post('/api/recipes/:id/comments', (req, res) => {
  const recipeId = req.params.id;
  const { username, content } = req.body;

  if (!username || !content) {
    return res.status(400).json({ error: 'username and content are required' });
  }

  const colors = ['#FFD700', '#FF9800', '#4CAF50', '#2196F3', '#9C27B0', '#E91E63', '#00BCD4'];
  const newComment: Comment = {
    id: uuidv4(),
    recipeId,
    username,
    avatarColor: colors[Math.floor(Math.random() * colors.length)],
    content,
    createdAt: new Date().toISOString(),
  };

  if (!mockComments[recipeId]) {
    mockComments[recipeId] = [];
  }
  mockComments[recipeId].unshift(newComment);

  res.status(201).json(newComment);
});

app.post('/api/recipes/:id/rating', (req, res) => {
  const recipe = mockRecipes.find((r) => r.id === req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }

  const { rating } = req.body;
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  const totalRating = recipe.rating * recipe.ratingCount + rating;
  recipe.ratingCount += 1;
  recipe.rating = Math.round((totalRating / recipe.ratingCount) * 10) / 10;

  res.json({ rating: recipe.rating, ratingCount: recipe.ratingCount });
});

app.get('/api/ingredients/:name', (req, res) => {
  const name = decodeURIComponent(req.params.name);
  const detail = ingredientDetails[name] || {
    name,
    origin: '各地均产',
    substitutes: ['同类其他食材'],
    description: `${name}是常见的烹饪食材，广泛用于各类菜品中。口感适中，营养价值丰富。`,
  };
  res.json(detail);
});

app.get('/api/recipes/:id/recommend', (req, res) => {
  const current = mockRecipes.find((r) => r.id === req.params.id);
  if (!current) {
    return res.status(404).json({ error: 'Recipe not found' });
  }

  const scored = mockRecipes
    .filter((r) => r.id !== current.id)
    .map((r) => {
      let score = 0;
      if (r.cuisine === current.cuisine) score += 3;
      const sharedTags = r.tags.filter((t) => current.tags.includes(t)).length;
      score += sharedTags * 2;
      const sharedIngredients = r.ingredients.filter((ing) =>
        current.ingredients.some((ci) => ci.name === ing.name)
      ).length;
      score += sharedIngredients;
      return { recipe: r, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((s) => s.recipe);

  res.json(scored);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
