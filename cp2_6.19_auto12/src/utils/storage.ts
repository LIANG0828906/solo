import type { Question, AnswerRecord } from '../types';

const QUESTIONS_KEY = 'quiz_questions';
const ANSWER_RECORDS_KEY = 'quiz_answer_records';

export const storage = {
  getQuestions: (): Question[] => {
    try {
      const data = localStorage.getItem(QUESTIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setQuestions: (questions: Question[]): void => {
    localStorage.setItem(QUESTIONS_KEY, JSON.stringify(questions));
  },

  getAnswerRecords: (): AnswerRecord[] => {
    try {
      const data = localStorage.getItem(ANSWER_RECORDS_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  setAnswerRecords: (records: AnswerRecord[]): void => {
    localStorage.setItem(ANSWER_RECORDS_KEY, JSON.stringify(records));
  },

  clearAll: (): void => {
    localStorage.removeItem(QUESTIONS_KEY);
    localStorage.removeItem(ANSWER_RECORDS_KEY);
  },
};
