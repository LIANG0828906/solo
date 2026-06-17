import { create } from 'zustand'

interface ViewerState {
  currentMolecule: string
  cameraDistance: number
  rotationY: number
  tiltX: number
  showLabels: boolean
  autoRotate: boolean

  setMolecule: (key: string) => void
  setCameraDistance: (d: number) => void
  setRotationY: (r: number) => void
  setTiltX: (t: number) => void
  toggleLabels: () => void
  toggleAutoRotate: () => void
  resetView: () => void
}

export const useViewerStore = create<ViewerState>((set) => ({
  currentMolecule: 'water',
  cameraDistance: 10,
  rotationY: 0,
  tiltX: 0,
  showLabels: true,
  autoRotate: true,

  setMolecule: (key: string) => set({ currentMolecule: key }),
  setCameraDistance: (d: number) => set({ cameraDistance: d }),
  setRotationY: (r: number) => set({ rotationY: r }),
  setTiltX: (t: number) => set({ tiltX: t }),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleAutoRotate: () => set((state) => ({ autoRotate: !state.autoRotate })),
  resetView: () =>
    set({
      cameraDistance: 10,
      rotationY: 0,
      tiltX: 0,
      autoRotate: true
    })
}))
