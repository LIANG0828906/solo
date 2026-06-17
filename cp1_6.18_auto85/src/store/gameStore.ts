import { create } from 'zustand';
import type { Note } from '../music/scoreParser';
import { compareNote, getAccuracy, type MatchResult } from '../music/noteMatcher';
import { audioEngine } from '../audio/audioEngine';

export type FlashColor = 'green' | 'red';

interface GameState {
  pressedKeys: string[];
  flashKeys: Record<string, FlashColor>;
  currentScore: Note[];
  currentScoreIndex: number;
  scoreName: string;
  playedNotes: string[];
  matchResults: MatchResult[];
  errorCount: number;

  pressKey: (note: string) => void;
  releaseKey: (note: string) => void;
  setScore: (name: string, notes: Note[]) => void;
  recordNote: (note: string) => void;
  resetPractice: () => void;
  calcAccuracy: () => number;
  clearFlash: (note: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  pressedKeys: [],
  flashKeys: {},
  currentScore: [],
  currentScoreIndex: 0,
  scoreName: '',
  playedNotes: [],
  matchResults: [],
  errorCount: 0,

  pressKey: (note: string) => {
    const { pressedKeys } = get();
    if (pressedKeys.includes(note)) return;
    set({ pressedKeys: [...pressedKeys, note] });
    audioEngine.playNote(note, '4n');
  },

  releaseKey: (note: string) => {
    const { pressedKeys } = get();
    set({ pressedKeys: pressedKeys.filter((k) => k !== note) });
  },

  setScore: (name: string, notes: Note[]) => {
    set({
      currentScore: notes,
      currentScoreIndex: 0,
      scoreName: name,
      playedNotes: [],
      matchResults: [],
      errorCount: 0,
      flashKeys: {},
    });
  },

  recordNote: (note: string) => {
    const state = get();
    const { currentScore, currentScoreIndex, matchResults, flashKeys } = state;

    if (currentScore.length === 0 || currentScoreIndex >= currentScore.length) return;

    const targetNote = currentScore[currentScoreIndex];
    const correct = compareNote(note, targetNote);

    const newFlashKeys: Record<string, FlashColor> = { ...flashKeys, [note]: correct ? 'green' : 'red' };

    const result: MatchResult = {
      index: currentScoreIndex,
      correct,
      timestamp: Date.now(),
    };

    const newErrorCount = correct ? state.errorCount : state.errorCount + 1;
    const newIndex = correct ? currentScoreIndex + 1 : currentScoreIndex;

    if (!correct) {
      audioEngine.playError();
    }

    set({
      playedNotes: [...state.playedNotes, note],
      matchResults: [...matchResults, result],
      flashKeys: newFlashKeys,
      errorCount: newErrorCount,
      currentScoreIndex: newIndex,
    });

    setTimeout(() => {
      get().clearFlash(note);
    }, 300);
  },

  resetPractice: () => {
    set({
      currentScoreIndex: 0,
      playedNotes: [],
      matchResults: [],
      errorCount: 0,
      flashKeys: {},
    });
  },

  calcAccuracy: () => {
    return getAccuracy(get().matchResults);
  },

  clearFlash: (note: string) => {
    const { flashKeys } = get();
    const newFlash = { ...flashKeys };
    delete newFlash[note];
    set({ flashKeys: newFlash });
  },
}));
