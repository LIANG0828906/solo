import { create } from 'zustand';
import type { Poll } from '../types';

interface PollState {
  currentPoll: Poll | null;
  myPolls: Poll[];
  selectedOptionIds: number[];
  isSocketConnected: boolean;
  votedPolls: Set<string>;
  setCurrentPoll: (poll: Poll | null) => void;
  setMyPolls: (polls: Poll[]) => void;
  addMyPoll: (poll: Poll) => void;
  removeMyPoll: (pollId: string) => void;
  updatePollVote: (pollId: string, optionIds: number[], votes: number) => void;
  setSelectedOptions: (optionIds: number[]) => void;
  toggleSelectedOption: (optionId: number) => void;
  setSocketConnected: (connected: boolean) => void;
  markAsVoted: (pollId: string) => void;
  hasVoted: (pollId: string) => boolean;
}

export const usePollStore = create<PollState>((set, get) => ({
  currentPoll: null,
  myPolls: [],
  selectedOptionIds: [],
  isSocketConnected: false,
  votedPolls: new Set(),
  setCurrentPoll: (poll) => set({ currentPoll: poll, selectedOptionIds: [] }),
  setMyPolls: (polls) => set({ myPolls: polls }),
  addMyPoll: (poll) => set((state) => ({ myPolls: [...state.myPolls, poll] })),
  removeMyPoll: (pollId) => set((state) => ({
    myPolls: state.myPolls.filter((p) => p.id !== pollId),
  })),
  updatePollVote: (pollId, optionIds, votes) => set((state) => {
    const updatePollOptions = (poll: Poll | null): Poll | null => {
      if (!poll || poll.id !== pollId) return poll;
      return {
        ...poll,
        options: poll.options.map((opt) =>
          optionIds.includes(opt.id) ? { ...opt, votes: opt.votes + 1 } : opt
        ),
        totalVotes: poll.totalVotes + optionIds.length,
      };
    };
    return {
      currentPoll: updatePollOptions(state.currentPoll),
      myPolls: state.myPolls.map((poll) =>
        poll.id === pollId ? updatePollOptions(poll)! : poll
      ),
    };
  }),
  setSelectedOptions: (optionIds) => set({ selectedOptionIds: optionIds }),
  toggleSelectedOption: (optionId) => set((state) => {
    const isSelected = state.selectedOptionIds.includes(optionId);
    if (isSelected) {
      return {
        selectedOptionIds: state.selectedOptionIds.filter((id) => id !== optionId),
      };
    }
    if (state.currentPoll?.isMultipleChoice) {
      return {
        selectedOptionIds: [...state.selectedOptionIds, optionId],
      };
    }
    return {
      selectedOptionIds: [optionId],
    };
  }),
  setSocketConnected: (connected) => set({ isSocketConnected: connected }),
  markAsVoted: (pollId) => set((state) => ({
    votedPolls: new Set([...state.votedPolls, pollId]),
  })),
  hasVoted: (pollId) => get().votedPolls.has(pollId),
}));
