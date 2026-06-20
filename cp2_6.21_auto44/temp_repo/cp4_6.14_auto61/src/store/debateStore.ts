import { create } from 'zustand';
import axios from 'axios';
import type { Debate, Argument, DebateRecord, CreateDebateRequest, SubmitArgumentRequest } from '../types';

interface DebateState {
  debates: Debate[];
  currentDebate: Debate | null;
  arguments: Argument[];
  records: DebateRecord[];
  loading: boolean;
  error: string | null;
  
  fetchDebates: () => Promise<void>;
  fetchDebate: (id: string) => Promise<void>;
  createDebate: (data: CreateDebateRequest) => Promise<Debate | null>;
  fetchArguments: (debateId: string) => Promise<void>;
  submitArgument: (debateId: string, data: SubmitArgumentRequest) => Promise<Argument | null>;
  fetchRecords: (debateId: string) => Promise<void>;
  updateTimer: (debateId: string, isRunning: boolean, remainingTime: number, currentSpeaker?: string) => Promise<void>;
  switchSpeaker: (debateId: string) => Promise<void>;
  resetTimer: (debateId: string) => Promise<void>;
  markTimeUp: (debateId: string) => Promise<void>;
  setCurrentDebate: (debate: Debate | null) => void;
  setRemainingTime: (time: number) => void;
  setIsRunning: (running: boolean) => void;
}

export const useDebateStore = create<DebateState>((set) => ({
  debates: [],
  currentDebate: null,
  arguments: [],
  records: [],
  loading: false,
  error: null,

  fetchDebates: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get('/api/debates');
      if (response.data.success) {
        set({ debates: response.data.data });
      }
    } catch (error) {
      set({ error: '获取辩论赛列表失败' });
      console.error('Failed to fetch debates:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchDebate: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`/api/debates/${id}`);
      if (response.data.success) {
        set({ currentDebate: response.data.data });
      }
    } catch (error) {
      set({ error: '获取辩论赛详情失败' });
      console.error('Failed to fetch debate:', error);
    } finally {
      set({ loading: false });
    }
  },

  createDebate: async (data: CreateDebateRequest) => {
    set({ loading: true, error: null });
    try {
      const response = await axios.post('/api/debates', data);
      if (response.data.success) {
        const newDebate = response.data.data;
        set((state) => ({
          debates: [newDebate, ...state.debates],
          currentDebate: newDebate,
        }));
        return newDebate;
      }
      return null;
    } catch (error) {
      set({ error: '创建辩论赛失败' });
      console.error('Failed to create debate:', error);
      return null;
    } finally {
      set({ loading: false });
    }
  },

  fetchArguments: async (debateId: string) => {
    try {
      const response = await axios.get(`/api/debates/${debateId}/arguments`);
      if (response.data.success) {
        const args = response.data.data.sort((a: Argument, b: Argument) => b.timestamp - a.timestamp);
        set({ arguments: args });
      }
    } catch (error) {
      console.error('Failed to fetch arguments:', error);
    }
  },

  submitArgument: async (debateId: string, data: SubmitArgumentRequest) => {
    try {
      const response = await axios.post(`/api/debates/${debateId}/arguments`, data);
      if (response.data.success) {
        const newArg = response.data.data;
        set((state) => ({
          arguments: [newArg, ...state.arguments],
        }));
        return newArg;
      }
      return null;
    } catch (error) {
      console.error('Failed to submit argument:', error);
      return null;
    }
  },

  fetchRecords: async (debateId: string) => {
    try {
      const response = await axios.get(`/api/debates/${debateId}/records`);
      if (response.data.success) {
        const records = response.data.data.sort((a: DebateRecord, b: DebateRecord) => a.timestamp - b.timestamp);
        set({ records });
      }
    } catch (error) {
      console.error('Failed to fetch records:', error);
    }
  },

  updateTimer: async (debateId: string, isRunning: boolean, remainingTime: number, currentSpeaker?: string) => {
    try {
      const response = await axios.put(`/api/debates/${debateId}/timer`, {
        isRunning,
        remainingTime,
        currentSpeaker,
      });
      if (response.data.success) {
        set({ currentDebate: response.data.data });
      }
    } catch (error) {
      console.error('Failed to update timer:', error);
    }
  },

  switchSpeaker: async (debateId: string) => {
    try {
      const response = await axios.post(`/api/debates/${debateId}/switch`);
      if (response.data.success) {
        set({ currentDebate: response.data.data });
      }
    } catch (error) {
      console.error('Failed to switch speaker:', error);
    }
  },

  resetTimer: async (debateId: string) => {
    try {
      const response = await axios.post(`/api/debates/${debateId}/reset`);
      if (response.data.success) {
        set({ currentDebate: response.data.data });
      }
    } catch (error) {
      console.error('Failed to reset timer:', error);
    }
  },

  markTimeUp: async (debateId: string) => {
    try {
      await axios.post(`/api/debates/${debateId}/timeup`);
    } catch (error) {
      console.error('Failed to mark time up:', error);
    }
  },

  setCurrentDebate: (debate: Debate | null) => {
    set({ currentDebate: debate });
  },

  setRemainingTime: (time: number) => {
    set((state) => ({
      currentDebate: state.currentDebate ? { ...state.currentDebate, remainingTime: time } : null,
    }));
  },

  setIsRunning: (running: boolean) => {
    set((state) => ({
      currentDebate: state.currentDebate ? { ...state.currentDebate, isRunning: running } : null,
    }));
  },
}));
