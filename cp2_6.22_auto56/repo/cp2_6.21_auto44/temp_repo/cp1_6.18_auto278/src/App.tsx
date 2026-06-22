import { create } from 'zustand'
import BubbleArea from './components/BubbleArea'
import SettingsPanel from './components/SettingsPanel'

export interface BubbleData {
  id: string
  x: number
  y: number
  size: number
  colorScheme: 'warm' | 'cool'
  speed: number
  phase: number
  quote: string
  popped: boolean
}

interface AppState {
  bubbles: BubbleData[]
  clickedCount: number
  density: number
  speed: number
  settingsOpen: boolean
  setDensity: (d: number) => void
  setSpeed: (s: number) => void
  popBubble: (id: string) => void
  resetBubbles: () => void
  toggleSettings: () => void
  generateBubbles: (count: number, speed: number) => BubbleData[]
}

import { getRandomQuote } from './utils/quotes'

function createBubbles(count: number, speed: number): BubbleData[] {
  const w = typeof window !== 'undefined' ? window.innerWidth : 1200
  const h = typeof window !== 'undefined' ? window.innerHeight : 800
  const bubbles: BubbleData[] = []
  for (let i = 0; i < count; i++) {
    const size = 40 + Math.random() * 40
    bubbles.push({
      id: `bubble-${Date.now()}-${i}`,
      x: size / 2 + Math.random() * (w - size),
      y: size / 2 + Math.random() * (h - size - 80),
      size,
      colorScheme: Math.random() > 0.5 ? 'warm' : 'cool',
      speed: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2,
      quote: getRandomQuote(),
      popped: false,
    })
  }
  return bubbles
}

const useStore = create<AppState>((set, get) => ({
  bubbles: createBubbles(25, 0.5),
  clickedCount: 0,
  density: 25,
  speed: 0.5,
  settingsOpen: false,
  setDensity: (d: number) => {
    set({ density: d, bubbles: createBubbles(d, get().speed) })
  },
  setSpeed: (s: number) => {
    set({ speed: s })
  },
  popBubble: (id: string) => {
    set((state) => ({
      bubbles: state.bubbles.map((b) =>
        b.id === id ? { ...b, popped: true } : b
      ),
      clickedCount: state.clickedCount + 1,
    }))
  },
  resetBubbles: () => {
    set((state) => ({
      bubbles: createBubbles(state.density, state.speed),
      clickedCount: 0,
    }))
  },
  toggleSettings: () => {
    set((state) => ({ settingsOpen: !state.settingsOpen }))
  },
  generateBubbles: (count: number, speed: number) => {
    return createBubbles(count, speed)
  },
}))

export default function App() {
  const settingsOpen = useStore((s) => s.settingsOpen)

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <BubbleArea />
      <SettingsPanel />
      <button
        onClick={() => useStore.getState().toggleSettings()}
        style={{
          position: 'fixed',
          top: 16,
          left: 16,
          zIndex: 1000,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 8,
          transition: 'transform 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'rotate(45deg)'
          e.currentTarget.querySelector('svg')!.setAttribute('fill', '#FFFFFF')
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'rotate(0deg)'
          e.currentTarget.querySelector('svg')!.setAttribute('fill', '#CCCCCC')
        }}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="#CCCCCC"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.484.484 0 00-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1115.6 12 3.6 3.6 0 0112 15.6z" />
        </svg>
      </button>
    </div>
  )
}

export { useStore }
