import { create } from 'zustand';
import type { Diary, AudioAnalysisResult } from '@/types';

interface DiaryState {
  diaryList: Diary[];
  currentDiaryId: string | null;
  audioAnalysis: AudioAnalysisResult | null;
  audioBlob: Blob | null;
  setDiaryList: (list: Diary[]) => void;
  setCurrentDiaryId: (id: string | null) => void;
  setAudioAnalysis: (result: AudioAnalysisResult | null) => void;
  setAudioBlob: (blob: Blob | null) => void;
  addDiary: (diary: Diary) => void;
  resetRecording: () => void;
}

export const useDiaryStore = create<DiaryState>((set) => ({
  diaryList: [],
  currentDiaryId: null,
  audioAnalysis: null,
  audioBlob: null,
  setDiaryList: (list) => set({ diaryList: list }),
  setCurrentDiaryId: (id) => set({ currentDiaryId: id }),
  setAudioAnalysis: (result) => set({ audioAnalysis: result }),
  setAudioBlob: (blob) => set({ audioBlob: blob }),
  addDiary: (diary) =>
    set((state) => ({
      diaryList: [diary, ...state.diaryList] })),
  resetRecording: () => set({ audioAnalysis: null, audioBlob: null }),
}));
