import { create } from 'zustand'
import type { Season } from '../engine/starMapEngine'
import type { Constellation, Node, DrawingState } from '../engine/constellationEngine'
import {
  createInitialDrawingState,
  createConstellation,
  snapToStar,
  createNode,
  resetCounter,
  setCounter,
  THEME_COLORS,
} from '../engine/constellationEngine'
import type { StarPoint } from '../engine/starMapEngine'

interface SerializedData {
  season: Season
  constellations: Constellation[]
  counter: number
}

interface UserStore {
  viewport: {
    width: number
    height: number
    centerX: number
    centerY: number
    zoom: number
  }
  season: Season
  constellations: Constellation[]
  selectedConstellationId: string | null
  drawingState: DrawingState
  shareLink: string | null
  shareCopied: boolean
  transitionOpacity: number
  showMobilePanel: boolean
  panelDragOffset: number

  setViewport: (w: number, h: number) => void
  setSeason: (s: Season) => void
  startDrawing: (x: number, y: number, stars: StarPoint[]) => void
  updateDrawing: (x: number, y: number) => void
  endDrawing: (stars: StarPoint[]) => void
  addManualNode: (x: number, y: number, stars: StarPoint[]) => void
  updateHoveredStar: (starId: string | null) => void
  addConstellation: (c: Constellation) => void
  deleteConstellation: (id: string) => void
  selectConstellation: (id: string | null) => void
  generateShareLink: () => string
  loadFromHash: (hash: string) => boolean
  clearShareState: () => void
  setTransitionOpacity: (o: number) => void
  setShowMobilePanel: (v: boolean) => void
  setPanelDragOffset: (v: number) => void
}

function encodeToBase64(obj: SerializedData): string {
  const json = JSON.stringify(obj)
  const bytes = new TextEncoder().encode(json)
  let binary = ''
  bytes.forEach((b) => (binary += String.fromCharCode(b)))
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function decodeFromBase64(str: string): SerializedData | null {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) base64 += '='
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    const json = new TextDecoder().decode(bytes)
    return JSON.parse(json)
  } catch {
    return null
  }
}

