import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import type { Poll, Question } from './types';

interface PollState {
  polls: Poll[];
  currentPoll: Poll | null;
  socket: Socket | null;
  wsConnected: boolean;
  lastUpdateTime: number | null;
  fetchPolls: () => Promise<void>;
  fetchPollByShortCode: (shortCode: string) => Promise<Poll | null>;
  createPoll: (title: string, questions: Question[]) => Promise<Poll>;
  submitVote: (pollId: string, answers: Record<number, string | string[] | number>) => void;
  closePoll: (pollId: string) => Promise<void>;
  addQuestion: (pollId: string, question: Question) => Promise<void>;
  setCurrentPoll: (poll: Poll | null) => void;
  initSocket: () => void;
}

export const usePollStore = create<PollState>((set, get) => ({
  polls: [],
  currentPoll: null,
  socket: null,
  wsConnected: false,
  lastUpdateTime: null,

  fetchPolls: async () => {
    const res = await fetch('/api/polls');
    const data = await res.json();
    set({ polls: data });
  },

  fetchPollByShortCode: async (shortCode: string) => {
    const res = await fetch(`/api/poll/${shortCode}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  },

  createPoll: async (title: string, questions: Question[]) => {
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, questions }),
    });
    const data = await res.json();
    set((state) => ({ polls: [...state.polls, data] }));
    return data;
  },

  submitVote: (pollId: string, answers: Record<number, string | string[] | number>) => {
    const { socket } = get();
    if (socket) {
      socket.emit('newVote', { pollId, answers });
    }
  },

  closePoll: async (pollId: string) => {
    const res = await fetch(`/api/polls/${pollId}/close`, {
      method: 'POST',
    });
    const data = await res.json();
    set((state) => ({
      polls: state.polls.map((p) => (p.id === pollId ? data : p)),
      currentPoll: state.currentPoll?.id === pollId ? data : state.currentPoll,
    }));
  },

  addQuestion: async (pollId: string, question: Question) => {
    const res = await fetch(`/api/polls/${pollId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    const data = await res.json();
    set((state) => ({
      polls: state.polls.map((p) => (p.id === pollId ? data : p)),
      currentPoll: state.currentPoll?.id === pollId ? data : state.currentPoll,
    }));
  },

  setCurrentPoll: (poll: Poll | null) => {
    set({ currentPoll: poll });
  },

  initSocket: () => {
    const socket = io('/', { path: '/socket.io' });

    socket.on('connect', () => {
      set({ wsConnected: true });
    });

    socket.on('disconnect', () => {
      set({ wsConnected: false });
    });

    socket.on('pollUpdate', (updatedPoll: Poll) => {
      set((state) => ({
        polls: state.polls.map((p) => (p.id === updatedPoll.id ? updatedPoll : p)),
        currentPoll: state.currentPoll?.id === updatedPoll.id ? updatedPoll : state.currentPoll,
        lastUpdateTime: Date.now(),
      }));
    });

    set({ socket });
  },
}));
