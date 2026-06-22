import { create } from 'zustand'
import type { CanvasComponent, ComponentStyle, ToastMessage, ToastType, ComponentType } from '@/types'
import { componentDefaults, defaultStyle } from '@/types'

interface StoreState {
  components: CanvasComponent[]
  selectedId: string | null
  toasts: ToastMessage[]
  templateModal: boolean
  loadProjectModal: boolean

  addComponent: (type: ComponentType, x: number, y: number) => string
  removeComponent: (id: string) => void
  updateComponent: (id: string, updates: Partial<CanvasComponent>) => void
  updateComponentStyle: (id: string, styleUpdates: Partial<ComponentStyle>) => void
  selectComponent: (id: string | null) => void
  clearComponents: () => void
  setComponents: (components: CanvasComponent[]) => void
  bringToFront: (id: string) => void

  addToast: (message: string, type?: ToastType) => void
  removeToast: (id: string) => void

  setTemplateModal: (open: boolean) => void
  setLoadProjectModal: (open: boolean) => void
}

let nextZIndex = 1

function generateId(): string {
  return `comp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generateToastId(): string {
  return `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export const useStore = create<StoreState>((set, get) => ({
  components: [],
  selectedId: null,
  toasts: [],
  templateModal: false,
  loadProjectModal: false,

  addComponent: (type, x, y) => {
    const id = generateId()
    const defaults = componentDefaults[type]
    const newComponent: CanvasComponent = {
      id,
      type,
      x,
      y,
      width: defaults.width ?? 100,
      height: defaults.height ?? 100,
      zIndex: nextZIndex++,
      style: {
        ...defaultStyle,
        ...(defaults.style ?? {}),
      },
      content: defaults.content,
      src: defaults.src,
      placeholder: defaults.placeholder,
      children: [],
    }
    set(state => ({
      components: [...state.components, newComponent],
      selectedId: id,
    }))
    return id
  },

  removeComponent: (id) => {
    set(state => ({
      components: state.components.filter(c => c.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }))
  },

  updateComponent: (id, updates) => {
    set(state => ({
      components: state.components.map(c =>
        c.id === id ? { ...c, ...updates } : c
      ),
    }))
  },

  updateComponentStyle: (id, styleUpdates) => {
    set(state => ({
      components: state.components.map(c =>
        c.id === id
          ? { ...c, style: { ...c.style, ...styleUpdates } }
          : c
      ),
    }))
  },

  selectComponent: (id) => {
    set({ selectedId: id })
    if (id) {
      get().bringToFront(id)
    }
  },

  clearComponents: () => {
    nextZIndex = 1
    set({ components: [], selectedId: null })
  },

  setComponents: (components) => {
    const maxZ = components.reduce((max, c) => Math.max(max, c.zIndex), 0)
    nextZIndex = maxZ + 1
    set({ components, selectedId: null })
  },

  bringToFront: (id) => {
    set(state => {
      const hasComponent = state.components.some(c => c.id === id)
      if (!hasComponent) return {}
      const newZ = nextZIndex++
      return {
        components: state.components.map(c =>
          c.id === id ? { ...c, zIndex: newZ } : c
        ),
      }
    })
  },

  addToast: (message, type = 'info') => {
    const id = generateToastId()
    const toast: ToastMessage = { id, message, type }
    set(state => ({ toasts: [...state.toasts, toast] }))
    setTimeout(() => {
      get().removeToast(id)
    }, 1500)
  },

  removeToast: (id) => {
    set(state => ({
      toasts: state.toasts.filter(t => t.id !== id),
    }))
  },

  setTemplateModal: (open) => {
    set({ templateModal: open })
  },

  setLoadProjectModal: (open) => {
    set({ loadProjectModal: open })
  },
}))
