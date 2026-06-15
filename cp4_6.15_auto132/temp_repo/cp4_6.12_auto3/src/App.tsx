import { useEffect } from 'react'
import { useReactorStore } from './store'
import { startSimulation, stopSimulation } from './coreSimulator'
import EventPanel from './components/EventPanel'
import CoreParamsPanel from './components/CoreParamsPanel'
import HistoryChart from './components/HistoryChart'
import './styles.css'

function App() {
  const { isReplayMode, isShutdown, resetReactor } = useReactorStore()

  useEffect(() => {
    if (!isReplayMode) {
      startSimulation()
    }
    return () => {
      stopSimulation()
    }
  }, [isReplayMode])

  return (
    <div className="app-container">
      <div className="main-layout">
        <EventPanel />
        <CoreParamsPanel />
        <RightPanel />
      </div>
      <HistoryChart />

      {isShutdown && (
        <div className="shutdown-overlay">
          <div className="shutdown-panel">
            <h2 className="shutdown-title">聚变停堆警告</h2>
            <p className="shutdown-reason">{useReactorStore.getState().shutdownReason}</p>
            <button className="reset-btn" onClick={resetReactor}>
              重启反应堆
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RightPanel() {
  const { params, replayParams, isReplayMode } = useReactorStore()

  const activeParams = isReplayMode && replayParams ? replayParams : params

  const fieldPercent = ((activeParams.magneticField - 1) / (10 - 1)) * 100
  const densityPercent = ((activeParams.density - 0.1) / (5 - 0.1)) * 100

  const fieldAngle = (fieldPercent / 100) * 180

  return (
    <div className="right-panel">
      <div className="panel-card">
        <h3 className="panel-title">约束磁场强度</h3>
        <div className="gauge-container">
          <svg viewBox="0 0 200 120" className="gauge-svg">
            <defs>
              <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#00FFFF" />
                <stop offset="50%" stopColor="#FFB300" />
                <stop offset="100%" stopColor="#FF1493" />
              </linearGradient>
            </defs>
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="#1a1d2e"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M 20 100 A 80 80 0 0 1 180 100"
              fill="none"
              stroke="url(#gaugeGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${(fieldAngle / 180) * 251.3} 251.3`}
              style={{ transition: 'stroke-dasharray 0.3s ease' }}
            />
            <g transform={`rotate(${fieldAngle - 90}, 100, 100)`}>
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="30"
                stroke="#00FF66"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <circle cx="100" cy="100" r="8" fill="#00FF66" />
            </g>
          </svg>
          <div className="gauge-value">
            <span className="gauge-number">{activeParams.magneticField.toFixed(1)}</span>
            <span className="gauge-unit">T</span>
          </div>
        </div>
      </div>

      <div className="panel-card">
        <h3 className="panel-title">等离子体密度</h3>
        <div className="density-indicator">
          <div className="density-bar-container">
            <div
              className="density-bar-fill"
              style={{
                height: `${densityPercent}%`,
                transition: 'height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            />
          </div>
          <div className="density-info">
            <span className="density-value">{activeParams.density.toFixed(2)}</span>
            <span className="density-unit">×10²⁰/m³</span>
          </div>
        </div>
      </div>

      <div className="panel-card status-card">
        <h3 className="panel-title">系统状态</h3>
        <div className="status-item">
          <span className="status-label">温度</span>
          <span className="status-value temp-value">{activeParams.temperature.toFixed(1)} keV</span>
        </div>
        <div className="status-item">
          <span className="status-label">约束模式</span>
          <span className="status-value mode-value">
            {activeParams.magneticField > 6 ? 'H模' : 'L模'}
          </span>
        </div>
        <div className="status-item">
          <span className="status-label">能量约束</span>
          <span className="status-value">
            {activeParams.temperature > 80 && activeParams.density > 1 ? '良好' : '一般'}
          </span>
        </div>
        {isReplayMode && (
          <div className="status-item">
            <span className="status-label">模式</span>
            <span className="status-value" style={{ color: '#00FF66' }}>回放中</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
