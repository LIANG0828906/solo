import { useState, useEffect, useRef, useCallback } from 'react'
import { Timeline } from './components/Timeline'
import { Editor } from './components/Editor'
import { useStore } from './store/useStore'
import './styles/app.css'

export default function App() {
  const { isFullscreen, setFullscreen, loadEntries, isLoading } = useStore()
  const [timelineWidth, setTimelineWidth] = useState(30)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadEntries()
  }, [loadEntries])

  const handleMouseDown = useCallback(() => {
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !containerRef.current) return
    
    const containerRect = containerRef.current.getBoundingClientRect()
    const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100
    
    if (newWidth >= 20 && newWidth <= 70) {
      setTimelineWidth(newWidth)
    }
  }, [isResizing])

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    } else {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setFullscreen(true)
      } else {
        await document.exitFullscreen()
        setFullscreen(false)
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }, [setFullscreen])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setFullscreen(false)
      }
    }
    
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [isFullscreen, setFullscreen])

  if (isLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-prompt">$</div>
          <span className="loading-text">Loading CodeChronicle...</span>
          <span className="loading-cursor">█</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`app-container ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      <div 
        className="timeline-panel" 
        style={{ width: `${timelineWidth}%` }}
      >
        <Timeline />
      </div>
      
      <div 
        className="resize-handle"
        ref={resizeRef}
        onMouseDown={handleMouseDown}
      />
      
      <div className="editor-panel">
        <Editor />
      </div>

      <button 
        className="fullscreen-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Enter Fullscreen'}
      >
        {isFullscreen ? '⛶' : '⛶'}
      </button>
    </div>
  )
}
