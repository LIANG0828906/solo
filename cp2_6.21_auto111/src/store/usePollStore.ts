import { create } from 'zustand';
import type { Poll } from '../types';
import { getMyPolls, createPoll as apiCreatePoll, deletePoll as apiDeletePoll } from '../utils/api';
import { getDeviceId } from '../utils/device';

interface PollStore {
  polls: Poll[];
  loading: boolean;
  error: string | null;
  fetchMyPolls: () => Promise<void>;
  createPoll: (data: { title: string; description: string; options: { text: string; color: string }[] }) => Promise<{ poll: Poll; shareUrl: string }>;
  deletePoll: (pollId: string) => Promise<boolean>;
}

export const usePollStore = create<PollStore>((set) => ({
  polls: [],
  loading: false,
  error: null,
  fetchMyPolls: async () => {
    set({ loading: true, error: null });
    try {
      const deviceId = getDeviceId();
      const polls = await getMyPolls(deviceId);
      set({ polls, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch polls', loading: false });
    }
  },
  createPoll: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await apiCreatePoll(data);
      set((state) => ({ polls: [result.poll, ...state.polls].slice(0, 20), loading: false }));
      return result;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to create poll', loading: false });
      throw error;
    }
  },
  deletePoll: async (pollId: string) => {
    set({ loading: true, error: null });
    try {
      const deviceId = getDeviceId();
      await apiDeletePoll(pollId, deviceId);
      set((state) => ({ polls: state.polls.filter((p) => p.id !== pollId), loading: false }));
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete poll', loading: false });
      return false;
    }
  },
}));
