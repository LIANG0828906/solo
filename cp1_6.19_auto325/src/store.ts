import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  nickname: string;
  avatarUrl: string;
  locationArea: string;
  createdAt: string;
}

export type ItemStatus = 'pending' | 'reserved' | 'exchanged';
export type ItemCategory = '书籍' | '电子产品' | '家居' | '服装' | '玩具' | '其他';

export interface Item {
  id: string;
  ownerId: string;
  title: string;
  description: string;
  imageUrl: string;
  conditionLevel: number;
  category: ItemCategory;
  status: ItemStatus;
  createdAt: string;
}

export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'expired';

export interface ExchangeRequest {
  id: string;
  fromUserId: string;
  toUserId: string;
  proposedItemId: string;
  targetItemId: string;
  status: RequestStatus;
  fromConfirmed: boolean;
  toConfirmed: boolean;
  expiredAt: string | null;
  completedAt: string | null;
  createdAt: string;
  isNew?: boolean;
}

export interface Message {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

type FilterCondition = number | 'all';
type FilterCategory = ItemCategory | 'all';
type FilterArea = string | 'all';

interface AppStore {
  currentUser: User | null;
  users: User[];
  items: Item[];
  requests: ExchangeRequest[];
  messages: Message[];
  searchQuery: string;
  filterCategory: FilterCategory;
  filterCondition: FilterCondition;
  filterArea: FilterArea;

  registerUser: (data: Omit<User, 'id' | 'createdAt'>) => User;
  loginUser: (userId: string) => void;
  logoutUser: () => void;

  createItem: (data: Omit<Item, 'id' | 'status' | 'createdAt'>) => Item;
  getItem: (id: string) => Item | undefined;
  getFilteredItems: () => Item[];

  createRequest: (
    data: Omit<ExchangeRequest, 'id' | 'status' | 'fromConfirmed' | 'toConfirmed' | 'expiredAt' | 'completedAt' | 'createdAt' | 'isNew'>
  ) => ExchangeRequest | null;
  acceptRequest: (requestId: string) => void;
  rejectRequest: (requestId: string) => void;
  confirmExchange: (requestId: string, userId: string) => void;
  checkExpiredRequests: () => void;
  markRequestRead: (requestId: string) => void;

  sendMessage: (data: Omit<Message, 'id' | 'isRead' | 'createdAt'>) => Message;
  getConversation: (userId1: string, userId2: string) => Message[];
  markMessagesAsRead: (fromUserId: string, toUserId: string) => void;

  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<{ category: FilterCategory; condition: FilterCondition; area: FilterArea }>) => void;
  getAvailableAreas: () => string[];

  getUserById: (id: string) => User | undefined;
  getMyRequests: () => { sent: ExchangeRequest[]; received: ExchangeRequest[] };
  getMyItems: () => Item[];
  getUnreadReceivedCount: () => number;
  getCompletedExchanges: () => ExchangeRequest[];
}

const STORAGE_KEY = 'exchange_app_state_v1';

const CATEGORIES: ItemCategory[] = ['书籍', '电子产品', '家居', '服装', '玩具', '其他'];

