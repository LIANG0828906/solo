import { create } from 'zustand';
import type { ExchangeRequest } from '../types';
import { ExchangeModule } from '../modules/exchange/ExchangeModule';

interface ExchangeState {
  requests: ExchangeRequest[];
  isLoading: boolean;
  error: string | null;

  loadRequests: (userId: string) => Promise<void>;
  createRequest: (data: {
    requesterId: string;
    recipientId: string;
    targetSkillId: string;
    offeredSkillId: string;
    message: string;
  }) => Promise<ExchangeRequest | null>;
  acceptRequest: (requestId: string) => Promise<ExchangeRequest | null>;
  rejectRequest: (requestId: string) => Promise<ExchangeRequest | null>;
  completeExchange: (requestId: string) => Promise<ExchangeRequest | null>;
  getRequestById: (requestId: string) => ExchangeRequest | null;
  getUserRequests: (userId: string) => ExchangeRequest[];
  getPendingRequests: (userId: string) => ExchangeRequest[];
  refreshRequests: () => Promise<void>;
  updateRequest: (request: ExchangeRequest) => void;
  addRequest: (request: ExchangeRequest) => void;
}

export const useExchangeStore = create<ExchangeState>((set, get) => ({
  requests: [],
  isLoading: false,
  error: null,

  loadRequests: async (userId: string) => {
    set({ isLoading: true });
    try {
      const requests = await ExchangeModule.getUserExchangeRequests(userId);
      set({ requests });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  createRequest: async (data) => {
    set({ isLoading: true });
    try {
      const request = await ExchangeModule.createExchangeRequest(data);
      if (request) {
        set((state) => ({
          requests: [request, ...state.requests],
        }));
      }
      return request;
    } finally {
      set({ isLoading: false });
    }
    return null;
  },

  acceptRequest: async (requestId: string) => {
    set({ isLoading: true });
    try {
      const request = await ExchangeModule.acceptRequest(requestId);
      if (request) {
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === requestId ? request : r
          ),
        }));
      }
      return request;
    } finally {
      set({ isLoading: false });
    }
    return null;
  },

  rejectRequest: async (requestId: string) => {
    set({ isLoading: true });
    try {
      const request = await ExchangeModule.rejectRequest(requestId);
      if (request) {
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === requestId ? request : r
          ),
        }));
      }
      return request;
    } finally {
      set({ isLoading: false });
    }
    return null;
  },

  completeExchange: async (requestId: string) => {
    set({ isLoading: true });
    try {
      const request = await ExchangeModule.completeExchange(requestId);
      if (request) {
        set((state) => ({
          requests: state.requests.map((r) =>
            r.id === requestId ? request : r
          ),
        }));
      }
      return request;
    } finally {
      set({ isLoading: false });
    }
    return null;
  },

  getRequestById: (requestId: string) => {
    const { requests } = get();
    return requests.find((r) => r.id === requestId) || null;
  },

  getUserRequests: (userId: string) => {
    const { requests } = get();
    return requests
      .filter(
        (r) => r.requesterId === userId || r.recipientId === userId
      )
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  getPendingRequests: (userId: string) => {
    const { requests } = get();
    return requests
      .filter(
        (r) => r.recipientId === userId && r.status === 'pending'
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  refreshRequests: async () => {
    const { currentUser } = useUserStore.getState();
    if (currentUser) {
      const requests = await ExchangeModule.getUserExchangeRequests(
        currentUser.id
      );
      set({ requests });
    }
  },

  updateRequest: (request: ExchangeRequest) => {
    set((state) => ({
      requests: state.requests.map((r) =>
        r.id === request.id ? request : r
      ),
    }));
  },

  addRequest: (request: ExchangeRequest) => {
    set((state) => ({
      requests: [request, ...state.requests],
    }));
  },
}));

import { useUserStore } from './useUserStore';
