import { get, set } from 'idb-keyval';
import type { Exercise, TrainingRecord, TrainingTemplate } from '../modules/exercise/types';

const EXERCISES_KEY = 'fitness_exercises';
const TRAINING_RECORDS_KEY = 'fitness_training_records';
const TEMPLATES_KEY = 'fitness_templates';

export async function getExercises(): Promise<Exercise[]> {
  const exercises = await get<Exercise[]>(EXERCISES_KEY);
  return exercises || [];
}

export async function setExercises(exercises: Exercise[]): Promise<void> {
  await set(EXERCISES_KEY, exercises);
}

export async function getTrainingRecords(): Promise<TrainingRecord[]> {
  const records = await get<TrainingRecord[]>(TRAINING_RECORDS_KEY);
  return records || [];
}

export async function setTrainingRecords(records: TrainingRecord[]): Promise<void> {
  await set(TRAINING_RECORDS_KEY, records);
}

export async function getTemplates(): Promise<TrainingTemplate[]> {
  const templates = await get<TrainingTemplate[]>(TEMPLATES_KEY);
  return templates || [];
}

export async function setTemplates(templates: TrainingTemplate[]): Promise<void> {
  await set(TEMPLATES_KEY, templates);
}
