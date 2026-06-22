import { useReducer, useEffect, useRef, useState, useCallback } from 'react'
import BeatGrid from './BeatGrid'
import { AudioEngine, GRID_COLS, GRID_ROWS, type GridData } from './AudioEngine'

interface SavedPattern {
  id: string
  name: string
  bpm: number
  grid: GridData
  createdAt: number
}

interface AppState {
  grid: GridData
  bpm: number
  volume: number
  isPlaying: boolean
  metronomeEnabled: boolean
  currentCol: number
  savedPatterns: SavedPattern[]
  patternName: string
}

type Action =
  | { type: 'SET_GRID'; grid: GridData }
  | { type: 'TOGGLE_CELL'; row: number; col: number }
  | { type: 'SET_BPM'; bpm: number }
  | { type: 'SET_VOLUME'; volume: number }
  | { type: 'SET_PLAYING'; playing: boolean }
  | { type: 'TOGGLE_METRONOME' }
  | { type: 'SET_CURRENT_COL'; col: number }
  | { type: 'SET_PATTERN_NAME'; name: string }
  | { type: 'SAVE_PATTERN'; pattern: SavedPattern }
  | { type: 'DELETE_PATTERN'; id: string }
  | { type: 'LOAD_PATTERN'; pattern: SavedPattern }
  | { type: 'CLEAR_GRID' }
  | { type: 'SET_SAVED_PATTERNS'; patterns: SavedPattern[] }

const MAX_PATTERNS = 10
const STORAGE_KEY = 'cyber_rhythm_patterns_v1'

const createEmptyGrid = (): GridData =>
  Array.from({ length: GRID_ROWS }, () => Array.from({ length: GRID_COLS }, () => false))

