import { create } from 'zustand';

export type EmotionCategory = 'happy' | 'calm' | 'sad' | 'angry';

export interface RecordingData {
  id: string;
  timestamp: string;
  duration: number;
  pitch: number;
  energy: number;
  zeroCrossingRate: number;
  valence: number;
  arousal: number;
  emotionCategory: EmotionCategory;
}

interface AppState {
  currentRecording: RecordingData | null;
  history: RecordingData[];
  isRecording: boolean;
  isAnalyzing: boolean;
  activeTab: 'record' | 'result' | 'history';
  setCurrentRecording: (data: RecordingData | null) => void;
  setHistory: (history: RecordingData[]) => void;
  setIsRecording: (isRecording: boolean) => void;
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setActiveTab: (tab: 'record' | 'result' | 'history') => void;
  addRecording: (data: RecordingData) => void;
}

export const useStore = create<AppState>((set) => ({
  currentRecording: null,
  history: [],
  isRecording: false,
  isAnalyzing: false,
  activeTab: 'record',
  setCurrentRecording: (data) => set({ currentRecording: data }),
  setHistory: (history) => set({ history }),
  setIsRecording: (isRecording) => set({ isRecording }),
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setActiveTab: (activeTab) => set({ activeTab }),
  addRecording: (data) => set((state) => ({
    history: [data, ...state.history],
    currentRecording: data,
  })),
}));
