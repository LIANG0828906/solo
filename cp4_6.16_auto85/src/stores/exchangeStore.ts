import { create } from 'zustand';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { ExchangeRequest, RequestStatus } from '@/types';
import { generateAllMockData } from '@/utils/mock';

interface ExchangeState {
  requests: ExchangeRequest[];
  isInitialized: boolean;
  initData: (requests?: ExchangeRequest[]) => Promise<void>;
  createRequest: (data: {
    requesterId: string;
    responderId: string;
    offeredItemId: string;
    requestedItemId: string;
  }) => Promise<void>;
  confirmRequest: (requestId: string) => Promise<void>;
  rejectRequest: (requestId: string) => Promise<void>;
  cancelRequest: (requestId: string) => Promise<void>;
  getPendingRequestsForUser: (userId: string) => ExchangeRequest[];
  getRequestsByUser: (userId: string) => ExchangeRequest[];
  getReceivedRequestsForUser: (userId: string) => ExchangeRequest[];
  getSentRequestsForUser: (userId: string) => ExchangeRequest[];
}

export const useExchangeStore = create<ExchangeState>((set, get) => ({
  requests: [],
  isInitialized: false,

  initData: async (preloadRequests) => {
    try {
      let requests = await get<ExchangeRequest[]>('requests');

      if (preloadRequests && preloadRequests.length > 0) {
        requests = preloadRequests;
        await set('requests', requests);
      } else if (!requests || requests.length === 0) {
        const mockData = generateAllMockData();
        requests = mockData.requests;
        await set('requests', requests);
      }

      set({ requests: requests || [], isInitialized: true });
    } catch (error) {
      console.error('Failed to init exchange data:', error);
      const mockData = generateAllMockData();
      set({ requests: mockData.requests, isInitialized: true });
    }
  },

  createRequest: async (data) => {
    const now = Date.now();
    const newRequest: ExchangeRequest = {
      id: uuidv4(),
      ...data,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    };
    const updatedRequests = [newRequest, ...get().requests];
    set({ requests: updatedRequests });
    try {
      await set('requests', updatedRequests);
    } catch (error) {
      console.error('Failed to save new request:', error);
    }
  },

  confirmRequest: async (requestId) => {
    const updatedRequests = get().requests.map((r) =>
      r.id === requestId
        ? { ...r, status: 'confirmed' as RequestStatus, updatedAt: Date.now() }
        : r
    );
    set({ requests: updatedRequests });
    try {
      await set('requests', updatedRequests);
    } catch (error) {
      console.error('Failed to confirm request:', error);
    }
  },

  rejectRequest: async (requestId) => {
    const updatedRequests = get().requests.map((r) =>
      r.id === requestId
        ? { ...r, status: 'rejected' as RequestStatus, updatedAt: Date.now() }
        : r
    );
    set({ requests: updatedRequests });
    try {
      await set('requests', updatedRequests);
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  },

  cancelRequest: async (requestId) => {
    const updatedRequests = get().requests.map((r) =>
      r.id === requestId
        ? { ...r, status: 'cancelled' as RequestStatus, updatedAt: Date.now() }
        : r
    );
    set({ requests: updatedRequests });
    try {
      await set('requests', updatedRequests);
    } catch (error) {
      console.error('Failed to cancel request:', error);
    }
  },

  getPendingRequestsForUser: (userId) => {
    return get().requests.filter(
      (r) => r.responderId === userId && r.status === 'pending'
    );
  },

  getRequestsByUser: (userId) => {
    return get().requests.filter(
      (r) => r.requesterId === userId || r.responderId === userId
    );
  },

  getReceivedRequestsForUser: (userId) => {
    return get().requests.filter((r) => r.responderId === userId);
  },

  getSentRequestsForUser: (userId) => {
    return get().requests.filter((r) => r.requesterId === userId);
  },
}));
