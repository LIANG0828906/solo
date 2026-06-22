import { useState, useEffect, useRef } from 'react'
import { useFPSState, useVisualizerStore } from '@/store/useStore'
import { cn } from '@/lib/utils'

export default function FPSIndicator() {
  const fpsState = useFPSState()
  const { togglePerformanceMode } = useVisualizerStore()
  const [showTooltip, setShowTooltip] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const prevFpsRef = useRef(fpsState.fps)

  useEffect(() => {
    if (fpsState.fps !== prevFpsRef.current) {
      setIsAnimating(true)
      const timer = setTimeout(() => setIsAnimating(false), 300)
      prevFpsRef.current = fpsState.fps
      return () => clearTimeout(timer)
    }
  }, [fpsState.fps])

  const getFPSColor = (fps: number): 'green' | 'yellow' | 'red' => {
    if (fps > 50) return 'green'
    if (fps >= 30) return 'yellow'
    return 'red'
  }

  const color = getFPSColor(fpsState.fps)

  return (
    <div
      className="fixed top-4 right-4 z-30"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="glass-panel px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-white/10 transition-colors">
        <div
          className={cn('fps-indicator', color)}
          onClick={togglePerformanceMode}
        />
        <span
          className={cn('fps-number text-sm font-medium', isAnimating && 'change')}
        >
          {Math.round(fpsState.fps)} FPS
        </span>
        {fpsState.manualOverride && (
          <span className="text-xs text-gray-400 ml-1">手动</span>
        )}
      </div>

      {showTooltip && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-black/80 text-xs text-gray-300 rounded-lg whitespace-nowrap fade-in">
          点击切换性能模式
        </div>
      )}
    </div>
  )
}
