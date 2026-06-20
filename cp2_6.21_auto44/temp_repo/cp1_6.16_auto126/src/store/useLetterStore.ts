import { create } from 'zustand'

export type FontFamily = 'xingshu' | 'italic'
export type PaperStyle = 'kraft' | 'watermark' | 'floral'
export type PlaybackSpeed = 0.5 | 1 | 2

export const FONT_COLORS = [
  { name: '墨黑', value: '#2C2C2C' },
  { name: '深棕', value: '#4A3728' },
  { name: '锈红', value: '#7B3F3A' },
  { name: '靛蓝', value: '#2A4B5C' },
] as const

export const PAPER_STYLES: Record<PaperStyle, { name: string; bg: string; lineColor: string }> = {
  kraft: { name: '牛皮纸', bg: 'linear-gradient(135deg, #F5E6CA 0%, #E8D8C8 100%)', lineColor: '#D5C4A1' },
  watermark: { name: '水纹纸', bg: 'linear-gradient(135deg, #E6E1D5 0%, #DBD6CA 100%)', lineColor: '#C8C3B7' },
  floral: { name: '花草纸', bg: 'linear-gradient(135deg, #F0EAD6 0%, #E5DFD0 100%)', lineColor: '#D0CAB8' },
}

export const SIGNATURE_PRESETS = ['敬上', '此致敬礼', '谨启', '手书'] as const

interface LetterStore {
  text: string
  fontFamily: FontFamily
  fontSize: number
  fontColor: string
  lineSpacing: number
  paperStyle: PaperStyle
  showDateStamp: boolean
  dateStamp: string
  signature: string
  signaturePreset: string
  isPlaying: boolean
  playbackSpeed: PlaybackSpeed
  currentCharIndex: number
  exportProgress: number
  isExporting: boolean
  exportType: 'gif' | 'video' | null

  setText: (text: string) => void
  setFontFamily: (font: FontFamily) => void
  setFontSize: (size: number) => void
  setFontColor: (color: string) => void
  setLineSpacing: (spacing: number) => void
  setPaperStyle: (style: PaperStyle) => void
  setShowDateStamp: (show: boolean) => void
  setDateStamp: (date: string) => void
  setSignature: (sig: string) => void
  setSignaturePreset: (preset: string) => void
  setIsPlaying: (playing: boolean) => void
  setPlaybackSpeed: (speed: PlaybackSpeed) => void
  setCurrentCharIndex: (index: number) => void
  setExportProgress: (progress: number) => void
  setIsExporting: (exporting: boolean) => void
  setExportType: (type: 'gif' | 'video' | null) => void
  reset: () => void
}

const today = new Date()
const defaultDateStamp = `${today.getFullYear()}年${String(today.getMonth() + 1).padStart(2, '0')}月${String(today.getDate()).padStart(2, '0')}日`

const initialState = {
  text: '见字如面，展信舒颜。\n时光流转，纸短情长。\n愿此信笺，温暖你的每一天。',
  fontFamily: 'xingshu' as FontFamily,
  fontSize: 22,
  fontColor: '#2C2C2C',
  lineSpacing: 32,
  paperStyle: 'kraft' as PaperStyle,
  showDateStamp: true,
  dateStamp: defaultDateStamp,
  signature: '',
  signaturePreset: '敬上',
  isPlaying: false,
  playbackSpeed: 1 as PlaybackSpeed,
  currentCharIndex: 0,
  exportProgress: 0,
  isExporting: false,
  exportType: null as 'gif' | 'video' | null,
}

export const useLetterStore = create<LetterStore>((set) => ({
  ...initialState,
  setText: (text) => set({ text }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setFontSize: (fontSize) => set({ fontSize }),
  setFontColor: (fontColor) => set({ fontColor }),
  setLineSpacing: (lineSpacing) => set({ lineSpacing }),
  setPaperStyle: (paperStyle) => set({ paperStyle }),
  setShowDateStamp: (showDateStamp) => set({ showDateStamp }),
  setDateStamp: (dateStamp) => set({ dateStamp }),
  setSignature: (signature) => set({ signature }),
  setSignaturePreset: (signaturePreset) => set({ signaturePreset }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  setCurrentCharIndex: (currentCharIndex) => set({ currentCharIndex }),
  setExportProgress: (exportProgress) => set({ exportProgress }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setExportType: (exportType) => set({ exportType }),
  reset: () => set(initialState),
}))
