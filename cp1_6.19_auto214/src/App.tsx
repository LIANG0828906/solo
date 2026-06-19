import { motion, AnimatePresence } from 'framer-motion'
import { CameraView } from './CameraView'
import { FilmStrip } from './FilmStrip'
import { useCameraStore } from './store'

function FilterPanel() {
  const {
    filterSettings,
    setGrainIntensity,
    setColorShift,
    setVignetteRadius,
    captureMode,
    focusDistance,
  } = useCameraStore()

  return (
    <div className="filter-panel">
      <div className="filter-title">滤镜控制</div>

      <div className="filter-control">
        <label className="control-label">
          <span>颗粒强度</span>
          <span className="control-value">{filterSettings.grainIntensity}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={filterSettings.grainIntensity}
          onChange={(e) => setGrainIntensity(Number(e.target.value))}
          className="control-slider"
        />
      </div>

      <div className="filter-control">
        <label className="control-label">
          <span>色调</span>
        </label>
        <div className="color-shift-buttons">
          <button
            className={`color-shift-btn ${
              filterSettings.colorShift === 'warm' ? 'active warm' : ''
            }`}
            onClick={() => setColorShift('warm')}
          >
            暖黄
          </button>
          <button
            className={`color-shift-btn ${
              filterSettings.colorShift === 'cool' ? 'active cool' : ''
            }`}
            onClick={() => setColorShift('cool')}
          >
            冷青
          </button>
        </div>
      </div>

      <div className="filter-control">
        <label className="control-label">
          <span>晕影范围</span>
          <span className="control-value">
            {filterSettings.vignetteRadius}%
          </span>
        </label>
        <input
          type="range"
          min="0"
          max="50"
          value={filterSettings.vignetteRadius}
          onChange={(e) => setVignetteRadius(Number(e.target.value))}
          className="control-slider"
        />
      </div>

      {captureMode === 'focus' && (
        <div className="filter-control focus-info">
          <label className="control-label">
            <span>对焦距离</span>
            <span className="control-value focus-value">
              {focusDistance >= 100 ? '∞' : focusDistance.toFixed(1) + 'm'}
            </span>
          </label>
          <div className="focus-hint">
            点击左侧取景器退出对焦模式
          </div>
        </div>
      )}

      <style>{`
        .filter-panel {
          background: rgba(0, 0, 0, 0.6);
          border-radius: 12px;
          padding: 16px 20px;
          backdrop-filter: blur(8px);
          border: 1px solid rgba(212, 165, 116, 0.2);
          min-width: 280px;
        }

        .filter-title {
          color: #d4a574;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 16px;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-family: monospace;
          border-bottom: 1px solid rgba(212, 165, 116, 0.3);
          padding-bottom: 8px;
        }

        .filter-control {
          margin-bottom: 16px;
        }

        .filter-control:last-child {
          margin-bottom: 0;
        }

        .control-label {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #ccc;
          font-size: 12px;
          margin-bottom: 8px;
          font-family: monospace;
        }

        .control-value {
          color: #d4a574;
          font-weight: 600;
        }

        .focus-value {
          color: #4ade80;
        }

        .control-slider {
          width: 100%;
          height: 6px;
          border-radius: 3px;
          background: rgba(255, 255, 255, 0.1);
          outline: none;
          -webkit-appearance: none;
          cursor: pointer;
          transition: background 0.2s ease;
        }

        .control-slider:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .control-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #d4a574;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s ease;
        }

        .control-slider::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }

        .control-slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #d4a574;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
        }

        .color-shift-buttons {
          display: flex;
          gap: 8px;
        }

        .color-shift-btn {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
          color: #888;
          border-radius: 8px;
          cursor: pointer;
          font-size: 12px;
          font-family: monospace;
          transition: all 0.2s ease;
        }

        .color-shift-btn:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ccc;
        }

        .color-shift-btn:active {
          transform: scale(0.95);
        }

        .color-shift-btn.active.warm {
          background: rgba(212, 165, 116, 0.3);
          border-color: #d4a574;
          color: #d4a574;
        }

        .color-shift-btn.active.cool {
          background: rgba(126, 181, 209, 0.3);
          border-color: #7eb5d1;
          color: #7eb5d1;
        }

        .focus-info {
          padding-top: 12px;
          border-top: 1px solid rgba(212, 165, 116, 0.2);
        }

        .focus-hint {
          font-size: 10px;
          color: #666;
          font-family: monospace;
          margin-top: 4px;
        }

        @media (max-width: 700px) {
          .filter-panel {
            min-width: auto;
            width: 100%;
            max-width: 320px;
          }
        }
      `}</style>
    </div>
  )
}

function FlashOverlay() {
  const { isFlashing } = useCameraStore()

  return (
    <AnimatePresence>
      {isFlashing && (
        <motion.div
          className="flash-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        />
      )}
    </AnimatePresence>
  )
}

export default function App() {
  return (
    <div className="app-container">
      <FlashOverlay />

      <header className="app-header">
        <h1 className="app-title">TLR Film Lab</h1>
        <p className="app-subtitle">双镜头取景器 · 胶片摄影实验室</p>
      </header>

      <main className="app-main">
        <section className="camera-section">
          <CameraView />
        </section>

        <aside className="controls-section">
          <FilterPanel />
        </aside>
      </main>

      <footer className="app-footer">
        <FilmStrip />
      </footer>

      <style>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, monospace;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .app-container {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: radial-gradient(ellipse at center top, #3e2f23 0%, #1a1a1a 70%, #0d0d0d 100%);
          color: #fff;
          overflow: hidden;
        }

        .app-header {
          text-align: center;
          padding: 20px 16px 12px;
        }

        .app-title {
          font-size: 20px;
          font-weight: 700;
          color: #d4a574;
          letter-spacing: 4px;
          text-transform: uppercase;
          font-family: 'Georgia', serif;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        }

        .app-subtitle {
          font-size: 11px;
          color: rgba(255, 255, 255, 0.5);
          margin-top: 4px;
          letter-spacing: 2px;
          font-family: monospace;
        }

        .app-main {
          flex: 1;
          display: flex;
          flex-direction: row;
          align-items: flex-start;
          justify-content: center;
          gap: 32px;
          padding: 20px;
          min-height: 0;
        }

        .camera-section {
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .controls-section {
          padding-top: 20px;
        }

        .app-footer {
          flex-shrink: 0;
        }

        .flash-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #fff;
          pointer-events: none;
          z-index: 9999;
        }

        @media (max-width: 700px) {
          .app-main {
            flex-direction: column;
            align-items: center;
            gap: 16px;
            padding: 12px;
          }

          .controls-section {
            padding-top: 0;
            width: 100%;
            display: flex;
            justify-content: center;
          }

          .app-title {
            font-size: 16px;
          }

          .app-subtitle {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  )
}
