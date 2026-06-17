import { create } from 'zustand';
import { charToDots, getRandomChar, getRandomChars, dotsEqual } from '../BrailleChar';

export type GameMode = 'practice' | 'test';

export interface HistoryRecord {
  id: number;
  accuracy: number;
  avgTime: number;
  date: string;
}

export interface TestResult {
  total: number;
  correct: number;
  accuracy: number;
  avgTime: number;
}

interface BrailleState {
  mode: GameMode;
  currentChar: string;
  currentDots: boolean[];
  score: number;
  totalQuestions: number;
  correctCount: number;
  questionStartTime: number;
  totalTime: number;
  history: HistoryRecord[];
  testQuestions: string[];
  testCurrentIndex: number;
  testStartTime: number;
  testResults: TestResult | null;
  showError: boolean;
  errorMessage: string;
  isCorrect: boolean;
  setMode: (mode: GameMode) => void;
  toggleDot: (index: number) => void;
  checkAnswer: () => boolean;
  nextQuestion: () => void;
  showErrorMsg: (msg: string) => void;
  hideError: () => void;
  startTest: () => void;
  submitTestAnswer: () => void;
  finishTest: () => void;
}

const initialDots = [false, false, false, false, false, false];

export const useBrailleStore = create<BrailleState>((set, get) => ({
  mode: 'practice',
  currentChar: getRandomChar(),
  currentDots: [...initialDots],
  score: 0,
  totalQuestions: 0,
  correctCount: 0,
  questionStartTime: Date.now(),
  totalTime: 0,
  history: [],
  testQuestions: [],
  testCurrentIndex: 0,
  testStartTime: 0,
  testResults: null,
  showError: false,
  errorMessage: '',
  isCorrect: false,

  setMode: (mode: GameMode) => {
    if (mode === 'test') {
      const questions = getRandomChars(20);
      set({
        mode,
        testQuestions: questions,
        testCurrentIndex: 0,
        currentChar: questions[0],
        currentDots: [...initialDots],
        testStartTime: Date.now(),
        questionStartTime: Date.now(),
        testResults: null,
        correctCount: 0,
        totalQuestions: 0,
        totalTime: 0,
      });
    } else {
      set({
        mode,
        currentChar: getRandomChar(),
        currentDots: [...initialDots],
        score: 0,
        totalQuestions: 0,
        correctCount: 0,
        questionStartTime: Date.now(),
        totalTime: 0,
        testResults: null,
      });
    }
  },

  toggleDot: (index: number) => {
    set((state) => {
      const newDots = [...state.currentDots];
      newDots[index] = !newDots[index];
      return { currentDots: newDots, isCorrect: false };
    });
  },

  checkAnswer: () => {
    const { currentChar, currentDots } = get();
    const correctDots = charToDots(currentChar);
    const isCorrect = dotsEqual(currentDots, correctDots);

    if (isCorrect) {
      const elapsed = (Date.now() - get().questionStartTime) / 1000;
      set((state) => ({
        score: state.score + 10,
        totalQuestions: state.totalQuestions + 1,
        correctCount: state.correctCount + 1,
        totalTime: state.totalTime + elapsed,
        isCorrect: true,
      }));
    }
    return isCorrect;
  },

  nextQuestion: () => {
    set({
      currentChar: getRandomChar(),
      currentDots: [...initialDots],
      questionStartTime: Date.now(),
      isCorrect: false,
      showError: false,
    });
  },

  showErrorMsg: (msg: string) => {
    set({ showError: true, errorMessage: msg });
  },

  hideError: () => {
    set({ showError: false });
  },

  startTest: () => {
    const questions = getRandomChars(20);
    set({
      testQuestions: questions,
      testCurrentIndex: 0,
      currentChar: questions[0],
      currentDots: [...initialDots],
      testStartTime: Date.now(),
      questionStartTime: Date.now(),
      testResults: null,
      correctCount: 0,
      totalQuestions: 0,
      totalTime: 0,
    });
  },

  submitTestAnswer: () => {
    const { currentChar, currentDots, testCurrentIndex, testQuestions } = get();
    const correctDots = charToDots(currentChar);
    const isCorrect = dotsEqual(currentDots, correctDots);
    const elapsed = (Date.now() - get().questionStartTime) / 1000;

    const nextIndex = testCurrentIndex + 1;

    if (nextIndex < testQuestions.length) {
      set((state) => ({
        correctCount: state.correctCount + (isCorrect ? 1 : 0),
        totalQuestions: state.totalQuestions + 1,
        totalTime: state.totalTime + elapsed,
        testCurrentIndex: nextIndex,
        currentChar: testQuestions[nextIndex],
        currentDots: [...initialDots],
        questionStartTime: Date.now(),
      }));
    } else {
      set((state) => ({
        correctCount: state.correctCount + (isCorrect ? 1 : 0),
        totalQuestions: state.totalQuestions + 1,
        totalTime: state.totalTime + elapsed,
      }));
      get().finishTest();
    }
  },

  finishTest: () => {
    const { correctCount, totalQuestions, totalTime, history } = get();
    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const avgTime = totalQuestions > 0 ? totalTime / totalQuestions : 0;

    const newRecord: HistoryRecord = {
      id: Date.now(),
      accuracy,
      avgTime,
      date: new Date().toLocaleDateString(),
    };

    const newHistory = [...history, newRecord].slice(-10);

    set({
      testResults: {
        total: totalQuestions,
        correct: correctCount,
        accuracy,
        avgTime,
      },
      history: newHistory,
    });
  },
}));