const createDefaultState = (): AppState => ({
  grid: createEmptyGrid(),
  bpm: 120,
  volume: 0.7,
  isPlaying: false,
  metronomeEnabled: false,
  currentCol: -1,
  savedPatterns: [],
  patternName: '',
})

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_GRID':
      return { ...state, grid: action.grid }
    case 'TOGGLE_CELL': {
      const newGrid = state.grid.map(r => [...r])
      newGrid[action.row][action.col] = !newGrid[action.row][action.col]
      return { ...state, grid: newGrid }
    }
    case 'SET_BPM':
      return { ...state, bpm: Math.max(40, Math.min(240, action.bpm)) }
    case 'SET_VOLUME':
      return { ...state, volume: Math.max(0, Math.min(1, action.volume)) }
    case 'SET_PLAYING':
      return { ...state, isPlaying: action.playing, currentCol: action.playing ? 0 : -1 }
    case 'TOGGLE_METRONOME':
      return { ...state, metronomeEnabled: !state.metronomeEnabled }
    case 'SET_CURRENT_COL':
      return { ...state, currentCol: action.col }
    case 'SET_PATTERN_NAME':
      return { ...state, patternName: action.name.slice(0, 20) }
    case 'SAVE_PATTERN': {
      const patterns = [action.pattern, ...state.savedPatterns].slice(0, MAX_PATTERNS)
      return { ...state, savedPatterns: patterns, patternName: '' }
    }
    case 'DELETE_PATTERN':
      return { ...state, savedPatterns: state.savedPatterns.filter(p => p.id !== action.id) }
    case 'LOAD_PATTERN':
      return {
        ...state,
        grid: action.pattern.grid.map(r => [...r]),
        bpm: action.pattern.bpm,
        isPlaying: false,
        currentCol: -1,
      }
    case 'CLEAR_GRID':
      return { ...state, grid: createEmptyGrid() }
    case 'SET_SAVED_PATTERNS':
      return { ...state, savedPatterns: action.patterns }
    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, createDefaultState)
  const audioEngineRef = useRef<AudioEngine | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafIdRef = useRef<number | null>(null)
  const [canvasHeight, setCanvasHeight] = useState(120)
  const [toast, setToast] = useState<{ type: 'error' | 'success' | 'info'; text: string; id: number } | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  const showToast = useCallback((type: 'error' | 'success' | 'info', text: string) => {
    if (toastTimerRef.current !== null) {
      clearTimeout(toastTimerRef.current)
    }
    const id = Date.now()
    setToast({ type, text, id })
    toastTimerRef.current = window.setTimeout(() => {
      setToast((current) => (current && current.id === id ? null : current))
    }, 2500)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 800) {
        setCanvasHeight(80)
      } else {
        setCanvasHeight(120)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed: SavedPattern[] = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          dispatch({ type: 'SET_SAVED_PATTERNS', patterns: parsed.slice(0, MAX_PATTERNS) })
        }
      } catch {
        // ignore
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedPatterns))
  }, [state.savedPatterns])

  useEffect(() => {
    audioEngineRef.current = new AudioEngine({
      onStep: (col: number) => {
        dispatch({ type: 'SET_CURRENT_COL', col })
      },
    })
    return () => {
      audioEngineRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setGrid(state.grid)
    }
  }, [state.grid])

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setBpm(state.bpm)
    }
  }, [state.bpm])

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setVolume(state.volume)
    }
  }, [state.volume])

  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.setMetronome(state.metronomeEnabled)
    }
  }, [state.metronomeEnabled])

  const handlePlay = useCallback(() => {
    const engine = audioEngineRef.current
    if (!engine) return
    if (state.isPlaying) {
      engine.stop()
      dispatch({ type: 'SET_PLAYING', playing: false })
    } else {
      engine.play()
      dispatch({ type: 'SET_PLAYING', playing: true })
    }
  }, [state.isPlaying])

  const handleStop = useCallback(() => {
    audioEngineRef.current?.stop()
    dispatch({ type: 'SET_PLAYING', playing: false })
  }, [])

  const handleSavePattern = useCallback(() => {
    const name = state.patternName.trim() || `模式 ${state.savedPatterns.length + 1}`
    if (state.savedPatterns.length >= MAX_PATTERNS) {
      showToast('error', `模式库已满（最多${MAX_PATTERNS}个），请先删除部分模式后再保存。`)
      return
    }
    const pattern: SavedPattern = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      bpm: state.bpm,
      grid: state.grid.map(r => [...r]),
      createdAt: Date.now(),
    }
    dispatch({ type: 'SAVE_PATTERN', pattern })
    showToast('success', `已保存模式「${name}」`)
  }, [state.patternName, state.bpm, state.grid, state.savedPatterns.length, showToast])

  const handleMetronomeToggle = useCallback(() => {
    dispatch({ type: 'TOGGLE_METRONOME' })
  }, [])

  const handleLoadPattern = useCallback((pattern: SavedPattern) => {
    audioEngineRef.current?.stop()
    dispatch({ type: 'LOAD_PATTERN', pattern })
  }, [])

  const handleDeletePattern = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    dispatch({ type: 'DELETE_PATTERN', id })
  }, [])

  const drawIdleBaseline = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    const width = rect.width
    const height = rect.height
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
    }
    ctx.clearRect(0, 0, width, height)
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(0, height / 2)
    ctx.lineTo(width, height / 2)
    ctx.stroke()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const engine = audioEngineRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!state.isPlaying) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
      drawIdleBaseline()
      return
    }

    const render = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      const width = rect.width
      const height = rect.height

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr
        canvas.height = height * dpr
        ctx.scale(dpr, dpr)
      }

      ctx.clearRect(0, 0, width, height)

      const analyser = engine?.getAnalyser()
      if (analyser && engine?.getAudioContext()) {
        const bufferLength = analyser.fftSize
        const dataArray = new Uint8Array(bufferLength)
        analyser.getByteTimeDomainData(dataArray)

        const gradient = ctx.createLinearGradient(0, 0, width, 0)
        gradient.addColorStop(0, '#00ffff')
        gradient.addColorStop(1, '#aa44ff')
        ctx.strokeStyle = gradient
        ctx.lineWidth = 2
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        ctx.beginPath()
        const sliceWidth = width / bufferLength
        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = (v * height) / 2

          if (i === 0) {
            ctx.moveTo(x, y)
          } else {
            ctx.lineTo(x, y)
          }
          x += sliceWidth
        }

        ctx.lineTo(width, height / 2)
        ctx.stroke()
      }

      rafIdRef.current = requestAnimationFrame(render)
    }

    rafIdRef.current = requestAnimationFrame(render)
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
        rafIdRef.current = null
      }
    }
  }, [state.isPlaying, drawIdleBaseline])

  useEffect(() => {
    drawIdleBaseline()

    let resizeTimer: number | null = null
    const handleResize = () => {
      if (resizeTimer !== null) {
        clearTimeout(resizeTimer)
      }
      resizeTimer = window.setTimeout(() => {
        if (!state.isPlaying) {
          drawIdleBaseline()
        }
      }, 50)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      if (resizeTimer !== null) {
        clearTimeout(resizeTimer)
      }
    }
  }, [drawIdleBaseline, canvasHeight, state.isPlaying])

  const handleGridChange = useCallback((grid: GridData) => {
    dispatch({ type: 'SET_GRID', grid })
  }, [])

  const handleBpmChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    dispatch({ type: 'SET_BPM', bpm: val })
  }, [])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value)
    dispatch({ type: 'SET_VOLUME', volume: val })
  }, [])

  return (
    <div className="app">
      <div className="editor-panel">
        <header className="app-header">
          <h1 className="app-title">
            <span className="title-glow">CYBER</span>
            <span className="title-accent">RHYTHM</span>
          </h1>
          <p className="app-subtitle">赛博节拍 · 节奏编程工具</p>
        </header>

        <section className="controls-section">
          <div className="controls-row">
            <div className="control-group">
              <button
                className={`cyber-btn play-btn ${state.isPlaying ? 'playing' : ''}`}
                onClick={handlePlay}
              >
                {state.isPlaying ? '⏸ 暂停' : '▶ 播放'}
              </button>
              <button className="cyber-btn stop-btn" onClick={handleStop}>
                ■ 停止
              </button>
              <button className="cyber-btn clear-btn" onClick={() => dispatch({ type: 'CLEAR_GRID' })}>
                清空
              </button>
            </div>

            <div className="control-group">
              <button
                className={`cyber-btn metronome-btn ${state.metronomeEnabled ? 'enabled' : ''}`}
                onClick={handleMetronomeToggle}
                title={state.metronomeEnabled ? '关闭节拍器' : '开启节拍器'}
              >
                {state.metronomeEnabled ? '🔊' : '🔇'} 节拍器
              </button>
              <label className="cyber-toggle">
                <input
                  type="checkbox"
                  checked={state.metronomeEnabled}
                  onChange={handleMetronomeToggle}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">{state.metronomeEnabled ? '开' : '关'}</span>
              </label>
            </div>
          </div>

          <div className="controls-row sliders-row">
            <div className="slider-group">
              <label className="slider-label">
                BPM <span className="slider-value">{state.bpm}</span>
              </label>
              <input
                type="range"
                min="40"
                max="240"
                step="5"
                value={state.bpm}
                onChange={handleBpmChange}
                className="cyber-slider bpm-slider"
              />
              <div className="slider-scale">
                <span>40</span>
                <span>140</span>
                <span>240</span>
              </div>
            </div>

            <div className="slider-group">
              <label className="slider-label">
                音量 <span className="slider-value">{Math.round(state.volume * 100)}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.volume}
                onChange={handleVolumeChange}
                className="cyber-slider vol-slider"
              />
              <div className="slider-scale">
                <span>静音</span>
                <span>适中</span>
                <span>最大</span>
              </div>
            </div>
          </div>
        </section>

        <section className="grid-section">
          <div className="section-header">
            <h2 className="section-title">节拍网格编辑器</h2>
            <div className="section-hint">
              <span className="hint-key">单击</span>切换 ·
              <span className="hint-key">Shift+拖选</span>批量 ·
              <span className="hint-key">拖动</span>连续编辑
            </div>
          </div>
          <BeatGrid
            grid={state.grid}
            currentCol={state.currentCol}
            isPlaying={state.isPlaying}
            onGridChange={handleGridChange}
          />
        </section>

        <section className="waveform-section">
          <div className="section-header">
            <h2 className="section-title">实时波形</h2>
            <div className="waveform-status">
              <span className={`status-dot ${state.isPlaying ? 'live' : ''}`}></span>
              <span>{state.isPlaying ? 'LIVE' : 'IDLE'}</span>
            </div>
          </div>
          <div className="waveform-container" style={{ height: canvasHeight }}>
            <canvas ref={canvasRef} className="waveform-canvas" />
            <div className="waveform-grid-overlay" style={{ height: canvasHeight }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="waveform-grid-line" style={{ top: `${(i + 1) * 25}%` }} />
              ))}
            </div>
          </div>
        </section>

        <section className="patterns-section">
          <div className="section-header">
            <h2 className="section-title">
              模式库
              <span className="pattern-count">({state.savedPatterns.length}/{MAX_PATTERNS})</span>
            </h2>
          </div>
          <div className="save-pattern-row">
            <div className="input-wrapper">
              <input
                type="text"
                className={`cyber-input pattern-name-input ${state.patternName.length >= 20 ? 'max-limit' : ''}`}
                placeholder="输入模式名称 (最多20字符)"
                maxLength={20}
                value={state.patternName}
                onChange={(e) => {
                  const val = e.target.value.slice(0, 20)
                  dispatch({ type: 'SET_PATTERN_NAME', name: val })
                }}
              />
              <span className={`char-counter ${state.patternName.length >= 18 ? 'warning' : ''} ${state.patternName.length >= 20 ? 'max-limit' : ''}`}>
                {state.patternName.length}/20
              </span>
            </div>
            <button
              className="cyber-btn save-btn"
              onClick={handleSavePattern}
              disabled={state.savedPatterns.length >= MAX_PATTERNS}
            >
              💾 保存当前
            </button>
          </div>
          <div className="patterns-list">
            {state.savedPatterns.length === 0 ? (
              <div className="patterns-empty">
                <p>还没有保存的模式</p>
                <p className="empty-hint">编排完节奏后点击"保存当前"来存储模式</p>
              </div>
            ) : (
              state.savedPatterns.map(pattern => (
                <div
                  key={pattern.id}
                  className="pattern-card"
                  onClick={() => handleLoadPattern(pattern)}
                >
                  <div className="pattern-info">
                    <div className="pattern-name">{pattern.name}</div>
                    <div className="pattern-meta">
                      <span className="pattern-bpm">BPM {pattern.bpm}</span>
                      <span className="pattern-date">
                        {new Date(pattern.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  </div>
                  <button
                    className="pattern-delete"
                    onClick={(e) => handleDeletePattern(pattern.id, e)}
                    title="删除"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        <footer className="app-footer">
          <p>Web Audio API · 1/16 音符精度 · 赛博朋克节奏工作站</p>
        </footer>

        {toast && (
          <div className={`toast toast-${toast.type}`} key={toast.id}>
            <span className="toast-icon">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span className="toast-text">{toast.text}</span>
          </div>
        )}
      </div>
    </div>
  )
}
