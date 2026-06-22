import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import type { Wedding, Todo, TimelineItem, Guest, Activity, Invitation, User } from '@types'
import { weddingApi, todoApi, timelineApi, guestApi, activityApi, invitationApi } from '@utils/api'

interface AppState {
  loading: boolean
  currentUser: User
  wedding: Wedding | null
  todos: Todo[]
  timeline: TimelineItem[]
  guests: Guest[]
  activities: Activity[]
  invitation: Invitation | null
  refreshAll: () => Promise<void>
  addTodo: (title: string, assigneeName?: string) => Promise<void>
  toggleTodo: (id: string) => Promise<void>
  deleteTodo: (id: string) => Promise<void>
  addTimelineItem: (item: Omit<TimelineItem, 'id' | 'order'>) => Promise<void>
  updateTimelineItem: (id: string, data: Partial<TimelineItem>) => Promise<void>
  deleteTimelineItem: (id: string) => Promise<void>
  reorderTimeline: (items: TimelineItem[]) => Promise<void>
  addGuest: (guest: Omit<Guest, 'id' | 'createdAt'>) => Promise<void>
  updateGuest: (id: string, data: Partial<Guest>) => Promise<void>
  deleteGuest: (id: string) => Promise<void>
  updateInvitation: (data: Partial<Invitation>) => Promise<void>
  addActivity: (action: string, detail: string, color: string) => Promise<void>
  updateWedding: (data: Partial<Wedding>) => Promise<void>
}

const AppContext = createContext<AppState | null>(null)

