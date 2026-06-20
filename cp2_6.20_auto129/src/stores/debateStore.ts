import { create } from 'zustand';
import { Debate, DebateMessage } from '../types';
import { debateApi } from '../api/debateApi';

interface DebateState {
  debates: Debate[];
  currentDebate: Debate | null;
  isLoading: boolean;
  activeSide: 'pro' | 'con' | null;

  fetchDebates: () => Promise<void>;
  fetchDebateById: (id: string) => Promise<void>;
  sendMessage: (debateId: string, side: 'pro' | 'con', content: string) => Promise<void>;
  setActiveSide: (side: 'pro' | 'con' | null) => void;
  createDebate: (data: { reviewId: string; title: string }) => Promise<Debate | null>;
}

export const useDebateStore = create<DebateState>((set) => ({
  debates: [],
  currentDebate: null,
  isLoading: false,
  activeSide: null,

  fetchDebates: async () => {
    set({ isLoading: true });
    try {
      const debates = await debateApi.getDebates();
      set({ debates, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  fetchDebateById: async (id: string) => {
    set({ isLoading: true });
    try {
      const debate = await debateApi.getDebateById(id);
      set({ currentDebate: debate, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  sendMessage: async (debateId, side, content) => {
    try {
      const newMessage = await debateApi.sendMessage(debateId, side, content);
      set((state) => {
        if (!state.currentDebate || state.currentDebate.id !== debateId) return state;
        const updatedDebate = { ...state.currentDebate };
        if (side === 'pro') {
          updatedDebate.proMessages = [...updatedDebate.proMessages, newMessage];
        } else {
          updatedDebate.conMessages = [...updatedDebate.conMessages, newMessage];
        }
        updatedDebate.lastReplyAt = newMessage.createdAt;
        updatedDebate.participantCount += 1;
        return { currentDebate: updatedDebate };
      });
    } catch (error) {
      console.error('发送消息失败', error);
    }
  },

  setActiveSide: (side) => {
    set({ activeSide: side });
  },

  createDebate: async (data) => {
    set({ isLoading: true });
    try {
      const newDebate = await debateApi.createDebate(data);
      set((state) => ({
        debates: [newDebate, ...state.debates],
        isLoading: false
      }));
      return newDebate;
    } catch (error) {
      set({ isLoading: false });
      return null;
    }
  }
}));
