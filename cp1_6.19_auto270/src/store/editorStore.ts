import { create } from 'zustand'

export type TemplateId = 'kraft' | 'parchment' | 'modern' | 'business'
export type SignatureFont = 'kaiti' | 'songti' | 'handwriting'

export interface CropRect {
  x: number
  y: number
  w: number
  h: number
}

export interface HistoryEntry {
  imageDataUrl: string
  brightness: number
  contrast: number
  rotation: number
  fineRotation: number
  isEnhanced: boolean
}

interface EditorState {
  originalImage: string | null
  processedImageDataUrl: string | null
  imageWidth: number
  imageHeight: number

  brightness: number
  contrast: number
  rotation: number
  fineRotation: number
  isEnhanced: boolean

  currentTemplateId: TemplateId
  signatureText: string
  signatureFont: SignatureFont
  signatureSize: number

  cropRect: CropRect | null
  isCropping: boolean

  history: HistoryEntry[]
  historyIndex: number

  isExporting: boolean

  setImage: (dataUrl: string, width: number, height: number) => void
  setProcessedImage: (dataUrl: string) => void
  setBrightness: (v: number) => void
  setContrast: (v: number) => void
  setRotation: (v: number) => void
  setFineRotation: (v: number) => void
  setEnhanced: (v: boolean) => void
  setTemplateId: (id: TemplateId) => void
  setSignatureText: (text: string) => void
  setSignatureFont: (font: SignatureFont) => void
  setSignatureSize: (size: number) => void
  setCropRect: (rect: CropRect | null) => void
  setCropping: (v: boolean) => void
  setExporting: (v: boolean) => void
  pushHistory: () => void
  undo: () => void
  redo: () => void
  reset: () => void
  rotateLeft: () => void
  rotateRight: () => void
}

const MAX_HISTORY = 20

export const useEditorStore = create<EditorState>((set, get) => ({
  originalImage: null,
  processedImageDataUrl: null,
  imageWidth: 0,
  imageHeight: 0,

  brightness: 0,
  contrast: 0,
  rotation: 0,
  fineRotation: 0,
  isEnhanced: false,

  currentTemplateId: 'kraft',
  signatureText: '—你的名字',
  signatureFont: 'kaiti',
  signatureSize: 18,

  cropRect: null,
  isCropping: false,

  history: [],
  historyIndex: -1,

  isExporting: false,

  setImage: (dataUrl, width, height) => {
    set({
      originalImage: dataUrl,
      processedImageDataUrl: dataUrl,
      imageWidth: width,
      imageHeight: height,
      brightness: 0,
      contrast: 0,
      rotation: 0,
      fineRotation: 0,
      isEnhanced: false,
      cropRect: null,
      isCropping: false,
      history: [],
      historyIndex: -1,
    })
    get().pushHistory()
  },

  setProcessedImage: (dataUrl) => set({ processedImageDataUrl: dataUrl }),

  setBrightness: (v) => set({ brightness: v }),
  setContrast: (v) => set({ contrast: v }),

  setRotation: (v) => set({ rotation: v }),
  setFineRotation: (v) => set({ fineRotation: v }),
  setEnhanced: (v) => set({ isEnhanced: v }),

  setTemplateId: (id) => set({ currentTemplateId: id }),
  setSignatureText: (text) => set({ signatureText: text }),
  setSignatureFont: (font) => set({ signatureFont: font }),
  setSignatureSize: (size) => set({ signatureSize: size }),

  setCropRect: (rect) => set({ cropRect: rect }),
  setCropping: (v) => set({ isCropping: v }),
  setExporting: (v) => set({ isExporting: v }),

  pushHistory: () => {
    const state = get()
    const entry: HistoryEntry = {
      imageDataUrl: state.processedImageDataUrl || '',
      brightness: state.brightness,
      contrast: state.contrast,
      rotation: state.rotation,
      fineRotation: state.fineRotation,
      isEnhanced: state.isEnhanced,
    }
    const newHistory = state.history.slice(0, state.historyIndex + 1)
    newHistory.push(entry)
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    })
  },

  undo: () => {
    const state = get()
    if (state.historyIndex <= 0) return
    const newIndex = state.historyIndex - 1
    const entry = state.history[newIndex]
    set({
      historyIndex: newIndex,
      processedImageDataUrl: entry.imageDataUrl,
      brightness: entry.brightness,
      contrast: entry.contrast,
      rotation: entry.rotation,
      fineRotation: entry.fineRotation,
      isEnhanced: entry.isEnhanced,
    })
  },

  redo: () => {
    const state = get()
    if (state.historyIndex >= state.history.length - 1) return
    const newIndex = state.historyIndex + 1
    const entry = state.history[newIndex]
    set({
      historyIndex: newIndex,
      processedImageDataUrl: entry.imageDataUrl,
      brightness: entry.brightness,
      contrast: entry.contrast,
      rotation: entry.rotation,
      fineRotation: entry.fineRotation,
      isEnhanced: entry.isEnhanced,
    })
  },

  reset: () => {
    const state = get()
    if (!state.originalImage) return
    set({
      processedImageDataUrl: state.originalImage,
      brightness: 0,
      contrast: 0,
      rotation: 0,
      fineRotation: 0,
      isEnhanced: false,
      cropRect: null,
      isCropping: false,
    })
    get().pushHistory()
  },

  rotateLeft: () => {
    const state = get()
    const newRotation = (state.rotation - 90 + 360) % 360
    set({ rotation: newRotation })
    get().pushHistory()
  },

  rotateRight: () => {
    const state = get()
    const newRotation = (state.rotation + 90) % 360
    set({ rotation: newRotation })
    get().pushHistory()
  },
}))
