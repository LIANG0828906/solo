import questionsData from './data/questions.json';
import type { Question } from './types';

function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export async function loadQuestions(): Promise<Question[]> {
  return questionsData as Question[];
}

export async function generateQuestions(count: number = 5): Promise<Question[]> {
  const allQuestions = await loadQuestions();
  const shuffled = shuffle(allQuestions);
  return shuffled.slice(0, count);
}
