export interface ColorParams {
  hueRotate: number
  saturation: number
  brightness: number
  contrast: number
}

export interface Preset {
  id: string
  name: string
  params: ColorParams
  previewColors: string[]
}

export interface ImageItem {
  id: string
  file: File
  url: string
  originalBitmap: ImageBitmap | null
  processedBitmap: ImageBitmap | null
  dominantColors: string[]
  histogram: number[]
  rgbAverage: { r: number; g: number; b: number }
  isProcessing: boolean
}

export interface SavedScheme {
  id: string
  name: string
  createdAt: number
  params: ColorParams
  previewColors: string[]
}

export type WorkerRequest =
  | { type: 'analyzeImage'; payload: { id: string; imageData: ImageData } }
  | { type: 'applyFilter'; payload: { id: string; imageData: ImageData; params: ColorParams } }
  | { type: 'generateMatrix'; payload: { params: ColorParams } }
  | { type: 'generateCSS'; payload: { params: ColorParams } }

export type WorkerResponse =
  | { type: 'imageAnalyzed'; payload: { id: string; dominantColors: string[]; histogram: number[]; rgbAverage: { r: number; g: number; b: number } } }
  | { type: 'filterApplied'; payload: { id: string; processedData: ImageData } }
  | { type: 'matrixGenerated'; payload: { matrix: number[][] } }
  | { type: 'cssGenerated'; payload: { css: string } }

export const DEFAULT_PARAMS: ColorParams = {
  hueRotate: 0,
  saturation: 0,
  brightness: 0,
  contrast: 0,
}

export const PRESETS: Preset[] = [
  {
    id: 'vintage',
    name: '复古',
    params: { hueRotate: -10, saturation: -20, brightness: 10, contrast: -15 },
    previewColors: ['#d4a574', '#8b6914', '#3d2914'],
  },
  {
    id: 'film',
    name: '胶片',
    params: { hueRotate: 5, saturation: -10, brightness: 5, contrast: 10 },
    previewColors: ['#c4b896', '#6b5b3d', '#2a2418'],
  },
  {
    id: 'cyberpunk',
    name: '赛博朋克',
    params: { hueRotate: 180, saturation: 40, brightness: 0, contrast: 20 },
    previewColors: ['#ff00ff', '#00ffff', '#1a0033'],
  },
  {
    id: 'japanese',
    name: '日系清新',
    params: { hueRotate: -5, saturation: -30, brightness: 20, contrast: -20 },
    previewColors: ['#e8f4f8', '#b8d4e3', '#7aa6b8'],
  },
  {
    id: 'noir',
    name: ' noir电影',
    params: { hueRotate: 0, saturation: -100, brightness: -10, contrast: 30 },
    previewColors: ['#ffffff', '#808080', '#000000'],
  },
  {
    id: 'warm',
    name: '暖色调',
    params: { hueRotate: 20, saturation: 20, brightness: 10, contrast: 10 },
    previewColors: ['#ff6b35', '#f7c59f', '#2e1f27'],
  },
]
