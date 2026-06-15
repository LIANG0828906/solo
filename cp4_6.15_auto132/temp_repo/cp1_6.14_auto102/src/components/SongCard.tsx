import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, Pause, Disc3, User } from 'lucide-react'
import type { Song } from '@/types'
import { useMusicStore } from '@/stores/musicStore'

interface SongCardProps {
  song: Song
  index: number
}

export default function SongCard({ song, index }: SongCardProps) {
  const [hovering, setHovering] = useState(false)
  const [previewTime, setPreviewTime] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const intervalRef = useRef<number>(0)
  const { previewSong, isPreviewPlaying, setPreviewSong, setIsPreviewPlaying } = useMusicStore()

  const isCurrentPreview = previewSong?.id === song.id && isPreviewPlaying

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const handlePreview = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (isCurrentPreview) {
      audioRef.current?.pause()
      setIsPreviewPlaying(false)
      setPreviewSong(null)
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    if (!song.audioFile) return

    const audio = new Audio(song.audioFile)
    audioRef.current = audio
    audio.currentTime = 0
    setPreviewTime(0)

    audio.play().then(() => {
      setPreviewSong(song)
      setIsPreviewPlaying(true)

      intervalRef.current = window.setInterval(() => {
        setPreviewTime(audio.currentTime)
        if (audio.currentTime >= 30) {
          audio.pause()
          setIsPreviewPlaying(false)
          setPreviewSong(null)
          clearInterval(intervalRef.current)
        }
      }, 100)
    }).catch(() => {})

    audio.onended = () => {
      setIsPreviewPlaying(false)
      setPreviewSong(null)
      clearInterval(intervalRef.current)
    }
  }

  const progress = Math.min((previewTime / 30) * 100, 100)

  return (
    <Link
      to={`/song/${song.id}`}
      className="group block"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <div
        className="glass-card overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-brand-indigo/10"
        style={{ animationDelay: `${index * 80}ms` }}
      >
        <div className="relative aspect-square overflow-hidden">
          {song.coverImage ? (
            <img src={song.coverImage} alt={song.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full vinyl-placeholder flex items-center justify-center">
              <Disc3 className="w-16 h-16 text-gray-500 opacity-50" />
            </div>
          )}
          <div className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity duration-300 ${hovering ? 'opacity-100' : 'opacity-0'}`}>
            <div className="text-center">
              <p className="text-white text-sm font-medium mb-1">{song.title}</p>
              <p className="text-gray-300 text-xs">{song.artist}</p>
            </div>
          </div>
          {isCurrentPreview && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
              <div className="h-full progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <div className="p-3">
          <h3 className="font-display font-semibold text-sm text-white truncate mb-1">{song.title}</h3>
          <div className="flex items-center gap-2 mb-2">
            {song.artistAvatar ? (
              <img src={song.artistAvatar} alt={song.artist} className="w-5 h-5 rounded-full" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
                <User className="w-3 h-3 text-gray-400" />
              </div>
            )}
            <span className="text-xs text-gray-400 truncate">{song.artist}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">¥{song.priceDigital}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300">¥{song.priceCD}</span>
          </div>
        </div>

        <button
          onClick={handlePreview}
          className={`absolute bottom-14 right-3 w-9 h-9 rounded-full gradient-bg flex items-center justify-center text-white shadow-lg transition-all duration-300 btn-press ${hovering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
        >
          {isCurrentPreview ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>
      </div>
    </Link>
  )
}
