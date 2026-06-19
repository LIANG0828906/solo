import { create } from 'zustand'
import { User, Ingredient, ChatMessage } from '../types'

const MOCK_USERS: User[] = [
  { id: 'u1', username: 'zhangdama', nickname: '张大妈', avatar_color: '#27AE60', exchange_count: 22, trust_count: 18, created_at: '2025-03-15' },
  { id: 'u2', username: 'lishushu', nickname: '李叔叔', avatar_color: '#2980B9', exchange_count: 35, trust_count: 30, created_at: '2025-01-10' },
  { id: 'u3', username: 'wangayi', nickname: '王阿姨', avatar_color: '#E67E22', exchange_count: 8, trust_count: 6, created_at: '2025-06-01' },
  { id: 'u4', username: 'xiaoliu', nickname: '小刘', avatar_color: '#8E44AD', exchange_count: 12, trust_count: 10, created_at: '2025-04-20' },
  { id: 'u5', username: 'zhaojie', nickname: '赵姐', avatar_color: '#27AE60', exchange_count: 5, trust_count: 3, created_at: '2025-08-12' },
  { id: 'u6', username: 'sundaye', nickname: '孙大爷', avatar_color: '#2980B9', exchange_count: 16, trust_count: 14, created_at: '2025-02-28' },
  { id: 'u7', username: 'chensao', nickname: '陈嫂', avatar_color: '#E67E22', exchange_count: 28, trust_count: 25, created_at: '2024-12-05' },
  { id: 'u8', username: 'zhouming', nickname: '周明', avatar_color: '#8E44AD', exchange_count: 3, trust_count: 2, created_at: '2025-09-18' },
  { id: 'u9', username: 'wujie', nickname: '吴姐', avatar_color: '#27AE60', exchange_count: 10, trust_count: 8, created_at: '2025-05-07' },
  { id: 'u10', username: 'zhengwei', nickname: '郑伟', avatar_color: '#2980B9', exchange_count: 7, trust_count: 5, created_at: '2025-07-22' },
]

