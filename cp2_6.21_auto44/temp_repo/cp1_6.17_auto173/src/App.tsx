import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useChoreographerStore } from '@/Choreographer'
import { PreviewRenderer, BeamRenderState } from '@/PreviewRenderer'
import { IBeam } from '@/BeamModel'
import GridEditor from '@/components/GridEditor'
import ControlPanel from '@/components/ControlPanel'

const App: React.FC = () => {
  const {
    beams,
    isPlaying,
    currentTime,
    duration,
    play,
    pause,
    setCurrentTime,
    undo,
    canUndo,
    selectedBeamId,
    selectBeam,
  } = useChoreographerStore()

  const [selectedBeam, setSelectedBeam] = useState<IBeam | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [fps, setFps] = useState(0)
  const [isUndoAnimating, setIsUndoAnimating] = useState(false)
  const [windowLights, setWindowLights] = useState<boolean[]>([])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewRendererRef = useRef<PreviewRenderer | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    const lights = Array.from({ length: 40 }, () => Math.random() > 0.5)
    setWindowLights(lights)
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setWindowLights((prev) => {
        const newLights = [...prev]
        const randomIndex = Math.floor(Math.random() * newLights.length)
        newLights[randomIndex] = !newLights[randomIndex]
        return newLights
      })
    }, 800)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    previewRendererRef.current = new PreviewRenderer()
    return () => {
      previewRendererRef.current?.destroy()
    }
  }, [])

  useEffect(() => {
    if (canvasRef.current && previewRendererRef.current) {
      previewRendererRef.current.setCanvas(canvasRef.current)
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      previewRendererRef.current?.resize()
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (!previewRendererRef.current) return

    const renderer = previewRendererRef.current
    const sortedBeams = [...beams].sort((a, b) => a.order - b.order)

    const getCurrentTime = () => useChoreographerStore.getState().currentTime
    const getIsPlaying = () => useChoreographerStore.getState().isPlaying

    renderer.startAnimationLoop(
      sortedBeams,
      getCurrentTime,
      getIsPlaying,
      (_states: BeamRenderState[], currentFps: number) => {
        setFps(currentFps)
      }
    )

    return () => {
      renderer.stopAnimationLoop()
    }
  }, [beams])

  useEffect(() => {
    if (!isPlaying) {
      lastTimeRef.current = 0
      return
    }

    const tick = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp
      }

      const delta = (timestamp - lastTimeRef.current) / 1000
      lastTimeRef.current = timestamp

      const newTime = currentTime + delta
      setCurrentTime(newTime)

      if (newTime < duration) {
        animationFrameRef.current = requestAnimationFrame(tick)
      }
    }

    animationFrameRef.current = requestAnimationFrame(tick)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, currentTime, duration, setCurrentTime])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        handleUndo()
      }
      if (e.key === ' ' && !isPanelOpen) {
        e.preventDefault()
        handlePlayPause()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canUndo, isPlaying, isPanelOpen])

  const handleBeamClick = useCallback((beam: IBeam) => {
    setSelectedBeam(beam)
    setIsPanelOpen(true)
  }, [])

  const handleClosePanel = useCallback(() => {
    setIsPanelOpen(false)
    selectBeam(null)
  }, [selectBeam])

  useEffect(() => {
    if (selectedBeamId) {
      const beam = beams.find((b) => b.id === selectedBeamId)
      if (beam) {
        setSelectedBeam(beam)
      }
    } else {
      setSelectedBeam(null)
    }
  }, [selectedBeamId, beams])

  const handlePlayPause = () => {
    if (isPlaying) {
      pause()
    } else {
      play()
    }
  }

  const handleUndo = () => {
    if (canUndo()) {
      setIsUndoAnimating(true)
      undo()
      setTimeout(() => setIsUndoAnimating(false), 200)
    }
  }

  const progressPercentage = (currentTime / duration) * 100

  const buildings = [
    { height: '65%', width: '8%', left: '5%' },
    { height: '85%', width: '10%', left: '15%' },
    { height: '55%', width: '7%', left: '27%' },
    { height: '95%', width: '12%', left: '36%' },
    { height: '60%', width: '9%', left: '50%' },
    { height: '80%', width: '11%', left: '61%' },
    { height: '50%', width: '8%', left: '74%' },
    { height: '90%', width: '10%', left: '84%' },
  ]

  return (
    <div className="app">
      <div className="skyline-container">
        <div className="skyline-bg">
          {buildings.map((building, index) => (
            <div
              key={index}
              className="building"
              style={{
                height: building.height,
                width: building.width,
                left: building.left,
              }}
          >
            {Array.from({ length: Math.floor(windowLights.length / buildings.length) }).map((_, wi) => {
              const lightIndex = index * Math.floor(windowLights.length / buildings.length) + wi
              return windowLights[lightIndex] !== undefined ? (
                <div
                  key={wi}
                  className={`window ${windowLights[lightIndex] ? 'lit' : ''}`}
                  style={{
                    top: `${10 + (wi % 5) * 18}%`,
                    left: `${15 + Math.floor(wi / 5) * 30}%`,
                  }}
                />
              ) : null
            })}
            <div className="building-top" />
          </div>
          ))}
        </div>

        <canvas
          ref={canvasRef}
          className="preview-canvas"
        />

        <div className="timeline-container">
          <div className="timeline-track">
            <div
              className="timeline-progress"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="timeline-time">
            <span>{currentTime.toFixed(1)}s</span>
            <span>{duration.toFixed(1)}s</span>
          </div>
        </div>
      </div>

      <div className="controls-bar">
        <div className="controls-left">
          <button
            className={`control-btn play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPause}
          >
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
          <button
            className={`control-btn undo-btn ${isUndoAnimating ? 'pulse' : ''} ${!canUndo() ? 'disabled' : ''}`}
            onClick={handleUndo}
            disabled={!canUndo()}
          >
            ↩ 撤销 (Ctrl+Z)
          </button>
        </div>
        <div className="controls-right">
          <span className={`fps-counter ${fps >= 55 ? 'high' : fps >= 30 ? 'medium' : 'low'}`}>FPS: {fps}</span>
          <span className="beam-count">光束: {beams.length}/30</span>
        </div>
      </div>

      <div className="editor-section">
        <GridEditor onBeamClick={handleBeamClick} />
      </div>

      <ControlPanel
        beam={selectedBeam}
        isOpen={isPanelOpen}
        onClose={handleClosePanel}
      />

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          background: #0a0e27;
          color: #ffffff;
          overflow-x: hidden;
        }

        .app {
          min-height: 100vh;
          background: linear-gradient(180deg, #0a0e27 0%, #16213e 100%);
          display: flex;
          flex-direction: column;
        }

        .skyline-container {
          position: relative;
          width: 100%;
          height: 500px;
          overflow: hidden;
          background: linear-gradient(180deg, #0a0e27 0%, #16213e 100%);
        }

        .skyline-bg {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .building {
          position: absolute;
          bottom: 0;
          background: linear-gradient(180deg, #0d1025 0%, #1a1d3a 100%);
          border-radius: 2px 2px 0 0;
        }

        .building::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8px;
          background: linear-gradient(90deg, 
            transparent 0%, 
            rgba(255, 215, 0, 0.3) 20%, 
            rgba(255, 100, 200, 0.3) 40%, 
            rgba(100, 200, 255, 0.3) 60%, 
            rgba(255, 215, 0, 0.3) 80%, 
            transparent 100%
          );
        }

        .building-top {
          position: absolute;
          top: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 60%;
          height: 10px;
          background: #1a1d3a;
          clip-path: polygon(0% 100%, 10% 0%, 90% 0%, 100% 100%);
        }

        .window {
          position: absolute;
          width: 6px;
          height: 8px;
          background: rgba(255, 200, 50, 0.1);
          border-radius: 1px;
          transition: all 0.5s ease;
        }

        .window.lit {
          background: rgba(255, 200, 50, 0.9);
          box-shadow: 0 0 4px rgba(255, 200, 50, 0.6);
        }

        .preview-canvas {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        .timeline-container {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 90%;
          max-width: 800px;
          z-index: 10;
        }

        .timeline-track {
          width: 100%;
          height: 6px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .timeline-progress {
          height: 100%;
          background: #ffd700;
          border-radius: 3px;
          transition: width 0.05s linear;
          box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .timeline-time {
          display: flex;
          justify-content: space-between;
          margin-top: 6px;
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          font-variant-numeric: tabular-nums;
        }

        .controls-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 24px;
          background: rgba(26, 26, 46, 0.8);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .controls-left {
          display: flex;
          gap: 12px;
        }

        .controls-right {
          display: flex;
          gap: 20px;
          align-items: center;
        }

        .control-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }

        .play-btn {
          background: linear-gradient(135deg, #ffd700, #ffaa00);
          color: #1a1a2e;
        }

        .play-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.4);
        }

        .play-btn.playing {
          background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
        }

        .undo-btn {
          background: rgba(255, 255, 255, 0.1);
          color: #c0c0e0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .undo-btn:hover:not(.disabled) {
          background: rgba(255, 255, 255, 0.2);
          color: #ffffff;
        }

        .undo-btn.disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .undo-btn.pulse {
          animation: pulse 0.2s ease;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(0.95); background: rgba(255, 215, 0, 0.3); }
        }

        .fps-counter,
        .beam-count {
          font-size: 13px;
          color: #8080a0;
          font-variant-numeric: tabular-nums;
        }

        .fps-counter {
          color: #8080a0;
        }

        .fps-counter.high {
          color: #4ade80;
        }

        .fps-counter.medium {
          color: #fbbf24;
        }

        .fps-counter.low {
          color: #f87171;
        }

        .editor-section {
          flex: 1;
          padding: 24px;
          background: linear-gradient(180deg, #16213e 0%, #0a0e27 100%);
        }

        @media (max-width: 768px) {
          .skyline-container {
            height: 300px;
          }

          .controls-bar {
            flex-direction: column;
            gap: 12px;
            padding: 12px 16px;
          }

          .controls-left,
          .controls-right {
            width: 100%;
            justify-content: center;
          }

          .editor-section {
            padding: 16px;
          }

          .window {
            width: 4px;
            height: 6px;
          }
        }

        @media (max-width: 480px) {
          .skyline-container {
            height: 250px;
          }

          .control-btn {
            padding: 8px 14px;
            font-size: 12px;
          }

          .timeline-container {
            bottom: 12px;
            width: 95%;
          }
        }
      `}</style>
    </div>
  )
}

export default App
