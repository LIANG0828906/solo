import React from 'react'
import { usePlanetariumStore } from '@/store/store'

const timeScaleOptions = [
  { label: '1x', value: 1 },
  { label: '5x', value: 5 },
  { label: '10x', value: 10 },
  { label: '50x', value: 50 },
  { label: '100x', value: 100 },
]

export const UI: React.FC = () => {
  const {
    timeScale,
    targetTimeScale,
    isAutoRotate,
    setTimeScale,
    setIsAutoRotate,
    selectedPlanet,
    planets,
    setSelectedPlanet,
  } = usePlanetariumStore()

  const selectedPlanetData = planets.find((p) => p.name === selectedPlanet)

  const handleTimeScaleClick = (scale: number) => {
    setTimeScale(scale)
  }

  const handleAutoRotateToggle = () => {
    setIsAutoRotate(!isAutoRotate)
  }

  const handleClosePanel = () => {
    setSelectedPlanet(null)
  }

  const displayTimeScale = targetTimeScale !== timeScale ? targetTimeScale : timeScale

  return (
    <>
      <style>{`
        .glass-button {
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          font-family: inherit;
        }
        .glass-button:hover {
          background: rgba(255, 255, 255, 0.15);
        }
        .glass-button.active {
          background: rgba(241, 196, 15, 0.2);
          border-color: rgba(241, 196, 15, 0.5);
          color: #F1C40F;
        }
        
        .auto-rotate-btn {
          position: fixed;
          top: 20px;
          left: 20px;
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          z-index: 100;
        }
        
        .time-scale-panel {
          position: fixed;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          flex-direction: column;
          gap: 8px;
          z-index: 100;
        }
        .time-scale-btn {
          width: 50px;
          height: 36px;
          font-size: 13px;
          font-weight: 500;
        }
        
        .info-panel {
          position: fixed;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%) translateY(100%);
          width: 90%;
          max-width: 640px;
          background: rgba(10, 14, 39, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-bottom: none;
          border-radius: 16px 16px 0 0;
          padding: 24px;
          color: #ffffff;
          z-index: 100;
          transition: transform 0.4s cubic-bezier(0.22, 1, 0.36, 1);
          pointer-events: auto;
        }
        .info-panel.visible {
          transform: translateX(-50%) translateY(0);
        }
        
        .info-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .info-panel-title {
          font-size: 24px;
          font-weight: 600;
          color: #F1C40F;
        }
        .info-panel-close {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .info-label {
          font-size: 12px;
          color: rgba(255, 255, 255, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .info-value {
          font-size: 16px;
          font-weight: 500;
        }
        .info-value.highlight {
          color: #F1C40F;
        }
        
        @media (max-width: 768px) {
          .auto-rotate-btn {
            width: 32px;
            height: 32px;
            font-size: 14px;
            top: 12px;
            left: 12px;
          }
          .time-scale-btn {
            width: 32px;
            height: 28px;
            font-size: 11px;
          }
          .time-scale-panel {
            right: 12px;
            gap: 6px;
          }
          .info-panel {
            width: 90%;
            padding: 16px;
            background: rgba(10, 14, 39, 0.75);
          }
          .info-panel-title {
            font-size: 18px;
          }
          .info-value {
            font-size: 14px;
          }
          .info-grid {
            gap: 10px;
          }
        }
      `}</style>

      <button
        className="glass-button auto-rotate-btn"
        onClick={handleAutoRotateToggle}
        title={isAutoRotate ? '停止自动旋转' : '开始自动旋转'}
      >
        {isAutoRotate ? '⏸' : '▶'}
      </button>

      <div className="time-scale-panel">
        {timeScaleOptions.map((option) => (
          <button
            key={option.value}
            className={`glass-button time-scale-btn ${
              displayTimeScale === option.value ? 'active' : ''
            }`}
            onClick={() => handleTimeScaleClick(option.value)}
            title={`${option.label} 速度`}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className={`info-panel ${selectedPlanet ? 'visible' : ''}`}>
        {selectedPlanetData && (
          <>
            <div className="info-panel-header">
              <div className="info-panel-title">{selectedPlanetData.name}</div>
              <button
                className="glass-button info-panel-close"
                onClick={handleClosePanel}
              >
                ✕
              </button>
            </div>
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">公转周期</span>
                <span className="info-value highlight">
                  {selectedPlanetData.orbitPeriod.toFixed(2)} 地球年
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">自转周期</span>
                <span className="info-value highlight">
                  {Math.abs(selectedPlanetData.rotationPeriod).toFixed(2)} 地球日
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">与太阳距离</span>
                <span className="info-value">
                  {selectedPlanetData.distanceFromSun.toFixed(2)} 天文单位
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">半径</span>
                <span className="info-value">
                  {(selectedPlanetData.radius / 0.02).toFixed(0)} km
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">自转轴倾角</span>
                <span className="info-value">
                  {Math.abs(selectedPlanetData.tiltAngle).toFixed(2)}°
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">当前时间倍率</span>
                <span className="info-value highlight">
                  {timeScale.toFixed(1)}x
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}

export default UI
