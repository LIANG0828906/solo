import { create } from 'zustand'
import type { Script, Version, Collaborator } from '@/types'

interface Toast {
  id: string
  message: string
  visible: boolean
}

interface ScriptState {
  script: Script | null
  versions: Version[]
  collaborators: Collaborator[]
  toasts: Toast[]
  sidebarOpen: boolean
  setScript: (script: Script | null) => void
  setVersions: (versions: Version[]) => void
  addVersion: (version: Version) => void
  setCollaborators: (collaborators: Collaborator[]) => void
  addCollaborator: (collaborator: Collaborator) => void
  removeCollaborator: (userId: string) => void
  updateCollaboratorCursor: (userId: string, line: number) => void
  showToast: (message: string) => void
  hideToast: (id: string) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const useScriptStore = create<ScriptState>((set) => ({
  script: null,
  versions: [],
  collaborators: [],
  toasts: [],
  sidebarOpen: false,

  setScript: (script) => set({ script }),
  setVersions: (versions) => set({ versions }),
  addVersion: (version) =>
    set((state) => ({
      versions: [version, ...state.versions],
    })),
  setCollaborators: (collaborators) => set({ collaborators }),
  addCollaborator: (collaborator) =>
    set((state) => {
      const exists = state.collaborators.find((c) => c.id === collaborator.id)
      if (exists) return state
      return { collaborators: [...state.collaborators, collaborator] }
    }),
  removeCollaborator: (userId) =>
    set((state) => ({
      collaborators: state.collaborators.filter((c) => c.id !== userId),
    })),
  updateCollaboratorCursor: (userId, line) =>
    set((state) => ({
      collaborators: state.collaborators.map((c) =>
        c.id === userId ? { ...c, currentLine: line } : c
      ),
    })),
  showToast: (message) => {
    const id = generateId()
    set((state) => ({
      toasts: [...state.toasts, { id, message, visible: true }],
    }))
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.map((t) =>
          t.id === id ? { ...t, visible: false } : t
        ),
      }))
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }))
      }, 500)
    }, 3000)
  },
  hideToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
