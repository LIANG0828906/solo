import { create } from 'zustand';

export type GameStatus = 'idle' | 'playing' | 'finished';
export type CharStatus = 'pending' | 'correct' | 'incorrect' | 'current';

export interface WpmRecord {
  time: number;
  wpm: number;
}

interface TypingState {
  status: GameStatus;
  currentText: string;
  currentIndex: number;
  charStates: ('correct' | 'incorrect')[];
  correctChars: number;
  totalChars: number;
  charErrors: Record<string, number>;
  wordErrors: Record<string, { errors: number; attempts: number }>;
  startTime: number | null;
  timeLeft: number;
  wpmHistory: WpmRecord[];
  currentWpm: number;
  peakWpm: number;
  accuracy: number;
  heatmapMode: boolean;
  showResult: boolean;
  flashIndex: number | null;

  startGame: (text: string) => void;
  handleInput: (char: string) => void;
  backspace: () => void;
  tick: () => void;
  recordWpm: (wpm: number, time: number) => void;
  finishGame: () => void;
  resetGame: (text: string) => void;
  toggleHeatmap: () => void;
  setFlashIndex: (index: number | null) => void;
  getCharStatus: (index: number) => CharStatus;
}

const INITIAL_TIME = 60;

export const useTypingStore = create<TypingState>((set, get) => ({
  status: 'idle',
  currentText: '',
  currentIndex: 0,
  charStates: [],
  correctChars: 0,
  totalChars: 0,
  charErrors: {},
  wordErrors: {},
  startTime: null,
  timeLeft: INITIAL_TIME,
  wpmHistory: [],
  currentWpm: 0,
  peakWpm: 0,
  accuracy: 100,
  heatmapMode: false,
  showResult: false,
  flashIndex: null,

  startGame: (text: string) => {
    set({
      status: 'playing',
      currentText: text,
      currentIndex: 0,
      charStates: [],
      correctChars: 0,
      totalChars: 0,
      charErrors: {},
      wordErrors: {},
      startTime: Date.now(),
      timeLeft: INITIAL_TIME,
      wpmHistory: [],
      currentWpm: 0,
      peakWpm: 0,
      accuracy: 100,
      showResult: false,
      flashIndex: null,
    });
  },

  handleInput: (char: string) => {
    const state = get();
    if (state.status !== 'playing') return;
    if (state.currentIndex >= state.currentText.length) return;

    const expectedChar = state.currentText[state.currentIndex];
    const isCorrect = char === expectedChar;

    const words = state.currentText.split(/\s+/);
    let charCount = 0;
    let currentWordIndex = -1;
    for (let i = 0; i < words.length; i++) {
      const wordStart = charCount;
      if (state.currentIndex >= wordStart && state.currentIndex < wordStart + words[i].length) {
        currentWordIndex = i;
        break;
      }
      charCount += words[i].length;
      if (charCount + 1 <= state.currentIndex) {
        charCount += 1;
      }
    }
    const currentWord = currentWordIndex >= 0 ? words[currentWordIndex] : '';

    const newCharStates = [...state.charStates];
    newCharStates[state.currentIndex] = isCorrect ? 'correct' : 'incorrect';

    const newCharErrors = { ...state.charErrors };
    const newWordErrors = { ...state.wordErrors };

    if (!isCorrect) {
      newCharErrors[char] = (newCharErrors[char] || 0) + 1;
      if (currentWord) {
        if (!newWordErrors[currentWord]) {
          newWordErrors[currentWord] = { errors: 0, attempts: 0 };
        }
        newWordErrors[currentWord].errors += 1;
      }
    }

    if (currentWord) {
      if (!newWordErrors[currentWord]) {
        newWordErrors[currentWord] = { errors: 0, attempts: 0 };
      }
      newWordErrors[currentWord].attempts += 1;
    }

    const newTotalChars = state.totalChars + 1;
    const newCorrectChars = state.correctChars + (isCorrect ? 1 : 0);
    const newAccuracy = newTotalChars > 0 ? (newCorrectChars / newTotalChars) * 100 : 100;

    const newIndex = state.currentIndex + 1;
    const isFinished = newIndex >= state.currentText.length;

    set({
      currentIndex: newIndex,
      charStates: newCharStates,
      correctChars: newCorrectChars,
      totalChars: newTotalChars,
      charErrors: newCharErrors,
      wordErrors: newWordErrors,
      accuracy: newAccuracy,
      status: isFinished ? 'finished' : state.status,
      showResult: isFinished ? true : state.showResult,
    });
  },

  backspace: () => {
    const state = get();
    if (state.status !== 'playing') return;
    if (state.currentIndex <= 0) return;

    const newIndex = state.currentIndex - 1;
    const newCharStates = [...state.charStates];
    const oldState = newCharStates[newIndex];

    let newCorrectChars = state.correctChars;
    let newTotalChars = state.totalChars;

    if (oldState !== undefined) {
      if (oldState === 'correct') {
        newCorrectChars -= 1;
      }
      newTotalChars -= 1;
      newCharStates[newIndex] = undefined as unknown as 'correct' | 'incorrect';
    }

    const newAccuracy = newTotalChars > 0 ? (newCorrectChars / newTotalChars) * 100 : 100;

    set({
      currentIndex: newIndex,
      charStates: newCharStates,
      correctChars: newCorrectChars,
      totalChars: newTotalChars,
      accuracy: newAccuracy,
    });
  },

  tick: () => {
    const state = get();
    if (state.status !== 'playing' || state.startTime === null) return;

    const elapsed = (Date.now() - state.startTime) / 1000;
    const newTimeLeft = Math.max(0, INITIAL_TIME - elapsed);

    if (newTimeLeft <= 0) {
      set({
        timeLeft: 0,
        status: 'finished',
        showResult: true,
      });
      return;
    }

    set({ timeLeft: newTimeLeft });
  },

  recordWpm: (wpm: number, time: number) => {
    const state = get();
    const newPeak = Math.max(state.peakWpm, wpm);

    set({
      currentWpm: wpm,
      peakWpm: newPeak,
      wpmHistory: [...state.wpmHistory, { time, wpm }],
    });
  },

  finishGame: () => {
    set({
      status: 'finished',
      showResult: true,
    });
  },

  resetGame: (text: string) => {
    set({
      status: 'idle',
      currentText: text,
      currentIndex: 0,
      charStates: [],
      correctChars: 0,
      totalChars: 0,
      charErrors: {},
      wordErrors: {},
      startTime: null,
      timeLeft: INITIAL_TIME,
      wpmHistory: [],
      currentWpm: 0,
      peakWpm: 0,
      accuracy: 100,
      showResult: false,
      flashIndex: null,
    });
  },

  toggleHeatmap: () => {
    set((state) => ({ heatmapMode: !state.heatmapMode }));
  },

  setFlashIndex: (index: number | null) => {
    set({ flashIndex: index });
  },

  getCharStatus: (index: number): CharStatus => {
    const state = get();
    if (index === state.currentIndex) {
      return 'current';
    }
    if (index < state.currentIndex) {
      return state.charStates[index] === 'incorrect' ? 'incorrect' : 'correct';
    }
    return 'pending';
  },
}));
