import { create } from 'zustand';
import type { ExchangeRequest } from './types';

export interface ExchangeNotification {
  id: string;
  userId: string;
  type: 'new_request' | 'request_accepted' | 'request_rejected' | 'request_completed';
  requestId: string;
  message: string;
  read: boolean;
  createdAt: number;
}

interface ExchangeStore {
  requests: ExchangeRequest[];
  notifications: ExchangeNotification[];
  addRequest: (request: Omit<ExchangeRequest, 'id' | 'createdAt'>) => ExchangeRequest;
  updateRequestStatus: (id: string, status: ExchangeRequest['status']) => void;
  getRequestsByFromUser: (userId: string) => ExchangeRequest[];
  getRequestsByToUser: (userId: string) => ExchangeRequest[];
  getCompletedRequests: (userId: string) => ExchangeRequest[];
  getRequestById: (id: string) => ExchangeRequest | undefined;
  getUnreadNotifications: (userId: string) => ExchangeNotification[];
  markNotificationRead: (id: string) => void;
  listeners: Set<() => void>;
  subscribe: (listener: () => void) => () => void;
  notify: () => void;
}

export const useExchangeStore = create<ExchangeStore>((set, get) => ({
  requests: [],
  notifications: [],
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
    const newNotification: ExchangeNotification = {
      id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
      userId: request.toUserId,
      type: 'new_request',
      requestId: newRequest.id,
      message: '有人想要交换你的物品',
      read: false,
      createdAt: Date.now(),
    };
    set((state) => ({
      requests: [...state.requests, newRequest],
      notifications: [...state.notifications, newNotification],
    }));
    get().notify();
    return newRequest;
  },

  updateRequestStatus: (id, status) => {
    const req = get().getRequestById(id);
    const notifications: ExchangeNotification[] = [];

    if (req) {
      if (status === 'confirmed') {
        notifications.push({
          id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          userId: req.fromUserId,
          type: 'request_accepted',
          requestId: id,
          message: '对方已同意你的交换请求',
          read: false,
          createdAt: Date.now(),
        });
      } else if (status === 'rejected') {
        notifications.push({
          id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          userId: req.fromUserId,
          type: 'request_rejected',
          requestId: id,
          message: '对方已拒绝你的交换请求',
          read: false,
          createdAt: Date.now(),
        });
      } else if (status === 'completed') {
        notifications.push({
          id: 'notif_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8),
          userId: req.fromUserId,
          type: 'request_completed',
          requestId: id,
          message: '交换已完成！',
          read: false,
          createdAt: Date.now(),
        });
        notifications.push({
          id: 'notif_' + (Date.now() + 1) + '_' + Math.random().toString(36).slice(2, 8),
          userId: req.toUserId,
          type: 'request_completed',
          requestId: id,
          message: '交换已完成！',
          read: false,
          createdAt: Date.now(),
        });
      }
    }

    set((state) => ({
      requests: state.requests.map((req) =>
        req.id === id ? { ...req, status } : req
      ),
      notifications: [...state.notifications, ...notifications],
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

  getUnreadNotifications: (userId) => {
    return get().notifications.filter(
      (n) => n.userId === userId && !n.read
    );
  },

  markNotificationRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
    get().notify();
  },
}));
