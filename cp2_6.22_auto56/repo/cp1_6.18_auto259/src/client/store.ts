import { create } from 'zustand';
import type { AppState, User, Card, VoteState, VoteHistory } from './types';

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  nickname: null,
  roomId: null,
  isCreator: false,
  users: [],
  cards: [],
  voteState: null,
  myVotes: [],
  history: [],
  isHistoryOpen: false,
  isVotingPanelOpen: false,
  error: null,

  setUser: (user) => set({
    userId: user.userId,
    nickname: user.nickname,
    roomId: user.roomId,
    isCreator: user.isCreator,
  }),

  setRoomState: (state) => set({
    users: state.users,
    cards: state.cards.map(card => ({ ...card, isNew: false })),
    voteState: state.voteState,
    myVotes: state.voteState?.userVotes[state.users.find(u => u.id === useAppStore.getState().userId)?.socketId || ''] || [],
  }),

  addCard: (card) => set((state) => ({
    cards: [...state.cards, { ...card, isNew: true }],
  })),

  deleteCard: (cardId) => set((state) => ({
    cards: state.cards.filter(card => card.id !== cardId),
  })),

  addUser: (user) => set((state) => ({
    users: [...state.users, user],
  })),

  removeUser: (userId) => set((state) => ({
    users: state.users.filter(user => user.id !== userId),
  })),

  openVote: (voteState) => set({
    voteState,
    myVotes: [],
  }),

  updateVotes: (votes, totalVotes) => set((state) => ({
    voteState: state.voteState ? {
      ...state.voteState,
      votes,
      totalVotes,
    } : null,
  })),

  closeVote: (history) => set((state) => ({
    voteState: null,
    myVotes: [],
    history: [history, ...state.history],
  })),

  castVote: (cardId) => set((state) => {
    const socketId = state.users.find(u => u.id === state.userId)?.socketId || '';
    const userVotes = state.voteState?.userVotes[socketId] || [];
    const hasVoted = userVotes.includes(cardId);
    
    if (hasVoted) {
      return {
        myVotes: state.myVotes.filter(id => id !== cardId),
      };
    }
    
    if (state.myVotes.length >= 3) {
      return state;
    }
    
    return {
      myVotes: [...state.myVotes, cardId],
    };
  }),

  setHistory: (history) => set({ history }),

  toggleHistory: () => set((state) => ({
    isHistoryOpen: !state.isHistoryOpen,
  })),

  toggleVotingPanel: () => set((state) => ({
    isVotingPanelOpen: !state.isVotingPanelOpen,
  })),

  setError: (error) => set({ error }),

  reset: () => set({
    userId: null,
    nickname: null,
    roomId: null,
    isCreator: false,
    users: [],
    cards: [],
    voteState: null,
    myVotes: [],
    history: [],
    isHistoryOpen: false,
    isVotingPanelOpen: false,
    error: null,
  }),
}));
