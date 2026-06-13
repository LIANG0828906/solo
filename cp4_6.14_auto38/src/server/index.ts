import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import type { Recipe, TimerState, CreateRecipeRequest, AddReviewRequest, Step } from '../types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const recipes: Map<string, Recipe> = new Map();
const timerStates: Map<string, TimerState> = new Map();

const sampleSteps: Step[] = [
  {
    id: uuidv4(),
    description: '准备食材，番茄切块，鸡蛋打散',
    duration: 120,
    ingredients: [
      { name: '番茄', quantity: '2个' },
      { name: '鸡蛋', quantity: '3个' },
    ],
  },
  {
    id: uuidv4(),
    description: '热锅下油，倒入蛋液炒至半熟盛出',
    duration: 90,
    ingredients: [
      { name: '食用油', quantity: '2勺' },
    ],
  },
  {
    id: uuidv4(),
    description: '锅内加油，放入番茄翻炒出汁',
    duration: 180,
    ingredients: [
      { name: '番茄', quantity: '2个' },
    ],
  },
  {
    id: uuidv4(),
    description: '加入炒好的鸡蛋，加盐调味，翻炒均匀',
    duration: 60,
    ingredients: [
      { name: '盐', quantity: '适量' },
      { name: '鸡蛋', quantity: '3个' },
    ],
  },
  {
    id: uuidv4(),
    description: '撒上葱花，出锅装盘',
    duration: 30,
    ingredients: [
      { name: '葱花', quantity: '少许' },
    ],
  },
];

const sampleRecipe: Recipe = {
  id: uuidv4(),
  title: '番茄炒蛋',
  coverImage: '',
  description: '经典家常菜，酸甜可口，简单易做',
  prepTime: 10,
  cookTime: 8,
  steps: sampleSteps,
  reviews: [
    {
      id: uuidv4(),
      userId: 'user1',
      userName: '美食家小王',
      rating: 5,
      comment: '非常好吃！步骤很详细，第一次做就成功了~',
      createdAt: Date.now() - 86400000,
    },
    {
      id: uuidv4(),
      userId: 'user2',
      userName: '厨房新手',
      rating: 4,
      comment: '味道不错，番茄可以多炒一会出汁',
      createdAt: Date.now() - 172800000,
    },
  ],
  createdAt: Date.now(),
  averageRating: 4.5,
};

recipes.set(sampleRecipe.id, sampleRecipe);

const calculateAverageRating = (reviews: { rating: number }[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};

app.get('/api/recipes', (_req, res) => {
  const recipeList = Array.from(recipes.values()).sort((a, b) => b.createdAt - a.createdAt);
  res.json(recipeList.slice(0, 50));
});

app.get('/api/recipes/:id', (req, res) => {
  const recipe = recipes.get(req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }
  res.json(recipe);
});

app.post('/api/recipes', (req, res) => {
  const data: CreateRecipeRequest = req.body;

  const steps: Step[] = data.steps.map((s) => ({
    ...s,
    id: uuidv4(),
  }));

  const recipe: Recipe = {
    id: uuidv4(),
    title: data.title,
    coverImage: data.coverImage,
    description: data.description,
    prepTime: data.prepTime,
    cookTime: data.cookTime,
    steps,
    reviews: [],
    createdAt: Date.now(),
    averageRating: 0,
  };

  recipes.set(recipe.id, recipe);
  res.status(201).json(recipe);
});

app.post('/api/recipes/:id/reviews', (req, res) => {
  const recipe = recipes.get(req.params.id);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }

  const data: AddReviewRequest = req.body;

  const review = {
    id: uuidv4(),
    userId: uuidv4(),
    userName: data.userName,
    rating: data.rating,
    comment: data.comment,
    createdAt: Date.now(),
  };

  recipe.reviews.push(review);
  recipe.averageRating = calculateAverageRating(recipe.reviews);

  res.json(recipe);
});

app.get('/api/timer/:recipeId', (req, res) => {
  const { recipeId } = req.params;
  let state = timerStates.get(recipeId);

  if (!state) {
    const recipe = recipes.get(recipeId);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    state = {
      recipeId,
      currentStepIndex: 0,
      remainingTime: recipe.steps[0]?.duration || 0,
      isRunning: false,
      completedSteps: [],
      lastUpdated: 0,
    };
    timerStates.set(recipeId, state);
  }

  res.json(state);
});

app.post('/api/timer/:recipeId/start', (req, res) => {
  const { recipeId } = req.params;
  const recipe = recipes.get(recipeId);
  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }

  let state = timerStates.get(recipeId);
  const now = Date.now();

  if (!state) {
    state = {
      recipeId,
      currentStepIndex: 0,
      remainingTime: recipe.steps[0]?.duration || 0,
      isRunning: true,
      completedSteps: [],
      lastUpdated: now,
    };
  } else {
    state = {
      ...state,
      isRunning: true,
      lastUpdated: now,
    };
  }

  timerStates.set(recipeId, state);
  res.json(state);
});

app.post('/api/timer/:recipeId/pause', (req, res) => {
  const { recipeId } = req.params;
  let state = timerStates.get(recipeId);

  if (!state) {
    return res.status(404).json({ error: 'Timer not found' });
  }

  const now = Date.now();
  state = {
    ...state,
    isRunning: false,
    lastUpdated: now,
  };

  timerStates.set(recipeId, state);
  res.json(state);
});

app.post('/api/timer/:recipeId/skip', (req, res) => {
  const { recipeId } = req.params;
  const recipe = recipes.get(recipeId);
  let state = timerStates.get(recipeId);

  if (!recipe || !state) {
    return res.status(404).json({ error: 'Not found' });
  }

  const now = Date.now();
  const currentStep = recipe.steps[state.currentStepIndex];
  const nextIndex = state.currentStepIndex + 1;

  const newCompletedSteps = [...state.completedSteps];
  if (currentStep && !newCompletedSteps.includes(currentStep.id)) {
    newCompletedSteps.push(currentStep.id);
  }

  if (nextIndex < recipe.steps.length) {
    state = {
      ...state,
      currentStepIndex: nextIndex,
      remainingTime: recipe.steps[nextIndex].duration,
      completedSteps: newCompletedSteps,
      lastUpdated: now,
    };
  } else {
    state = {
      ...state,
      isRunning: false,
      completedSteps: newCompletedSteps,
      lastUpdated: now,
    };
  }

  timerStates.set(recipeId, state);
  res.json(state);
});

app.post('/api/timer/:recipeId/reset', (req, res) => {
  const { recipeId } = req.params;
  const recipe = recipes.get(recipeId);

  if (!recipe) {
    return res.status(404).json({ error: 'Recipe not found' });
  }

  const now = Date.now();
  const state: TimerState = {
    recipeId,
    currentStepIndex: 0,
    remainingTime: recipe.steps[0]?.duration || 0,
    isRunning: false,
    completedSteps: [],
    lastUpdated: now,
  };

  timerStates.set(recipeId, state);
  res.json(state);
});

app.post('/api/timer/:recipeId/sync', (req, res) => {
  const { recipeId } = req.params;
  const incomingState: TimerState = req.body;

  let currentState = timerStates.get(recipeId);
  const now = Date.now();

  if (!currentState || incomingState.lastUpdated >= currentState.lastUpdated) {
    currentState = {
      ...incomingState,
      lastUpdated: now,
    };
    timerStates.set(recipeId, currentState);
  }

  res.json(currentState);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
