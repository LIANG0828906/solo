import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Material, Project, AppNotification, Favorite, FilterState, MaterialType } from './types'
import { mockMaterials, mockProjects } from './mockData'

interface AppState {
  materials: Material[]
  projects: Project[]
  notifications: AppNotification[]
  favorites: Favorite[]
  filters: FilterState
  activeTab: 'materials' | 'projects'
  showFavoritesDrawer: boolean
  showPublishMaterial: boolean
  showPublishProject: boolean
  confirmDialog: { show: boolean; materialId: string; message: string } | null
  expandedProjectId: string | null

  setActiveTab: (tab: 'materials' | 'projects') => void
  setShowFavoritesDrawer: (show: boolean) => void
  setShowPublishMaterial: (show: boolean) => void
  setShowPublishProject: (show: boolean) => void
  setConfirmDialog: (dialog: { show: boolean; materialId: string; message: string } | null) => void
  setExpandedProjectId: (id: string | null) => void

  addMaterial: (material: Omit<Material, 'id' | 'createdAt' | 'status'>) => void
  updateMaterialStatus: (id: string, status: Material['status']) => void
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'matchScore'>) => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  addFavorite: (itemId: string, itemType: Favorite['itemType']) => void
  removeFavorite: (itemId: string) => void
  updateFilters: (filters: Partial<FilterState>) => void
  calculateMatchScore: (requiredTypes: MaterialType[]) => number
}

export const useStore = create<AppState>((set, get) => ({
  materials: mockMaterials,
  projects: mockProjects,
  notifications: [],
  favorites: [],
  filters: { materialType: null, color: null, conditionRange: [1, 5] },
  activeTab: 'materials',
  showFavoritesDrawer: false,
  showPublishMaterial: false,
  showPublishProject: false,
  confirmDialog: null,
  expandedProjectId: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setShowFavoritesDrawer: (show) => set({ showFavoritesDrawer: show }),
  setShowPublishMaterial: (show) => set({ showPublishMaterial: show }),
  setShowPublishProject: (show) => set({ showPublishProject: show }),
  setConfirmDialog: (dialog) => set({ confirmDialog: dialog }),
  setExpandedProjectId: (id) => set({ expandedProjectId: id }),

  addMaterial: (material) =>
    set((state) => ({
      materials: [
        {
          ...material,
          id: uuidv4(),
          status: 'available',
          createdAt: Date.now(),
        },
        ...state.materials,
      ],
    })),

  updateMaterialStatus: (id, status) =>
    set((state) => ({
      materials: state.materials.map((m) => (m.id === id ? { ...m, status } : m)),
    })),

  addProject: (project) => {
    const matchScore = get().calculateMatchScore(project.requiredMaterialTypes)
    set((state) => ({
      projects: [
        {
          ...project,
          id: uuidv4(),
          matchScore,
          createdAt: Date.now(),
        },
        ...state.projects,
      ],
    }))
  },

  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: uuidv4(),
          read: false,
          createdAt: Date.now(),
        },
        ...state.notifications,
      ],
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),

  addFavorite: (itemId, itemType) =>
    set((state) => {
      if (state.favorites.some((f) => f.itemId === itemId)) return state
      return {
        favorites: [
          ...state.favorites,
          { id: uuidv4(), itemId, itemType, createdAt: Date.now() },
        ],
      }
    }),

  removeFavorite: (itemId) =>
    set((state) => ({
      favorites: state.favorites.filter((f) => f.itemId !== itemId),
    })),

  updateFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  calculateMatchScore: (requiredTypes) => {
    const materials = get().materials.filter((m) => m.status === 'available')
    if (requiredTypes.length === 0) return 0
    const matchedTypes = requiredTypes.filter((type) =>
      materials.some((m) => m.materialType === type)
    )
    return Math.round((matchedTypes.length / requiredTypes.length) * 100)
  },
}))
