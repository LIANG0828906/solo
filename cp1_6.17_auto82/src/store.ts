import { create } from 'zustand'
import { LyricParser, type LyricLine } from './LyricParser'

const DEFAULT_LRC = `[00:00.00] 欢迎使用歌词排版与卡拉OK预览
[00:03.50] 请在左侧输入或粘贴 LRC 格式歌词
[00:07.20] 每行以 [mm:ss.xx] 格式标记时间戳
[00:11.00] 点击播放按钮预览卡拉OK效果
[00:15.50] 双击歌词行可以编辑时间戳
[00:20.00] 点击歌词行可以快速定位
[00:24.50] 满意后点击右上角导出按钮下载`

interface LyricState {
  rawText: string
  lines: LyricLine[]
  currentTime: number
  duration: number
  isPlaying: boolean
  setRawText: (text: string) => void
  setCurrentTime: (t: number) => void
  setPlaying: (p: boolean) => void
  updateLineTime: (index: number, newTime: number) => void
  exportLRC: () => void
}

export const useLyricStore = create<LyricState>((set, get) => ({
  rawText: DEFAULT_LRC,
  lines: LyricParser.parse(DEFAULT_LRC),
  currentTime: 0,
  duration: 30,
  isPlaying: false,

  setRawText: (text: string) => {
    const lines = LyricParser.parse(text)
    const duration = lines.length > 0 ? Math.max(30, lines[lines.length - 1].time + 5) : 30
    set({ rawText: text, lines, duration })
  },

  setCurrentTime: (t: number) => {
    const { duration } = get()
    set({ currentTime: Math.max(0, Math.min(t, duration)) })
  },

  setPlaying: (p: boolean) => set({ isPlaying: p }),

  updateLineTime: (index: number, newTime: number) => {
    const { lines, rawText } = get()
    if (index < 0 || index >= lines.length) return

    const newLines = [...lines]
    newLines[index] = { ...newLines[index], time: newTime }
    const sorted = LyricParser.sortLines(newLines)
    const newRawText = LyricParser.serialize(sorted)
    const duration = sorted.length > 0 ? Math.max(30, sorted[sorted.length - 1].time + 5) : 30

    set({ lines: sorted, rawText: newRawText, duration })
  },

  exportLRC: () => {
    const { lines } = get()
    const content = LyricParser.serialize(lines)
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'lyrics.lrc'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  },
}))
