import { useState, useEffect, useRef } from 'react'
import { type Song, type Artist, useStore } from '@/store'
import { formatDuration, getRealTimeFrequencies } from '@/utils/audio'
import { getInitials } from '@/utils/storage'

interface PlayerProps {
  song: Song
  artist: Artist
  onClose: () => void
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(26, 26, 26, 0.8)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  animation: 'fadeIn 0.3s ease',
}

const playerContainerStyle: React.CSSProperties = {
  width: '90%',
  maxWidth: '500px',
  backgroundColor: '#1E1E1E',
  borderRadius: '16px',
  padding: '32px',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  animation: 'scaleIn 0.3s ease',
}

const closeButtonStyle: React.CSSProperties = {
  position: 'absolute',
  top: '16px',
  right: '16px',
  background: 'none',
  border: 'none',
  color: '#888',
  cursor: 'pointer',
  padding: '8px',
  fontSize: '24px',
  lineHeight: 1,
  transition: 'color 0.2s ease',
}

const coverStyle = (color: string): React.CSSProperties => ({
  width: '200px',
  height: '200px',
  borderRadius: '12px',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 24px',
})

const musicIconStyle: React.CSSProperties = {
  width: '80px',
  height: '80px',
  opacity: 0.6,
}

const songInfoStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '24px',
}

const titleStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  color: '#EAEAEA',
  marginBottom: '8px',
}

const artistNameStyle: React.CSSProperties = {
  fontSize: '16px',
  color: '#999',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
}

const miniAvatarStyle = (color: string): React.CSSProperties => ({
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  backgroundColor: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontSize: '12px',
  fontWeight: 600,
})

const canvasContainerStyle: React.CSSProperties = {
  width: '100%',
  height: '120px',
  marginBottom: '24px',
  borderRadius: '8px',
  backgroundColor: '#121212',
  overflow: 'hidden',
}

const canvasStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'block',
}

const progressContainerStyle: React.CSSProperties = {
  marginBottom: '20px',
}

const progressBarStyle: React.CSSProperties = {
  width: '100%',
  height: '6px',
  backgroundColor: '#333',
  borderRadius: '3px',
  cursor: 'pointer',
  position: 'relative',
  marginBottom: '8px',
}

const progressFillStyle = (percent: number): React.CSSProperties => ({
  height: '100%',
  backgroundColor: '#FF6B6B',
  borderRadius: '3px',
  width: `${percent}%`,
  transition: 'width 0.1s linear',
})

const timeStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  fontSize: '12px',
  color: '#888',
}

const controlsStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '32px',
  marginBottom: '24px',
}

const playButtonStyle = (isPlaying: boolean): React.CSSProperties => ({
  width: '64px',
  height: '64px',
  borderRadius: '50%',
  backgroundColor: '#FF6B6B',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'transform 0.2s ease',
  fontSize: isPlaying ? '24px' : '28px',
})

const sideButtonStyle: React.CSSProperties = {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  backgroundColor: 'transparent',
  color: '#888',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'color 0.2s ease',
}

const lyricsPlaceholderStyle: React.CSSProperties = {
  padding: '16px',
  backgroundColor: '#252525',
  borderRadius: '8px',
  marginBottom: '16px',
  minHeight: '80px',
  textAlign: 'center',
  color: '#666',
  fontSize: '14px',
  fontStyle: 'italic',
}

const likeContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
}

const likeButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '8px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  color: '#888',
  fontSize: '14px',
  transition: 'color 0.2s ease',
}

const likeButtonLikedStyle: React.CSSProperties = {
  color: '#FF4757',
}

const pulseAnimation: React.CSSProperties = {
  animation: 'pulse 0.3s ease',
}

const noteStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#888',
  textAlign: 'center',
  marginTop: '12px',
}

const playIcon = (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff" style={{ marginLeft: '4px' }}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
)

const pauseIcon = (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
)

const heartIcon = (filled: boolean) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
)

const musicNoteSVG = (
  <svg style={musicIconStyle} viewBox="0 0 24 24" fill="none" stroke="#EAEAEA" strokeWidth="1.5">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
)

