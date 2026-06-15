import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useVisualizerStore } from './store'
import { audioEngine } from './audioEngine'
import { Visualizer } from './visualizer'
import ControlPanel from './controls'

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const visualizerRef = useRef<Visualizer | null>(null)
  const animationFrameRef = useRef<number>(0)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    isPlaying,
    fftSize,
    setPlaying,
    setAudioFileName,
    setParam,
    ...visualizerState
  } = useVisualizerStore()

  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [fps, setFps] = useState(0)
  const [hasAudio, setHasAudio] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (canvasRef.current) {
      visualizerRef.current = new Visualizer(canvasRef.current)
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      audioEngine.close()
    }
  }, [])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && visualizerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect()
        const dpr = window.devicePixelRatio || 1
        visualizerRef.current.resize(
          Math.min(width * dpr, 2048),
          Math.min(height * dpr, 1024)
        )
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    audioEngine.setFftSize(fftSize)
  }, [fftSize])

  const animate = useCallback(() => {
    if (!visualizerRef.current) return

    const waveformData = audioEngine.getWaveformData()
    const frequencyData = audioEngine.getFrequencyData()
    const time = audioEngine.getCurrentTime()
    const dur = audioEngine.getDuration()

    setCurrentTime(time)
    setDuration(dur)

    if (audioBufferRef.current && time >= dur && dur > 0) {
      setPlaying(false)
    }

    const state = useVisualizerStore.getState()
    visualizerRef.current.render(
      waveformData,
      frequencyData,
      state,
      time,
      dur
    )

    setFps(Math.round(visualizerRef.current.getFPS()))

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [setPlaying])

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate)
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [animate])

  const handleFileUpload = useCallback(async (file: File) => {
    setIsLoading(true)
    setError(null)

    try {
      const buffer = await audioEngine.decodeAudioFile(file)
      audioBufferRef.current = buffer
      setHasAudio(true)
      setDuration(buffer.duration)
      setAudioFileName(file.name)

      if (visualizerRef.current) {
        visualizerRef.current.clear()
      }

      audioEngine.play(buffer)
      setPlaying(true)
      setCurrentTime(0)
    } catch (err) {
      setError('音频文件解码失败，请检查文件格式')
      console.error('Audio decode error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [setPlaying, setAudioFileName])

  const handlePlayPause = useCallback(() => {
    if (!audioBufferRef.current) return

    if (isPlaying) {
      audioEngine.pause()
      setPlaying(false)
    } else {
      audioEngine.play()
      setPlaying(true)
    }
  }, [isPlaying, setPlaying])

  return (
    <div className="app-container">
      <div className="visualizer-section" ref={containerRef}>
        <canvas
          ref={canvasRef}
          className="visualizer-canvas"
        />

        {!hasAudio && !isLoading && (
          <div className="overlay">
            <div className="overlay-content">
              <div className="overlay-icon">🎵</div>
              <h2>上传音频开始体验</h2>
              <p>支持 MP3 和 WAV 格式</p>
              <div className="demo-tip">
                <span className="tip-icon">💡</span>
                <span>在右侧控制面板上传音频文件，即可看到实时可视化效果</span>
              </div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="overlay">
            <div className="loading-spinner" />
            <p className="loading-text">正在解码音频...</p>
          </div>
        )}

        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            {error}
            <button
              className="error-close"
              onClick={() => setError(null)}
            >
              ✕
            </button>
          </div>
        )}

        {hasAudio && (
          <div className="status-bar">
            <div className="status-item">
              <span className="status-label">FPS</span>
              <span className={`status-value ${fps < 55 ? 'warning' : ''}`}>
                {fps}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">FFT</span>
              <span className="status-value">{fftSize}</span>
            </div>
            <div className="status-item">
              <span className="status-label">模式</span>
              <span className="status-value">{visualizerState.mode}</span>
            </div>
          </div>
        )}
      </div>

      <ControlPanel
        onFileUpload={handleFileUpload}
        onPlayPause={handlePlayPause}
        isPlaying={isPlaying}
        hasAudio={hasAudio}
        currentTime={currentTime}
        duration={duration}
      />

      <style>{`
        .app-container {
          display: flex;
          height: 100vh;
          width: 100vw;
          overflow: hidden;
          position: relative;
        }

        .visualizer-section {
          flex: 1;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          min-width: 0;
        }

        .visualizer-canvas {
          width: 100%;
          height: 100%;
          display: block;
          transition: opacity 0.3s ease;
        }

        .overlay {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          z-index: 10;
        }

        .overlay-content {
          text-align: center;
          color: #f1f5f9;
          max-width: 400px;
          padding: 40px;
        }

        .overlay-icon {
          font-size: 64px;
          margin-bottom: 16px;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }

        .overlay-content h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #f1f5f9;
        }

        .overlay-content p {
          font-size: 14px;
          opacity: 0.7;
          margin-bottom: 24px;
        }

        .demo-tip {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 16px;
          background: rgba(99, 102, 241, 0.15);
          border: 1px solid rgba(99, 102, 241, 0.3);
          border-radius: 10px;
          text-align: left;
          font-size: 13px;
          line-height: 1.6;
        }

        .tip-icon {
          font-size: 18px;
          flex-shrink: 0;
        }

        .loading-spinner {
          width: 48px;
          height: 48px;
          border: 3px solid rgba(99, 102, 241, 0.3);
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          color: #f1f5f9;
          font-size: 14px;
          opacity: 0.8;
        }

        .error-banner {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          border-radius: 8px;
          font-size: 14px;
          z-index: 20;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        .error-icon {
          font-size: 16px;
        }

        .error-close {
          background: none;
          border: none;
          color: white;
          cursor: pointer;
          font-size: 14px;
          opacity: 0.8;
          padding: 0 4px;
          transition: opacity 0.2s;
        }

        .error-close:hover {
          opacity: 1;
        }

        .status-bar {
          position: absolute;
          bottom: 20px;
          left: 20px;
          display: flex;
          gap: 20px;
          padding: 10px 16px;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 8px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          z-index: 5;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .status-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .status-label {
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 9px;
        }

        .status-value {
          color: #f1f5f9;
          font-weight: 600;
          font-size: 13px;
        }

        .status-value.warning {
          color: #f59e0b;
        }

        @media (max-width: 768px) {
          .app-container {
            flex-direction: column;
          }

          .visualizer-section {
            height: 55vh;
          }

          .overlay-content {
            padding: 20px;
          }

          .overlay-content h2 {
            font-size: 20px;
          }

          .overlay-icon {
            font-size: 48px;
          }

          .status-bar {
            bottom: 10px;
            left: 10px;
            gap: 12px;
            padding: 8px 12px;
          }
        }
      `}</style>
    </div>
  )
}

export default App
