import { useEffect, useRef, useState } from 'react'
import { useLyricStore } from './store'
import { LyricParser } from './LyricParser'
import LyricRenderer from './LyricRenderer'

function formatDisplayTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  const ms = Math.floor((s - Math.floor(s)) * 100)
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`
}

interface EditorLineProps {
  rawLine: string
  lineIndex: number
  onClick: () => void
  onUpdateTime: (newTime: number) => void
}

function EditorLine({ rawLine, lineIndex, onClick, onUpdateTime }: EditorLineProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const timeMatch = rawLine.match(/\[(\d{1,3}:\d{1,2}(?:[.:]\d{1,3})?)\]/)
  const timeTag = timeMatch ? timeMatch[0] : ''
  const textAfter = timeMatch ? rawLine.slice(timeMatch.index! + timeTag.length) : rawLine

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!timeTag) return
    setEditValue(timeTag)
    setEditing(true)
  }

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    const t = LyricParser.parseTime(editValue.trim())
    onUpdateTime(t)
  }

  return (
    <div
      className="editor-line"
      onClick={onClick}
      onDoubleClick={startEdit}
    >
      {editing ? (
        <input
          ref={inputRef}
          className="editor-time-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') setEditing(false)
            e.stopPropagation()
          }}
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <span className="editor-time">{timeTag || '[--:--.--]'}</span>
      )}
      <span className="editor-text">{textAfter}</span>
      <span className="editor-line-num">{lineIndex + 1}</span>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <polygon points="6,4 20,12 6,20" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7,10 12,15 17,10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  )
}

export default function App() {
  const {
    rawText,
    lines,
    currentTime,
    duration,
    isPlaying,
    setRawText,
    setCurrentTime,
    setPlaying,
    updateLineTime,
    exportLRC,
  } = useLyricStore()

  const [mobileEditorOpen, setMobileEditorOpen] = useState(true)
  const [showRawInput, setShowRawInput] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const lastTickRef = useRef(performance.now())

  useEffect(() => {
    let raf = 0
    const tick = (now: number) => {
      const dt = (now - lastTickRef.current) / 1000
      lastTickRef.current = now
      const s = useLyricStore.getState()
      if (s.isPlaying && !draggingRef.current) {
        const next = Math.min(s.duration, s.currentTime + dt)
        useLyricStore.setState({ currentTime: next })
        if (next >= s.duration) {
          useLyricStore.setState({ isPlaying: false })
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  useEffect(() => {
    const onUp = () => { draggingRef.current = false }
    window.addEventListener('mouseup', onUp)
    window.addEventListener('touchend', onUp)
    return () => {
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('touchend', onUp)
    }
  }, [])

  const seekFromEvent = (clientX: number) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
    setCurrentTime(ratio * duration)
  }

  const handleLineClick = (index: number) => {
    if (index >= 0 && index < lines.length) {
      setCurrentTime(lines[index].time)
      setPlaying(false)
    }
  }

  const handleLineUpdate = (index: number, newTime: number) => {
    updateLineTime(index, newTime)
  }

  const togglePlay = () => {
    if (currentTime >= duration) setCurrentTime(0)
    setPlaying(!isPlaying)
  }

  const editorLines = rawText.split('\n')

  return (
    <div className="app">
      <div className="layout">
        <aside className={`editor-panel ${mobileEditorOpen ? 'open' : ''}`}>
          <div className="editor-header">
            <span className="editor-title">歌词编辑器</span>
            <button
              className="toggle-raw-btn"
              onClick={() => setShowRawInput(!showRawInput)}
            >
              {showRawInput ? '列表视图' : '原始文本'}
            </button>
          </div>
          {showRawInput ? (
            <textarea
              className="raw-textarea"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="粘贴 LRC 格式歌词，例如：&#10;[00:00.00] 第一句歌词&#10;[00:03.50] 第二句歌词"
              spellCheck={false}
            />
          ) : (
            <div className="editor-lines">
              {editorLines.map((line, idx) => (
                <EditorLine
                  key={idx}
                  rawLine={line}
                  lineIndex={idx}
                  onClick={() => handleLineClick(idx)}
                  onUpdateTime={(t) => handleLineUpdate(idx, t)}
                />
              ))}
              {editorLines.length === 0 && (
                <div className="editor-empty">暂无歌词，点击右上角切换原始文本输入</div>
              )}
            </div>
          )}
          <button
            className={`mobile-toggle ${mobileEditorOpen ? 'open' : ''}`}
            onClick={() => setMobileEditorOpen(!mobileEditorOpen)}
          >
            {mobileEditorOpen ? '收起编辑器 ▲' : '展开编辑器 ▼'}
          </button>
        </aside>

        <div className="divider" />

        <main className="preview-panel">
          <div className="preview-header">
            <span className="preview-title">卡拉OK预览</span>
            <button className="export-btn" onClick={exportLRC}>
              <ExportIcon />
              <span>导出 LRC</span>
            </button>
          </div>
          <div className="lyric-stage">
            <LyricRenderer lines={lines} currentTime={currentTime} />
          </div>
          <div className="control-bar">
            <button className="play-btn" onClick={togglePlay}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <div
              className="progress-wrap"
              ref={progressRef}
              onMouseDown={(e) => { draggingRef.current = true; seekFromEvent(e.clientX) }}
              onMouseMove={(e) => { if (draggingRef.current) seekFromEvent(e.clientX) }}
              onTouchStart={(e) => { draggingRef.current = true; seekFromEvent(e.touches[0].clientX) }}
              onTouchMove={(e) => { if (draggingRef.current) seekFromEvent(e.touches[0].clientX) }}
            >
              <div className="progress-bg">
                <div
                  className="progress-fill"
                  style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              <div
                className="progress-handle"
                style={{ left: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <span className="time-display">
              {formatDisplayTime(currentTime)} / {formatDisplayTime(duration)}
            </span>
          </div>
        </main>
      </div>
    </div>
  )
}
