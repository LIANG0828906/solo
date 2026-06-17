export interface FilterSettings {
  brightness: number
  contrast: number
  hue: number
  saturation: number
  blur: number
  sepia: number
  grayscale: number
}

export interface TextSettings {
  text: string
  fontFamily: string
  fontSize: number
  fontWeight: number
  color: string
  opacity: number
  rotation: number
  textAlign: 'left' | 'center' | 'right'
}

export interface Layer {
  id: string
  name: string
  type: 'image' | 'text'
  x: number
  y: number
  width: number
  height: number
  imageSrc?: string
  filter: FilterSettings
  text?: TextSettings
  rotation: number
  scale: number
  visible: boolean
}

export interface CanvasSize {
  width: number
  height: number
  name: string
  platform: string
}

export interface AppState {
  layers: Layer[]
  selectedLayerId: string | null
  canvasSize: CanvasSize
  uploadProgress: number
  isUploading: boolean
  isDownloading: boolean
  showSuccessToast: boolean
}

export interface AppActions {
  addLayer: (layer: Layer) => void
  removeLayer: (id: string) => void
  duplicateLayer: (id: string) => void
  reorderLayer: (fromIndex: number, toIndex: number) => void
  selectLayer: (id: string | null) => void
  updateLayer: (id: string, updates: Partial<Layer>) => void
  setCanvasSize: (size: CanvasSize) => void
  setUploadProgress: (progress: number) => void
  setIsUploading: (isUploading: boolean) => void
  setIsDownloading: (isDownloading: boolean) => void
  setShowSuccessToast: (show: boolean) => void
}

export type AppStore = AppState & AppActions

export const FILTER_PRESETS: Record<string, Partial<FilterSettings>> = {
  '美食暖黄': { brightness: 1.1, contrast: 1.05, saturation: 1.2, hue: 0, sepia: 0.15, grayscale: 0, blur: 0 },
  '极简黑白': { brightness: 1, contrast: 1.2, saturation: 0, hue: 0, sepia: 0, grayscale: 1, blur: 0 },
  '复古胶片': { brightness: 0.95, contrast: 1.1, saturation: 0.85, hue: -10, sepia: 0.3, grayscale: 0, blur: 0 },
  '清新冷蓝': { brightness: 1.05, contrast: 1, saturation: 0.9, hue: 180, sepia: 0, grayscale: 0, blur: 0 },
  '高饱和电商': { brightness: 1.05, contrast: 1.15, saturation: 1.4, hue: 0, sepia: 0, grayscale: 0, blur: 0 },
  '柔光': { brightness: 1.1, contrast: 0.9, saturation: 0.95, hue: 0, sepia: 0.05, grayscale: 0, blur: 1 },
  '锐化': { brightness: 1, contrast: 1.3, saturation: 1.1, hue: 0, sepia: 0, grayscale: 0, blur: 0 },
  '暗调': { brightness: 0.75, contrast: 1.2, saturation: 0.8, hue: 0, sepia: 0.1, grayscale: 0, blur: 0 },
}

export const CANVAS_SIZES: CanvasSize[] = [
  { width: 800, height: 800, name: '淘宝主图', platform: 'taobao' },
  { width: 750, height: 500, name: '京东主图', platform: 'jd' },
  { width: 750, height: 352, name: '拼多多主图', platform: 'pdd' },
]

export const FONT_FAMILIES = [
  { name: '思源黑体', value: "'Noto Sans SC', sans-serif" },
  { name: '思源宋体', value: "'Noto Serif SC', serif" },
  { name: '站酷文艺体', value: "'ZCOOL KuaiLe', cursive" },
  { name: 'Dancing Script', value: "'Dancing Script', cursive" },
]

export const DEFAULT_FILTER: FilterSettings = {
  brightness: 1,
  contrast: 1,
  hue: 0,
  saturation: 1,
  blur: 0,
  sepia: 0,
  grayscale: 0,
}

export const DEFAULT_TEXT: TextSettings = {
  text: '双击编辑文字',
  fontFamily: "'Noto Sans SC', sans-serif",
  fontSize: 32,
  fontWeight: 700,
  color: '#000000',
  opacity: 1,
  rotation: 0,
  textAlign: 'center',
}
