import { create } from 'zustand'
import { BookList, booklistAPI, recommendAPI } from '../api'

interface BookState {
  myBooklists: BookList[]
  publicBooklists: BookList[]
  recommendations: BookList[]
  currentBooklist: BookList | null
  fetchMyBooklists: () => Promise<void>
  fetchPublicBooklists: () => Promise<void>
  fetchRecommendations: () => Promise<void>
  fetchBooklist: (id: number) => Promise<void>
  createBooklist: (data: { name: string; description: string; cover_color: string; is_public: boolean }) => Promise<BookList>
  addBook: (booklistId: number, data: { title: string; author: string; cover_url?: string; tags?: string; progress?: number; notes?: string }) => Promise<void>
  updateBookProgress: (booklistId: number, bookId: number, progress: number, notes?: string) => Promise<void>
  cloneBooklist: (id: number) => Promise<BookList>
}

export const useBookStore = create<BookState>((set, get) => ({
  myBooklists: [],
  publicBooklists: [],
  recommendations: [],
  currentBooklist: null,

  fetchMyBooklists: async () => {
    const data = await booklistAPI.getMy()
    set({ myBooklists: data })
  },

  fetchPublicBooklists: async () => {
    const data = await booklistAPI.getPublic()
    set({ publicBooklists: data })
  },

  fetchRecommendations: async () => {
    try {
      const data = await recommendAPI.getRecommendations()
      set({ recommendations: data })
    } catch {
      set({ recommendations: [] })
    }
  },

  fetchBooklist: async (id: number) => {
    const data = await booklistAPI.getById(id)
    set({ currentBooklist: data })
  },

  createBooklist: async (data) => {
    const bl = await booklistAPI.create(data)
    set({ myBooklists: [bl, ...get().myBooklists] })
    return bl
  },

  addBook: async (booklistId, data) => {
    await booklistAPI.addBook(booklistId, data)
    await get().fetchBooklist(booklistId)
    await get().fetchMyBooklists()
  },

  updateBookProgress: async (booklistId, bookId, progress, notes) => {
    await booklistAPI.updateBook(booklistId, bookId, { progress, notes })
    await get().fetchBooklist(booklistId)
  },

  cloneBooklist: async (id) => {
    const bl = await booklistAPI.clone(id)
    set({ myBooklists: [bl, ...get().myBooklists] })
    return bl
  },
}))
