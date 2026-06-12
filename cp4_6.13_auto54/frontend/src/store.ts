import { create } from 'zustand'
import type { Pet, Notice, User, PetType, ActionType } from './types'

interface AppState {
  user: User | null
  currentPet: Pet | null
  adoptablePets: Pet[]
  notices: Notice[]
  loading: boolean
  modalPet: Pet | null
  showAdoptModal: boolean
  selectedNotice: Notice | null
  noticeFilter: PetType | 'all'

  initUser: () => Promise<void>
  fetchAdoptablePets: () => Promise<void>
  fetchMyPets: () => Promise<void>
  fetchNotices: (filter?: PetType | 'all') => Promise<void>
  adoptPet: (petId: string) => Promise<void>
  performAction: (petId: string, action: ActionType) => Promise<void>
  setModalPet: (pet: Pet | null) => void
  setShowAdoptModal: (show: boolean) => void
  setSelectedNotice: (notice: Notice | null) => void
  setNoticeFilter: (f: PetType | 'all') => void
  decayPet: (petId: string) => Promise<boolean>
}

const API_BASE = '/api'
const USER_KEY = 'pixel_pet_user'

function storeUserLocal(u: User): void {
  try { localStorage.setItem(USER_KEY, JSON.stringify(u)) } catch (e) { /* noop */ }
}
function loadUserLocal(): User | null {
  try {
    const s = localStorage.getItem(USER_KEY)
    return s ? JSON.parse(s) : null
  } catch { return null }
}

export const useAppStore = create<AppState>((set, get) => ({
  user: loadUserLocal(),
  currentPet: null,
  adoptablePets: [],
  notices: [],
  loading: false,
  modalPet: null,
  showAdoptModal: false,
  selectedNotice: null,
  noticeFilter: 'all',

  initUser: async () => {
    if (get().user) return
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/user/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const user: User = await res.json()
      storeUserLocal(user)
      set({ user, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchAdoptablePets: async () => {
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/pets/random`)
      const pets: Pet[] = await res.json()
      set({ adoptablePets: pets, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchMyPets: async () => {
    const { user } = get()
    if (!user) return
    set({ loading: true })
    try {
      const res = await fetch(`${API_BASE}/pets/mine?userId=${encodeURIComponent(user.id)}`)
      const pets: Pet[] = await res.json()
      const active = pets.find(p => !p.lost) || pets[0] || null
      set({ currentPet: active, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  fetchNotices: async (filter) => {
    const f = filter ?? get().noticeFilter
    set({ loading: true, noticeFilter: f })
    try {
      const url = f === 'all' ? `${API_BASE}/notices` : `${API_BASE}/notices?type=${f}`
      const res = await fetch(url)
      const notices: Notice[] = await res.json()
      set({ notices, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  adoptPet: async (petId) => {
    const { user } = get()
    if (!user) return
    try {
      const res = await fetch(`${API_BASE}/pets/adopt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ petId, userId: user.id }),
      })
      const pet: Pet = await res.json()
      set(state => ({
        adoptablePets: state.adoptablePets.filter(p => p.id !== petId),
        currentPet: state.currentPet || pet,
        showAdoptModal: false,
        modalPet: null,
      }))
    } catch { /* noop */ }
  },

  performAction: async (petId, action) => {
    try {
      const res = await fetch(`${API_BASE}/pets/${petId}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const pet: Pet = await res.json()
      set({ currentPet: pet })
    } catch { /* noop */ }
  },

  decayPet: async (petId) => {
    try {
      const res = await fetch(`${API_BASE}/pets/${petId}/decay`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      set({ currentPet: data })
      if (data.noticeCreated) {
        await get().fetchNotices()
        return true
      }
    } catch { /* noop */ }
    return false
  },

  setModalPet: (pet) => set({ modalPet: pet }),
  setShowAdoptModal: (show) => set({ showAdoptModal: show }),
  setSelectedNotice: (notice) => set({ selectedNotice: notice }),
  setNoticeFilter: (f) => {
    set({ noticeFilter: f })
    get().fetchNotices(f)
  },
}))
