import { StateCreator } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Vote, VoteOption, SortType } from '../../types';

const VOTES_KEY = 'votehub_votes';
const VOTED_KEY = 'votehub_voted_ids';

function loadVotesFromStorage(): Vote[] {
  try {
    const data = localStorage.getItem(VOTES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveVotesToStorage(votes: Vote[]): void {
  localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
}

function loadVotedIdsFromStorage(): Record<string, string> {
  try {
    const data = localStorage.getItem(VOTED_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveVotedIdsToStorage(ids: Record<string, string>): void {
  localStorage.setItem(VOTED_KEY, JSON.stringify(ids));
}

export interface VoteSlice {
  votes: Vote[];
  votedIds: Record<string, string>;
  searchQuery: string;
  sortType: SortType;
  createVote: (title: string, optionTexts: string[]) => void;
  castVote: (voteId: string, optionId: string) => void;
  setSearchQuery: (query: string) => void;
  setSortType: (sort: SortType) => void;
  getFilteredAndSortedVotes: () => Vote[];
  hasVoted: (voteId: string) => boolean;
  getVotedOption: (voteId: string) => string | null;
}

export const createVoteSlice: StateCreator<VoteSlice> = (set, get) => ({
  votes: loadVotesFromStorage(),
  votedIds: loadVotedIdsFromStorage(),
  searchQuery: '',
  sortType: 'time-desc',

  createVote: (title: string, optionTexts: string[]) => {
    const options: VoteOption[] = optionTexts.map((text) => ({
      id: uuidv4(),
      text,
      votes: 0,
    }));

    const newVote: Vote = {
      id: uuidv4(),
      title,
      options,
      createdAt: Date.now(),
    };

    set((state) => {
      const newVotes = [newVote, ...state.votes];
      saveVotesToStorage(newVotes);
      return { votes: newVotes };
    });
  },

  castVote: (voteId: string, optionId: string) => {
    set((state) => {
      if (state.votedIds[voteId]) return state;

      const newVotes = state.votes.map((vote) => {
        if (vote.id !== voteId) return vote;
        return {
          ...vote,
          options: vote.options.map((opt) =>
            opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
          ),
        };
      });

      const newVotedIds = { ...state.votedIds, [voteId]: optionId };
      saveVotesToStorage(newVotes);
      saveVotedIdsToStorage(newVotedIds);

      return { votes: newVotes, votedIds: newVotedIds };
    });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setSortType: (sort: SortType) => {
    set({ sortType: sort });
  },

  getFilteredAndSortedVotes: () => {
    const { votes, searchQuery, sortType } = get();
    let result = [...votes];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((v) => v.title.toLowerCase().includes(query));
    }

    switch (sortType) {
      case 'time-desc':
        result.sort((a, b) => b.createdAt - a.createdAt);
        break;
      case 'time-asc':
        result.sort((a, b) => a.createdAt - b.createdAt);
        break;
      case 'votes-desc':
        result.sort((a, b) => {
          const totalA = a.options.reduce((sum, o) => sum + o.votes, 0);
          const totalB = b.options.reduce((sum, o) => sum + o.votes, 0);
          return totalB - totalA;
        });
        break;
    }

    return result;
  },

  hasVoted: (voteId: string) => {
    return !!get().votedIds[voteId];
  },

  getVotedOption: (voteId: string) => {
    return get().votedIds[voteId] || null;
  },
});