function getCurrentSeason(): Season {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export const useUserStore = create<UserStore>((set, get) => ({
  viewport: {
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    centerX: 0,
    centerY: 0,
    zoom: 1,
  },
  season: getCurrentSeason(),
  constellations: [],
  selectedConstellationId: null,
  drawingState: createInitialDrawingState(),
  shareLink: null,
  shareCopied: false,
  transitionOpacity: 1,
  showMobilePanel: false,
  panelDragOffset: 0,

  setViewport: (w, h) =>
    set((state) => ({
      viewport: { ...state.viewport, width: w, height: h },
    })),

  setSeason: (s) => {
    const current = get().season
    if (current === s) return
    set({ transitionOpacity: 0 })
    setTimeout(() => {
      set({ season: s })
      requestAnimationFrame(() => {
        setTimeout(() => set({ transitionOpacity: 1 }), 20)
      })
    }, 200)
  },

  startDrawing: (x, y, stars) => {
    const snapped = snapToStar(x, y, stars)
    const node = createNode(snapped.x, snapped.y, false, snapped.starId)
    set({
      drawingState: {
        isDrawing: true,
        isDragging: true,
        currentPath: [{ x: snapped.x, y: snapped.y, timestamp: Date.now() }],
        tempNodes: [node],
        hoveredStarId: null,
      },
    })
  },

  updateDrawing: (x, y) => {
    const state = get()
    if (!state.drawingState.isDragging) return
    const path = [...state.drawingState.currentPath, { x, y, timestamp: Date.now() }]
    if (path.length > 200) path.splice(0, path.length - 200)
    set({
      drawingState: {
        ...state.drawingState,
        currentPath: path,
      },
    })
  },

  endDrawing: (stars) => {
    const state = get()
    const { tempNodes, currentPath, isDragging } = state.drawingState
    if (!isDragging) {
      set({ drawingState: { ...state.drawingState, isDrawing: false, isDragging: false } })
      return
    }

    const nodes = [...tempNodes]
    if (currentPath.length > 10) {
      const last = currentPath[currentPath.length - 1]
      const snapped = snapToStar(last.x, last.y, stars)
      const lastNode = createNode(snapped.x, snapped.y, false, snapped.starId)
      nodes.push(lastNode)

      const sampleStep = Math.max(1, Math.floor(currentPath.length / 30))
      for (let i = sampleStep; i < currentPath.length - 1; i += sampleStep) {
        const pt = currentPath[i]
        const snappedPt = snapToStar(pt.x, pt.y, stars)
        if (snappedPt.starId && !nodes.some((n) => n.starId === snappedPt.starId)) {
          nodes.push(createNode(snappedPt.x, snappedPt.y, false, snappedPt.starId))
        }
      }
    }

    if (nodes.length >= 2) {
      const constellation = createConstellation(nodes)
      if (constellation) {
        set((s) => ({ constellations: [...s.constellations, constellation] }))
      }
    }

    set({ drawingState: createInitialDrawingState() })
  },

  addManualNode: (x, y, stars) => {
    const snapped = snapToStar(x, y, stars)
    set((s) => {
      const existing = s.drawingState.tempNodes
      if (existing.length === 0) {
        return {
          drawingState: {
            ...s.drawingState,
            isDrawing: true,
            tempNodes: [createNode(snapped.x, snapped.y, true, snapped.starId)],
          },
        }
      }

      const newNodes = [...existing, createNode(snapped.x, snapped.y, true, snapped.starId)]
      const lastTwo = newNodes.slice(-2)
      const tempConstellation = createConstellation(lastTwo)

      if (newNodes.length >= 3 && tempConstellation) {
        const fullConstellation = createConstellation(newNodes)
        if (fullConstellation) {
          return {
            constellations: [...s.constellations, fullConstellation],
            drawingState: createInitialDrawingState(),
          }
        }
      }

      return {
        drawingState: {
          ...s.drawingState,
          tempNodes: newNodes,
        },
      }
    })
  },

  updateHoveredStar: (starId) =>
    set((s) => ({ drawingState: { ...s.drawingState, hoveredStarId: starId } })),

  addConstellation: (c) => set((s) => ({ constellations: [...s.constellations, c] })),

  deleteConstellation: (id) =>
    set((s) => ({
      constellations: s.constellations.filter((c) => c.id !== id),
      selectedConstellationId: s.selectedConstellationId === id ? null : s.selectedConstellationId,
    })),

  selectConstellation: (id) => set({ selectedConstellationId: id }),

  generateShareLink: () => {
    const { season, constellations } = get()
    const matchResult = constellations.length.toString().match(/\d+/)
    const counter = matchResult ? parseInt(matchResult[0], 10) : constellations.length
    const data: SerializedData = { season, constellations, counter }
    const hash = encodeToBase64(data)
    const link = `${window.location.origin}${window.location.pathname}#${hash}`
    navigator.clipboard.writeText(link).then(
      () => set({ shareLink: link, shareCopied: true }),
      () => set({ shareLink: link, shareCopied: false })
    )
    setTimeout(() => set({ shareLink: null, shareCopied: false }), 3000)
    return link
  },

  loadFromHash: (hash) => {
    if (!hash || hash.length < 10) return false
    const data = decodeFromBase64(hash)
    if (!data || !data.constellations || !data.season) return false
    resetCounter()
    setCounter(data.counter || 0)
    set({
      season: data.season,
      constellations: data.constellations,
    })
    return true
  },

  clearShareState: () => set({ shareLink: null, shareCopied: false }),

  setTransitionOpacity: (o) => set({ transitionOpacity: o }),

  setShowMobilePanel: (v) => set({ showMobilePanel: v, panelDragOffset: 0 }),

  setPanelDragOffset: (v) => set({ panelDragOffset: v }),
}))

export { THEME_COLORS }
