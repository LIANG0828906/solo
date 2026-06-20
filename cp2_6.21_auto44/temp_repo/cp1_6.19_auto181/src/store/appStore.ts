import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AudioSegment, EmotionType } from '../audioEngine/segmentProcessor'

export interface Comment {
  id: string
  segmentId: string
  text: string
  emoji: string
  userName: string
  userColor: string
  timestamp: number
}

interface AppState {
  segments: AudioSegment[]
  comments: Record<string, Comment[]>
  gridColumns: number
  selectedSegmentId: string | null
  isProcessing: boolean
  audioFileName: string | null

  setSegments: (segments: AudioSegment[]) => void
  updateSegmentEmotion: (segmentId: string, emotion: EmotionType) => void
  reorderSegments: (fromIndex: number, toIndex: number) => void
  addComment: (segmentId: string, text: string, emoji: string) => void
  setGridColumns: (columns: number) => void
  setSelectedSegmentId: (id: string | null) => void
  setIsProcessing: (processing: boolean) => void
  setAudioFileName: (name: string | null) => void
  clearAll: () => void
  exportData: () => void
}

const USER_COLORS = ['#FF6B6B', '#5B86E5', '#FFA94D', '#B197FC', '#6C63FF', '#E040FB', '#4ADE80']

const generateUserName = (): string => {
  const adjectives = ['热情的', '安静的', '疯狂的', '温柔的', '酷酷的', '迷幻的']
  const nouns = ['听众', '歌迷', '观众', '乐迷', '朋友']
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 1000)
  return `${adj}${noun}${num}`
}

const getRandomUserColor = (): string => {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]
}

const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours < 1) return '刚刚'
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  return `${days}天前`
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      segments: [],
      comments: {},
      gridColumns: 3,
      selectedSegmentId: null,
      isProcessing: false,
      audioFileName: null,

      setSegments: (segments) => set({ segments }),

      updateSegmentEmotion: (segmentId, emotion) =>
        set((state) => ({
          segments: state.segments.map((s) =>
            s.id === segmentId ? { ...s, emotion } : s
          )
        })),

      reorderSegments: (fromIndex, toIndex) =>
        set((state) => {
          const segments = [...state.segments]
          const [removed] = segments.splice(fromIndex, 1)
          segments.splice(toIndex, 0, removed)
          return { segments }
        }),

      addComment: (segmentId, text, emoji) =>
        set((state) => {
          const newComment: Comment = {
            id: `comment-${Date.now()}`,
            segmentId,
            text,
            emoji,
            userName: generateUserName(),
            userColor: getRandomUserColor(),
            timestamp: Date.now()
          }

          const existingComments = state.comments[segmentId] || []
          return {
            comments: {
              ...state.comments,
              [segmentId]: [newComment, ...existingComments]
            }
          }
        }),

      setGridColumns: (columns) => set({ gridColumns: columns }),

      setSelectedSegmentId: (id) => set({ selectedSegmentId: id }),

      setIsProcessing: (processing) => set({ isProcessing: processing }),

      setAudioFileName: (name) => set({ audioFileName: name }),

      clearAll: () =>
        set({
          segments: [],
          comments: {},
          selectedSegmentId: null,
          audioFileName: null
        }),

      exportData: () => {
        const state = get()
        const exportData = {
          segments: state.segments,
          comments: state.comments,
          exportedAt: new Date().toISOString(),
          audioFileName: state.audioFileName
        }

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json'
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `memory-wall-${Date.now()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    }),
    {
      name: 'audio-slicer-storage',
      partialize: (state) => ({
        segments: state.segments,
        comments: state.comments,
        gridColumns: state.gridColumns,
        audioFileName: state.audioFileName
      })
    }
  )
)

export { formatRelativeTime }