const MOCK_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing1', user_id: 'u1', name: '小白菜', quantity: 3, unit: '把', expiry_date: '2026-06-22',
    image_url: '', category: '蔬菜', description: '自家菜园种的，新鲜无农药', created_at: '2026-06-18', distance: 0.5, user: MOCK_USERS[0], is_exchanged: false,
  },
  {
    id: 'ing2', user_id: 'u2', name: '西红柿', quantity: 6, unit: '个', expiry_date: '2026-06-25',
    image_url: '', category: '蔬菜', description: '菜市场买多了，红透了很好吃', created_at: '2026-06-18', distance: 0.3, user: MOCK_USERS[1], is_exchanged: false,
  },
  {
    id: 'ing3', user_id: 'u3', name: '土豆', quantity: 2, unit: '斤', expiry_date: '2026-07-03',
    image_url: '', category: '根茎类', description: '新买的土豆，又大又圆', created_at: '2026-06-17', distance: 0.8, user: MOCK_USERS[2], is_exchanged: false,
  },
  {
    id: 'ing4', user_id: 'u4', name: '鸡蛋', quantity: 10, unit: '个', expiry_date: '2026-06-26',
    image_url: '', category: '其他', description: '农家土鸡蛋，蛋黄特别黄', created_at: '2026-06-18', distance: 1.2, user: MOCK_USERS[3], is_exchanged: false,
  },
  {
    id: 'ing5', user_id: 'u5', name: '生姜', quantity: 1, unit: '块', expiry_date: '2026-07-09',
    image_url: '', category: '调味料', description: '老姜，炒菜炖肉很香', created_at: '2026-06-16', distance: 0.6, user: MOCK_USERS[4], is_exchanged: false,
  },
  {
    id: 'ing6', user_id: 'u6', name: '大蒜', quantity: 2, unit: '头', expiry_date: '2026-07-14',
    image_url: '', category: '调味料', description: '独头蒜，蒜味浓', created_at: '2026-06-15', distance: 0.4, user: MOCK_USERS[5], is_exchanged: false,
  },
  {
    id: 'ing7', user_id: 'u7', name: '苹果', quantity: 4, unit: '个', expiry_date: '2026-06-27',
    image_url: '', category: '水果', description: '烟台红富士，脆甜多汁', created_at: '2026-06-18', distance: 1.5, user: MOCK_USERS[6], is_exchanged: false,
  },
  {
    id: 'ing8', user_id: 'u1', name: '香蕉', quantity: 5, unit: '根', expiry_date: '2026-06-21',
    image_url: '', category: '水果', description: '熟透了，再不吃就坏了', created_at: '2026-06-18', distance: 0.5, user: MOCK_USERS[0], is_exchanged: false,
  },
  {
    id: 'ing9', user_id: 'u9', name: '牛奶', quantity: 1, unit: '盒', expiry_date: '2026-06-22',
    image_url: '', category: '乳制品', description: '鲜牛奶1L装，快到保质期了', created_at: '2026-06-18', distance: 2.0, user: MOCK_USERS[8], is_exchanged: false,
  },
  {
    id: 'ing10', user_id: 'u10', name: '酱油', quantity: 1, unit: '瓶', expiry_date: '2026-09-17',
    image_url: '', category: '调味料', description: '海天生抽，开封不久', created_at: '2026-06-14', distance: 1.8, user: MOCK_USERS[9], is_exchanged: false,
  },
  {
    id: 'ing11', user_id: 'u2', name: '五花肉', quantity: 1, unit: '斤', expiry_date: '2026-06-21',
    image_url: '', category: '肉类', description: '新鲜五花肉，肥瘦相间', created_at: '2026-06-18', distance: 0.3, user: MOCK_USERS[1], is_exchanged: false,
  },
  {
    id: 'ing12', user_id: 'u6', name: '胡萝卜', quantity: 3, unit: '根', expiry_date: '2026-06-29',
    image_url: '', category: '根茎类', description: '有机胡萝卜，口感甜脆', created_at: '2026-06-17', distance: 0.7, user: MOCK_USERS[5], is_exchanged: false,
  },
  {
    id: 'ing13', user_id: 'u3', name: '豆腐', quantity: 1, unit: '块', expiry_date: '2026-06-21',
    image_url: '', category: '其他', description: '卤水豆腐，今天刚买的', created_at: '2026-06-18', distance: 0.3, user: MOCK_USERS[2], is_exchanged: false,
  },
  {
    id: 'ing14', user_id: 'u7', name: '橙子', quantity: 6, unit: '个', expiry_date: '2026-06-25',
    image_url: '', category: '水果', description: '赣南脐橙，水分足', created_at: '2026-06-17', distance: 1.3, user: MOCK_USERS[6], is_exchanged: false,
  },
  {
    id: 'ing15', user_id: 'u8', name: '鸡胸肉', quantity: 2, unit: '块', expiry_date: '2026-06-20',
    image_url: '', category: '肉类', description: '健身餐多买了，新鲜鸡胸', created_at: '2026-06-18', distance: 2.5, user: MOCK_USERS[7], is_exchanged: false,
  },
  {
    id: 'ing16', user_id: 'u4', name: '酸奶', quantity: 4, unit: '杯', expiry_date: '2026-06-24',
    image_url: '', category: '乳制品', description: '原味酸奶，买一送一多出来的', created_at: '2026-06-18', distance: 0.5, user: MOCK_USERS[3], is_exchanged: false,
  },
  {
    id: 'ing17', user_id: 'u9', name: '菠菜', quantity: 2, unit: '把', expiry_date: '2026-06-21',
    image_url: '', category: '蔬菜', description: '嫩菠菜，涮火锅特别好', created_at: '2026-06-18', distance: 0.8, user: MOCK_USERS[8], is_exchanged: false,
  },
  {
    id: 'ing18', user_id: 'u5', name: '红薯', quantity: 3, unit: '个', expiry_date: '2026-07-04',
    image_url: '', category: '根茎类', description: '蜜薯，烤着吃特别甜', created_at: '2026-06-16', distance: 1.6, user: MOCK_USERS[4], is_exchanged: false,
  },
  {
    id: 'ing19', user_id: 'u10', name: '香菇', quantity: 200, unit: '克', expiry_date: '2026-06-23',
    image_url: '', category: '蔬菜', description: '鲜香菇，炖鸡汤很鲜', created_at: '2026-06-18', distance: 1.1, user: MOCK_USERS[9], is_exchanged: false,
  },
  {
    id: 'ing20', user_id: 'u6', name: '醋', quantity: 1, unit: '瓶', expiry_date: '2026-08-18',
    image_url: '', category: '调味料', description: '山西老陈醋，家里有多的', created_at: '2026-06-12', distance: 0.4, user: MOCK_USERS[5], is_exchanged: false,
  },
]

