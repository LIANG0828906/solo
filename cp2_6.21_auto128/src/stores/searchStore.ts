import { create } from 'zustand';
import type { TranscriptSentence } from '@/types';

interface SearchState {
  keyword: string;
  matchedSentenceIds: string[];
  activeSentenceId: string | null;
  timelineMarkers: number[];

  setKeyword: (keyword: string, sentences: TranscriptSentence[]) => void;
  setActiveSentence: (sentenceId: string | null) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  keyword: '',
  matchedSentenceIds: [],
  activeSentenceId: null,
  timelineMarkers: [],

  setKeyword: (keyword: string, sentences: TranscriptSentence[]) => {
    if (!keyword.trim()) {
      set({
        keyword: '',
        matchedSentenceIds: [],
        timelineMarkers: [],
      });
      return;
    }

    const lowerKeyword = keyword.toLowerCase();
    const matchedIds: string[] = [];
    const markers: number[] = [];

    sentences.forEach((sentence) => {
      if (sentence.text.toLowerCase().includes(lowerKeyword)) {
        matchedIds.push(sentence.id);
        markers.push(sentence.startTime);
      }
    });

    set({
      keyword,
      matchedSentenceIds: matchedIds,
      timelineMarkers: markers,
    });
  },

  setActiveSentence: (sentenceId: string | null) => {
    set({ activeSentenceId: sentenceId });
  },

  clearSearch: () => {
    set({
      keyword: '',
      matchedSentenceIds: [],
      timelineMarkers: [],
      activeSentenceId: null,
    });
  },
}));
