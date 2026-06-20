import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { Poll, Question, PollResults, Answer } from './types';

interface PollState {
  polls: Poll[];
  currentPoll: Poll | null;
  currentResults: PollResults | null;
  socket: Socket | null;
  wsConnected: boolean;
  lastUpdateTime: number;
  fetchPolls: () => Promise<void>;
  createPoll: (title: string, questions: Omit<Question, 'id'>[]) => Promise<Poll | null>;
  fetchPollByShortCode: (shortCode: string) => Promise<Poll | null>;
  fetchResults: (pollId: string) => Promise<void>;
  submitVote: (pollId: string, answers: Answer[]) => Promise<boolean>;
  closePoll: (pollId: string) => Promise<void>;
  addQuestion: (pollId: string, question: Omit<Question, 'id'>) => Promise<void>;
  setCurrentPoll: (poll: Poll | null) => void;
  initSocket: () => void;
  disconnectSocket: () => void;
}

export const usePollStore = create<PollState>((set, get) => ({
  polls: [],
  currentPoll: null,
  currentResults: null,
  socket: null,
  wsConnected: false,
  lastUpdateTime: 0,

  fetchPolls: async () => {
    try {
      const response = await fetch('/api/polls');
      const data = await response.json();
      set({ polls: data });
    } catch (error) {
      console.error('Failed to fetch polls:', error);
    }
  },

  createPoll: async (title, questions) => {
    try {
      const response = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, questions }),
      });
      const data = await response.json();
      set((state) => ({ polls: [...state.polls, data] }));
      return data;
    } catch (error) {
      console.error('Failed to create poll:', error);
      return null;
    }
  },

  fetchPollByShortCode: async (shortCode) => {
    try {
      const response = await fetch(`/api/polls/${shortCode}`);
      if (response.status === 404) return null;
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch poll:', error);
      return null;
    }
  },

  fetchResults: async (pollId) => {
    try {
      const response = await fetch(`/api/results/${pollId}`);
      const data = await response.json();
      set({ currentResults: data, lastUpdateTime: Date.now() });
    } catch (error) {
      console.error('Failed to fetch results:', error);
    }
  },

  submitVote: async (pollId, answers) => {
    const socket = get().socket;
    if (!socket) return false;
    
    return new Promise((resolve) => {
      socket.emit('newVote', { pollId, answers });
      
      const onSuccess = () => {
        socket.off('voteSuccess', onSuccess);
        socket.off('voteError', onError);
        resolve(true);
      };
      
      const onError = () => {
        socket.off('voteSuccess', onSuccess);
        socket.off('voteError', onError);
        resolve(false);
      };
      
      socket.on('voteSuccess', onSuccess);
      socket.on('voteError', onError);
      
      setTimeout(() => {
        socket.off('voteSuccess', onSuccess);
        socket.off('voteError', onError);
        resolve(false);
      }, 5000);
    });
  },

  closePoll: async (pollId) => {
    try {
      await fetch(`/api/polls/${pollId}/close`, { method: 'POST' });
      set((state) => ({
        polls: state.polls.map((p) =>
          p.id === pollId ? { ...p, closed: true, closedAt: Date.now() } : p
        ),
        currentPoll: state.currentPoll?.id === pollId
          ? { ...state.currentPoll, closed: true, closedAt: Date.now() }
          : state.currentPoll,
      }));
    } catch (error) {
      console.error('Failed to close poll:', error);
    }
  },

  addQuestion: async (pollId, question) => {
    try {
      await fetch(`/api/polls/${pollId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
    } catch (error) {
      console.error('Failed to add question:', error);
    }
  },

  setCurrentPoll: (poll) => {
    set({ currentPoll: poll });
  },

  initSocket: () => {
    if (get().socket) return;
    
    const socket = io({ path: '/socket.io' });
    
    socket.on('connect', () => {
      set({ wsConnected: true });
    });
    
    socket.on('disconnect', () => {
      set({ wsConnected: false });
    });
    
    socket.on('pollUpdate', async (data: { pollId: string; newVote?: unknown; newQuestion?: unknown; closed?: boolean }) => {
      const currentPoll = get().currentPoll;
      if (currentPoll && currentPoll.id === data.pollId) {
        await get().fetchResults(data.pollId);
        
        if (data.newQuestion) {
          get().fetchPolls();
        }
      }
      get().fetchPolls();
    });
    
    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, wsConnected: false });
    }
  },
}));
