import { create } from 'zustand';
import axios from 'axios';
import { VoteListItem, Vote, VoteResult, PageType, SubmitVoteRequest } from './types';

interface VoteStore {
  votes: VoteListItem[];
  currentVote: Vote | null;
  result: VoteResult | null;
  loading: boolean;
  error: string | null;
  currentPage: PageType;
  currentVoteId: string | null;

  fetchVotes: () => Promise<void>;
  fetchVote: (id: string) => Promise<void>;
  fetchResult: (id: string) => Promise<void>;
  submitVote: (id: string, data: SubmitVoteRequest) => Promise<boolean>;
  setPage: (page: PageType, voteId?: string) => void;
  clearError: () => void;
}

const API_BASE = '/api';

export const useVoteStore = create<VoteStore>((set, get) => ({
  votes: [],
  currentVote: null,
  result: null,
  loading: false,
  error: null,
  currentPage: 'list',
  currentVoteId: null,

  fetchVotes: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<VoteListItem[]>(`${API_BASE}/votes`);
      set({ votes: response.data, loading: false });
    } catch (err) {
      set({ error: '获取投票列表失败', loading: false });
    }
  },

  fetchVote: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get<Vote>(`${API_BASE}/votes/${id}`);
      set({ currentVote: response.data, loading: false, currentVoteId: id });
    } catch (err) {
      set({ error: '获取投票详情失败', loading: false });
    }
  },

  fetchResult: async (id: string) => {
    try {
      const response = await axios.get<VoteResult>(`${API_BASE}/votes/${id}/results`);
      set({ result: response.data });
    } catch (err) {
      set({ error: '获取投票结果失败' });
    }
  },

  submitVote: async (id: string, data: SubmitVoteRequest): Promise<boolean> => {
    set({ loading: true, error: null });
    try {
      await axios.post(`${API_BASE}/votes/${id}/submit`, data);
      await get().fetchResult(id);
      set({ loading: false });
      return true;
    } catch (err: any) {
      set({ error: err.response?.data?.error || '提交投票失败', loading: false });
      return false;
    }
  },

  setPage: (page: PageType, voteId?: string) => {
    set({ currentPage: page, currentVoteId: voteId || null });
  },

  clearError: () => set({ error: null })
}));
