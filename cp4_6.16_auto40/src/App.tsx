import React, { useEffect, useRef } from 'react'
import { useStore } from './store'
import Canvas from './components/Canvas'
import NodePanel from './components/NodePanel'
import Reader from './components/Reader'

const App: React.FC = () => {
  const { mode, setMode, loadFromIdb, resetReader } = useStore()
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = React.useState(false)

  useEffect(() => {
    loadFromIdb()
    const timer = setTimeout(() => setMounted(true), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleEnterReader = () => {
    resetReader()
    setMode('reader')
  }

  const handleExitReader = () => {
    setMode('editor')
  }

  return (
    <div className="w-full h-full relative" style={{ overflow: 'hidden' }}>
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: mounted ? 1 : 0,
        }}
      >
        <Canvas containerRef={canvasContainerRef} />
      </div>

      {mode === 'editor' && <NodePanel containerRef={canvasContainerRef} />}

      {mode === 'editor' && (
        <>
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-40 glass-panel rounded-2xl px-6 py-3
                          flex items-center gap-4 border border-white/5 shadow-2xl">
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center relative"
                style={{
                  background: 'linear-gradient(135deg, #00ffd5 0%, #ff007f 100%)',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                  <path d="M2 17l10 5 10-5" />
                  <path d="M2 12l10 5 10-5" />
                </svg>
                <div
                  className="absolute inset-0 rounded-xl animate-ping opacity-20"
                  style={{
                    background: 'linear-gradient(135deg, #00ffd5 0%, #ff007f 100%)',
                  }}
                />
              </div>
              <div>
                <div
                  className="text-base font-bold tracking-widest leading-none"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    background: 'linear-gradient(135deg, #00ffd5 0%, #ffffff 50%, #ff007f 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  WORDWEAVER
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5 tracking-wider">
                  互动文字冒险编辑器
                </div>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-gray-500 tracking-wide">
              <span className="px-2 py-1 rounded-md bg-white/5">拖拽节点</span>
              <span>·</span>
              <span className="px-2 py-1 rounded-md bg-white/5">滚轮缩放</span>
              <span>·</span>
              <span className="px-2 py-1 rounded-md bg-white/5">拖动连线</span>
            </div>
          </div>

          <div className="fixed top-4 right-28 z-50">
            <button
              onClick={handleEnterReader}
              className="group relative overflow-hidden px-6 py-3 rounded-2xl
                         transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: `linear-gradient(135deg,
                  rgba(0, 255, 213, 0.15) 0%,
                  rgba(0, 255, 213, 0.05) 40%,
                  rgba(255, 0, 127, 0.05) 60%,
                  rgba(255, 0, 127, 0.15) 100%
                )`,
                border: '1.5px solid rgba(0, 255, 213, 0.4)',
                animation: 'neon-flicker 4s ease-in-out infinite',
                backdropFilter: 'blur(16px)',
              }}
            >
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `linear-gradient(135deg,
                    rgba(0, 255, 213, 0.25) 0%,
                    rgba(0, 255, 213, 0.1) 40%,
                    rgba(255, 0, 127, 0.1) 60%,
                    rgba(255, 0, 127, 0.25) 100%
                  )`,
                }}
              />
              <div
                className="absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  boxShadow: `
                    0 0 20px rgba(0, 255, 213, 0.4),
                    0 0 40px rgba(0, 255, 213, 0.2),
                    0 0 60px rgba(255, 0, 127, 0.2)
                  `,
                }}
              />
              <div className="relative flex items-center gap-2.5">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transition-transform duration-300 group-hover:scale-110"
                >
                  <polygon
                    points="5 3 19 12 5 21 5 3"
                    fill="#00ffd5"
                    style={{
                      filter: 'drop-shadow(0 0 6px rgba(0, 255, 213, 0.6))',
                    }}
                  />
                </svg>
                <span
                  className="text-sm font-bold tracking-widest"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    color: '#00ffd5',
                    textShadow: '0 0 10px rgba(0, 255, 213, 0.4)',
                  }}
                >
                  运行剧情
                </span>
              </div>
            </button>
          </div>

          <div className="fixed bottom-4 left-4 z-30 hidden md:flex items-center gap-2
                          glass-panel rounded-xl px-4 py-2 border border-white/5">
            <div className="flex items-center gap-1.5">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{
                  backgroundColor: '#00ffd5',
                  boxShadow: '0 0 6px rgba(0, 255, 213, 0.8)',
                }}
              />
              <span className="text-[10px] text-gray-400 tracking-wider">
                数据已同步到 IndexedDB
              </span>
            </div>
          </div>
        </>
      )}

      {mode === 'reader' && <Reader onExit={handleExitReader} />}
    </div>
  )
}

export default App
