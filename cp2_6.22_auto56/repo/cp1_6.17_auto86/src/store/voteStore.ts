import { create } from 'zustand';
import type { Vote, VoteListItem } from '../api/VoteAPI';
import * as VoteAPI from '../api/VoteAPI';

interface VoteState {
  voteList: VoteListItem[];
  currentVote: Vote | null;
  loading: boolean;
  error: string | null;
  votedMap: Record<string, string>;

  fetchVoteList: () => Promise<void>;
  fetchVoteDetail: (id: string) => Promise<void>;
  createVote: (title: string, description: string, options: string[]) => Promise<void>;
  submitVote: (voteId: string, optionId: string) => Promise<void>;
}

export const useVoteStore = create<VoteState>((set, get) => ({
  voteList: [],
  currentVote: null,
  loading: false,
  error: null,
  votedMap: {},

  fetchVoteList: async () => {
    set({ loading: true, error: null });
    try {
      const list = await VoteAPI.fetchVotes();
      set({ voteList: list, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchVoteDetail: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const vote = await VoteAPI.fetchResults(id);
      set({ currentVote: vote, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  createVote: async (title: string, description: string, options: string[]) => {
    set({ loading: true, error: null });
    try {
      await VoteAPI.createVote(title, description, options);
      const list = await VoteAPI.fetchVotes();
      set({ voteList: list, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  submitVote: async (voteId: string, optionId: string) => {
    try {
      const updated = await VoteAPI.submitVote(voteId, optionId);
      set((state) => ({
        currentVote: updated,
        votedMap: { ...state.votedMap, [voteId]: optionId },
      }));
    } catch (e: any) {
      set({ error: e.message });
    }
  },
}));
