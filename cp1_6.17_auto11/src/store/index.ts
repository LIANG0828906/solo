import { create } from 'zustand'

export const AUTO_ROTATE_SPEED = 0.005

export const ELEMENTS = ['C', 'O', 'N', 'H'] as const

export const ELEMENT_LABELS: Record<string, string> = {
  C: '碳 (C)',
  O: '氧 (O)',
  N: '氮 (N)',
  H: '氢 (H)'
}

export const ELEMENT_COLORS: Record<string, string> = {
  C: '#555555',
  O: '#ff0d0d',
  N: '#3050f8',
  H: '#ffffff'
}

export const LABEL_COLOR_PRESETS = [
  { name: '白色', value: '#ffffff' },
  { name: '黄色', value: '#ffeb3b' },
  { name: '青色', value: '#00e5ff' },
  { name: '绿色', value: '#69f0ae' },
  { name: '粉色', value: '#ff80ab' }
]

interface ViewerState {
  currentMolecule: string
  cameraDistance: number
  rotationY: number
  tiltX: number
  autoRotate: boolean
  labelVisibility: Record<string, boolean>
  labelFontSize: number
  labelColor: string

  setMolecule: (key: string) => void
  setCameraDistance: (d: number) => void
  setRotationY: (r: number) => void
  setTiltX: (t: number) => void
  toggleAutoRotate: () => void
  setLabelVisibility: (element: string, visible: boolean) => void
  setLabelFontSize: (size: number) => void
  setLabelColor: (color: string) => void
  toggleAllLabels: (visible: boolean) => void
  resetView: () => void
}

export const useViewerStore = create<ViewerState>((set) => ({
  currentMolecule: 'water',
  cameraDistance: 10,
  rotationY: 0,
  tiltX: 0,
  autoRotate: true,
  labelVisibility: {
    C: true,
    O: true,
    N: true,
    H: true
  },
  labelFontSize: 16,
  labelColor: '#ffffff',

  setMolecule: (key: string) => set({ currentMolecule: key }),
  setCameraDistance: (d: number) => set({ cameraDistance: d }),
  setRotationY: (r: number) => set({ rotationY: r }),
  setTiltX: (t: number) => set({ tiltX: t }),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  setLabelVisibility: (element: string, visible: boolean) =>
    set((state) => ({
      labelVisibility: {
        ...state.labelVisibility,
        [element]: visible
      }
    })),
  setLabelFontSize: (size: number) => set({ labelFontSize: size }),
  setLabelColor: (color: string) => set({ labelColor: color }),
  toggleAllLabels: (visible: boolean) =>
    set((state) => {
      const newVisibility: Record<string, boolean> = {}
      for (const el of Object.keys(state.labelVisibility)) {
        newVisibility[el] = visible
      }
      return { labelVisibility: newVisibility }
    }),
  resetView: () =>
    set({
      cameraDistance: 10,
      rotationY: 0,
      tiltX: 0,
      autoRotate: true
    })
}))
