import { v4 as uuidv4 } from 'uuid'

export type LensType = 'convex' | 'concave' | 'doublet'

export interface OpticalSurface {
  id: string
  lensId: string
  curvatureRadius: number
  thickness: number
  refractiveIndex: number
  positionZ: number
  aperture: number
  isFirst: boolean
  isLast: boolean
}

export interface Lens {
  id: string
  type: LensType
  positionZ: number
  aperture: number
  surfaces: OpticalSurface[]
}

interface LensStore {
  lenses: Lens[]
  setLenses: (lenses: Lens[]) => void
  addLens: (lens: Lens) => void
  removeLens: (id: string) => void
  updateLens: (id: string, updates: Partial<Lens>) => void
}

let lensStore: LensStore | null = null

export function registerStore(store: LensStore) {
  lensStore = store
}

function ensureStore(): LensStore {
  if (!lensStore) {
    throw new Error('Lens store not registered')
  }
  return lensStore
}

const DEFAULT_SURFACE_PARAMS: Record<LensType, Array<Partial<OpticalSurface>>> = {
  convex: [
    { curvatureRadius: 50, thickness: 8, refractiveIndex: 1.5 },
    { curvatureRadius: -50, thickness: 0, refractiveIndex: 1.0 }
  ],
  concave: [
    { curvatureRadius: -50, thickness: 8, refractiveIndex: 1.5 },
    { curvatureRadius: 50, thickness: 0, refractiveIndex: 1.0 }
  ],
  doublet: [
    { curvatureRadius: 40, thickness: 6, refractiveIndex: 1.52 },
    { curvatureRadius: -25, thickness: 4, refractiveIndex: 1.65 },
    { curvatureRadius: -60, thickness: 0, refractiveIndex: 1.0 }
  ]
}

const DEFAULT_APERTURE: Record<LensType, number> = {
  convex: 30,
  concave: 30,
  doublet: 35
}

export function createLens(type: LensType, positionZ: number): Lens {
  const lensId = uuidv4()
  const aperture = DEFAULT_APERTURE[type]
  const surfaceTemplates = DEFAULT_SURFACE_PARAMS[type]

  let accumulatedZ = positionZ
  const surfaces: OpticalSurface[] = surfaceTemplates.map((tpl, idx) => {
    const surface: OpticalSurface = {
      id: uuidv4(),
      lensId,
      curvatureRadius: tpl.curvatureRadius!,
      thickness: tpl.thickness!,
      refractiveIndex: tpl.refractiveIndex!,
      positionZ: accumulatedZ,
      aperture,
      isFirst: idx === 0,
      isLast: idx === surfaceTemplates.length - 1
    }
    accumulatedZ += tpl.thickness!
    return surface
  })

  return {
    id: lensId,
    type,
    positionZ,
    aperture,
    surfaces
  }
}

export function validateLensParams(surface: Partial<OpticalSurface>): boolean {
  if (surface.curvatureRadius !== undefined) {
    if (surface.curvatureRadius === 0) return false
    if (Math.abs(surface.curvatureRadius) > 100) return false
  }
  if (surface.thickness !== undefined) {
    if (surface.thickness < 1 || surface.thickness > 20) return false
  }
  if (surface.refractiveIndex !== undefined) {
    if (surface.refractiveIndex < 1.4 || surface.refractiveIndex > 2.0) return false
  }
  return true
}

const MIN_LENS_GAP = 15
const LENS_SPACING = 25

export function recalculateLensPositions(lenses: Lens[]): Lens[] {
  if (lenses.length === 0) return []

  const sorted = [...lenses].sort((a, b) => a.positionZ - b.positionZ)
  let currentZ = 0

  return sorted.map((lens) => {
    const totalThickness = lens.surfaces.reduce((sum, s) => sum + s.thickness, 0)
    const newPositionZ = currentZ

    let accumulatedZ = newPositionZ
    const newSurfaces = lens.surfaces.map((s) => {
      const updated = { ...s, positionZ: accumulatedZ }
      accumulatedZ += s.thickness
      return updated
    })

    currentZ = newPositionZ + totalThickness + (lens.type === 'doublet' ? LENS_SPACING : MIN_LENS_GAP)

    return {
      ...lens,
      positionZ: newPositionZ,
      surfaces: newSurfaces
    }
  })
}

export function getOpticalSurfaces(lenses: Lens[]): OpticalSurface[] {
  return lenses
    .sort((a, b) => a.positionZ - b.positionZ)
    .flatMap((lens) => lens.surfaces)
}

export function addLensToStore(type: LensType, positionZ?: number) {
  const store = ensureStore()
  const existingLenses = store.lenses
  const newPositionZ = positionZ ?? calculateNextPosition(existingLenses)
  const newLens = createLens(type, newPositionZ)
  const updated = recalculateLensPositions([...existingLenses, newLens])
  store.setLenses(updated)
  return newLens
}

export function removeLensFromStore(id: string) {
  const store = ensureStore()
  const filtered = store.lenses.filter((l) => l.id !== id)
  const recalculated = recalculateLensPositions(filtered)
  store.setLenses(recalculated)
}

export function updateLensInStore(id: string, updates: Partial<Lens>) {
  const store = ensureStore()
  const updated = store.lenses.map((lens) => {
    if (lens.id !== id) return lens
    return { ...lens, ...updates }
  })
  const recalculated = recalculateLensPositions(updated)
  store.setLenses(recalculated)
}

export function updateSurfaceInStore(lensId: string, surfaceId: string, updates: Partial<OpticalSurface>) {
  if (!validateLensParams(updates)) {
    throw new Error('Invalid lens parameters')
  }
  const store = ensureStore()
  const updated = store.lenses.map((lens) => {
    if (lens.id !== lensId) return lens
    const newSurfaces = lens.surfaces.map((s) =>
      s.id === surfaceId ? { ...s, ...updates } : s
    )
    return { ...lens, surfaces: newSurfaces }
  })
  const recalculated = recalculateLensPositions(updated)
  store.setLenses(recalculated)
}

function calculateNextPosition(lenses: Lens[]): number {
  if (lenses.length === 0) return 0
  const lastLens = lenses.reduce((prev, curr) =>
    prev.positionZ > curr.positionZ ? prev : curr
  )
  const totalThickness = lastLens.surfaces.reduce((sum, s) => sum + s.thickness, 0)
  return lastLens.positionZ + totalThickness + MIN_LENS_GAP
}
