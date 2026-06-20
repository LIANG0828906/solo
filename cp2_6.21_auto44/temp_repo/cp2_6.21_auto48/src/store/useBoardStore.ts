import { create } from 'zustand';
import { IBoardRoom, ICreative } from '../types';

interface BoardStore {
  boardRoom: IBoardRoom | null;
  setBoardRoom: (room: IBoardRoom) => void;
  addCreative: (creative: ICreative) => void;
  updateCreative: (creative: ICreative) => void;
  removeCreative: (creativeId: string) => void;
  optimisticVote: (creativeId: string, userId: string) => { prevVotes: number; prevVoters: string[] } | null;
  rollbackVote: (creativeId: string, prevVotes: number, prevVoters: string[]) => void;
}

const useBoardStore = create<BoardStore>((set, get) => ({
  boardRoom: null,

  setBoardRoom: (room) => set({ boardRoom: room }),

  addCreative: (creative) =>
    set((state) => {
      if (!state.boardRoom) return state;
      return {
        boardRoom: {
          ...state.boardRoom,
          creatives: [creative, ...state.boardRoom.creatives],
        },
      };
    }),

  updateCreative: (creative) =>
    set((state) => {
      if (!state.boardRoom) return state;
      return {
        boardRoom: {
          ...state.boardRoom,
          creatives: state.boardRoom.creatives.map((c) =>
            c.id === creative.id ? creative : c
          ),
        },
      };
    }),

  removeCreative: (creativeId) =>
    set((state) => {
      if (!state.boardRoom) return state;
      return {
        boardRoom: {
          ...state.boardRoom,
          creatives: state.boardRoom.creatives.filter((c) => c.id !== creativeId),
        },
      };
    }),

  optimisticVote: (creativeId, userId) => {
    const state = get();
    if (!state.boardRoom) return null;

    const creative = state.boardRoom.creatives.find((c) => c.id === creativeId);
    if (!creative) return null;

    const prevVotes = creative.votes;
    const prevVoters = [...creative.voters];

    const hasVoted = creative.voters.includes(userId);
    const newVoters = hasVoted
      ? creative.voters.filter((v) => v !== userId)
      : [...creative.voters, userId];
    const newVotes = hasVoted ? creative.votes - 1 : creative.votes + 1;

    set({
      boardRoom: {
        ...state.boardRoom,
        creatives: state.boardRoom.creatives.map((c) =>
          c.id === creativeId ? { ...c, votes: newVotes, voters: newVoters } : c
        ),
      },
    });

    return { prevVotes, prevVoters };
  },

  rollbackVote: (creativeId, prevVotes, prevVoters) =>
    set((state) => {
      if (!state.boardRoom) return state;
      return {
        boardRoom: {
          ...state.boardRoom,
          creatives: state.boardRoom.creatives.map((c) =>
            c.id === creativeId ? { ...c, votes: prevVotes, voters: prevVoters } : c
          ),
        },
      };
    }),
}));

export default useBoardStore;
