import { create } from 'zustand';
import type { ExchangeRequest } from './types';

interface ExchangeStore {
  requests: ExchangeRequest[];
  addRequest: (request: Omit<ExchangeRequest, 'id' | 'createdAt'>) => void;
  updateRequestStatus: (id: string, status: ExchangeRequest['status']) => void;
  getRequestsByFromUser: (userId: string) => ExchangeRequest[];
  getRequestsByToUser: (userId: string) => ExchangeRequest[];
  getCompletedRequests: (userId: string) => ExchangeRequest[];
  getRequestById: (id: string) => ExchangeRequest | undefined;
  listeners: Set<() => void>;
  subscribe: (listener: () => void) => () => void;
  notify: () => void;
}

export const useExchangeStore = create<ExchangeStore>((set, get) => ({
  requests: [],
  listeners: new Set(),

  subscribe: (listener) => {
    get().listeners.add(listener);
    return () => get().listeners.delete(listener);
  },

  notify: () => {
    get().listeners.forEach((listener) => listener());
  },

  addRequest: (request) => {
    const newRequest: ExchangeRequest = {
      ...request,
      id: 'req_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      createdAt: Date.now(),
    };
    set((state) => ({
      requests: [...state.requests, newRequest],
    }));
    get().notify();
  },

  updateRequestStatus: (id, status) => {
    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === id ? { ...req, status } : req
      ),
    }));
    get().notify();
  },

  getRequestsByFromUser: (userId) => {
    return get().requests.filter((req) => req.fromUserId === userId);
  },

  getRequestsByToUser: (userId) => {
    return get().requests.filter((req) => req.toUserId === userId);
  },

  getCompletedRequests: (userId) => {
    return get().requests.filter(
      (req) =>
        (req.fromUserId === userId || req.toUserId === userId) &&
        req.status === 'completed'
    );
  },

  getRequestById: (id) => {
    return get().requests.find((req) => req.id === id);
  },
}));