const defaultUser: User = {
  id: 'user-1',
  name: '林小雅',
  role: 'bride',
  avatar: '👰',
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [currentUser] = useState<User>(defaultUser)
  const [wedding, setWedding] = useState<Wedding | null>(null)
  const [todos, setTodos] = useState<Todo[]>([])
  const [timeline, setTimeline] = useState<TimelineItem[]>([])
  const [guests, setGuests] = useState<Guest[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [invitation, setInvitation] = useState<Invitation | null>(null)
  const loadingRef = useRef(false)

  const addActivity = useCallback(async (action: string, detail: string, color: string) => {
    const activity: Omit<Activity, 'id' | 'timestamp'> = {
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      detail,
      color,
    }
    try {
      const newActivity = await activityApi.create(activity)
      setActivities((prev) => [newActivity, ...prev].slice(0, 50))
    } catch (e) {
      console.error('Failed to add activity:', e)
    }
  }, [currentUser])

  const refreshAll = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    try {
      const [w, t, tl, g, a, inv] = await Promise.all([
        weddingApi.get().catch(() => null),
        todoApi.list().catch(() => []),
        timelineApi.list().catch(() => []),
        guestApi.list().catch(() => []),
        activityApi.list().catch(() => []),
        invitationApi.get().catch(() => null),
      ])
      setWedding(w)
      setTodos(t)
      setTimeline(tl)
      setGuests(g)
      setActivities(a)
      setInvitation(inv)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  useEffect(() => {
    refreshAll()
  }, [refreshAll])

  const addTodo = useCallback(async (title: string, assigneeName?: string) => {
    try {
      const newTodo = await todoApi.create({ title, assigneeName })
      setTodos((prev) => [...prev, newTodo])
      await addActivity('添加待办', `添加了待办：${title}`, '#E8A8B8')
    } catch (e) {
      console.error(e)
    }
  }, [addActivity])

  const toggleTodo = useCallback(async (id: string) => {
    try {
      const todo = todos.find((t) => t.id === id)
      if (!todo) return
      const updated = await todoApi.update(id, { completed: !todo.completed })
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? updated : t))
      )
      await addActivity(
        todo.completed ? '取消完成' : '完成待办',
        `${todo.completed ? '取消完成' : '完成'}了待办：${todo.title}`,
        '#F7E7CE'
      )
    } catch (e) {
      console.error(e)
    }
  }, [todos, addActivity])

  const deleteTodo = useCallback(async (id: string) => {
    try {
      const todo = todos.find((t) => t.id === id)
      await todoApi.delete(id)
      setTodos((prev) => prev.filter((t) => t.id !== id))
      if (todo) {
        await addActivity('删除待办', `删除了待办：${todo.title}`, '#D4C9C0')
      }
    } catch (e) {
      console.error(e)
    }
  }, [todos, addActivity])

  const addTimelineItem = useCallback(async (item: Omit<TimelineItem, 'id' | 'order'>) => {
    try {
      const newItem = await timelineApi.create(item)
      setTimeline((prev) => [...prev, newItem].sort((a, b) => a.order - b.order))
      await addActivity('添加环节', `添加了婚礼环节：${item.title}`, '#F7E7CE')
    } catch (e) {
      console.error(e)
    }
  }, [addActivity])

  const updateTimelineItem = useCallback(async (id: string, data: Partial<TimelineItem>) => {
    try {
      const updated = await timelineApi.update(id, data)
      setTimeline((prev) => prev.map((i) => (i.id === id ? updated : i)))
      if (data.title) {
        await addActivity('更新环节', `更新了环节：${data.title}`, '#E8A8B8')
      }
    } catch (e) {
      console.error(e)
    }
  }, [addActivity])

  const deleteTimelineItem = useCallback(async (id: string) => {
    try {
      const item = timeline.find((i) => i.id === id)
      await timelineApi.delete(id)
      setTimeline((prev) => prev.filter((i) => i.id !== id))
      if (item) {
        await addActivity('删除环节', `删除了环节：${item.title}`, '#D4C9C0')
      }
    } catch (e) {
      console.error(e)
    }
  }, [timeline, addActivity])

  const reorderTimeline = useCallback(async (items: TimelineItem[]) => {
    try {
      const updatedItems = items.map((item, idx) => ({ ...item, order: idx }))
      setTimeline(updatedItems)
      await timelineApi.reorder(updatedItems)
      await addActivity('调整顺序', '调整了婚礼流程顺序', '#F7E7CE')
    } catch (e) {
      console.error(e)
    }
  }, [addActivity])

  const addGuest = useCallback(async (guest: Omit<Guest, 'id' | 'createdAt'>) => {
    try {
      const newGuest = await guestApi.create({
        ...guest,
        addedBy: currentUser.id,
        addedByName: currentUser.name,
      })
      setGuests((prev) => [...prev, newGuest])
      await addActivity('添加宾客', `添加了宾客：${guest.name}${guest.companions > 0 ? `（含${guest.companions}位随行）` : ''}`, '#E8A8B8')
    } catch (e) {
      console.error(e)
    }
  }, [currentUser, addActivity])

  const updateGuest = useCallback(async (id: string, data: Partial<Guest>) => {
    try {
      const updated = await guestApi.update(id, data)
      setGuests((prev) => prev.map((g) => (g.id === id ? updated : g)))
      if (data.name || data.rsvp) {
        const guest = guests.find((g) => g.id === id)
        const rsvpMap: Record<string, string> = { pending: '待确认', confirmed: '已确认', declined: '婉拒' }
        const detail = data.rsvp
          ? `${guest?.name || ''}的RSVP状态更新为${rsvpMap[data.rsvp]}`
          : `更新了宾客信息：${data.name || guest?.name}`
        await addActivity('更新宾客', detail, '#F7E7CE')
      }
    } catch (e) {
      console.error(e)
    }
  }, [guests, addActivity])

  const deleteGuest = useCallback(async (id: string) => {
    try {
      const guest = guests.find((g) => g.id === id)
      await guestApi.delete(id)
      setGuests((prev) => prev.filter((g) => g.id !== id))
      if (guest) {
        await addActivity('删除宾客', `删除了宾客：${guest.name}`, '#D4C9C0')
      }
    } catch (e) {
      console.error(e)
    }
  }, [guests, addActivity])

  const updateInvitation = useCallback(async (data: Partial<Invitation>) => {
    try {
      const updated = await invitationApi.update(data)
      setInvitation(updated)
      await addActivity('更新请柬', '更新了电子请柬内容', '#E8A8B8')
    } catch (e) {
      console.error(e)
    }
  }, [addActivity])

  const updateWedding = useCallback(async (data: Partial<Wedding>) => {
    try {
      const updated = await weddingApi.update(data)
      setWedding(updated)
      await addActivity('更新婚礼信息', '更新了婚礼基本信息', '#F7E7CE')
    } catch (e) {
      console.error(e)
    }
  }, [addActivity])

  return (
    <AppContext.Provider
      value={{
        loading,
        currentUser,
        wedding,
        todos,
        timeline,
        guests,
        activities,
        invitation,
        refreshAll,
        addTodo,
        toggleTodo,
        deleteTodo,
        addTimelineItem,
        updateTimelineItem,
        deleteTimelineItem,
        reorderTimeline,
        addGuest,
        updateGuest,
        deleteGuest,
        updateInvitation,
        addActivity,
        updateWedding,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
