import { useRef, useCallback, useEffect } from 'react'
import { Upload, Play, Pause, Volume2 } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { useAudioAnalyzer } from '@/hooks/useAudioAnalyzer'
import { themeConfigs } from '@/utils/colorUtils'
import type { ThemeType } from '@/types'

export function AudioPlayer() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)

  const { loadAudioFile, play, pause, seek, getCurrentTime, getDuration } = useAudioAnalyzer()

  const audioFile = useAppStore((state) => state.audioFile)
  const isPlaying = useAppStore((state) => state.isPlaying)
  const currentTime = useAppStore((state) => state.currentTime)
  const duration = useAppStore((state) => state.duration)
  const volume = useAppStore((state) => state.volume)
  const currentTheme = useAppStore((state) => state.currentTheme)

  const setAudioFile = useAppStore((state) => state.setAudioFile)
  const setIsPlaying = useAppStore((state) => state.setIsPlaying)
  const setCurrentTime = useAppStore((state) => state.setCurrentTime)
  const setDuration = useAppStore((state) => state.setDuration)
  const setVolume = useAppStore((state) => state.setVolume)
  const setCurrentTheme = useAppStore((state) => state.setCurrentTheme)

  const themes: ThemeType[] = ['neon', 'aurora', 'lava']

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      if (!file.type.includes('audio/mpeg') && !file.type.includes('audio/wav') && !file.type.includes('audio/x-wav') && !file.type.includes('audio/wave')) {
        alert('请上传MP3或WAV格式的音频文件')
        return
      }

      setAudioFile(file)
      const audioElement = await loadAudioFile(file)

      audioElement.addEventListener('loadedmetadata', () => {
        setDuration(audioElement.duration)
      })

      audioElement.addEventListener('timeupdate', () => {
        if (!isDraggingRef.current) {
          setCurrentTime(audioElement.currentTime)
        }
      })

      audioElement.addEventListener('ended', () => {
        setIsPlaying(false)
        setCurrentTime(0)
      })

      await play()
      setIsPlaying(true)
    },
    [loadAudioFile, setAudioFile, setDuration, setCurrentTime, setIsPlaying, play],
  )

  const handleUploadClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handlePlayPause = useCallback(async () => {
    if (!audioFile) return

    if (isPlaying) {
      pause()
      setIsPlaying(false)
    } else {
      await play()
      setIsPlaying(true)
    }
  }, [audioFile, isPlaying, play, pause, setIsPlaying])

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressRef.current || duration === 0) return

      const rect = progressRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = percentage * duration

      seek(newTime)
      setCurrentTime(newTime)
    },
    [duration, seek, setCurrentTime],
  )

  const handleProgressMouseDown = useCallback(() => {
    isDraggingRef.current = true
  }, [])

  const handleProgressMouseUp = useCallback(() => {
    isDraggingRef.current = false
  }, [])

  const handleProgressMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isDraggingRef.current || !progressRef.current || duration === 0) return

      const rect = progressRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = Math.max(0, Math.min(1, x / rect.width))
      const newTime = percentage * duration

      seek(newTime)
      setCurrentTime(newTime)
    },
    [duration, seek, setCurrentTime],
  )

  const handleVolumeChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newVolume = parseFloat(e.target.value)
      setVolume(newVolume)
    },
    [setVolume],
  )

  const handleThemeChange = useCallback(
    (theme: ThemeType) => {
      setCurrentTheme(theme)
    },
    [setCurrentTheme],
  )

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) {
        setCurrentTime(getCurrentTime())
      }
    }, 100)
    return () => clearInterval(interval)
  }, [isPlaying, getCurrentTime, setCurrentTime])

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="control-bar">
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.wave"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />

      <button className="upload-btn" onClick={handleUploadClick} title="上传音频">
        <Upload size={20} />
      </button>

      <button
        className={`play-btn ${!audioFile ? 'disabled' : ''}`}
        onClick={handlePlayPause}
        disabled={!audioFile}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
      </button>

      <div
        ref={progressRef}
        className="progress-container"
        onClick={handleProgressClick}
        onMouseDown={handleProgressMouseDown}
        onMouseUp={handleProgressMouseUp}
        onMouseMove={handleProgressMouseMove}
        onMouseLeave={handleProgressMouseUp}
      >
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progressPercentage}%` }} />
          <div
            className="progress-thumb"
            style={{ left: `calc(${progressPercentage}% - 6px)` }}
          />
        </div>
        <span className="time-display">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>

      <div className="volume-container">
        <Volume2 size={16} />
        <input
          type="range"
          className="volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>

      <div className="theme-switcher">
        {themes.map((theme) => (
          <button
            key={theme}
            className={`theme-dot ${currentTheme === theme ? 'active' : ''}`}
            style={{ backgroundColor: themeConfigs[theme].dotColor }}
            onClick={() => handleThemeChange(theme)}
            title={themeConfigs[theme].name}
          />
        ))}
      </div>
    </div>
  )
}
