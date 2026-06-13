import { useCallback, useState, useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { Flag, Play, Trash2, Camera, Palette } from 'lucide-react'
import { PRESET_COLORS, useStore, type AppMode } from './useStore'
import { clearFlagsRemote, fetchFlags, useFlagReplay } from './FlagManager'
import { cn } from '@/lib/utils'

function ScreenshotHelper({ onCapture }: { onCapture: (dataUrl: string) => void }) {
  const { gl, scene, camera } = useThree()

  useEffect(() => {
    onCapture('')
  }, [onCapture])

  const capture = useCallback(() => {
    gl.render(scene, camera)
    const dataUrl = gl.domElement.toDataURL('image/png')
    onCapture(dataUrl)
  }, [gl, scene, camera, onCapture])

  useEffect(() => {
    const handler = () => capture()
    window.addEventListener('capture-screenshot', handler)
    return () => window.removeEventListener('capture-screenshot', handler)
  }, [capture])

  return null
}

export { ScreenshotHelper }

export default function Toolbar() {
  const { mode, setMode, selectedColor, setSelectedColor, clearFlags, flags } = useStore()
  const { startReplay, stopReplay, isReplaying } = useFlagReplay()
  const [screenshotUrl, setScreenshotUrl] = useState('')
  const [compact, setCompact] = useState(false)

  useEffect(() => {
    const checkCompact = () => {
      const isLandscape = window.innerWidth > window.innerHeight && window.innerHeight < 500
      setCompact(isLandscape)
    }
    checkCompact()
    window.addEventListener('resize', checkCompact)
    const mql = window.matchMedia('(orientation: landscape) and (max-height: 500px)')
    mql.addEventListener('change', checkCompact)
    return () => {
      window.removeEventListener('resize', checkCompact)
      mql.removeEventListener('change', checkCompact)
    }
  }, [])

  const handleModeSwitch = useCallback(
    (newMode: AppMode) => {
      if (newMode === 'replay') {
        startReplay()
      } else {
        stopReplay()
      }
      setMode(newMode)
    },
    [setMode, startReplay, stopReplay]
  )

  const handleClear = useCallback(async () => {
    await clearFlagsRemote()
    clearFlags()
  }, [clearFlags])

  const handleScreenshot = useCallback(() => {
    window.dispatchEvent(new Event('capture-screenshot'))
  }, [])

  useEffect(() => {
    if (!screenshotUrl) return
    const link = document.createElement('a')
    link.download = `sandtable-${Date.now()}.png`
    link.href = screenshotUrl
    link.click()
    setScreenshotUrl('')
  }, [screenshotUrl])

  const handleCapture = useCallback((dataUrl: string) => {
    if (dataUrl) setScreenshotUrl(dataUrl)
  }, [])

  return (
    <>
      <div
        className={cn(
          'fixed left-3 top-1/2 -translate-y-1/2 z-50 flex flex-col gap-3 transition-all duration-500 ease-out',
          compact ? 'left-2 gap-2' : 'left-3 gap-3'
        )}
      >
        <div
          className={cn(
            'rounded-2xl border border-white/20 shadow-2xl flex flex-col gap-4 transition-all duration-300',
            compact ? 'p-2.5 gap-2.5' : 'p-5 gap-4'
          )}
          style={{
            background: 'rgba(15, 25, 45, 0.55)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
          }}
        >
          <div className={cn('text-white/80 font-semibold tracking-wide', compact ? 'text-[10px]' : 'text-sm')}>
            模式
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleModeSwitch('place')}
              className={cn(
                'flex items-center gap-2 rounded-xl transition-all duration-300 border',
                compact ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-xs',
                mode === 'place'
                  ? 'bg-cyan-500/30 border-cyan-400/50 text-white shadow-lg shadow-cyan-500/20'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              )}
            >
              <Flag size={compact ? 12 : 14} />
              <span>插旗</span>
            </button>
            <button
              onClick={() => handleModeSwitch('replay')}
              className={cn(
                'flex items-center gap-2 rounded-xl transition-all duration-300 border',
                compact ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-xs',
                mode === 'replay'
                  ? 'bg-amber-500/30 border-amber-400/50 text-white shadow-lg shadow-amber-500/20'
                  : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
              )}
            >
              <Play size={compact ? 12 : 14} />
              <span>回放</span>
              {isReplaying && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>

          <div className="w-full h-px bg-white/10" />

          <div className={cn('text-white/80 font-semibold tracking-wide', compact ? 'text-[10px]' : 'text-sm')}>
            旗帜颜色
          </div>

          <div className={cn('flex flex-wrap gap-1.5', compact ? 'gap-1' : 'gap-1.5')}>
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={cn(
                  'rounded-full border-2 transition-all duration-200',
                  compact ? 'w-5 h-5' : 'w-7 h-7',
                  selectedColor === color
                    ? 'border-white scale-110 shadow-lg'
                    : 'border-white/20 hover:border-white/40 hover:scale-105'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="w-full h-px bg-white/10" />

          <div className={cn('text-white/50', compact ? 'text-[9px]' : 'text-xs')}>
            {flags.length} / 50
          </div>

          <button
            onClick={handleClear}
            className={cn(
              'flex items-center gap-2 rounded-xl transition-all duration-200 border border-white/10',
              compact ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-xs',
              'bg-white/5 text-white/50 hover:bg-red-500/20 hover:border-red-400/30 hover:text-red-300'
            )}
          >
            <Trash2 size={compact ? 12 : 14} />
            <span>清空</span>
          </button>

          <button
            onClick={handleScreenshot}
            className={cn(
              'flex items-center gap-2 rounded-xl transition-all duration-200 border border-white/10',
              compact ? 'px-2 py-1.5 text-[10px]' : 'px-3 py-2 text-xs',
              'bg-white/5 text-white/50 hover:bg-cyan-500/20 hover:border-cyan-400/30 hover:text-cyan-300'
            )}
          >
            <Camera size={compact ? 12 : 14} />
            <span>截图</span>
          </button>
        </div>
      </div>
    </>
  )
}
