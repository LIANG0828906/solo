import { create } from 'zustand'
import type { Component, Template } from '../types'

interface CanvasOffset {
  x: number
  y: number
}

interface DesignState {
  components: Component[]
  selectedId: string | null
  canvasScale: number
  canvasOffset: CanvasOffset
  templates: Template[]
  leftPanelOpen: boolean
  rightPanelOpen: boolean

  addComponent: (component: Component) => void
  updateComponent: (id: string, updates: Partial<Component>) => void
  removeComponent: (id: string) => void
  selectComponent: (id: string | null) => void
  moveComponent: (id: string, x: number, y: number) => void
  setCanvasScale: (scale: number) => void
  setCanvasOffset: (offset: CanvasOffset) => void
  adjustZIndex: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void
  setTemplates: (templates: Template[]) => void
  loadTemplate: (template: Template) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
}

export const useDesignStore = create<DesignState>((set, get) => ({
  components: [],
  selectedId: null,
  canvasScale: 1,
  canvasOffset: { x: 0, y: 0 },
  templates: [],
  leftPanelOpen: true,
  rightPanelOpen: true,

  addComponent: (component) =>
    set((state) => ({
      components: [...state.components, component],
    })),

  updateComponent: (id, updates) =>
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? ({ ...c, ...updates } as Component) : c
      ),
    })),

  removeComponent: (id) =>
    set((state) => ({
      components: state.components.filter((c) => c.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),

  selectComponent: (id) =>
    set(() => ({
      selectedId: id,
    })),

  moveComponent: (id, x, y) =>
    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, x, y } : c
      ),
    })),

  setCanvasScale: (scale) =>
    set(() => ({
      canvasScale: scale,
    })),

  setCanvasOffset: (offset) =>
    set(() => ({
      canvasOffset: offset,
    })),

  adjustZIndex: (id, direction) => {
    const { components } = get()
    const index = components.findIndex((c) => c.id === id)
    if (index === -1) return

    const sorted = [...components].sort((a, b) => a.zIndex - b.zIndex)
    const sortedIndex = sorted.findIndex((c) => c.id === id)

    let newZIndex: number
    switch (direction) {
      case 'up':
        newZIndex = sortedIndex < sorted.length - 1 ? sorted[sortedIndex + 1].zIndex + 1 : components[index].zIndex
        break
      case 'down':
        newZIndex = sortedIndex > 0 ? sorted[sortedIndex - 1].zIndex - 1 : components[index].zIndex
        break
      case 'top':
        newZIndex = sorted.length > 0 ? sorted[sorted.length - 1].zIndex + 1 : 1
        break
      case 'bottom':
        newZIndex = sorted.length > 0 ? sorted[0].zIndex - 1 : 1
        break
      default:
        return
    }

    set((state) => ({
      components: state.components.map((c) =>
        c.id === id ? { ...c, zIndex: newZIndex } : c
      ),
    }))
  },

  setTemplates: (templates) =>
    set(() => ({
      templates,
    })),

  loadTemplate: (template) =>
    set(() => ({
      components: [...template.components],
      selectedId: null,
    })),

  toggleLeftPanel: () =>
    set((state) => ({
      leftPanelOpen: !state.leftPanelOpen,
    })),

  toggleRightPanel: () =>
    set((state) => ({
      rightPanelOpen: !state.rightPanelOpen,
    })),
}))
