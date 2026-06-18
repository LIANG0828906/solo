import { create } from 'zustand';
import { AppState, View, QuizQuestion, WrongAnswer } from '../types';

interface AppStore extends AppState {
  setView: (view: View) => void;
  setSelectedCourse: (courseId: string | null) => void;
  setSelectedUnit: (unitId: string | null) => void;
  setQuizQuestions: (questions: QuizQuestion[]) => void;
  setWrongAnswers: (answers: WrongAnswer[]) => void;
  setIsReviewMode: (isReview: boolean) => void;
  resetQuizState: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  currentView: 'courseList',
  selectedCourseId: null,
  selectedUnitId: null,
  quizQuestions: [],
  wrongAnswers: [],
  isReviewMode: false,

  setView: (view) => set({ currentView: view }),
  setSelectedCourse: (courseId) => set({ selectedCourseId: courseId }),
  setSelectedUnit: (unitId) => set({ selectedUnitId: unitId }),
  setQuizQuestions: (questions) => set({ quizQuestions: questions }),
  setWrongAnswers: (answers) => set({ wrongAnswers: answers }),
  setIsReviewMode: (isReview) => set({ isReviewMode: isReview }),
  resetQuizState: () =>
    set({
      quizQuestions: [],
      wrongAnswers: [],
      isReviewMode: false,
    }),
}));
