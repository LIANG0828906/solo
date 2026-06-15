import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  generateRecipe as engineGenerateRecipe,
  BREED_OPTIONS,
  type PetInfo,
  type Recipe,
  type FeedbackRecord,
  type FeedbackType,
} from '../src/recipeEngine';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

interface Storage {
  feedbacks: FeedbackRecord[];
  currentRecipe: Recipe | null;
  currentPetInfo: PetInfo | null;
}

const storage: Storage = {
  feedbacks: [],
  currentRecipe: null,
  currentPetInfo: null,
};

function delay<T>(data: T, ms: number = 150): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

app.get('/mock/petInfo', (_req, res) => {
  delay({
    breeds: BREED_OPTIONS,
    activityLevels: [
      { value: 'low', label: '低活动量（宅家为主）' },
      { value: 'medium', label: '中等活动量（日常散步）' },
      { value: 'high', label: '高活动量（运动爱好者）' },
    ],
  }).then((data) => res.json(data));
});

app.post('/mock/generateRecipe', async (req, res) => {
  const { petInfo, useFeedback = true } = req.body as { petInfo: PetInfo; useFeedback?: boolean };

  storage.currentPetInfo = petInfo;

  const feedbacks = useFeedback ? storage.feedbacks : [];
  const recipe = engineGenerateRecipe(petInfo, feedbacks, storage.currentRecipe || undefined);

  storage.currentRecipe = recipe;

  delay(recipe, 100).then((data) => res.json(data));
});

app.post('/mock/submitFeedback', (req, res) => {
  const { recipeId, type, timestamp } = req.body as {
    recipeId: string;
    type: FeedbackType;
    timestamp?: string;
  };

  const record: FeedbackRecord = {
    id: uuidv4(),
    recipeId,
    type,
    timestamp: timestamp || new Date().toISOString(),
  };

  storage.feedbacks.push(record);

  delay(record, 80).then((data) => res.json(data));
});

app.put('/mock/feedbacks/:id', (req, res) => {
  const { id } = req.params;
  const { type } = req.body as { type: FeedbackType };

  const index = storage.feedbacks.findIndex((f) => f.id === id);
  if (index === -1) {
    res.status(404).json({ error: 'Feedback not found' });
    return;
  }

  storage.feedbacks[index] = {
    ...storage.feedbacks[index],
    type,
  };

  delay(storage.feedbacks[index], 80).then((data) => res.json(data));
});

app.get('/mock/feedbacks', (_req, res) => {
  const sorted = [...storage.feedbacks].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  delay(sorted, 80).then((data) => res.json(data));
});

app.listen(PORT, () => {
  console.log(`🐾 Pet Recipe API server running at http://localhost:${PORT}`);
});
