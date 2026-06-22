import { create } from 'zustand';
import { Survey, SurveyResponse, generateId } from './utils/questionTypes';
import { generateMockData } from './utils/mockData';

interface SurveyStore {
  surveys: Survey[];
  responses: SurveyResponse[];
  currentRoute: string;
  routeParams: Record<string, string>;
  navigate: (route: string, params?: Record<string, string>) => void;
  addSurvey: (survey: Omit<Survey, 'id' | 'createdAt'>) => string;
  updateSurvey: (id: string, survey: Partial<Survey>) => void;
  deleteSurvey: (id: string) => void;
  addResponse: (response: Omit<SurveyResponse, 'id' | 'submittedAt'>) => void;
  getSurveyResponses: (surveyId: string) => SurveyResponse[];
  getSurvey: (id: string) => Survey | undefined;
  initMockData: () => void;
}

const mockData = generateMockData();

export const useSurveyStore = create<SurveyStore>((set, get) => ({
  surveys: mockData.surveys,
  responses: mockData.responses,
  currentRoute: '/',
  routeParams: {},

  navigate: (route, params = {}) => {
    set({ currentRoute: route, routeParams: params });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  addSurvey: (surveyData) => {
    const newSurvey: Survey = {
      ...surveyData,
      id: generateId(),
      createdAt: new Date(),
    };
    set((state) => ({
      surveys: [newSurvey, ...state.surveys],
    }));
    return newSurvey.id;
  },

  updateSurvey: (id, surveyData) => {
    set((state) => ({
      surveys: state.surveys.map((s) =>
        s.id === id ? { ...s, ...surveyData } : s,
      ),
    }));
  },

  deleteSurvey: (id) => {
    set((state) => ({
      surveys: state.surveys.filter((s) => s.id !== id),
      responses: state.responses.filter((r) => r.surveyId !== id),
    }));
  },

  addResponse: (responseData) => {
    const newResponse: SurveyResponse = {
      ...responseData,
      id: generateId(),
      submittedAt: new Date(),
    };
    set((state) => ({
      responses: [...state.responses, newResponse],
    }));
  },

  getSurveyResponses: (surveyId) => {
    return get().responses.filter((r) => r.surveyId === surveyId);
  },

  getSurvey: (id) => {
    return get().surveys.find((s) => s.id === id);
  },

  initMockData: () => {
    const data = generateMockData();
    set({ surveys: data.surveys, responses: data.responses });
  },
}));
