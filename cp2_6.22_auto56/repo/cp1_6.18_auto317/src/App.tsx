import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'
import { useAppStore } from './store'

function RightTopStats() {
  const statistics = useAppStore((state) => state.statistics)

  return (
    <div className="right-top-panel">
      <div className="panel-title">实时统计</div>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{statistics.avgTemp.toFixed(1)}°</div>
          <div className="stat-label">平均温度</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#FF6B6B' }}>
            {statistics.maxTemp.toFixed(1)}°
          </div>
          <div className="stat-label">最高</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#4ECDC4' }}>
            {statistics.minTemp.toFixed(1)}°
          </div>
          <div className="stat-label">最低</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#FFD93D' }}>
            {statistics.stdDev.toFixed(2)}
          </div>
          <div className="stat-label">标准差</div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <div className="app-container">
      <div className="left-panel">
        <ControlPanel />
      </div>
      <div className="scene-container">
        <div className="canvas-wrapper">
          <Scene />
        </div>
        <RightTopStats />
      </div>
    </div>
  )
}

export default App
