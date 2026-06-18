import { useState, useRef, useCallback, useEffect } from 'react'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
} from 'lucide-react'
import { useMusicStore } from '@/store/musicStore'
import { cn } from '@/lib/utils'
import { LoopMode } from '@/types'
import { formatTime } from '@/utils/helpers'

const getLoopIcon = (mode: LoopMode) => {
  switch (mode) {
    case 'single':
      return Repeat1
    case 'shuffle':
      return Shuffle
    case 'list':
    default:
      return Repeat
  }
}

export default function Player() {
  const {
    player,
    togglePlay,
    nextSong,
    prevSong,
    setVolume,
    setCurrentTime,
    toggleLoopMode,
  } = useMusicStore()

  const { currentSong, isPlaying, currentTime, duration, volume, loopMode, isTransitioning } = player

  const [isDragging, setIsDragging] = useState(false)
  const [dragTime, setDragTime] = useState(0)
  const [isMuted, setIsMuted] = useState(false)
  const [prevVolume, setPrevVolume] = useState(volume)
  const [hoverX, setHoverX] = useState<number | null>(null)
  const [isHovering, setIsHovering] = useState(false)

  const progressRef = useRef<HTMLDivElement>(null)

  const getTimeFromX = useCallback(
    (clientX: number) => {
      if (!progressRef.current || !duration) return 0
      const rect = progressRef.current.getBoundingClientRect()
      const x = clientX - rect.left
      const ratio = Math.max(0, Math.min(1, x / rect.width))
      return ratio * duration
    },
    [duration]
  )

  const getTimeFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent<HTMLDivElement>) => {
      return getTimeFromX(e.clientX)
    },
    [getTimeFromX]
  )

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setCurrentTime(getTimeFromEvent(e))
    },
    [getTimeFromEvent, setCurrentTime]
  )

  const handleProgressMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setHoverX(e.clientX)
    },
    []
  )

  const handleProgressMouseEnter = useCallback(() => {
    setIsHovering(true)
  }, [])

  const handleProgressMouseLeave = useCallback(() => {
    setIsHovering(false)
    setHoverX(null)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMove = (e: MouseEvent) => {
      setDragTime(getTimeFromX(e.clientX))
      setHoverX(e.clientX)
    }
    const handleUp = (e: MouseEvent) => {
      setCurrentTime(getTimeFromX(e.clientX))
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isDragging, getTimeFromX, setCurrentTime])

  const handleMuteToggle = () => {
    if (isMuted) {
      setVolume(prevVolume)
      setIsMuted(false)
    } else {
      setPrevVolume(volume)
      setVolume(0)
      setIsMuted(true)
    }
  }

  const displayTime = isDragging ? dragTime : currentTime
  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  const getTooltipPosition = () => {
    if (!progressRef.current || hoverX === null) return { left: 0, time: 0 }
    const rect = progressRef.current.getBoundingClientRect()
    const x = hoverX - rect.left
    const ratio = Math.max(0, Math.min(1, x / rect.width))
    const leftPx = ratio * rect.width
    const clampedLeft = Math.max(20, Math.min(leftPx, rect.width - 20))
    return { left: clampedLeft, time: ratio * duration }
  }

  const showTooltip = isHovering || isDragging

  const volumePercent = (isMuted ? 0 : volume) * 100

  if (!currentSong) return null

  const LoopIcon = getLoopIcon(loopMode)

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl bg-[#0a0e27]/90 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div
          ref={progressRef}
          className="h-1.5 -mt-0.5 cursor-pointer group relative"
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseMove={handleProgressMouseMove}
          onMouseEnter={handleProgressMouseEnter}
          onMouseLeave={handleProgressMouseLeave}
        >
          <div className="h-full bg-white/10 relative rounded-full">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #0099cc, #00d4ff)',
              }}
            />
            <div
              className={cn(
                'absolute top-1/2 w-3 h-3 rounded-full transition-opacity shadow-[0_0_6px_rgba(0,212,255,0.5)]',
                showTooltip ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              )}
              style={{
                left: `${progress}%`,
                transform: 'translate(-50%, -50%)',
                background: '#00d4ff',
              }}
            />
          </div>

          {showTooltip && hoverX !== null && duration > 0 && (
            <div
              className="absolute -top-9 pointer-events-none z-50 transition-opacity duration-150"
              style={{
                left: `${getTooltipPosition().left}px`,
                transform: 'translateX(-50%)',
              }}
            >
              <div className="bg-[#0a0e27] border border-white/20 text-[#00d4ff] text-xs font-medium px-2 py-1 rounded-md whitespace-nowrap shadow-lg shadow-black/40">
                {formatTime(getTooltipPosition().time)}
              </div>
              <div className="flex justify-center -mt-0.5">
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-white/20" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center h-16 gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className={cn(
                'w-10 h-10 rounded-lg flex-shrink-0 shadow-lg',
                isPlaying && !isTransitioning && 'animate-pulse'
              )}
              style={{ backgroundColor: currentSong.color }}
            />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{currentSong.title}</p>
              <p className="text-xs text-white/50 truncate">{currentSong.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevSong}
              className="text-white/60 hover:text-white transition-colors"
            >
              <SkipBack size={20} />
            </button>
            <button
              onClick={togglePlay}
              disabled={isTransitioning}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-colors',
                isTransitioning
                  ? 'bg-white/10 text-white/30'
                  : 'bg-[#00d4ff] text-[#0a0e27] hover:bg-[#00d4ff]/90'
              )}
            >
              {isPlaying && !isTransitioning ? (
                <Pause size={20} />
              ) : (
                <Play size={20} fill="currentColor" />
              )}
            </button>
            <button
              onClick={nextSong}
              className="text-white/60 hover:text-white transition-colors"
            >
              <SkipForward size={20} />
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-3 flex-1 justify-end">
            <span className="text-xs text-white/40 tabular-nums">
              {formatTime(displayTime)} / {formatTime(duration)}
            </span>
            <button
              onClick={handleMuteToggle}
              className="text-white/60 hover:text-white transition-colors"
            >
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div className="relative w-24 h-6 flex items-center group/vol">
              <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1 rounded-full overflow-hidden bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${volumePercent}%`,
                    background: 'linear-gradient(90deg, #0099cc, #00d4ff)',
                  }}
                />
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value))
                  if (Number(e.target.value) > 0) setIsMuted(false)
                }}
                className="volume-slider w-full relative z-10"
              />
              <div
                className="absolute top-1/2 w-3.5 h-3.5 rounded-full pointer-events-none shadow-[0_0_8px_rgba(0,212,255,0.4)] transition-transform duration-100 group-hover/vol:scale-125"
                style={{
                  left: `calc(${volumePercent}% - 7px)`,
                  background: 'linear-gradient(135deg, #0099cc, #00d4ff)',
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
            <button
              onClick={toggleLoopMode}
              className={cn(
                'transition-colors',
                loopMode === 'list' ? 'text-white/40 hover:text-white/60' : 'text-[#00d4ff]'
              )}
            >
              <LoopIcon size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