const generateMockData = () => {
  const now = Date.now();
  const users: User[] = [
    {
      id: 'user-1',
      nickname: '小明同学',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming',
      locationArea: 'A区-东区',
      createdAt: new Date(now - 86400000 * 30).toISOString(),
    },
    {
      id: 'user-2',
      nickname: '文艺青年',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wenyi',
      locationArea: 'B区-西区',
      createdAt: new Date(now - 86400000 * 20).toISOString(),
    },
    {
      id: 'user-3',
      nickname: '收纳达人',
      avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=shouna',
      locationArea: 'C区-南区',
      createdAt: new Date(now - 86400000 * 15).toISOString(),
    },
  ];

  const items: Item[] = [
    {
      id: 'item-1',
      ownerId: 'user-1',
      title: '《三体》全套三部曲',
      description: '刘慈欣代表作，科幻迷必读！9成新，无笔记无破损，希望换个同类型的好书。',
      imageUrl: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&q=80',
      conditionLevel: 9,
      category: '书籍',
      status: 'pending',
      createdAt: new Date(now - 86400000 * 5).toISOString(),
    },
    {
      id: 'item-2',
      ownerId: 'user-1',
      title: '小米无线蓝牙耳机',
      description: '使用半年，音质清晰，续航持久，配件齐全，换购其他电子产品。',
      imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
      conditionLevel: 8,
      category: '电子产品',
      status: 'pending',
      createdAt: new Date(now - 86400000 * 4).toISOString(),
    },
    {
      id: 'item-3',
      ownerId: 'user-2',
      title: '北欧风极简台灯',
      description: '护眼LED台灯，三档亮度调节，北欧简约设计，搬家出闲置。',
      imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&q=80',
      conditionLevel: 7,
      category: '家居',
      status: 'pending',
      createdAt: new Date(now - 86400000 * 6).toISOString(),
    },
    {
      id: 'item-4',
      ownerId: 'user-2',
      title: '复古胶片相机',
      description: '经典胶片机，收藏级别，功能完好，适合摄影爱好者。',
      imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&q=80',
      conditionLevel: 6,
      category: '电子产品',
      status: 'reserved',
      createdAt: new Date(now - 86400000 * 8).toISOString(),
    },
    {
      id: 'item-5',
      ownerId: 'user-2',
      title: '《人类简史》精装版',
      description: '尤瓦尔赫拉利经典著作，精装硬壳，全新未拆封。',
      imageUrl: 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400&q=80',
      conditionLevel: 10,
      category: '书籍',
      status: 'pending',
      createdAt: new Date(now - 86400000 * 3).toISOString(),
    },
    {
      id: 'item-6',
      ownerId: 'user-3',
      title: '手工编织毛毯',
      description: '妈妈亲手编织的羊毛毯，柔软保暖，图案精美，适合秋冬。',
      imageUrl: 'https://images.unsplash.com/photo-1580301762395-21ce84d00bc6?w=400&q=80',
      conditionLevel: 9,
      category: '家居',
      status: 'pending',
      createdAt: new Date(now - 86400000 * 2).toISOString(),
    },
    {
      id: 'item-7',
      ownerId: 'user-3',
      title: '乐高城市系列积木',
      description: '完整套装，含说明书，零件齐全，孩子大了不玩了，希望找个有缘人。',
      imageUrl: 'https://images.unsplash.com/photo-1587654780291-39c9404d746b?w=400&q=80',
      conditionLevel: 8,
      category: '玩具',
      status: 'pending',
      createdAt: new Date(now - 86400000 * 7).toISOString(),
    },
    {
      id: 'item-8',
      ownerId: 'user-3',
      title: '运动品牌速干T恤',
      description: 'L码，只穿过两次，版型修身，透气性好，运动休闲两不误。',
      imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80',
      conditionLevel: 9,
      category: '服装',
      status: 'exchanged',
      createdAt: new Date(now - 86400000 * 12).toISOString(),
    },
    {
      id: 'item-9',
      ownerId: 'user-1',
      title: '便携式蓝牙音箱',
      description: '小巧便携，音质震撼，防水设计，户外必备神器。',
      imageUrl: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&q=80',
      conditionLevel: 7,
      category: '电子产品',
      status: 'pending',
      createdAt: new Date(now - 86400000 * 1).toISOString(),
    },
  ];

  const requests: ExchangeRequest[] = [
    {
      id: 'req-1',
      fromUserId: 'user-2',
      toUserId: 'user-1',
      proposedItemId: 'item-5',
      targetItemId: 'item-1',
      status: 'pending',
      fromConfirmed: false,
      toConfirmed: false,
      expiredAt: null,
      completedAt: null,
      createdAt: new Date(now - 3600000 * 2).toISOString(),
      isNew: true,
    },
    {
      id: 'req-2',
      fromUserId: 'user-3',
      toUserId: 'user-2',
      proposedItemId: 'item-6',
      targetItemId: 'item-4',
      status: 'accepted',
      fromConfirmed: true,
      toConfirmed: false,
      expiredAt: new Date(now + 86400000 * 20).toISOString(),
      completedAt: null,
      createdAt: new Date(now - 86400000 * 1).toISOString(),
      isNew: true,
    },
    {
      id: 'req-3',
      fromUserId: 'user-1',
      toUserId: 'user-3',
      proposedItemId: 'item-2',
      targetItemId: 'item-7',
      status: 'completed',
      fromConfirmed: true,
      toConfirmed: true,
      expiredAt: null,
      completedAt: new Date(now - 86400000 * 5).toISOString(),
      createdAt: new Date(now - 86400000 * 10).toISOString(),
      isNew: false,
    },
  ];

  const messages: Message[] = [
    {
      id: 'msg-1',
      fromUserId: 'user-2',
      toUserId: 'user-1',
      content: '你好，对你的三体很感兴趣！',
      isRead: false,
      createdAt: new Date(now - 3600000 * 2).toISOString(),
    },
    {
      id: 'msg-2',
      fromUserId: 'user-1',
      toUserId: 'user-2',
      content: '谢谢！你的人类简史我也想看～',
      isRead: true,
      createdAt: new Date(now - 3600000 * 1.5).toISOString(),
    },
    {
      id: 'msg-3',
      fromUserId: 'user-3',
      toUserId: 'user-2',
      content: '请问相机有原装皮套吗？',
      isRead: false,
      createdAt: new Date(now - 86400000).toISOString(),
    },
  ];

  return { users, items, requests, messages };
};

