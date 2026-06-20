import { create } from 'zustand';
import { User, Meal, Chat, ChatMessage, MatchRequest } from './types';

interface AppState {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  meals: Meal[];
  setMeals: (meals: Meal[]) => void;
  addMeal: (meal: Meal) => void;
  chats: Chat[];
  addChat: (chat: Chat) => void;
  addMessage: (chatId: string, message: ChatMessage) => void;
  markAsRead: (chatId: string, messageId: string, readerId: string) => void;
  pendingRequests: MatchRequest[];
  addRequest: (request: MatchRequest) => void;
  updateRequest: (requestId: string, status: 'pending' | 'accepted' | 'rejected') => void;
}

interface WSState {
  wsConnected: boolean;
  setWSConnected: (connected: boolean) => void;
  lastNotification: string | null;
  setLastNotification: (notification: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  currentUser: null,
  setCurrentUser: (user) => set({ currentUser: user }),
  meals: [],
  setMeals: (meals) => set({ meals }),
  addMeal: (meal) => set((state) => ({ meals: [meal, ...state.meals] })),
  chats: [],
  addChat: (chat) =>
    set((state) => {
      const exists = state.chats.find((c) => c.id === chat.id);
      if (exists) return state;
      return { chats: [...state.chats, chat] };
    }),
  addMessage: (chatId, message) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: [...chat.messages, message],
            }
          : chat
      ),
    })),
  markAsRead: (chatId, messageId, readerId) =>
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              messages: chat.messages.map((msg) =>
                msg.id === messageId && !msg.readBy.includes(readerId)
                  ? { ...msg, readBy: [...msg.readBy, readerId] }
                  : msg
              ),
            }
          : chat
      ),
    })),
  pendingRequests: [],
  addRequest: (request) =>
    set((state) => {
      const exists = state.pendingRequests.find((r) => r.id === request.id);
      if (exists) return state;
      return { pendingRequests: [...state.pendingRequests, request] };
    }),
  updateRequest: (requestId, status) =>
    set((state) => ({
      pendingRequests: state.pendingRequests.map((r) =>
        r.id === requestId ? { ...r, status } : r
      ),
    })),
}));

export const useWSStore = create<WSState>((set) => ({
  wsConnected: false,
  setWSConnected: (connected) => set({ wsConnected: connected }),
  lastNotification: null,
  setLastNotification: (notification) => set({ lastNotification: notification }),
}));
