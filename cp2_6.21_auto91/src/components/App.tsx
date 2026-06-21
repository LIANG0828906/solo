import React, { useState, useEffect, useRef, useCallback } from 'react'
import { AudioEngine, type SpectrumData } from '../audioEngine'
import { Visualizer } from '../visualizer'
import { themes, defaultTheme, type ThemeConfig } from '../themeConfig'
import { ControlPanel } from './ControlPanel'
import './App.css'

type LayoutMode = 'desktop' | 'tablet' | 'mobile'

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const visualizerRef = useRef<Visualizer | null>(null)
  const audioEngineRef = useRef<AudioEngine | null>(null)
  const spectrumDataRef = useRef<SpectrumData>({
    frequencies: [],
    waveform: [],
    beatIntensity: 0,
  })

  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [currentTheme, setCurrentTheme] = useState(defaultTheme.name)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('desktop')

  useEffect(() => {
    if (!canvasRef.current) return

    const engine = new AudioEngine()
    const visualizer = new Visualizer(canvasRef.current)

    audioEngineRef.current = engine
    visualizerRef.current = visualizer

    engine.setSpectrumCallback((data) => {
      spectrumDataRef.current = data
      visualizer.setData(data)
    })

    const handleResize = () => {
      const canvasContainer = canvasRef.current?.parentElement
      if (!canvasContainer || !canvasRef.current) return

      const w = canvasContainer.clientWidth
      const h = canvasContainer.clientHeight

      visualizer.resize(w, h)

      const width = window.innerWidth
      if (width >= 1280) {
        setLayoutMode('desktop')
        engine.setBarCount(32)
        visualizer.setBarCount(32)
        visualizer.setParticleCount(100)
      } else if (width >= 768) {
        setLayoutMode('tablet')
        engine.setBarCount(32)
        visualizer.setBarCount(32)
        visualizer.setParticleCount(80)
      } else {
        setLayoutMode('mobile')
        engine.setBarCount(16)
        visualizer.setBarCount(16)
        visualizer.setParticleCount(50)
      }
    }

    handleResize()
    visualizer.start()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      visualizer.destroy()
      engine.destroy()
    }
  }, [])

  useEffect(() => {
    if (!visualizerRef.current) return
    const theme = themes[currentTheme] || defaultTheme
    visualizerRef.current.setTheme(theme)
  }, [currentTheme])

  useEffect(() => {
    if (!audioEngineRef.current) return
    audioEngineRef.current.setVolume(volume)
  }, [volume])

  useEffect(() => {
    let animationId: number

    const updateTime = () => {
      if (audioEngineRef.current) {
        setCurrentTime(audioEngineRef.current.getCurrentTime())
      }
      animationId = requestAnimationFrame(updateTime)
    }

    if (isPlaying) {
      animationId = requestAnimationFrame(updateTime)
    }

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [isPlaying])

  const handleFileUpload = useCallback(async (file: File) => {
    const engine = audioEngineRef.current
    if (!engine) return

    setIsLoading(true)
    setUploadProgress(0)
    setFileName(file.name)

    const startTime = Date.now()
    const fileSize = file.size

    try {
      let loaded = 0
      const reader = file.stream().getReader()
      const chunks: Uint8Array[] = []

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        chunks.push(value)
        loaded += value.length
        const progress = (loaded / fileSize) * 100
        setUploadProgress(progress)

        await new Promise((resolve) => setTimeout(resolve, 5))
      }

      const arrayBuffer = new Uint8Array(loaded)
      let offset = 0
      for (const chunk of chunks) {
        arrayBuffer.set(chunk, offset)
        offset += chunk.length
      }

      const blob = new Blob([arrayBuffer], { type: file.type })
      const newFile = new File([blob], file.name, { type: file.type })

      await engine.loadFile(newFile)

      setDuration(engine.getDuration())
      setIsPlaying(true)
      engine.play()

      const elapsed = (Date.now() - startTime) / 1000
      const remaining = Math.max(0, (100 - uploadProgress) / 100 * elapsed)
      void remaining
    } catch (error) {
      console.error('Failed to load audio file:', error)
      setFileName(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handlePlayPause = useCallback(() => {
    const engine = audioEngineRef.current
    if (!engine || !fileName) return

    if (isPlaying) {
      engine.pause()
      setIsPlaying(false)
    } else {
      engine.play()
      setIsPlaying(true)
    }
  }, [isPlaying, fileName])

  const handleSeek = useCallback((time: number) => {
    const engine = audioEngineRef.current
    if (!engine) return
    engine.seek(time)
    setCurrentTime(time)
  }, [])

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value)
  }, [])

  const handleThemeChange = useCallback((themeName: string) => {
    setCurrentTheme(themeName)
  }, [])

  const themeList: ThemeConfig[] = Object.values(themes)

  return (
    <div className={`app app--${layoutMode}`}>
      <ControlPanel
        isPlaying={isPlaying}
        currentTime={currentTime}
        duration={duration}
        volume={volume}
        currentTheme={currentTheme}
        themes={themeList}
        uploadProgress={uploadProgress}
        isLoading={isLoading}
        fileName={fileName}
        onFileUpload={handleFileUpload}
        onPlayPause={handlePlayPause}
        onSeek={handleSeek}
        onVolumeChange={handleVolumeChange}
        onThemeChange={handleThemeChange}
        layoutMode={layoutMode}
      />

      <div className="app__visualizer">
        <canvas ref={canvasRef} className="app__canvas" />
        {!fileName && !isLoading && (
          <div className="app__overlay">
            <div className="app__overlay-content">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <h2>上传一首音乐开始体验</h2>
              <p>支持MP3, WAV, OGG格式</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
