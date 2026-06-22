import { Router, Request, Response } from 'express';
import { recipes } from './recipes';

interface Interaction {
  id: string;
  userId: string;
  recipeId: string;
  type: 'favorite' | 'rating' | 'comment';
  value: number | string;
  createdAt: string;
}

const interactions: Interaction[] = [
  { id: 'f1', userId: 'user1', recipeId: '1', type: 'favorite', value: '', createdAt: '2024-03-01T10:00:00Z' },
  { id: 'f2', userId: 'user1', recipeId: '3', type: 'favorite', value: '', createdAt: '2024-03-02T11:00:00Z' },
  { id: 'f3', userId: 'user1', recipeId: '5', type: 'favorite', value: '', createdAt: '2024-03-03T12:00:00Z' },
  { id: 'f4', userId: 'user1', recipeId: '7', type: 'favorite', value: '', createdAt: '2024-03-04T13:00:00Z' },
  { id: 'r1', userId: 'user1', recipeId: '1', type: 'rating', value: 5, createdAt: '2024-03-01T10:30:00Z' },
  { id: 'r2', userId: 'user1', recipeId: '3', type: 'rating', value: 4, createdAt: '2024-03-02T11:30:00Z' },
  { id: 'r3', userId: 'user1', recipeId: '5', type: 'rating', value: 4, createdAt: '2024-03-03T12:30:00Z' },
  { id: 'c1', userId: 'user2', recipeId: '2', type: 'comment', value: '太好吃了，非常正宗！', createdAt: '2024-03-05T14:00:00Z' },
  { id: 'c2', userId: 'user2', recipeId: '4', type: 'comment', value: '酸甜可口，家人都很喜欢', createdAt: '2024-03-06T15:00:00Z' },
  { id: 'r4', userId: 'user2', recipeId: '2', type: 'rating', value: 5, createdAt: '2024-03-05T14:30:00Z' },
  { id: 'r5', userId: 'user2', recipeId: '4', type: 'rating', value: 5, createdAt: '2024-03-06T15:30:00Z' },
  { id: 'r6', userId: 'user2', recipeId: '6', type: 'rating', value: 4, createdAt: '2024-03-07T16:00:00Z' },
  { id: 'r7', userId: 'user3', recipeId: '1', type: 'rating', value: 5, createdAt: '2024-03-08T09:00:00Z' },
  { id: 'r8', userId: 'user3', recipeId: '2', type: 'rating', value: 4, createdAt: '2024-03-08T10:00:00Z' },
  { id: 'r9', userId: 'user3', recipeId: '7', type: 'rating', value: 5, createdAt: '2024-03-08T11:00:00Z' }
];

const router = Router();

router.get('/', (req: Request, res: Response) => {
  const { userId, recipeId, type } = req.query;
  let filtered = [...interactions];

  if (userId && typeof userId === 'string') {
    filtered = filtered.filter(i => i.userId === userId);
  }

  if (recipeId && typeof recipeId === 'string') {
    filtered = filtered.filter(i => i.recipeId === recipeId);
  }

  if (type && typeof type === 'string') {
    filtered = filtered.filter(i => i.type === type);
  }

  res.json(filtered);
});

router.post('/', (req: Request, res: Response) => {
  const newInteraction: Interaction = {
    id: String(Date.now()),
    userId: req.body.userId || '',
    recipeId: req.body.recipeId || '',
    type: req.body.type || 'comment',
    value: req.body.value ?? '',
    createdAt: new Date().toISOString()
  };
  interactions.push(newInteraction);

  if (newInteraction.type === 'rating') {
    const recipe = recipes.find(r => r.id === newInteraction.recipeId);
    if (recipe) {
      const allRatings = interactions.filter(
        i => i.recipeId === newInteraction.recipeId && i.type === 'rating'
      );
      const sum = allRatings.reduce((acc, i) => acc + Number(i.value), 0);
      recipe.avgRating = Math.round((sum / allRatings.length) * 10) / 10;
    }
  }

  if (newInteraction.type === 'favorite') {
    const recipe = recipes.find(r => r.id === newInteraction.recipeId);
    if (recipe) {
      recipe.favoritesCount += 1;
    }
  }

  res.status(201).json(newInteraction);
});

router.get('/recommendations/:userId', (req: Request, res: Response) => {
  const targetUserId = req.params.userId;

  const ratingInteractions = interactions.filter(i => i.type === 'rating');

  const userRatings: Record<string, Record<string, number>> = {};
  for (const i of ratingInteractions) {
    if (!userRatings[i.userId]) {
      userRatings[i.userId] = {};
    }
    userRatings[i.userId][i.recipeId] = Number(i.value);
  }

  const targetVector = userRatings[targetUserId] || {};

  const allRecipeIds = new Set<string>();
  for (const ratings of Object.values(userRatings)) {
    for (const rid of Object.keys(ratings)) {
      allRecipeIds.add(rid);
    }
  }

  const cosineSimilarity = (vecA: Record<string, number>, vecB: Record<string, number>): number => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (const rid of allRecipeIds) {
      const a = vecA[rid] || 0;
      const b = vecB[rid] || 0;
      dotProduct += a * b;
      normA += a * a;
      normB += b * b;
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  };

  const similarities: { userId: string; similarity: number }[] = [];
  for (const userId of Object.keys(userRatings)) {
    if (userId === targetUserId) continue;
    similarities.push({
      userId,
      similarity: cosineSimilarity(targetVector, userRatings[userId])
    });
  }

  similarities.sort((a, b) => b.similarity - a.similarity);
  const topUsers = similarities.slice(0, 3);

  const targetInteractedRecipes = new Set(
    interactions
      .filter(i => i.userId === targetUserId)
      .map(i => i.recipeId)
  );

  const candidateRecipes: { recipeId: string; weightedScore: number }[] = [];
  for (const similarUser of topUsers) {
    const userRatingMap = userRatings[similarUser.userId] || {};
    for (const [recipeId, rating] of Object.entries(userRatingMap)) {
      if (!targetInteractedRecipes.has(recipeId) && rating >= 4) {
        const existing = candidateRecipes.find(c => c.recipeId === recipeId);
        if (existing) {
          existing.weightedScore += similarUser.similarity * rating;
        } else {
          candidateRecipes.push({
            recipeId,
            weightedScore: similarUser.similarity * rating
          });
        }
      }
    }
  }

  candidateRecipes.sort((a, b) => b.weightedScore - a.weightedScore);
  const topRecipeIds = candidateRecipes.slice(0, 6).map(c => c.recipeId);

  const recommendedRecipes = topRecipeIds
    .map(id => recipes.find(r => r.id === id))
    .filter((r): r is typeof recipes[0] => r !== undefined);

  res.json(recommendedRecipes);
});

export default router;
