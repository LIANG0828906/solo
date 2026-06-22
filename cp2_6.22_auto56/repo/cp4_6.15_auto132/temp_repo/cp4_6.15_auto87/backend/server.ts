import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Comment {
  id: string;
  user: string;
  text: string;
  date: string;
}

interface Recipe {
  id: string;
  name: string;
  image: string;
  time: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  ingredients: string[];
  steps: string[];
  comments: Comment[];
}

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const loadRecipes = (): Recipe[] => {
  const dataPath = path.join(__dirname, 'recipeData.json');
  const rawData = fs.readFileSync(dataPath, 'utf-8');
  return JSON.parse(rawData);
};

const calculateSimilarity = (recipeA: Recipe, recipeB: Recipe): number => {
  const commonIngredients = recipeA.ingredients.filter((ing) =>
    recipeB.ingredients.includes(ing)
  ).length;
  const maxIngredients = Math.max(recipeA.ingredients.length, recipeB.ingredients.length);
  const ingredientScore = maxIngredients > 0 ? commonIngredients / maxIngredients : 0;

  const commonTags = recipeA.tags.filter((tag) => recipeB.tags.includes(tag)).length;
  const maxTags = Math.max(recipeA.tags.length, recipeB.tags.length);
  const tagScore = maxTags > 0 ? commonTags / maxTags : 0;

  const difficultyDiff = Math.abs(recipeA.difficulty - recipeB.difficulty);
  const difficultyScore = 1 - difficultyDiff / 4;

  return ingredientScore * 0.5 + tagScore * 0.3 + difficultyScore * 0.2;
};

app.get('/api/recipes', (_req, res) => {
  try {
    const recipes = loadRecipes();
    res.json(recipes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load recipes' });
  }
});

app.get('/api/recipes/:id', (req, res) => {
  try {
    const recipes = loadRecipes();
    const recipe = recipes.find((r) => r.id === req.params.id);
    if (!recipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load recipe' });
  }
});

app.get('/api/recommendations/:id', (req, res) => {
  try {
    const recipes = loadRecipes();
    const currentRecipe = recipes.find((r) => r.id === req.params.id);
    if (!currentRecipe) {
      res.status(404).json({ error: 'Recipe not found' });
      return;
    }

    const otherRecipes = recipes.filter((r) => r.id !== req.params.id);
    const scoredRecipes = otherRecipes.map((recipe) => ({
      recipe,
      score: calculateSimilarity(currentRecipe, recipe),
    }));

    scoredRecipes.sort((a, b) => b.score - a.score);
    const recommendations = scoredRecipes.slice(0, 4).map((item) => item.recipe);

    res.json(recommendations);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
