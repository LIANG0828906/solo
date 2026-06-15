import { create } from 'zustand'

interface User {
  id: string
  username: string
  password?: string
  avatar?: string
  createdAt: string
}

interface Pet {
  id: string
  ownerId: string
  name: string
  breed: string
  age: string
  personality: string
  photo: string
  availableForBorrow: boolean
  availableForAdoption: boolean
  createdAt: string
}

interface Item {
  id: string
  ownerId: string
  name: string
  image: string
  condition: string
  location: string
  availableForBorrow: boolean
  createdAt: string
}

interface Application {
  id: string
  type: 'borrow' | 'adopt'
  targetType: 'pet' | 'item'
  targetId: string
  targetName: string
  applicantId: string
  applicantName: string
  ownerId: string
  reason: string
  contact: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

interface Notification {
  id: string
  userId: string
  type: 'application_received' | 'application_approved' | 'application_rejected'
  applicationId: string
  message: string
  read: boolean
  createdAt: string
}

interface Comment {
  id: string
  targetType: 'pet' | 'item'
  targetId: string
  userId: string
  username: string
  content: string
  parentId: string | null
  likes: string[]
  createdAt: string
}

interface AppState {
  currentUser: User | null
  users: User[]
  pets: Pet[]
  items: Item[]
  notifications: Notification[]
  comments: Comment[]
  applications: Application[]
  login: (username: string, password: string) => Promise<User>
  register: (username: string, password: string) => Promise<User>
  logout: () => void
  fetchPets: () => Promise<void>
  fetchItems: () => Promise<void>
  fetchNotifications: () => Promise<void>
  fetchComments: (targetType: string, targetId: string) => Promise<void>
  submitApplication: (app: Omit<Application, 'id' | 'createdAt' | 'status'>) => Promise<void>
  handleApplication: (appId: string, status: 'approved' | 'rejected') => Promise<void>
  addComment: (comment: Omit<Comment, 'id' | 'createdAt' | 'likes'>) => Promise<void>
  toggleLike: (commentId: string) => Promise<void>
  markNotificationRead: (notificationId: string) => Promise<void>
}

export type { User, Pet, Item, Application, Notification, Comment }

export const useStore = create<AppState>((set, get) => ({
  currentUser: null,
  users: [],
  pets: [],
  items: [],
  notifications: [],
  comments: [],
  applications: [],

  login: async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || '登录失败')
    const user = data.user as User
    set({ currentUser: user })
    return user
  },

  register: async (username: string, password: string) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || '注册失败')
    const user = data.user as User
    set({ currentUser: user })
    return user
  },

  logout: () => {
    set({ currentUser: null, notifications: [], pets: [], items: [], comments: [], applications: [] })
  },

  fetchPets: async () => {
    const res = await fetch('/api/pets')
    const data = await res.json()
    if (data.success) set({ pets: data.pets })
  },

  fetchItems: async () => {
    const res = await fetch('/api/items')
    const data = await res.json()
    if (data.success) set({ items: data.items })
  },

  fetchNotifications: async () => {
    const { currentUser } = get()
    if (!currentUser) return
    const res = await fetch(`/api/notifications?userId=${currentUser.id}`)
    const data = await res.json()
    if (data.success) set({ notifications: data.notifications })
  },

  fetchComments: async (targetType: string, targetId: string) => {
    const res = await fetch(`/api/comments?targetType=${targetType}&targetId=${targetId}`)
    const data = await res.json()
    if (data.success) set({ comments: data.comments })
  },

  submitApplication: async (app) => {
    const res = await fetch('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(app),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || '申请失败')
    set((state) => ({ applications: [...state.applications, data.application] }))
  },

  handleApplication: async (appId, status) => {
    const res = await fetch(`/api/applications/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || '操作失败')
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === appId ? { ...a, status } : a
      ),
    }))
    get().fetchNotifications()
  },

  addComment: async (comment) => {
    const res = await fetch('/api/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(comment),
    })
    const data = await res.json()
    if (!data.success) throw new Error(data.error || '评论失败')
    set((state) => ({ comments: [...state.comments, data.comment] }))
  },

  toggleLike: async (commentId) => {
    const { currentUser, comments } = get()
    if (!currentUser) return
    const comment = comments.find((c) => c.id === commentId)
    if (!comment) return
    const isLiked = comment.likes.includes(currentUser.id)
    const res = await fetch(`/api/comments/${commentId}/like`, {
      method: isLiked ? 'DELETE' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser.id }),
    })
    const data = await res.json()
    if (data.success) {
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId ? data.comment : c
        ),
      }))
    }
  },

  markNotificationRead: async (notificationId) => {
    const res = await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
    })
    const data = await res.json()
    if (data.success) {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === notificationId ? { ...n, read: true } : n
        ),
      }))
    }
  },
}))
