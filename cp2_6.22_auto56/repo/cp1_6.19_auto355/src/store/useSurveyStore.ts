import { create } from 'zustand';
import { v4 } from 'uuid';
import type {
  Survey,
  SurveyResponse,
  QuestionType,
  Question,
  ResponseAnswer,
} from '../types';
import {
  fetchSurveys,
  fetchSurvey,
  createSurvey,
  updateSurvey,
  publishSurvey,
  fetchResponses,
  submitResponse,
} from '../api';

interface SurveyStore {
  surveys: Survey[];
  currentSurvey: Survey | null;
  responses: SurveyResponse[];
  isLoading: boolean;
  error: string | null;

  loadSurveys: () => Promise<void>;
  loadSurvey: (id: string) => Promise<void>;
  createSurveyAndGo: (
    data: { title: string; description: string; questions: Question[] },
    navigate: (path: string) => void
  ) => Promise<void>;
  saveCurrentSurvey: () => Promise<void>;
  publishCurrentSurvey: () => Promise<void>;
  addQuestion: (type: QuestionType) => void;
  updateQuestion: (questionId: string, updates: Partial<Question>) => void;
  deleteQuestion: (questionId: string) => void;
  reorderQuestions: (fromIndex: number, toIndex: number) => void;
  loadResponses: (surveyId: string) => Promise<void>;
  submitSurveyResponse: (
    surveyId: string,
    answers: ResponseAnswer[],
    completionTime: number
  ) => Promise<void>;
  clearCurrent: () => void;
}

export const useSurveyStore = create<SurveyStore>((set, get) => ({
  surveys: [],
  currentSurvey: null,
  responses: [],
  isLoading: false,
  error: null,

  loadSurveys: async () => {
    set({ isLoading: true, error: null });
    try {
      const surveys = await fetchSurveys();
      set({ surveys });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载问卷列表失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  loadSurvey: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const currentSurvey = await fetchSurvey(id);
      set({ currentSurvey });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载问卷失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  createSurveyAndGo: async (data, navigate) => {
    set({ isLoading: true, error: null });
    try {
      const newSurvey = await createSurvey(data);
      const { surveys } = get();
      set({ surveys: [...surveys, newSurvey], currentSurvey: newSurvey });
      navigate(`/editor/${newSurvey.id}`);
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建问卷失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  saveCurrentSurvey: async () => {
    const { currentSurvey } = get();
    if (!currentSurvey) return;
    set({ isLoading: true, error: null });
    try {
      const updated = await updateSurvey(currentSurvey.id, currentSurvey);
      set({ currentSurvey: updated });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '保存问卷失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  publishCurrentSurvey: async () => {
    const { currentSurvey } = get();
    if (!currentSurvey) return;
    set({ isLoading: true, error: null });
    try {
      const updated = await publishSurvey(currentSurvey.id);
      set({ currentSurvey: updated });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '发布问卷失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  addQuestion: (type: QuestionType) => {
    const { currentSurvey } = get();
    if (!currentSurvey) return;

    const newQuestion: Question = {
      id: v4(),
      type,
      title: '新题目',
    };

    if (type === 'single' || type === 'multiple') {
      newQuestion.options = ['选项1', '选项2'];
    }
    if (type === 'rating') {
      newQuestion.maxRating = 5;
    }

    set({
      currentSurvey: {
        ...currentSurvey,
        questions: [...currentSurvey.questions, newQuestion],
      },
    });
  },

  updateQuestion: (questionId: string, updates: Partial<Question>) => {
    const { currentSurvey } = get();
    if (!currentSurvey) return;

    set({
      currentSurvey: {
        ...currentSurvey,
        questions: currentSurvey.questions.map((q) =>
          q.id === questionId ? { ...q, ...updates } : q
        ),
      },
    });
  },

  deleteQuestion: (questionId: string) => {
    const { currentSurvey } = get();
    if (!currentSurvey) return;

    set({
      currentSurvey: {
        ...currentSurvey,
        questions: currentSurvey.questions.filter((q) => q.id !== questionId),
      },
    });
  },

  reorderQuestions: (fromIndex: number, toIndex: number) => {
    const { currentSurvey } = get();
    if (!currentSurvey) return;

    const questions = [...currentSurvey.questions];
    const [removed] = questions.splice(fromIndex, 1);
    questions.splice(toIndex, 0, removed);

    set({
      currentSurvey: {
        ...currentSurvey,
        questions,
      },
    });
  },

  loadResponses: async (surveyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const responses = await fetchResponses(surveyId);
      set({ responses });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '加载答卷失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  submitSurveyResponse: async (surveyId, answers, completionTime) => {
    set({ isLoading: true, error: null });
    try {
      await submitResponse(surveyId, { answers, completionTime });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '提交答卷失败' });
    } finally {
      set({ isLoading: false });
    }
  },

  clearCurrent: () => {
    set({ currentSurvey: null, responses: [], error: null });
  },
}));
