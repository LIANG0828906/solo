import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type Alignment = 'left' | 'center' | 'right' | 'justify'
export type PathType = 'linear' | 'circle' | 'spiral' | 'wave'

export interface Theme {
  id: string
  name: string
  textColor: string
  backgroundColor: string
  accentColor: string
}

export interface CharData {
  id: string
  char: string
  x: number
  y: number
  rotation: number
  fontSize: number
  color: string
  fontWeight: number
  fontStyle: 'normal' | 'italic'
  isLastInLine: boolean
  lineIndex: number
  originalIndex: number
  manualOffsetX: number
  manualOffsetY: number
}

export interface LineData {
  id: string
  text: string
  alignment: Alignment
  chars: CharData[]
}

export interface TypographyState {
  fontFamily: string
  fontSize: number
  fontWeight: number
  lineHeight: number
  letterSpacing: number
  textColor: string
  backgroundColor: string
  accentColor: string
  text: string
  lines: LineData[]
  pathType: PathType
  pathRadius: number
  spiralTurns: number
  waveAmplitude: number
  selectedCharId: string | null
  themeId: string
  themes: Theme[]
  zoom: number
  panX: number
  panY: number
  lastCharSpecial: boolean

  setFontFamily: (font: string) => void
  setFontSize: (size: number) => void
  setFontWeight: (weight: number) => void
  setLineHeight: (height: number) => void
  setLetterSpacing: (spacing: number) => void
  setTextColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  setAccentColor: (color: string) => void
  setText: (text: string) => void
  setPathType: (type: PathType) => void
  setPathRadius: (radius: number) => void
  setSpiralTurns: (turns: number) => void
  setWaveAmplitude: (amplitude: number) => void
  setSelectedCharId: (id: string | null) => void
  setThemeId: (id: string) => void
  setZoom: (zoom: number) => void
  setPan: (x: number, y: number) => void
  setLineAlignment: (lineId: string, alignment: Alignment) => void
  setLastCharSpecial: (special: boolean) => void
  updateCharPosition: (id: string, offsetX: number, offsetY: number) => void
  deleteChar: (id: string) => void
  setLines: (lines: LineData[]) => void
}

const defaultThemes: Theme[] = [
  { id: 'ink', name: '水墨', textColor: '#333333', backgroundColor: '#F5F5DC', accentColor: '#E53935' },
  { id: 'cyber', name: '赛博', textColor: '#00BCD4', backgroundColor: '#0B0B0B', accentColor: '#FF4081' },
  { id: 'sunset', name: '夕阳', textColor: '#FF5722', backgroundColor: '#FFF3E0', accentColor: '#FF9800' },
  { id: 'ocean', name: '海洋', textColor: '#1565C0', backgroundColor: '#E3F2FD', accentColor: '#00ACC1' },
  { id: 'forest', name: '森林', textColor: '#2E7D32', backgroundColor: '#E8F5E9', accentColor: '#8BC34A' },
  { id: 'rose', name: '玫瑰', textColor: '#AD1457', backgroundColor: '#FCE4EC', accentColor: '#F06292' },
  { id: 'royal', name: '皇家', textColor: '#4A148C', backgroundColor: '#F3E5F5', accentColor: '#AB47BC' },
  { id: 'vintage', name: '复古', textColor: '#5D4037', backgroundColor: '#EFEBE9', accentColor: '#A1887F' },
  { id: 'neon', name: '霓虹', textColor: '#76FF03', backgroundColor: '#1A1A2E', accentColor: '#FF00FF' },
  { id: 'minimal', name: '极简', textColor: '#212121', backgroundColor: '#FAFAFA', accentColor: '#757575' },
]

const defaultText = `床前明月光
疑是地上霜
举头望明月
低头思故乡`

function createLinesFromText(text: string, defaultAlignment: Alignment = 'center'): LineData[] {
  return text.split('\n').map((lineText, lineIndex) => ({
    id: uuidv4(),
    text: lineText,
    alignment: defaultAlignment,
    chars: Array.from(lineText).map((char, charIndex) => ({
      id: uuidv4(),
      char,
      x: 0,
      y: 0,
      rotation: 0,
      fontSize: 0,
      color: '',
      fontWeight: 400,
      fontStyle: 'normal',
      isLastInLine: charIndex === lineText.length - 1,
      lineIndex,
      originalIndex: charIndex,
      manualOffsetX: 0,
      manualOffsetY: 0,
    })),
  })).filter(line => line.text.length > 0)
}

export const useTypographyStore = create<TypographyState>((set, get) => ({
  fontFamily: 'SimSun',
  fontSize: 48,
  fontWeight: 400,
  lineHeight: 1.6,
  letterSpacing: 2,
  textColor: '#333333',
  backgroundColor: '#F5F5DC',
  accentColor: '#E53935',
  text: defaultText,
  lines: createLinesFromText(defaultText),
  pathType: 'linear',
  pathRadius: 200,
  spiralTurns: 2,
  waveAmplitude: 20,
  selectedCharId: null,
  themeId: 'ink',
  themes: defaultThemes,
  zoom: 1,
  panX: 0,
  panY: 0,
  lastCharSpecial: true,

  setFontFamily: (font) => set({ fontFamily: font }),
  setFontSize: (size) => set({ fontSize: size }),
  setFontWeight: (weight) => set({ fontWeight: weight }),
  setLineHeight: (height) => set({ lineHeight: height }),
  setLetterSpacing: (spacing) => set({ letterSpacing: spacing }),
  setTextColor: (color) => set({ textColor: color }),
  setBackgroundColor: (color) => set({ backgroundColor: color }),
  setAccentColor: (color) => set({ accentColor: color }),
  setText: (text) => set({ text, lines: createLinesFromText(text) }),
  setPathType: (type) => set({ pathType: type }),
  setPathRadius: (radius) => set({ pathRadius: radius }),
  setSpiralTurns: (turns) => set({ spiralTurns: turns }),
  setWaveAmplitude: (amplitude) => set({ waveAmplitude: amplitude }),
  setSelectedCharId: (id) => set({ selectedCharId: id }),
  setThemeId: (id) => {
    const theme = get().themes.find(t => t.id === id)
    if (theme) {
      set({
        themeId: id,
        textColor: theme.textColor,
        backgroundColor: theme.backgroundColor,
        accentColor: theme.accentColor,
      })
    }
  },
  setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(3, zoom)) }),
  setPan: (x, y) => set({ panX: x, panY: y }),
  setLineAlignment: (lineId, alignment) => set(state => ({
    lines: state.lines.map(l => l.id === lineId ? { ...l, alignment } : l),
  })),
  setLastCharSpecial: (special) => set({ lastCharSpecial: special }),
  updateCharPosition: (id, offsetX, offsetY) => set(state => ({
    lines: state.lines.map(line => ({
      ...line,
      chars: line.chars.map(c =>
        c.id === id ? { ...c, manualOffsetX: offsetX, manualOffsetY: offsetY } : c
      ),
    })),
  })),
  deleteChar: (id) => set(state => ({
    lines: state.lines.map(line => ({
      ...line,
      chars: line.chars.filter(c => c.id !== id),
    })).filter(line => line.chars.length > 0),
    selectedCharId: null,
  })),
  setLines: (lines) => set({ lines }),
}))
