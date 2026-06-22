import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { ExchangeRequest, Message, CalendarEvent, User } from '@/types';
import * as service from './ExchangeService';

interface ExchangeState {
  exchanges: ExchangeRequest[];
  messages: Message[];
  calendarEvents: CalendarEvent[];
  users: User[];
  currentExchange: ExchangeRequest | null;
  loading: boolean;

  fetchExchanges: (userId: string) => Promise<void>;
  fetchMessages: () => Promise<void>;
  fetchCalendarEvents: (userId: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  createExchange: (
    exchange: Omit<ExchangeRequest, 'id' | 'createdAt' | 'status'>,
  ) => Promise<void>;
  acceptExchange: (id: string) => Promise<void>;
  rejectExchange: (id: string) => Promise<void>;
  sendMessage: (message: Omit<Message, 'id' | 'createdAt' | 'isRead'>) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  setCurrentExchange: (exchange: ExchangeRequest | null) => void;
  addCalendarEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
}

export const useExchangeStore = create<ExchangeState>((set, get) => ({
  exchanges: [],
  messages: [],
  calendarEvents: [],
  users: [],
  currentExchange: null,
  loading: false,

  fetchExchanges: async (userId: string) => {
    set({ loading: true });
    const exchanges = await service.getExchangesForUser(userId);
    set({ exchanges, loading: false });
  },

  fetchMessages: async () => {
    set({ loading: true });
    const messages = await service.getAllMessages();
    set({ messages, loading: false });
  },

  fetchCalendarEvents: async (userId: string) => {
    set({ loading: true });
    const calendarEvents = await service.getCalendarEventsForUser(userId);
    set({ calendarEvents, loading: false });
  },

  fetchUsers: async () => {
    set({ loading: true });
    const users = await service.getAllUsers();
    set({ users, loading: false });
  },

  createExchange: async (exchange) => {
    const newExchange: ExchangeRequest = {
      ...exchange,
      id: uuidv4(),
      createdAt: Date.now(),
      status: 'pending',
    };
    await service.addExchange(newExchange);

    const event: CalendarEvent = {
      id: uuidv4(),
      userId: newExchange.fromUserId,
      itemId: newExchange.offeredItemId,
      type: 'exchange',
      title: `交换请求: ${newExchange.message}`,
      date: newExchange.createdAt,
    };
    await service.addCalendarEvent(event);

    set((state) => ({
      exchanges: [...state.exchanges, newExchange],
      calendarEvents: [...state.calendarEvents, event],
    }));
  },

  acceptExchange: async (id: string) => {
    const { exchanges, users } = get();
    const exchange = exchanges.find((e) => e.id === id);
    if (!exchange) return;

    const updatedExchange: ExchangeRequest = { ...exchange, status: 'accepted' };
    await service.updateExchange(updatedExchange);

    const fromUser = users.find((u) => u.id === exchange.fromUserId);
    const toUser = users.find((u) => u.id === exchange.toUserId);

    if (fromUser) {
      const updatedFrom: User = {
        ...fromUser,
        points: fromUser.points + 10,
        exchangeCount: fromUser.exchangeCount + 1,
      };
      await service.updateUser(updatedFrom);
    }

    if (toUser) {
      const updatedTo: User = {
        ...toUser,
        points: toUser.points + 10,
        exchangeCount: toUser.exchangeCount + 1,
      };
      await service.updateUser(updatedTo);
    }

    const event: CalendarEvent = {
      id: uuidv4(),
      userId: exchange.toUserId,
      itemId: exchange.requestedItemId,
      type: 'exchange',
      title: `交换已接受: ${exchange.message}`,
      date: Date.now(),
    };
    await service.addCalendarEvent(event);

    const refreshedUsers = await service.getAllUsers();

    set((state) => ({
      exchanges: state.exchanges.map((e) => (e.id === id ? updatedExchange : e)),
      users: refreshedUsers,
      calendarEvents: [...state.calendarEvents, event],
    }));
  },

  rejectExchange: async (id: string) => {
    const { exchanges } = get();
    const exchange = exchanges.find((e) => e.id === id);
    if (!exchange) return;

    const updatedExchange: ExchangeRequest = { ...exchange, status: 'rejected' };
    await service.updateExchange(updatedExchange);

    set((state) => ({
      exchanges: state.exchanges.map((e) => (e.id === id ? updatedExchange : e)),
    }));
  },

  sendMessage: async (message) => {
    const newMessage: Message = {
      ...message,
      id: uuidv4(),
      createdAt: Date.now(),
      isRead: false,
    };
    await service.addMessage(newMessage);

    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
  },

  markAsRead: async (messageId: string) => {
    await service.markMessageAsRead(messageId);

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, isRead: true } : m,
      ),
    }));
  },

  setCurrentExchange: (exchange) => {
    set({ currentExchange: exchange });
  },

  addCalendarEvent: async (event) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: uuidv4(),
    };
    await service.addCalendarEvent(newEvent);

    set((state) => ({
      calendarEvents: [...state.calendarEvents, newEvent],
    }));
  },
}));
