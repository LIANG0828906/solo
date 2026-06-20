import { useState, useRef, useEffect, useCallback } from 'react'
import { audioEngine } from './AudioEngine'
import { WaveCanvas, type WaveCanvasHandle } from './WaveCanvas'
import { ParticleCanvas, type ParticleCanvasHandle } from './ParticleCanvas'
import { ControlPanel } from './ControlPanel'
import type { WaveformType, LFOTarget, ADSRParams, PathPoint, Note } from './types'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

function frequencyToNoteName(freq: number): string {
  const noteNum = 12 * (Math.log(freq / 440) / Math.log(2)) + 69
  const octave = Math.floor(noteNum / 12) - 1
  const noteIndex = Math.round(noteNum) % 12
  return NOTE_NAMES[noteIndex] + octave
}

function yToFrequency(y: number): number {
  const minFreq = 110
  const maxFreq = 880
  const normalized = 1 - y
  return minFreq * Math.pow(maxFreq / minFreq, normalized)
}

export default function App() {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 500 })
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentWaveform, setCurrentWaveform] = useState<WaveformType>('sine')
  const [envelope, setEnvelope] = useState<ADSRParams>({
    attack: 0.1,
    decay: 0.2,
    sustain: 0.7,
    release: 0.5
  })
  const [lfoEnabled, setLfoEnabled] = useState(false)
  const [lfoFrequency, setLfoFrequency] = useState(2)
  const [lfoTarget, setLfoTarget] = useState<LFOTarget>('volume')
  const [isInitialized, setIsInitialized] = useState(false)

  const waveCanvasRef = useRef<WaveCanvasHandle>(null)
  const particleCanvasRef = useRef<ParticleCanvasHandle>(null)
  const pathPointsRef = useRef<PathPoint[]>([])
  const lastPosRef = useRef<{ x: number; y: number; timestamp: number } | null>(null)
  const stopPlaybackRef = useRef<(() => void) | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setCanvasSize({
          width: Math.floor(rect.width),
          height: Math.floor(rect.height)
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    audioEngine.setOnNotePlayCallback((frequency, velocity) => {
      const y = canvasSize.height * (1 - (Math.log(frequency / 110) / Math.log(880 / 110)))
      if (particleCanvasRef.current) {
        for (let i = 0; i < 3; i++) {
          const offsetX = (Math.random() - 0.5) * 100
          particleCanvasRef.current.emitParticle(
            canvasSize.width / 2 + offsetX,
            Math.max(20, Math.min(canvasSize.height - 20, y)),
            frequency,
            velocity
          )
        }
      }
    })
    return () => {
      audioEngine.setOnNotePlayCallback(() => {})
    }
  }, [canvasSize])

  useEffect(() => {
    const animate = () => {
      const waveformData = audioEngine.getWaveformData()
      if (waveCanvasRef.current) {
        waveCanvasRef.current.paintFrame(waveformData)
      }
      const lfoIntensity = lfoEnabled ? Math.sin(Date.now() * lfoFrequency * 0.001 * Math.PI * 2) * 0.5 + 0.5 : 0
      if (particleCanvasRef.current) {
        particleCanvasRef.current.animate(lfoIntensity)
      }
      animationFrameRef.current = requestAnimationFrame(animate)
    }
    animationFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [lfoEnabled, lfoFrequency])

  const handleCanvasMouseDown = useCallback(async (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInitialized) {
      await audioEngine.init()
      setIsInitialized(true)
    }
    if (stopPlaybackRef.current) {
      stopPlaybackRef.current()
      stopPlaybackRef.current = null
      setIsPlaying(false)
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setIsDrawing(true)
    pathPointsRef.current = [{
      x: x / rect.width,
      y: y / rect.height,
      timestamp: Date.now()
    }]
    lastPosRef.current = { x, y, timestamp: Date.now() }
    if (waveCanvasRef.current) {
      waveCanvasRef.current.clearCanvas()
    }
    const freq = yToFrequency(y / rect.height)
    waveCanvasRef.current?.drawPitchIndicator(x, y, frequencyToNoteName(freq))
  }, [isInitialized])

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const freq = yToFrequency(y / rect.height)
    waveCanvasRef.current?.drawPitchIndicator(x, y, frequencyToNoteName(freq))
    if (!isDrawing) return
    const now = Date.now()
    if (lastPosRef.current && now - lastPosRef.current.timestamp >= 30) {
      pathPointsRef.current.push({
        x: x / rect.width,
        y: y / rect.height,
        timestamp: now
      })
      lastPosRef.current = { x, y, timestamp: now }
      if (waveCanvasRef.current) {
        waveCanvasRef.current.drawPath(pathPointsRef.current)
      }
    }
  }, [isDrawing])

  const handleCanvasMouseUp = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (pathPointsRef.current.length >= 2) {
      const notes = pathToNotes(pathPointsRef.current)
      if (notes.length > 0) {
        setIsPlaying(true)
        stopPlaybackRef.current = audioEngine.playSequence(notes, true, () => {})
      }
    }
  }, [isDrawing])

  const pathToNotes = (points: PathPoint[]): Note[] => {
    if (points.length < 2) return []
    const notes: Note[] = []
    const totalDuration = 4
    const minNoteDuration = 0.15
    let lastNoteTime = -1
    for (let i = 0; i < points.length; i++) {
      const point = points[i]
      const startTime = point.x * totalDuration
      if (startTime - lastNoteTime < minNoteDuration && i > 0) continue
      const frequency = yToFrequency(point.y)
      let velocity = 0.6
      if (i > 0) {
        const prevPoint = points[i - 1]
        const dx = (point.x - prevPoint.x)
        const dy = (point.y - prevPoint.y)
        const dt = (point.timestamp - prevPoint.timestamp) / 1000
        if (dt > 0) {
          const speed = Math.sqrt(dx * dx + dy * dy) / dt
          velocity = Math.min(1, Math.max(0.2, speed * 0.3))
        }
      }
      notes.push({
        frequency,
        velocity,
        startTime,
        duration: minNoteDuration
      })
      lastNoteTime = startTime
    }
    return notes
  }

  const handleWaveformChange = useCallback((type: WaveformType) => {
    setCurrentWaveform(type)
    audioEngine.setWaveform(type)
  }, [])

  const handleEnvelopeChange = useCallback((adsr: ADSRParams) => {
    setEnvelope(adsr)
    audioEngine.setEnvelope(adsr)
  }, [])

  const handleLFOChange = useCallback((enabled: boolean, freq: number, target: LFOTarget) => {
    setLfoEnabled(enabled)
    setLfoFrequency(freq)
    setLfoTarget(target)
    if (enabled) {
      audioEngine.startLFO(freq, target)
    } else {
      audioEngine.stopLFO()
    }
  }, [])

  const handleNotePlay = useCallback((freq: number) => {
    if (!isInitialized) {
      audioEngine.init().then(() => {
        audioEngine.playNote(freq, 0.7)
        setIsInitialized(true)
      })
    } else {
      audioEngine.playNote(freq, 0.7)
    }
  }, [isInitialized])

  const handleStop = useCallback(() => {
    if (stopPlaybackRef.current) {
      stopPlaybackRef.current()
      stopPlaybackRef.current = null
    }
    audioEngine.stopNote()
    setIsPlaying(false)
    if (waveCanvasRef.current) {
      waveCanvasRef.current.clearCanvas()
    }
    pathPointsRef.current = []
  }, [])

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">音乐节奏可视化与音效合成</h1>
        <div className="header-controls">
          <button className={`control-btn ${isPlaying ? 'active' : ''}`} onClick={handleStop}>
            {isPlaying ? '停止播放' : '清空画布'}
          </button>
          <div className="status-indicator">
            <span className={`status-dot ${isInitialized ? 'ready' : ''}`} />
            <span className="status-text">{isInitialized ? '音频就绪' : '点击画布初始化'}</span>
          </div>
        </div>
      </header>
      <div className="main-content">
        <div className="canvas-container" ref={containerRef}>
          <WaveCanvas
            ref={waveCanvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          />
          <ParticleCanvas
            ref={particleCanvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
          />
          <div className="canvas-hint">
            {!isDrawing && !isPlaying && (
              <p>按住鼠标在画布上拖动绘制路径，松开后自动播放旋律</p>
            )}
            {isDrawing && <p>继续绘制... 松开鼠标开始播放</p>}
            {isPlaying && <p>正在循环播放 • 点击画布重新绘制</p>}
          </div>
        </div>
        <ControlPanel
          currentWaveform={currentWaveform}
          onWaveformChange={handleWaveformChange}
          envelope={envelope}
          onEnvelopeChange={handleEnvelopeChange}
          lfoEnabled={lfoEnabled}
          lfoFrequency={lfoFrequency}
          lfoTarget={lfoTarget}
          onLFOChange={handleLFOChange}
          onNotePlay={handleNotePlay}
        />
      </div>
    </div>
  )
}
