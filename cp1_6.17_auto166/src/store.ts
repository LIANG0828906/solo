import { create } from 'zustand'

export interface Comment {
  id: string
  author: string
  content: string
  createdAt: string
}

export interface Work {
  id: string
  title: string
  imageUrl: string
  shootDate: string
  cameraParams: string
  tags: string[]
  likes: number
  liked: boolean
  comments: Comment[]
  createdAt: string
}

export interface Exhibition {
  id: string
  name: string
  workIds: string[]
  createdAt: string
}

interface AppState {
  works: Work[]
  exhibitions: Exhibition[]
  selectedWorks: string[]
  editingWork: Work | null
  filterTag: string
  sortOrder: 'date' | 'date-asc' | ''
  sidebarOpen: boolean
  commentPanelWorkId: string | null

  setWorks: (works: Work[]) => void
  addWork: (work: Work) => void
  updateWork: (id: string, updates: Partial<Work>) => void
  removeWork: (id: string) => void
  toggleWorkLike: (id: string, liked: boolean) => void
  addComment: (workId: string, comment: Comment) => void

  setExhibitions: (exhibitions: Exhibition[]) => void
  addExhibition: (exhibition: Exhibition) => void

  toggleSelectedWork: (id: string) => void
  clearSelectedWorks: () => void

  setEditingWork: (work: Work | null) => void
  setFilterTag: (tag: string) => void
  setSortOrder: (order: 'date' | 'date-asc' | '') => void
  setSidebarOpen: (open: boolean) => void
  setCommentPanelWorkId: (id: string | null) => void
}

export const useStore = create<AppState>((set) => ({
  works: [],
  exhibitions: [],
  selectedWorks: [],
  editingWork: null,
  filterTag: '',
  sortOrder: '',
  sidebarOpen: false,
  commentPanelWorkId: null,

  setWorks: (works) => set({ works }),
  addWork: (work) => set((state) => ({ works: [...state.works, work] })),
  updateWork: (id, updates) =>
    set((state) => ({
      works: state.works.map((w) => (w.id === id ? { ...w, ...updates } : w)),
    })),
  removeWork: (id) =>
    set((state) => ({
      works: state.works.filter((w) => w.id !== id),
      selectedWorks: state.selectedWorks.filter((sid) => sid !== id),
    })),
  toggleWorkLike: (id, liked) =>
    set((state) => ({
      works: state.works.map((w) =>
        w.id === id
          ? { ...w, liked, likes: liked ? w.likes + 1 : Math.max(0, w.likes - 1) }
          : w
      ),
    })),
  addComment: (workId, comment) =>
    set((state) => ({
      works: state.works.map((w) =>
        w.id === workId ? { ...w, comments: [...w.comments, comment] } : w
      ),
    })),

  setExhibitions: (exhibitions) => set({ exhibitions }),
  addExhibition: (exhibition) =>
    set((state) => ({ exhibitions: [...state.exhibitions, exhibition] })),

  toggleSelectedWork: (id) =>
    set((state) => ({
      selectedWorks: state.selectedWorks.includes(id)
        ? state.selectedWorks.filter((sid) => sid !== id)
        : [...state.selectedWorks, id],
    })),
  clearSelectedWorks: () => set({ selectedWorks: [] }),

  setEditingWork: (work) => set({ editingWork: work }),
  setFilterTag: (tag) => set({ filterTag: tag }),
  setSortOrder: (order) => set({ sortOrder: order }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setCommentPanelWorkId: (id) => set({ commentPanelWorkId: id }),
}))