export function Player({ song, artist, onClose }: PlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const { hasLikedSong, addLike, currentVisitorName, getLikesForSong, incrementPlayCount } = useStore()
  const liked = hasLikedSong(song.id, currentVisitorName)
  const likeCount = getLikesForSong(song.id).length

  useEffect(() => {
    const audio = new Audio(song.audioData)
    audioRef.current = audio

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime)
    })

    audio.addEventListener('ended', () => {
      setIsPlaying(false)
      setCurrentTime(0)
    })

    const initAudioContext = () => {
      if (!audioContextRef.current && audioRef.current) {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        audioContextRef.current = new AudioContext()
        analyserRef.current = audioContextRef.current.createAnalyser()
        analyserRef.current.fftSize = 256
        sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current)
        sourceRef.current.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
      }
    }

    const handlePlay = () => {
      initAudioContext()
      if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume()
      }
    }

    audio.addEventListener('play', handlePlay)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', () => {})
      audio.removeEventListener('ended', () => {})
      audio.removeEventListener('play', handlePlay)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect()
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect()
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [song.audioData])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const drawWaveform = () => {
      const width = canvas.width
      const height = canvas.height

      ctx.fillStyle = '#121212'
      ctx.fillRect(0, 0, width, height)

      if (analyserRef.current && isPlaying) {
        const frequencies = getRealTimeFrequencies(analyserRef.current)
        const barCount = 64
        const barWidth = width / barCount
        const gap = 2

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor(i * (frequencies.length / barCount))
          const value = frequencies[dataIndex]
          const barHeight = (value / 255) * height * 0.9
          const x = i * barWidth
          const y = (height - barHeight) / 2

          const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
          gradient.addColorStop(0, artist.avatarColor)
          gradient.addColorStop(1, '#FF6B6B')

          ctx.fillStyle = gradient
          ctx.fillRect(x + gap / 2, y, barWidth - gap, barHeight)
        }
      } else {
        const barCount = 64
        const barWidth = width / barCount
        const gap = 2

        for (let i = 0; i < barCount; i++) {
          const barHeight = height * 0.1 + Math.sin(i * 0.3 + Date.now() * 0.002) * height * 0.05
          const x = i * barWidth
          const y = (height - barHeight) / 2

          ctx.fillStyle = '#333'
          ctx.fillRect(x + gap / 2, y, barWidth - gap, barHeight)
        }
      }

      animationFrameRef.current = requestAnimationFrame(drawWaveform)
    }

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    drawWaveform()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, artist.avatarColor])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    } else {
      if (!isPlaying && currentTime === 0) {
        incrementPlayCount(song.id)
      }
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return
    const rect = e.currentTarget.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    audioRef.current.currentTime = percent * song.duration
  }

  const handleLike = () => {
    if (!liked) {
      addLike({ songId: song.id, visitorName: currentVisitorName })
      setIsAnimating(true)
      setTimeout(() => setIsAnimating(false), 300)
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === ' ' && audioRef.current) {
        e.preventDefault()
        togglePlay()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isPlaying, onClose])

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={playerContainerStyle}>
        <button style={closeButtonStyle} onClick={onClose}>×</button>

        <div style={coverStyle(song.coverColor)}>
          {musicNoteSVG}
        </div>

        <div style={songInfoStyle}>
          <h2 style={titleStyle}>{song.title}</h2>
          <div style={artistNameStyle}>
            <span style={miniAvatarStyle(artist.avatarColor)}>{getInitials(artist.name)}</span>
            <span>{artist.name}</span>
          </div>
        </div>

        <div style={canvasContainerStyle}>
          <canvas ref={canvasRef} style={{ ...canvasStyle, width: '100%', height: '100%' }} />
        </div>

        <div style={progressContainerStyle}>
          <div style={progressBarStyle} onClick={handleProgressClick}>
            <div style={progressFillStyle((currentTime / song.duration) * 100)} />
          </div>
          <div style={timeStyle}>
            <span>{formatDuration(currentTime)}</span>
            <span>{formatDuration(song.duration)}</span>
          </div>
        </div>

        <div style={controlsStyle}>
          <button style={sideButtonStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="19 20 9 12 19 4 19 20" />
              <line x1="5" y1="19" x2="5" y2="5" />
            </svg>
          </button>
          <button
            style={playButtonStyle(isPlaying)}
            onClick={togglePlay}
          >
            {isPlaying ? pauseIcon : playIcon}
          </button>
          <button style={sideButtonStyle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 4 15 12 5 20 5 4" />
              <line x1="19" y1="5" x2="19" y2="19" />
            </svg>
          </button>
        </div>

        <div style={lyricsPlaceholderStyle}>
          ♪ 歌词加载中...（歌词占位区域）
        </div>

        <div style={likeContainerStyle}>
          <button
            style={{
              ...likeButtonStyle,
              ...(liked ? likeButtonLikedStyle : {}),
              ...(isAnimating ? pulseAnimation : {}),
            }}
            onClick={handleLike}
          >
            {heartIcon(liked)}
            <span>{likeCount}</span>
          </button>
        </div>

        {song.note && <p style={noteStyle}>{song.note}</p>}
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }
        ${playButtonStyle(true)}:hover { transform: scale(1.1); }
        ${closeButtonStyle}:hover { color: #EAEAEA; }
        ${sideButtonStyle}:hover { color: #EAEAEA; }
      `}</style>
    </div>
  )
}
