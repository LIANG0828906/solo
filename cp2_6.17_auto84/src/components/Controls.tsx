import { useState, useEffect, useCallback } from 'react'
import { Camera, RotateCcw, Play, Pause, Settings } from 'lucide-react'
import { useStore } from '@/store/useStore'
import { getDynamicEquationText, type SurfaceParams } from '@/utils/surfaceGeometry'

const sliderKeys: (keyof SurfaceParams)[] = ['a', 'b', 'c', 'd', 'e', 'f']

const sliderLabels: Record<keyof SurfaceParams, string> = {
  a: '参数 a',
  b: '参数 b',
  c: '参数 c',
  d: '参数 d',
  e: '参数 e',
  f: '参数 f',
}

export function Controls() {
  const params = useStore((state) => state.params)
  const isPlaying = useStore((state) => state.isPlaying)
  const fps = useStore((state) => state.fps)
  const updateParam = useStore((state) => state.updateParam)
  const toggleAnimation = useStore((state) => state.toggleAnimation)
  const triggerReset = useStore((state) => state.triggerReset)
  const triggerScreenshot = useStore((state) => state.triggerScreenshot)

  const [mobilePanelOpen, setMobilePanelOpen] = useState(false)
  const [activeSlider, setActiveSlider] = useState<keyof SurfaceParams | null>(null)

  const clearActiveSlider = useCallback(() => {
    setActiveSlider(null)
  }, [])

  useEffect(() => {
    const handleMouseUp = () => clearActiveSlider()
    const handleTouchEnd = () => clearActiveSlider()
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [clearActiveSlider])

  return (
    <>
      <div className="status-bar">
        <div className="equation-display">
          <pre>{getDynamicEquationText(params)}</pre>
        </div>
        <div className="fps-counter">FPS: {fps}</div>
      </div>

      <button
        className="screenshot-button"
        onClick={triggerScreenshot}
        title="截图"
      >
        <Camera size={18} />
      </button>

      <div className="bottom-controls">
        <button
          className="mobile-toggle"
          onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
        >
          <Settings size={20} />
        </button>

        <div className={`slider-panel ${mobilePanelOpen ? 'mobile-open' : ''}`}>
          {sliderKeys.map((key) => (
            <div key={key} className="slider-row">
              <span className="slider-label">{sliderLabels[key]}</span>
              <div className="slider-wrapper">
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="0.1"
                  value={params[key]}
                  onChange={(e) => updateParam(key, parseFloat(e.target.value))}
                  onMouseDown={() => setActiveSlider(key)}
                  onTouchStart={() => setActiveSlider(key)}
                  className={`slider ${activeSlider === key ? 'active' : ''}`}
                />
                <span className="slider-value">{params[key].toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="control-buttons">
        <button
          className="control-button"
          onClick={triggerReset}
          title="重置视角"
        >
          <RotateCcw size={18} />
        </button>
        <button
          className="control-button"
          onClick={toggleAnimation}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
      </div>

      <style>{`
        .status-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 48px;
          background: rgba(10, 11, 30, 0.85);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          z-index: 100;
        }

        .equation-display {
          background: rgba(0, 0, 0, 0.4);
          border-radius: 6px;
          padding: 8px 12px;
        }

        .equation-display pre {
          margin: 0;
          color: #ffffff;
          font-size: 14px;
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
          line-height: 1.4;
          white-space: pre;
        }

        .fps-counter {
          font-size: 12px;
          color: #00FF00;
          font-family: 'Consolas', monospace;
          font-weight: bold;
          text-shadow: 0 0 4px rgba(0, 255, 0, 0.5);
        }

        .screenshot-button {
          position: fixed;
          top: 60px;
          left: 20px;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          background: #FFD700;
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #1a1a2e;
          transition: all 0.2s ease;
          z-index: 100;
          box-shadow: 0 2px 8px rgba(255, 215, 0, 0.3);
        }

        .screenshot-button:hover {
          background: #FFAA00;
          box-shadow: 0 4px 12px rgba(255, 170, 0, 0.5);
          transform: translateY(-1px);
        }

        .screenshot-button:active {
          transform: translateY(0);
        }

        .bottom-controls {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 100;
          pointer-events: none;
        }

        .slider-panel {
          background: rgba(10, 11, 30, 0.8);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 12px 12px 0 0;
          padding: 12px 20px;
          width: 400px;
          pointer-events: auto;
          transition: transform 0.3s ease;
        }

        .slider-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .slider-row:last-child {
          margin-bottom: 0;
        }

        .slider-label {
          color: #ffffff;
          font-size: 12px;
          min-width: 60px;
          flex-shrink: 0;
        }

        .slider-wrapper {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }

        .slider {
          -webkit-appearance: none;
          appearance: none;
          flex: 1;
          height: 6px;
          border-radius: 3px;
          background: transparent;
          outline: none;
          cursor: pointer;
        }

        .slider::-webkit-slider-runnable-track {
          height: 6px;
          border-radius: 3px;
          background: #4A4A6E;
          transition: background-color 0.3s ease;
        }

        .slider.active::-webkit-slider-runnable-track {
          background: #00E5FF;
        }

        .slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #6C63FF;
          cursor: pointer;
          margin-top: -6px;
          transition: all 0.2s ease;
          box-shadow: 0 0 0 0 rgba(108, 99, 255, 0);
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .slider.active::-webkit-slider-thumb {
          box-shadow: 0 0 0 8px rgba(108, 99, 255, 0.3);
        }

        .slider::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: #4A4A6E;
          transition: background-color 0.3s ease;
        }

        .slider.active::-moz-range-track {
          background: #00E5FF;
        }

        .slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #6C63FF;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }

        .slider.active::-moz-range-thumb {
          box-shadow: 0 0 0 8px rgba(108, 99, 255, 0.3);
        }

        .slider-value {
          color: #00E5FF;
          font-size: 12px;
          font-family: 'Consolas', monospace;
          min-width: 45px;
          text-align: right;
          font-variant-numeric: tabular-nums;
        }

        .mobile-toggle {
          display: none;
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #6C63FF;
          border: none;
          cursor: pointer;
          color: #ffffff;
          align-items: center;
          justify-content: center;
          z-index: 101;
          box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
          transition: all 0.2s ease;
          pointer-events: auto;
        }

        .mobile-toggle:hover {
          background: #8B83FF;
          transform: translateX(-50%) scale(1.05);
        }

        .control-buttons {
          position: fixed;
          bottom: 20px;
          right: 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          z-index: 100;
        }

        .control-button {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(10, 11, 30, 0.8);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(108, 99, 255, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          transition: all 0.2s ease;
        }

        .control-button:hover {
          background: rgba(108, 99, 255, 0.3);
          border-color: #6C63FF;
          color: #00E5FF;
        }

        @media (max-width: 768px) {
          .equation-display pre {
            font-size: 11px;
          }

          .slider-panel {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            width: 100%;
            border-radius: 12px 12px 0 0;
            transform: translateY(100%);
            padding: 16px 20px 24px;
          }

          .slider-panel.mobile-open {
            transform: translateY(0);
          }

          .mobile-toggle {
            display: flex;
          }

          .mobile-toggle.panel-open {
            bottom: calc(100% + 20px);
          }

          .control-buttons {
            bottom: 70px;
            right: 10px;
          }

          .control-button {
            width: 36px;
            height: 36px;
          }

          .screenshot-button {
            top: 60px;
            left: 10px;
            width: 32px;
            height: 32px;
          }
        }
      `}</style>
    </>
  )
}
