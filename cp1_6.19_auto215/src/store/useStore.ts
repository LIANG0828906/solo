import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Item, User, Message, Conversation, DistanceFilter, ItemCategory } from '../types';
import { generateMockItems, generateMockUsers, generateMockMessages, getCurrentUser } from '../utils/mockData';
import { calculateCarbon } from '../modules/eco/CarbonCalculator';

interface StoreState {
  items: Item[];
  currentUser: User;
  users: User[];
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  showNotification: boolean;
  notificationMessage: string;
  distanceFilter: DistanceFilter;
  activeTab: 'exchange' | 'eco';
  showPublishModal: boolean;
  showChatWindow: boolean;
  activeConversationId: string | null;

  addItem: (item: Omit<Item, 'id' | 'publisherId' | 'publisherName' | 'publishTime' | 'status'>) => void;
  setDistanceFilter: (filter: DistanceFilter) => void;
  setActiveTab: (tab: 'exchange' | 'eco') => void;
  setShowPublishModal: (show: boolean) => void;
  setShowChatWindow: (show: boolean) => void;
  setActiveConversationId: (id: string | null) => void;
  sendMessage: (conversationId: string, content: string) => void;
  getConversation: (itemId: string) => Conversation | undefined;
  startConversation: (itemId: string) => string;
  confirmExchange: (itemId: string) => void;
  showSuccessNotification: (message: string) => void;
  hideNotification: () => void;
  getFilteredItems: () => Item[];
}

export const useStore = create<StoreState>((set, get) => ({
  items: generateMockItems(30),
  currentUser: getCurrentUser(),
  users: generateMockUsers(),
  conversations: [],
  messages: {},
  showNotification: false,
  notificationMessage: '',
  distanceFilter: 'all',
  activeTab: 'exchange',
  showPublishModal: false,
  showChatWindow: false,
  activeConversationId: null,

  addItem: (itemData) => {
    const newItem: Item = {
      ...itemData,
      id: uuidv4(),
      publisherId: get().currentUser.id,
      publisherName: get().currentUser.name,
      publishTime: new Date(),
      status: 'available',
    };
    set((state) => ({
      items: [newItem, ...state.items],
    }));
  },

  setDistanceFilter: (filter) => set({ distanceFilter: filter }),

  setActiveTab: (tab) => set({ activeTab: tab }),

  setShowPublishModal: (show) => set({ showPublishModal: show }),

  setShowChatWindow: (show) => set({ showChatWindow: show }),

  setActiveConversationId: (id) => set({ activeConversationId: id }),

  sendMessage: (conversationId, content) => {
    const message: Message = {
      id: uuidv4(),
      conversationId,
      senderId: get().currentUser.id,
      content,
      timestamp: new Date(),
    };

    set((state) => {
      const currentMessages = state.messages[conversationId] || [];
      const updatedMessages = [...currentMessages, message];

      const updatedConversations = state.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: content, lastMessageTime: new Date() }
          : c
      );

      return {
        messages: {
          ...state.messages,
          [conversationId]: updatedMessages,
        },
        conversations: updatedConversations,
      };
    });

    setTimeout(() => {
      const autoReplies = [
        '好的，我知道了~',
        '没问题！',
        '好的，那就这样说定了。',
        '嗯嗯，我看到了。',
        '好哒~',
      ];
      const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      const replyMessage: Message = {
        id: uuidv4(),
        conversationId,
        senderId: 'user-1',
        content: reply,
        timestamp: new Date(),
      };

      set((state) => {
        const currentMessages = state.messages[conversationId] || [];
        return {
          messages: {
            ...state.messages,
            [conversationId]: [...currentMessages, replyMessage],
          },
        };
      });
    }, 1000 + Math.random() * 1000);
  },

  getConversation: (itemId) => {
    return get().conversations.find((c) => c.itemId === itemId);
  },

  startConversation: (itemId) => {
    const existing = get().conversations.find((c) => c.itemId === itemId);
    if (existing) {
      return existing.id;
    }

    const conversationId = uuidv4();
    const item = get().items.find((i) => i.id === itemId);
    const newConversation: Conversation = {
      id: conversationId,
      itemId,
      participants: [get().currentUser.id, item?.publisherId || 'user-1'],
      lastMessage: '',
      lastMessageTime: new Date(),
    };

    const initialMessages = generateMockMessages(conversationId, itemId);

    set((state) => ({
      conversations: [...state.conversations, newConversation],
      messages: {
        ...state.messages,
        [conversationId]: initialMessages,
      },
    }));

    return conversationId;
  },

  confirmExchange: (itemId) => {
    const item = get().items.find((i) => i.id === itemId);
    if (!item || item.status !== 'available') return;

    const result = calculateCarbon(item.category as ItemCategory, item.weight);

    set((state) => {
      const updatedItems = state.items.map((i) =>
        i.id === itemId ? { ...i, status: 'exchanged' as const } : i
      );

      const updatedCurrentUser = {
        ...state.currentUser,
        carbonPoints: state.currentUser.carbonPoints + result.carbonPoints,
        exchangeCount: state.currentUser.exchangeCount + 1,
        totalReduction: state.currentUser.totalReduction + result.reduction,
        monthlyExchangeCount: state.currentUser.monthlyExchangeCount + 1,
        pointsHistory: [
          ...state.currentUser.pointsHistory.slice(1),
          state.currentUser.carbonPoints + result.carbonPoints,
        ],
      };

      return {
        items: updatedItems,
        currentUser: updatedCurrentUser,
      };
    });

    get().showSuccessNotification(`交换成功！获得 ${result.carbonPoints} 碳积分`);
  },

  showSuccessNotification: (message) => {
    set({ showNotification: true, notificationMessage: message });
    setTimeout(() => {
      set({ showNotification: false });
    }, 3000);
  },

  hideNotification: () => set({ showNotification: false }),

  getFilteredItems: () => {
    const { items, distanceFilter } = get();
    if (distanceFilter === 'all') return items;

    const maxDistance = {
      '1km': 1,
      '3km': 3,
      '5km': 5,
    }[distanceFilter];

    return items.filter((item) => item.distance <= maxDistance);
  },
}));
