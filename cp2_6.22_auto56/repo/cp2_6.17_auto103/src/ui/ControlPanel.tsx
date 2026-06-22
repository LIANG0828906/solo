import React from 'react'
import { useParticleStore, ColorCurve } from '../store'

const curves: { value: ColorCurve; label: string }[] = [
  { value: 'linear', label: '线性' },
  { value: 'sin', label: '正弦' },
  { value: 'exp', label: '指数' },
]

export const ControlPanel: React.FC = () => {
  const {
    gravity, setGravity,
    windX, setWindX,
    windY, setWindY,
    windZ, setWindZ,
    drag, setDrag,
    colorStart, setColorStart,
    colorEnd, setColorEnd,
    colorCurve, setColorCurve,
    sizeMin, setSizeMin,
    sizeMax, setSizeMax,
    lifetime, setLifetime,
    isApplying, setIsApplying,
    isPanelOpen,
  } = useParticleStore()

  const handleApply = () => {
    setIsApplying(true)
    setTimeout(() => {
      setIsApplying(false)
      const worker = (window as any).__particleWorker
      if (worker) {
        worker.postMessage({
          type: 'applyAttributes',
          payload: { sizeMin, sizeMax },
        })
      }
    }, 300)
  }

  const panelClass = `control-panel ${isPanelOpen ? 'open' : 'closed'}`

  return (
    <div className={panelClass}>
      <div className="panel-title">粒子参数</div>

      <div className="slider-group">
        <div className="slider-label">
          <span>重力</span>
          <span className="slider-value">{gravity.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="20"
          step="0.1"
          value={gravity}
          onChange={(e) => setGravity(parseFloat(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>风力 X</span>
          <span className="slider-value">{windX.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="-5"
          max="5"
          step="0.1"
          value={windX}
          onChange={(e) => setWindX(parseFloat(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>风力 Y</span>
          <span className="slider-value">{windY.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="-5"
          max="5"
          step="0.1"
          value={windY}
          onChange={(e) => setWindY(parseFloat(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>风力 Z</span>
          <span className="slider-value">{windZ.toFixed(1)}</span>
        </div>
        <input
          type="range"
          min="-5"
          max="5"
          step="0.1"
          value={windZ}
          onChange={(e) => setWindZ(parseFloat(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>空气阻力</span>
          <span className="slider-value">{drag.toFixed(3)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="0.1"
          step="0.001"
          value={drag}
          onChange={(e) => setDrag(parseFloat(e.target.value))}
        />
      </div>

      <div className="color-group">
        <div className="color-curve-label">粒子颜色渐变</div>
        <div className="color-row">
          <div className="color-item">
            <div className="color-label">起始色</div>
            <input
              type="color"
              value={colorStart}
              onChange={(e) => setColorStart(e.target.value)}
            />
          </div>
          <div className="color-item">
            <div className="color-label">结束色</div>
            <input
              type="color"
              value={colorEnd}
              onChange={(e) => setColorEnd(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="color-curve-group">
        <div className="color-curve-label">颜色曲线</div>
        <div className="color-curve-buttons">
          {curves.map((c) => (
            <button
              key={c.value}
              className={`curve-btn ${colorCurve === c.value ? 'active' : ''}`}
              onClick={() => setColorCurve(c.value)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>粒子最小尺寸</span>
          <span className="slider-value">{sizeMin.toFixed(1)} px</span>
        </div>
        <input
          type="range"
          min="1"
          max="8"
          step="0.5"
          value={sizeMin}
          onChange={(e) => setSizeMin(parseFloat(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>粒子最大尺寸</span>
          <span className="slider-value">{sizeMax.toFixed(1)} px</span>
        </div>
        <input
          type="range"
          min="2"
          max="10"
          step="0.5"
          value={sizeMax}
          onChange={(e) => setSizeMax(parseFloat(e.target.value))}
        />
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>粒子寿命</span>
          <span className="slider-value">{lifetime.toFixed(1)} s</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={lifetime}
          onChange={(e) => setLifetime(parseFloat(e.target.value))}
        />
      </div>

      <button
        className="apply-btn"
        onClick={handleApply}
        disabled={isApplying}
      >
        {isApplying && <div className="spinner" />}
        {isApplying ? '应用中' : '应用到存活粒子'}
      </button>
    </div>
  )
}
