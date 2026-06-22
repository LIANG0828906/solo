import { create } from 'zustand';
import type { Message, Conversation, ChannelMessage } from '../types';
import { MessageModule } from '../modules/message/MessageModule';
import { useUserStore } from './useUserStore';
import { useExchangeStore } from './useExchangeStore';

interface MessageState {
  messages: Record<string, Message[]>;
  conversations: Conversation[];
  isLoading: boolean;
  error: string | null;
  activeConversationId: string | null;

  initChannel: () => void;
  closeChannel: () => void;
  sendMessage: (
    exchangeRequestId: string,
    senderId: string,
    content: string
  ) => Promise<Message>;
  loadMessages: (exchangeRequestId: string) => Promise<void>;
  loadConversations: (userId: string) => Promise<void>;
  setActiveConversation: (exchangeRequestId: string | null) => void;
  markAsRead: (exchangeRequestId: string, userId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  getMessages: (exchangeRequestId: string) => Message[];
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: {},
  conversations: [],
  isLoading: false,
  error: null,
  activeConversationId: null,

  initChannel: () => {
    MessageModule.initChannel((channelMessage: ChannelMessage) => {
      const { currentUser } = useUserStore.getState();

      if (channelMessage.type === 'new_message') {
        const message = channelMessage.payload.message as Message;
        get().addMessage(message);

        const { activeConversationId } = get();
        if (
          activeConversationId === message.exchangeRequestId &&
          currentUser &&
          message.senderId !== currentUser.id
        ) {
          MessageModule.markAsRead(
            message.exchangeRequestId,
            currentUser.id
          );
        }

        if (currentUser) {
          get().loadConversations(currentUser.id);
        }
      }

      if (channelMessage.type === 'request_status_change') {
        useExchangeStore.getState().refreshRequests();
        if (currentUser) {
          get().loadConversations(currentUser.id);
        }
      }
    });
  },

  closeChannel: () => {
    MessageModule.closeChannel();
  },

  sendMessage: async (exchangeRequestId, senderId, content) => {
    set({ isLoading: true });
    try {
      const message = await MessageModule.sendMessage(
        exchangeRequestId,
        senderId,
        content
      );
      get().addMessage(message);
      const { currentUser } = useUserStore.getState();
      if (currentUser) {
        get().loadConversations(currentUser.id);
      }
      return message;
    } finally {
      set({ isLoading: false });
    }
  },

  loadMessages: async (exchangeRequestId: string) => {
    set({ isLoading: true });
    try {
      const messages = await MessageModule.getMessages(exchangeRequestId);
      set((state) => ({
        messages: {
          ...state.messages,
          [exchangeRequestId]: messages,
        },
      }));
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  loadConversations: async (userId: string) => {
    set({ isLoading: true });
    try {
      const { requests } = useExchangeStore.getState();
      const { users } = useUserStore.getState();
      const conversations = await MessageModule.getConversations(
        userId,
        requests,
        users
      );
      set({ conversations });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveConversation: (exchangeRequestId: string | null) => {
    set({ activeConversationId: exchangeRequestId });
  },

  markAsRead: async (exchangeRequestId: string, userId: string) => {
    await MessageModule.markAsRead(exchangeRequestId, userId);
    get().loadConversations(userId);
  },

  addMessage: (message: Message) => {
    set((state) => {
      const requestMessages = state.messages[message.exchangeRequestId] || [];
      const exists = requestMessages.some((m) => m.id === message.id);
      if (exists) return state;

      return {
        messages: {
          ...state.messages,
          [message.exchangeRequestId]: [...requestMessages, message].sort(
            (a, b) => a.timestamp - b.timestamp
          ),
        },
      };
    });
  },

  getMessages: (exchangeRequestId: string) => {
    const { messages } = get();
    return messages[exchangeRequestId] || [];
  },
}));
