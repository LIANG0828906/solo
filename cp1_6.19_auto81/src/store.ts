import { create } from 'zustand'
import type { AppState, UIComponent, UIComponentProps, Annotation, CanvasState, ToolMode } from './types'

export const useStore = create<AppState>((set) => ({
  components: [],
  selectedId: null,
  canvas: { offsetX: 0, offsetY: 0, scale: 1, isDragging: false },
  annotations: [],
  toolMode: 'select',
  showPropertyPanel: false,
  arrowStart: null,
  isMobile: false,
  inputPanelCollapsed: false,
  selectedAnnotationId: null,

  addComponent: (component: UIComponent) =>
    set((s) => ({ components: [...s.components, component] })),

  addComponents: (components: UIComponent[]) =>
    set((s) => ({ components: [...s.components, ...components] })),

  updateComponent: (id: string, props: Partial<UIComponentProps>) =>
    set((s) => ({
      components: s.components.map((c) =>
        c.id === id ? { ...c, props: { ...c.props, ...props } } : c
      ),
    })),

  removeComponent: (id: string) =>
    set((s) => ({
      components: s.components.filter((c) => c.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
      showPropertyPanel: s.selectedId === id ? false : s.showPropertyPanel,
    })),

  selectComponent: (id: string | null) =>
    set({ selectedId: id, showPropertyPanel: id !== null, selectedAnnotationId: null }),

  setCanvas: (partial: Partial<CanvasState>) =>
    set((s) => ({ canvas: { ...s.canvas, ...partial } })),

  addAnnotation: (annotation: Annotation) =>
    set((s) => ({ annotations: [...s.annotations, annotation] })),

  updateAnnotation: (id: string, updates: Partial<Annotation>) =>
    set((s) => ({
      annotations: s.annotations.map((a) =>
        a.id === id ? { ...a, ...updates } : a
      ),
    })),

  removeAnnotation: (id: string) =>
    set((s) => ({
      annotations: s.annotations.filter((a) => a.id !== id),
      selectedAnnotationId: s.selectedAnnotationId === id ? null : s.selectedAnnotationId,
    })),

  selectAnnotation: (id: string | null) =>
    set({ selectedAnnotationId: id, selectedId: null }),

  setToolMode: (mode: ToolMode) =>
    set({ toolMode: mode, arrowStart: null }),

  setArrowStart: (start: { x: number; y: number } | null) =>
    set({ arrowStart: start }),

  setIsMobile: (v: boolean) => set({ isMobile: v }),

  setInputPanelCollapsed: (v: boolean) => set({ inputPanelCollapsed: v }),
}))
