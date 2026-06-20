import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Material, Project, AppNotification, Favorite, FilterState, MaterialType, MaterialStatus } from './types'
import { calculateColorSimilarity } from './types'
import { mockMaterials, mockProjects } from './mockData'

type ConfirmDialog = { show: boolean; materialId: string; message: string } | null

type ReorderParams = { dragId: string; dropId: string }

interface AppState {
  materials: Material[]
  materialOrder: string[]
  projects: Project[]
  notifications: AppNotification[]
  favorites: Favorite[]
  filters: FilterState
  activeTab: 'materials' | 'projects'
  showFavoritesDrawer: boolean
  showPublishMaterial: boolean
  showPublishProject: boolean
  confirmDialog: ConfirmDialog
  expandedProjectId: string | null

  setActiveTab: (tab: 'materials' | 'projects') => void
  setShowFavoritesDrawer: (show: boolean) => void
  setShowPublishMaterial: (show: boolean) => void
  setShowPublishProject: (show: boolean) => void
  setConfirmDialog: (dialog: ConfirmDialog) => void
  setExpandedProjectId: (id: string | null) => void

  addMaterial: (material: Omit<Material, 'id' | 'createdAt' | 'status'>) => void
  updateMaterialStatus: (id: string, status: MaterialStatus) => void
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'matchScore'>) => void
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  addFavorite: (itemId: string, itemType: Favorite['itemType']) => void
  removeFavorite: (itemId: string) => void
  updateFilters: (filters: Partial<FilterState>) => void
  calculateMatchScore: (requiredTypes: MaterialType[]) => number
  reorderMaterials: (params: ReorderParams) => void
  selectFilteredMaterials: (filters: FilterState, materials: Material[]) => Material[]
}

const getDefaultMaterialOrder = (materials: Material[]): string[] => {
  return [...materials]
    .sort((a: Material, b: Material) => b.createdAt - a.createdAt)
    .map((m: Material) => m.id)
}

export const useStore = create<AppState>((set, get) => ({
  materials: mockMaterials,
  materialOrder: getDefaultMaterialOrder(mockMaterials),
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

  setActiveTab: (tab: 'materials' | 'projects'): void => set({ activeTab: tab }),
  setShowFavoritesDrawer: (show: boolean): void => set({ showFavoritesDrawer: show }),
  setShowPublishMaterial: (show: boolean): void => set({ showPublishMaterial: show }),
  setShowPublishProject: (show: boolean): void => set({ showPublishProject: show }),
  setConfirmDialog: (dialog: ConfirmDialog): void => set({ confirmDialog: dialog }),
  setExpandedProjectId: (id: string | null): void => set({ expandedProjectId: id }),

  addMaterial: (material: Omit<Material, 'id' | 'createdAt' | 'status'>): void => {
    const newId: string = uuidv4()
    set((state: AppState) => ({
      materials: [
        {
          ...material,
          id: newId,
          status: 'available',
          createdAt: Date.now(),
        },
        ...state.materials,
      ],
      materialOrder: [newId, ...state.materialOrder],
    }))
  },

  updateMaterialStatus: (id: string, status: MaterialStatus): void =>
    set((state: AppState) => ({
      materials: state.materials.map((m: Material) => (m.id === id ? { ...m, status } : m)),
    })),

  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'matchScore'>): void => {
    const matchScore: number = get().calculateMatchScore(project.requiredMaterialTypes)
    set((state: AppState) => ({
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

  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): void =>
    set((state: AppState) => ({
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

  markNotificationRead: (id: string): void =>
    set((state: AppState) => ({
      notifications: state.notifications.map((n: AppNotification) => (n.id === id ? { ...n, read: true } : n)),
    })),

  addFavorite: (itemId: string, itemType: Favorite['itemType']): void =>
    set((state: AppState) => {
      if (state.favorites.some((f: Favorite) => f.itemId === itemId)) return state
      return {
        favorites: [
          ...state.favorites,
          { id: uuidv4(), itemId, itemType, createdAt: Date.now() },
        ],
      }
    }),

  removeFavorite: (itemId: string): void =>
    set((state: AppState) => ({
      favorites: state.favorites.filter((f: Favorite) => f.itemId !== itemId),
    })),

  updateFilters: (newFilters: Partial<FilterState>): void =>
    set((state: AppState) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  calculateMatchScore: (requiredTypes: MaterialType[]): number => {
    const availableMaterials: Material[] = get().materials.filter((m: Material) => m.status === 'available')
    if (requiredTypes.length === 0) return 0
    const matchedTypes: MaterialType[] = requiredTypes.filter((type: MaterialType) =>
      availableMaterials.some((m: Material) => m.materialType === type)
    )
    return Math.round((matchedTypes.length / requiredTypes.length) * 100)
  },

  reorderMaterials: ({ dragId, dropId }: ReorderParams): void =>
    set((state: AppState) => {
      const order: string[] = state.materialOrder
      const dragIndex: number = order.indexOf(dragId)
      const dropIndex: number = order.indexOf(dropId)
      if (dragIndex === -1 || dropIndex === -1) return state
      const newOrder: string[] = [
        ...order.slice(0, dragIndex),
        ...order.slice(dragIndex + 1),
      ]
      const finalOrder: string[] = [
        ...newOrder.slice(0, dropIndex),
        dragId,
        ...newOrder.slice(dropIndex),
      ]
      return { materialOrder: finalOrder }
    }),

  selectFilteredMaterials: (filters: FilterState, materials: Material[]): Material[] => {
    return materials.filter((m: Material) => {
      if (filters.materialType !== null && m.materialType !== filters.materialType) {
        return false
      }
      if (filters.color !== null && calculateColorSimilarity(m.color, filters.color) < 40) {
        return false
      }
      const [minCondition, maxCondition]: [number, number] = filters.conditionRange
      if (m.condition < minCondition || m.condition > maxCondition) {
        return false
      }
      return true
    })
  },
}))
