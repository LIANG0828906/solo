import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

export type QuestionType = 'single' | 'multiple' | 'rating';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options?: string[];
  minRating?: number;
  maxRating?: number;
}

export interface VoteAnswer {
  questionId: string;
  value: string | string[] | number;
}

export interface VoteSubmission {
  id: string;
  pollId: string;
  answers: VoteAnswer[];
  submittedAt: string;
}

export interface Poll {
  id: string;
  shortCode: string;
  title: string;
  questions: Question[];
  isClosed: boolean;
  createdAt: string;
  closedAt?: string;
  votes: VoteSubmission[];
  voteCount?: number;
  questionCount?: number;
}

interface PollStore {
  polls: Poll[];
  currentPoll: Poll | null;
  socket: Socket | null;
  lastUpdateTime: string | null;
  loading: boolean;
  newQuestionIds: string[];
  initSocket: () => void;
  fetchPolls: () => Promise<void>;
  fetchPoll: (id: string) => Promise<void>;
  createPoll: (data: { title: string; questions: Omit<Question, 'id'>[] }) => Promise<Poll>;
  submitVote: (pollId: string, answers: VoteAnswer[]) => Promise<void>;
  closePoll: (id: string) => Promise<void>;
  addQuestion: (pollId: string, question: Omit<Question, 'id'>) => Promise<void>;
  setCurrentPoll: (poll: Poll | null) => void;
  clearNewQuestionHighlight: (id: string) => void;
}

export const usePollStore = create<PollStore>((set, get) => ({
  polls: [],
  currentPoll: null,
  socket: null,
  lastUpdateTime: null,
  loading: false,
  newQuestionIds: [],

  initSocket: () => {
    if (get().socket) return;
    const socket = io({ path: '/socket.io' });
    socket.on('pollUpdate', ({ pollId, poll }: { pollId: string; poll: Poll }) => {
      set(state => {
        const polls = state.polls.map(p => {
          if (p.id === pollId) {
            return { ...p, ...poll, voteCount: poll.voteCount ?? poll.votes?.length ?? p.voteCount };
          }
          return p;
        });
        if (!polls.find(p => p.id === pollId) && poll.id) {
          polls.push(poll as Poll);
        }
        let currentPoll = state.currentPoll;
        if (state.currentPoll?.id === pollId) {
          currentPoll = poll as Poll;
        }
        return { polls, currentPoll, lastUpdateTime: new Date().toISOString() };
      });
    });
    set({ socket });
  },

  fetchPolls: async () => {
    set({ loading: true });
    const res = await fetch('/api/polls');
    const data = await res.json();
    set({ polls: data, loading: false });
  },

  fetchPoll: async (id: string) => {
    set({ loading: true });
    const res = await fetch(`/api/polls/${id}`);
    const data = await res.json();
    set({ currentPoll: data, loading: false });
  },

  createPoll: async (data) => {
    const res = await fetch('/api/polls', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const poll = await res.json();
    set(state => ({ polls: [...state.polls, poll] }));
    return poll;
  },

  submitVote: async (pollId: string, answers: VoteAnswer[]) => {
    const socket = get().socket;
    if (socket) {
      socket.emit('newVote', { pollId, answers });
    } else {
      await fetch('/api/votes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pollId, answers }),
      });
    }
  },

  closePoll: async (id: string) => {
    const res = await fetch(`/api/polls/${id}/close`, { method: 'POST' });
    const poll = await res.json();
    set(state => ({
      polls: state.polls.map(p => p.id === id ? { ...p, isClosed: true, closedAt: poll.closedAt } : p),
      currentPoll: state.currentPoll?.id === id ? { ...state.currentPoll, isClosed: true, closedAt: poll.closedAt } : state.currentPoll,
    }));
  },

  addQuestion: async (pollId: string, question: Omit<Question, 'id'>) => {
    const res = await fetch(`/api/polls/${pollId}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(question),
    });
    const poll = await res.json();
    const newQuestionId = poll.questions[poll.questions.length - 1].id;
    set(state => ({
      newQuestionIds: [...state.newQuestionIds, newQuestionId],
    }));
  },

  setCurrentPoll: (poll) => set({ currentPoll: poll }),

  clearNewQuestionHighlight: (id) => set(state => ({
    newQuestionIds: state.newQuestionIds.filter(qid => qid !== id),
  })),
}));