const loadFromStorage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        users: parsed.users || [],
        items: parsed.items || [],
        requests: parsed.requests || [],
        messages: parsed.messages || [],
        currentUser: parsed.currentUser || null,
      };
    }
  } catch (e) {
    console.warn('Failed to load from storage');
  }
  return null;
};

const saveToStorage = (state: Partial<AppStore>) => {
  try {
    const data = {
      users: state.users,
      items: state.items,
      requests: state.requests,
      messages: state.messages,
      currentUser: state.currentUser,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save to storage');
  }
};

const getInitialState = () => {
  const stored = loadFromStorage();
  if (stored && stored.users.length > 0) {
    return stored;
  }
  return { ...generateMockData(), currentUser: null };
};

export const useStore = create<AppStore>((set, get) => {
  const initial = getInitialState();

  return {
    currentUser: initial.currentUser,
    users: initial.users,
    items: initial.items,
    requests: initial.requests,
    messages: initial.messages,
    searchQuery: '',
    filterCategory: 'all',
    filterCondition: 'all',
    filterArea: 'all',

    registerUser: (data) => {
      const user: User = {
        ...data,
        id: `user-${uuidv4().slice(0, 8)}`,
        createdAt: new Date().toISOString(),
      };
      set((s) => {
        const newState = { ...s, users: [...s.users, user], currentUser: user };
        saveToStorage(newState);
        return newState;
      });
      return user;
    },

    loginUser: (userId) => {
      set((s) => {
        const user = s.users.find((u) => u.id === userId) || null;
        const newState = { ...s, currentUser: user };
        saveToStorage(newState);
        return newState;
      });
    },

    logoutUser: () => {
      set((s) => {
        const newState = { ...s, currentUser: null };
        saveToStorage(newState);
        return newState;
      });
    },

    createItem: (data) => {
      const item: Item = {
        ...data,
        id: `item-${uuidv4().slice(0, 8)}`,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      set((s) => {
        const newState = { ...s, items: [item, ...s.items] };
        saveToStorage(newState);
        return newState;
      });
      return item;
    },

    getItem: (id) => get().items.find((i) => i.id === id),

    getFilteredItems: () => {
      const { items, searchQuery, filterCategory, filterCondition, filterArea, users } = get();
      return items.filter((item) => {
        if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
        if (filterCategory !== 'all' && item.category !== filterCategory) {
          return false;
        }
        if (filterCondition !== 'all' && item.conditionLevel < filterCondition) {
          return false;
        }
        if (filterArea !== 'all') {
          const owner = users.find((u) => u.id === item.ownerId);
          if (!owner || owner.locationArea !== filterArea) {
            return false;
          }
        }
        return true;
      });
    },

    createRequest: (data) => {
      const { items } = get();
      const targetItem = items.find((i) => i.id === data.targetItemId);
      if (!targetItem || targetItem.status !== 'pending') return null;

      const request: ExchangeRequest = {
        ...data,
        id: `req-${uuidv4().slice(0, 8)}`,
        status: 'pending',
        fromConfirmed: false,
        toConfirmed: false,
        expiredAt: null,
        completedAt: null,
        createdAt: new Date().toISOString(),
        isNew: true,
      };
      set((s) => {
        const newState = { ...s, requests: [request, ...s.requests] };
        saveToStorage(newState);
        return newState;
      });
      return request;
    },

    acceptRequest: (requestId) => {
      set((s) => {
        const request = s.requests.find((r) => r.id === requestId);
        if (!request) return s;

        const expiredAt = new Date(Date.now() + 86400000 * 24).toISOString();
        const updatedRequests = s.requests.map((r) =>
          r.id === requestId ? { ...r, status: 'accepted' as RequestStatus, expiredAt, isNew: false } : r
        );
        const updatedItems = s.items.map((i) => {
          if (i.id === request.proposedItemId || i.id === request.targetItemId) {
            return { ...i, status: 'reserved' as ItemStatus };
          }
          return i;
        });
        const newState = { ...s, requests: updatedRequests, items: updatedItems };
        saveToStorage(newState);
        return newState;
      });
    },

    rejectRequest: (requestId) => {
      set((s) => {
        const updatedRequests = s.requests.map((r) =>
          r.id === requestId ? { ...r, status: 'rejected' as RequestStatus, isNew: false } : r
        );
        const newState = { ...s, requests: updatedRequests };
        saveToStorage(newState);
        return newState;
      });
    },

    confirmExchange: (requestId, userId) => {
      set((s) => {
        const request = s.requests.find((r) => r.id === requestId);
        if (!request) return s;

        const isFromUser = userId === request.fromUserId;
        const isToUser = userId === request.toUserId;

        let updatedRequest = { ...request, isNew: false };
        if (isFromUser) updatedRequest.fromConfirmed = true;
        if (isToUser) updatedRequest.toConfirmed = true;

        let updatedItems = [...s.items];
        if (updatedRequest.fromConfirmed && updatedRequest.toConfirmed) {
          updatedRequest.status = 'completed';
          updatedRequest.completedAt = new Date().toISOString();
          updatedItems = s.items.map((i) => {
            if (i.id === request.proposedItemId || i.id === request.targetItemId) {
              return { ...i, status: 'exchanged' as ItemStatus };
            }
            return i;
          });
        }

        const updatedRequests = s.requests.map((r) =>
          r.id === requestId ? updatedRequest : r
        );

        const newState = { ...s, requests: updatedRequests, items: updatedItems };
        saveToStorage(newState);
        return newState;
      });
    },

    checkExpiredRequests: () => {
      set((s) => {
        const now = new Date().getTime();
        let itemsChanged = false;

        const updatedRequests = s.requests.map((r) => {
          if (r.status === 'accepted' && r.expiredAt && new Date(r.expiredAt).getTime() < now) {
            itemsChanged = true;
            return { ...r, status: 'expired' as RequestStatus };
          }
          return r;
        });

        let updatedItems = s.items;
        if (itemsChanged) {
          const expiredRequestIds = updatedRequests
            .filter((r, idx) => r.status === 'expired' && s.requests[idx]?.status !== 'expired')
            .map((r) => r.id);

          const affectedRequests = s.requests.filter(
            (r) => expiredRequestIds.includes(r.id) && r.status === 'accepted'
          );

          if (affectedRequests.length > 0) {
            const affectedItemIds = new Set<string>();
            affectedRequests.forEach((r) => {
              affectedItemIds.add(r.proposedItemId);
              affectedItemIds.add(r.targetItemId);
            });

            updatedItems = s.items.map((i) => {
              if (affectedItemIds.has(i.id) && i.status === 'reserved') {
                const hasOtherActive = updatedRequests.some(
                  (r) =>
                    (r.proposedItemId === i.id || r.targetItemId === i.id) &&
                    r.status === 'accepted'
                );
                if (!hasOtherActive) {
                  return { ...i, status: 'pending' as ItemStatus };
                }
              }
              return i;
            });
          }
        }

        const newState = { ...s, requests: updatedRequests, items: updatedItems };
        saveToStorage(newState);
        return newState;
      });
    },

    markRequestRead: (requestId) => {
      set((s) => {
        const updatedRequests = s.requests.map((r) =>
          r.id === requestId ? { ...r, isNew: false } : r
        );
        const newState = { ...s, requests: updatedRequests };
        saveToStorage(newState);
        return newState;
      });
    },

    sendMessage: (data) => {
      const message: Message = {
        ...data,
        id: `msg-${uuidv4().slice(0, 8)}`,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      set((s) => {
        const newState = { ...s, messages: [...s.messages, message] };
        saveToStorage(newState);
        return newState;
      });
      return message;
    },

    getConversation: (userId1, userId2) => {
      return get()
        .messages.filter(
          (m) =>
            (m.fromUserId === userId1 && m.toUserId === userId2) ||
            (m.fromUserId === userId2 && m.toUserId === userId1)
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    markMessagesAsRead: (fromUserId, toUserId) => {
      set((s) => {
        const updatedMessages = s.messages.map((m) =>
          m.fromUserId === fromUserId && m.toUserId === toUserId ? { ...m, isRead: true } : m
        );
        const newState = { ...s, messages: updatedMessages };
        saveToStorage(newState);
        return newState;
      });
    },

    setSearchQuery: (query) => set({ searchQuery: query }),

    setFilters: (filters) => set((s) => ({ ...s, ...filters })),

    getAvailableAreas: () => {
      const areas = new Set(get().users.map((u) => u.locationArea));
      return Array.from(areas);
    },

    getUserById: (id) => get().users.find((u) => u.id === id),

    getMyRequests: () => {
      const currentUser = get().currentUser;
      if (!currentUser) return { sent: [], received: [] };
      return {
        sent: get().requests.filter((r) => r.fromUserId === currentUser.id),
        received: get().requests.filter((r) => r.toUserId === currentUser.id),
      };
    },

    getMyItems: () => {
      const currentUser = get().currentUser;
      if (!currentUser) return [];
      return get().items.filter((i) => i.ownerId === currentUser.id);
    },

    getUnreadReceivedCount: () => {
      const currentUser = get().currentUser;
      if (!currentUser) return 0;
      return get().requests.filter((r) => r.toUserId === currentUser.id && r.isNew === true).length;
    },

    getCompletedExchanges: () => {
      const currentUser = get().currentUser;
      if (!currentUser) return [];
      return get()
        .requests.filter(
          (r) =>
            r.status === 'completed' &&
            (r.fromUserId === currentUser.id || r.toUserId === currentUser.id)
        )
        .slice(0, 5);
    },
  };
});

export { CATEGORIES };
