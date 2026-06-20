import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'anonymous-feedback-db';
const DB_VERSION = 1;
const FEEDBACK_STORE = 'feedbacks';
const EMOTION_STORE = 'emotions';

export interface FeedbackItem {
  id: string;
  content: string;
  userId: string;
  createdAt: number;
  emotion?: EmotionType;
  borderColor: string;
}

export type EmotionType = 'happy' | 'neutral' | 'sad';

export interface EmotionStats {
  happy: number;
  neutral: number;
  sad: number;
}

let db: IDBPDatabase | null = null;

export async function initDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database) {
      if (!database.objectStoreNames.contains(FEEDBACK_STORE)) {
        const store = database.createObjectStore(FEEDBACK_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!database.objectStoreNames.contains(EMOTION_STORE)) {
        database.createObjectStore(EMOTION_STORE, { keyPath: 'id' });
      }
    },
  });

  return db;
}

export async function addFeedback(feedback: FeedbackItem): Promise<void> {
  const database = await initDB();
  await database.add(FEEDBACK_STORE, feedback);
}

export async function getAllFeedbacks(): Promise<FeedbackItem[]> {
  const database = await initDB();
  const all = await database.getAll(FEEDBACK_STORE);
  return all.sort((a: FeedbackItem, b: FeedbackItem) => b.createdAt - a.createdAt);
}

export async function updateFeedbackEmotion(
  id: string,
  emotion: EmotionType
): Promise<void> {
  const database = await initDB();
  const feedback = await database.get(FEEDBACK_STORE, id);
  if (feedback) {
    feedback.emotion = emotion;
    await database.put(FEEDBACK_STORE, feedback);
  }
}

export async function clearAllFeedbacks(): Promise<void> {
  const database = await initDB();
  await database.clear(FEEDBACK_STORE);
}

export async function getEmotionStats(): Promise<EmotionStats> {
  const feedbacks = await getAllFeedbacks();
  const stats: EmotionStats = { happy: 0, neutral: 0, sad: 0 };
  feedbacks.forEach((f) => {
    if (f.emotion) {
      stats[f.emotion]++;
    }
  });
  return stats;
}

export async function exportAllData(): Promise<{
  feedbacks: FeedbackItem[];
  emotions: EmotionStats;
  exportedAt: number;
}> {
  const feedbacks = await getAllFeedbacks();
  const emotions = await getEmotionStats();
  return {
    feedbacks,
    emotions,
    exportedAt: Date.now(),
  };
}
