import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { calculateVoteResult } from '@/engine/voteEngine';
import { generateFeedback } from '@/engine/feedbackEngine';
import type { FeedbackEntry } from '@/data/feedbackPool';

export interface Option {
  id: string;
  title: string;
  description: string;
}

interface SelectionState {
  optionsMap: Record<string, Option>;
  optionIds: string[];
  voteCounts: Record<string, number>;
  votedOptionId: string | null;
  lockedOptionId: string | null;
  percentages: Record<string, number>;
  feedback: FeedbackEntry | null;

  addOption: (title: string, description: string) => void;
  vote: (optionId: string) => void;
  reset: () => void;
}

const MAX_OPTIONS = 6;

export const useSelectionStore = create<SelectionState>((set, get) => ({
  optionsMap: {},
  optionIds: [],
  voteCounts: {},
  votedOptionId: null,
  lockedOptionId: null,
  percentages: {},
  feedback: null,

  addOption: (title: string, description: string) => {
    const state = get();
    if (state.optionIds.length >= MAX_OPTIONS) return;
    if (state.lockedOptionId) return;

    const id = uuidv4();
    const option: Option = { id, title, description };

    set({
      optionsMap: { ...state.optionsMap, [id]: option },
      optionIds: [...state.optionIds, id],
      voteCounts: { ...state.voteCounts, [id]: 0 },
    });
  },

  vote: (optionId: string) => {
    const state = get();
    if (state.votedOptionId) return;
    if (state.lockedOptionId) return;

    const newVoteCounts = {
      ...state.voteCounts,
      [optionId]: (state.voteCounts[optionId] || 0) + 1,
    };

    const result = calculateVoteResult(newVoteCounts, state.optionIds);

    let newFeedback: FeedbackEntry | null = null;
    let lockedId: string | null = result.lockedOptionId;

    if (lockedId) {
      const lockedOption = state.optionsMap[lockedId];
      if (lockedOption) {
        newFeedback = generateFeedback(lockedOption);
      }
    }

    set({
      voteCounts: newVoteCounts,
      votedOptionId: optionId,
      percentages: result.percentages,
      lockedOptionId: lockedId,
      feedback: newFeedback,
    });
  },

  reset: () => {
    set({
      optionsMap: {},
      optionIds: [],
      voteCounts: {},
      votedOptionId: null,
      lockedOptionId: null,
      percentages: {},
      feedback: null,
    });
  },
}));
