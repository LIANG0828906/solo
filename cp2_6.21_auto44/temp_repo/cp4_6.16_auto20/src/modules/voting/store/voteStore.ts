import { create } from 'zustand';
import type { Blend, BlendWithVotes } from '@/shared/types';
import {
  getAllBlends,
  createVote,
  createNote as createNoteInDb,
  getAllVoteCounts,
  getUserVoteMap,
  getUniqueVoterCount,
  createBlend as createBlendInDb,
  getNotesByBlend,
} from '@/modules/backend/data/cafeData';
import type { FlavorNote } from '@/shared/types';

interface VoteState {
  blends: Blend[];
  voteCounts: Record<string, number>;
  userVotes: Record<string, boolean>;
  uniqueVoterCount: number;
  isLoading: boolean;
  loadBlends: (userId: string | null) => Promise<void>;
  vote: (userId: string, blendId: string) => Promise<boolean>;
  submitNote: (userId: string, blendId: string, content: string) => Promise<FlavorNote>;
  createBlend: (blend: Omit<Blend, 'id' | 'createdAt'>) => Promise<Blend>;
  getBlendsWithVotes: () => BlendWithVotes[];
  getNotesForBlend: (blendId: string) => Promise<FlavorNote[]>;
  refreshVoteCounts: () => Promise<void>;
}

export const useVoteStore = create<VoteState>((set, get) => ({
  blends: [],
  voteCounts: {},
  userVotes: {},
  uniqueVoterCount: 0,
  isLoading: false,

  loadBlends: async (userId) => {
    set({ isLoading: true });
    try {
      const [blends, voteCounts, uniqueVoterCount] = await Promise.all([
        getAllBlends(),
        getAllVoteCounts(),
        getUniqueVoterCount(),
      ]);

      let userVotes: Record<string, boolean> = {};
      if (userId) {
        userVotes = await getUserVoteMap(userId);
      }

      set({
        blends,
        voteCounts,
        userVotes,
        uniqueVoterCount,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  vote: async (userId, blendId) => {
    const alreadyVoted = get().userVotes[blendId];
    if (alreadyVoted) {
      return false;
    }

    set((state) => {
      const hadNoVotes = Object.keys(state.userVotes).length === 0;
      return {
        userVotes: { ...state.userVotes, [blendId]: true },
        voteCounts: {
          ...state.voteCounts,
          [blendId]: (state.voteCounts[blendId] || 0) + 1,
        },
        uniqueVoterCount: state.uniqueVoterCount + (hadNoVotes ? 1 : 0),
      };
    });

    try {
      await createVote({ userId, blendId });
      return true;
    } catch (error) {
      set((state) => {
        const newUserVotes = { ...state.userVotes };
        delete newUserVotes[blendId];
        const newVoteCounts = { ...state.voteCounts };
        if (newVoteCounts[blendId] && newVoteCounts[blendId] > 0) {
          newVoteCounts[blendId] -= 1;
        }
        const hadOnlyThisVote = Object.keys(state.userVotes).length === 1 && state.userVotes[blendId];
        return {
          userVotes: newUserVotes,
          voteCounts: newVoteCounts,
          uniqueVoterCount: state.uniqueVoterCount - (hadOnlyThisVote ? 1 : 0),
        };
      });
      throw error;
    }
  },

  submitNote: async (userId, blendId, content) => {
    const note = await createNoteInDb({ userId, blendId, content });
    return note;
  },

  createBlend: async (blend) => {
    const newBlend = await createBlendInDb(blend);
    set((state) => ({
      blends: [newBlend, ...state.blends],
      voteCounts: { ...state.voteCounts, [newBlend.id]: 0 },
    }));
    return newBlend;
  },

  getBlendsWithVotes: () => {
    const state = get();
    return state.blends.map((blend) => ({
      ...blend,
      voteCount: state.voteCounts[blend.id] || 0,
      hasVoted: !!state.userVotes[blend.id],
    }));
  },

  getNotesForBlend: async (blendId) => {
    return await getNotesByBlend(blendId);
  },

  refreshVoteCounts: async () => {
    const [voteCounts, uniqueVoterCount] = await Promise.all([
      getAllVoteCounts(),
      getUniqueVoterCount(),
    ]);
    set({ voteCounts, uniqueVoterCount });
  },
}));
