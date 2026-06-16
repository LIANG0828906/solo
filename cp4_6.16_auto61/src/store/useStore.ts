import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { formatISO } from 'date-fns'
import {
  AppStore,
  Exhibition,
  Artwork,
  ArtworkStatus,
  Milestone,
  Task,
  TransferType,
  TransferRecord
} from '../types'
import { dbGet, dbSet, initializeSampleData } from '../utils/db'

const useStore = create<AppStore>((set, get) => ({
  exhibitions: [],
  artworks: [],
  selectedExhibitionId: null,
  selectedArtworkId: null,

  addExhibition: (exhibition) => {
    const newExhibition: Exhibition = {
      ...exhibition,
      id: uuidv4(),
      createdAt: formatISO(new Date())
    }
    const exhibitions = [...get().exhibitions, newExhibition]
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  updateExhibition: (id, updates) => {
    const exhibitions = get().exhibitions.map(e =>
      e.id === id ? { ...e, ...updates } : e
    )
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  deleteExhibition: (id) => {
    const exhibitions = get().exhibitions.filter(e => e.id !== id)
    set({
      exhibitions,
      selectedExhibitionId: get().selectedExhibitionId === id ? null : get().selectedExhibitionId
    })
    dbSet('exhibitions', exhibitions)
  },

  selectExhibition: (id) => set({ selectedExhibitionId: id }),

  addMilestone: (exhibitionId, milestone) => {
    const newMilestone: Milestone = {
      ...milestone,
      id: uuidv4(),
      tasks: []
    }
    const exhibitions = get().exhibitions.map(e =>
      e.id === exhibitionId
        ? { ...e, milestones: [...e.milestones, newMilestone] }
        : e
    )
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  updateMilestone: (exhibitionId, milestoneId, updates) => {
    const exhibitions = get().exhibitions.map(e =>
      e.id === exhibitionId
        ? {
            ...e,
            milestones: e.milestones.map(m =>
              m.id === milestoneId ? { ...m, ...updates } : m
            )
          }
        : e
    )
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  deleteMilestone: (exhibitionId, milestoneId) => {
    const exhibitions = get().exhibitions.map(e =>
      e.id === exhibitionId
        ? { ...e, milestones: e.milestones.filter(m => m.id !== milestoneId) }
        : e
    )
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  reorderMilestones: (exhibitionId, milestoneIds) => {
    const exhibitions = get().exhibitions.map(e => {
      if (e.id !== exhibitionId) return e
      const reordered = milestoneIds
        .map(id => e.milestones.find(m => m.id === id))
        .filter(Boolean) as Milestone[]
      return { ...e, milestones: reordered }
    })
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  addTask: (exhibitionId, milestoneId, title) => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      completed: false,
      order: 0
    }
    const exhibitions = get().exhibitions.map(e => {
      if (e.id !== exhibitionId) return e
      return {
        ...e,
        milestones: e.milestones.map(m => {
          if (m.id !== milestoneId) return m
          newTask.order = m.tasks.length
          return { ...m, tasks: [...m.tasks, newTask] }
        })
      }
    })
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  toggleTask: (exhibitionId, milestoneId, taskId) => {
    const exhibitions = get().exhibitions.map(e => {
      if (e.id !== exhibitionId) return e
      return {
        ...e,
        milestones: e.milestones.map(m => {
          if (m.id !== milestoneId) return m
          return {
            ...m,
            tasks: m.tasks.map(t =>
              t.id === taskId ? { ...t, completed: !t.completed } : t
            )
          }
        })
      }
    })
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  updateTask: (exhibitionId, milestoneId, taskId, updates) => {
    const exhibitions = get().exhibitions.map(e => {
      if (e.id !== exhibitionId) return e
      return {
        ...e,
        milestones: e.milestones.map(m => {
          if (m.id !== milestoneId) return m
          return {
            ...m,
            tasks: m.tasks.map(t =>
              t.id === taskId ? { ...t, ...updates } : t
            )
          }
        })
      }
    })
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  deleteTask: (exhibitionId, milestoneId, taskId) => {
    const exhibitions = get().exhibitions.map(e => {
      if (e.id !== exhibitionId) return e
      return {
        ...e,
        milestones: e.milestones.map(m => {
          if (m.id !== milestoneId) return m
          return { ...m, tasks: m.tasks.filter(t => t.id !== taskId) }
        })
      }
    })
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  reorderTasks: (exhibitionId, milestoneId, taskIds) => {
    const exhibitions = get().exhibitions.map(e => {
      if (e.id !== exhibitionId) return e
      return {
        ...e,
        milestones: e.milestones.map(m => {
          if (m.id !== milestoneId) return m
          const reordered = taskIds
            .map(id => m.tasks.find(t => t.id === id))
            .filter(Boolean) as Task[]
          return { ...m, tasks: reordered.map((t, i) => ({ ...t, order: i })) }
        })
      }
    })
    set({ exhibitions })
    dbSet('exhibitions', exhibitions)
  },

  addArtwork: (artwork) => {
    const newArtwork: Artwork = {
      ...artwork,
      id: uuidv4(),
      transferRecords: [],
      createdAt: formatISO(new Date())
    }
    const artworks = [...get().artworks, newArtwork]
    set({ artworks })
    dbSet('artworks', artworks)
  },

  updateArtwork: (id, updates) => {
    const artworks = get().artworks.map(a =>
      a.id === id ? { ...a, ...updates } : a
    )
    set({ artworks })
    dbSet('artworks', artworks)
  },

  deleteArtwork: (id) => {
    const artworks = get().artworks.filter(a => a.id !== id)
    set({
      artworks,
      selectedArtworkId: get().selectedArtworkId === id ? null : get().selectedArtworkId
    })
    dbSet('artworks', artworks)
  },

  selectArtwork: (id) => set({ selectedArtworkId: id }),

  lendArtwork: (artworkId, record) => {
    const lendRecord: TransferRecord = {
      ...record,
      id: uuidv4(),
      artworkId,
      type: TransferType.LEND,
      returned: false
    }
    const artworks = get().artworks.map(a =>
      a.id === artworkId
        ? {
            ...a,
            status: ArtworkStatus.LENT_OUT,
            transferRecords: [...a.transferRecords, lendRecord]
          }
        : a
    )
    set({ artworks })
    dbSet('artworks', artworks)
  },

  returnArtwork: (artworkId, transferId, notes) => {
    const artworks = get().artworks.map(a => {
      if (a.id !== artworkId) return a
      const updatedRecords = a.transferRecords.map(r =>
        r.id === transferId ? { ...r, returned: true } : r
      )
      const returnRecord: TransferRecord = {
        id: uuidv4(),
        artworkId,
        type: TransferType.RETURN,
        date: formatISO(new Date()),
        institution: updatedRecords.find(r => r.id === transferId)?.institution,
        notes,
        returned: true
      }
      return {
        ...a,
        status: ArtworkStatus.IN_STOCK,
        transferRecords: [...updatedRecords, returnRecord]
      }
    })
    set({ artworks })
    dbSet('artworks', artworks)
  },

  exportData: () => {
    const { exhibitions, artworks } = get()
    return JSON.stringify(
      { exhibitions, artworks, exportedAt: formatISO(new Date()) },
      null,
      2
    )
  }
}))

export const initializeStore = async (): Promise<void> => {
  await initializeSampleData()
  const exhibitions = await dbGet<Exhibition[]>('exhibitions')
  const artworks = await dbGet<Artwork[]>('artworks')
  useStore.setState({
    exhibitions: exhibitions || [],
    artworks: artworks || []
  })
}

export default useStore
