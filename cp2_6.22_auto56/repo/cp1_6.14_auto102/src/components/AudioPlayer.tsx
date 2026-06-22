import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Volume2, Heart } from 'lucide-react'
import { useMusicStore } from '@/stores/musicStore'

export default function AudioPlayer() {
  const { currentSong, isPlaying, setIsPlaying, favorites, toggleFavorite } = useMusicStore()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const rafRef = useRef<number>(0)

  useEffect(() => {
    if (!currentSong?.audioFile) return

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(currentSong.audioFile)
    audioRef.current = audio

    audio.onloadedmetadata = () => setDuration(audio.duration)
    audio.onended = () => setIsPlaying(false)

    if (isPlaying) {
      audio.play().catch(() => {})
    }

    return () => {
      audio.pause()
      cancelAnimationFrame(rafRef.current)
    }
  }, [currentSong])

  useEffect(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.play().catch(() => {})
      const update = () => {
        if (audioRef.current && !isDragging) {
          setCurrentTime(audioRef.current.currentTime)
        }
        rafRef.current = requestAnimationFrame(update)
      }
      rafRef.current = requestAnimationFrame(update)
    } else {
      audioRef.current.pause()
      cancelAnimationFrame(rafRef.current)
    }
  }, [isPlaying, isDragging])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value)
    setCurrentTime(time)
    if (audioRef.current) {
      audioRef.current.currentTime = time
    }
  }, [])

  const formatTime = (t: number) => {
    if (!t || isNaN(t)) return '0:00'
    const m = Math.floor(t / 60)
    const s = Math.floor(t % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const isFav = currentSong ? favorites.includes(currentSong.id) : false

  if (!currentSong) return null

  return (
    <div className="glass-card p-6 mb-6">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 vinyl-placeholder flex items-center justify-center">
          {currentSong.coverImage ? (
            <img src={currentSong.coverImage} alt={currentSong.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" opacity="0.3"/><circle cx="12" cy="12" r="4" opacity="0.5"/></svg>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="font-display font-bold text-lg text-white truncate">{currentSong.title}</h2>
          <p className="text-sm text-gray-400">{currentSong.artist}</p>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-xs text-gray-400 w-10 text-right">{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              className="flex-1 h-1 cursor-pointer"
            />
            <span className="text-xs text-gray-400 w-10">{formatTime(duration)}</span>
          </div>

          <div className="mt-2 flex items-center gap-3">
            <button onClick={() => { if (audioRef.current) { audioRef.current.currentTime = Math.max(0, currentTime - 10) } }} className="text-gray-400 hover:text-white transition-colors btn-press">
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-white btn-press hover:shadow-lg hover:shadow-brand-indigo/30 transition-shadow"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button onClick={() => { if (audioRef.current) { audioRef.current.currentTime = Math.min(duration, currentTime + 10) } }} className="text-gray-400 hover:text-white transition-colors btn-press">
              <SkipForward className="w-4 h-4" />
            </button>
            <Volume2 className="w-4 h-4 text-gray-400 ml-auto" />
          </div>
        </div>

        <button
          onClick={() => toggleFavorite(currentSong.id)}
          className={`flex-shrink-0 transition-all duration-300 btn-press ${isFav ? 'animate-heart-beat' : ''}`}
        >
          <Heart className={`w-6 h-6 transition-colors duration-300 ${isFav ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
        </button>
      </div>
    </div>
  )
}
