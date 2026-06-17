import { create } from 'zustand';
import type { Poll, ScheduleResult, PreferenceType } from '../types';

interface PollState {
  polls: Poll[];
  currentPoll: Poll | null;
  scheduleResult: ScheduleResult | null;
  loading: boolean;
  error: string | null;

  fetchPolls: () => Promise<void>;
  fetchPoll: (id: string) => Promise<void>;
  createPoll: (data: {
    title: string;
    options: Array<{ date: string; startTime: string; endTime: string }>;
    deadline: string;
    creatorName: string;
    members: Array<{ name: string; avatar: string }>;
  }) => Promise<Poll | null>;
  submitVote: (
    pollId: string,
    data: {
      memberId: string;
      memberName: string;
      avatar: string;
      preferences: Record<string, PreferenceType>;
    }
  ) => Promise<void>;
  fetchSchedule: (pollId: string) => Promise<void>;
}

export const usePollStore = create<PollState>((set) => ({
  polls: [],
  currentPoll: null,
  scheduleResult: null,
  loading: false,
  error: null,

  fetchPolls: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/polls');
      if (!res.ok) throw new Error('获取投票列表失败');
      const polls: Poll[] = await res.json();
      set({ polls, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchPoll: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/polls/${id}`);
      if (!res.ok) throw new Error('获取投票失败');
      const poll: Poll = await res.json();
      set({ currentPoll: poll, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  createPoll: async (data) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('创建投票失败');
      const poll: Poll = await res.json();
      set((state) => ({ polls: [...state.polls, poll], loading: false }));
      return poll;
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
      return null;
    }
  },

  submitVote: async (pollId, data) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('提交投票失败');
      const poll: Poll = await res.json();
      set((state) => ({
        currentPoll: state.currentPoll?.id === poll.id ? poll : state.currentPoll,
        polls: state.polls.map((p) => (p.id === poll.id ? poll : p)),
        loading: false,
      }));
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  fetchSchedule: async (pollId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await fetch(`/api/schedule/${pollId}`);
      if (!res.ok) throw new Error('获取排期结果失败');
      const result: ScheduleResult = await res.json();
      set({ scheduleResult: result, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },
}));