const MOCK_CHAT_MESSAGES: Record<string, ChatMessage[]> = {
  'u1': [
    { id: 'm1', chat_id: 'u1', sender_id: 'u1', receiver_id: 'current', content: '你好，小白菜还有吗？', is_read: true, created_at: '2026-06-18T09:00:00' },
    { id: 'm2', chat_id: 'u1', sender_id: 'current', receiver_id: 'u1', content: '有的，你要几把？', is_read: true, created_at: '2026-06-18T09:02:00' },
    { id: 'm3', chat_id: 'u1', sender_id: 'u1', receiver_id: 'current', content: '来两把吧，我住3号楼', is_read: true, created_at: '2026-06-18T09:05:00' },
    { id: 'm4', chat_id: 'u1', sender_id: 'current', receiver_id: 'u1', content: '好的，一会儿给你送过去', is_read: true, created_at: '2026-06-18T09:06:00' },
  ],
  'u2': [
    { id: 'm5', chat_id: 'u2', sender_id: 'u2', receiver_id: 'current', content: '西红柿要吗？很新鲜的', is_read: true, created_at: '2026-06-18T10:00:00' },
    { id: 'm6', chat_id: 'u2', sender_id: 'current', receiver_id: 'u2', content: '要！多少钱？', is_read: true, created_at: '2026-06-18T10:05:00' },
    { id: 'm7', chat_id: 'u2', sender_id: 'u2', receiver_id: 'current', content: '免费分享，拿去吃就好', is_read: false, created_at: '2026-06-18T10:06:00' },
  ],
  'u7': [
    { id: 'm8', chat_id: 'u7', sender_id: 'u7', receiver_id: 'current', content: '苹果要不要？刚从超市买的', is_read: false, created_at: '2026-06-18T11:00:00' },
  ],
}

interface AppState {
  currentUser: User | null
  users: User[]
  ingredients: Ingredient[]
  chatMessages: Record<string, ChatMessage[]>
  activeChat: string | null
  searchQuery: string
  categoryFilter: string

  login: (user: User) => void
  logout: () => void
  fetchIngredients: () => void
  addIngredient: (ingredient: Ingredient) => void
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void
  sendMessage: (chatId: string, senderId: string, receiverId: string, content: string) => void
  markAsRead: (chatId: string) => void
  markMessageAsRead: (messageId: string) => void
  setSearchQuery: (query: string) => void
  setCategoryFilter: (category: string) => void
  getUserById: (id: string) => User | undefined
}

export const useStore = create<AppState>((set, get) => ({
  currentUser: {
    id: 'current',
    username: 'wo',
    nickname: '我',
    avatar_color: '#E67E22',
    exchange_count: 6,
    trust_count: 4,
    created_at: '2025-10-01',
  },
  users: MOCK_USERS,
  ingredients: MOCK_INGREDIENTS,
  chatMessages: MOCK_CHAT_MESSAGES,
  activeChat: null,
  searchQuery: '',
  categoryFilter: '',

  login: (user) => set({ currentUser: user }),

  logout: () => set({ currentUser: null }),

  fetchIngredients: () => set({ ingredients: MOCK_INGREDIENTS }),

  addIngredient: (ingredient) =>
    set((state) => ({ ingredients: [ingredient, ...state.ingredients] })),

  updateIngredient: (id, updates) =>
    set((state) => ({
      ingredients: state.ingredients.map((ing) =>
        ing.id === id ? { ...ing, ...updates } : ing
      ),
    })),

  sendMessage: (chatId, senderId, receiverId, content) => {
    const newMessage: ChatMessage = {
      id: `m${Date.now()}`,
      chat_id: chatId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    }
    set((state) => ({
      chatMessages: {
        ...state.chatMessages,
        [chatId]: [...(state.chatMessages[chatId] || []), newMessage],
      },
    }))
  },

  markAsRead: (chatId) =>
    set((state) => ({
      chatMessages: {
        ...state.chatMessages,
        [chatId]: (state.chatMessages[chatId] || []).map((msg) =>
          msg.receiver_id === 'current' ? { ...msg, is_read: true } : msg
        ),
      },
    })),

  markMessageAsRead: (messageId) =>
    set((state) => {
      const updated: Record<string, ChatMessage[]> = {}
      for (const [chatId, msgs] of Object.entries(state.chatMessages)) {
        const found = msgs.find((m) => m.id === messageId)
        if (found) {
          updated[chatId] = msgs.map((m) =>
            m.id === messageId ? { ...m, is_read: true } : m
          )
        } else {
          updated[chatId] = msgs
        }
      }
      return { chatMessages: updated }
    }),

  setSearchQuery: (query) => set({ searchQuery: query }),

  setCategoryFilter: (category) => set({ categoryFilter: category }),

  getUserById: (id) => {
    const state = get()
    if (id === 'current') return state.currentUser || undefined
    return state.users.find((u) => u.id === id) || state.ingredients.find((i) => i.user?.id === id)?.user
  },
}))
