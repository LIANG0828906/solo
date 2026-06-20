import { useAppStore } from '../store'
import type { CityBuilding } from '../types'

const orientationLabels: Record<CityBuilding['orientation'], string> = {
  north: '朝北',
  south: '朝南',
  east: '朝东',
  west: '朝西',
}

function BuildingInfoPanel() {
  const selectedId = useAppStore((state) => state.selectedBuildingId)
  const buildings = useAppStore((state) => state.buildings)
  const selectedBuilding = buildings.find((b) => b.id === selectedId)

  return (
    <div className="panel-section">
      <div className="panel-title">建筑信息</div>
      {selectedBuilding ? (
        <div className="building-info">
          <div className="building-info-row">
            <span className="building-info-label">占地面积</span>
            <span className="building-info-value">
              {(selectedBuilding.width * selectedBuilding.depth).toFixed(2)} 单元²
            </span>
          </div>
          <div className="building-info-row">
            <span className="building-info-label">建筑高度</span>
            <span className="building-info-value">
              {selectedBuilding.height.toFixed(2)} 单位
            </span>
          </div>
          <div className="building-info-row">
            <span className="building-info-label">朝向</span>
            <span className="building-info-value">
              {orientationLabels[selectedBuilding.orientation]}
            </span>
          </div>
          <div className="building-info-row">
            <span className="building-info-label">受热等级</span>
            <span className={`heat-level-badge heat-level-${selectedBuilding.heatLevel}`}>
              {selectedBuilding.heatLevel === 'low' ? '低' : selectedBuilding.heatLevel === 'medium' ? '中' : '高'}
            </span>
          </div>
        </div>
      ) : (
        <div className="no-selection">点击场景中的建筑查看详情</div>
      )}
    </div>
  )
}

function SliderPanel() {
  const params = useAppStore((state) => state.params)
  const setParams = useAppStore((state) => state.setParams)

  const handleGreenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ greenCoverage: Number(e.target.value) })
  }

  const handleWaterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ waterCoverage: Number(e.target.value) })
  }

  const handleSunlightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setParams({ sunlightIntensity: Number(e.target.value) })
  }

  return (
    <div className="panel-section">
      <div className="panel-title">环境参数</div>
      <div className="slider-group">
        <div className="slider-item">
          <div className="slider-label">
            <span>绿地覆盖率</span>
            <span className="slider-value">{params.greenCoverage}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="40"
            value={params.greenCoverage}
            onChange={handleGreenChange}
          />
        </div>
        <div className="slider-item">
          <div className="slider-label">
            <span>水体覆盖率</span>
            <span className="slider-value">{params.waterCoverage}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="20"
            value={params.waterCoverage}
            onChange={handleWaterChange}
          />
        </div>
        <div className="slider-item">
          <div className="slider-label">
            <span>夏季日照强度</span>
            <span className="slider-value">{params.sunlightIntensity}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            value={params.sunlightIntensity}
            onChange={handleSunlightChange}
          />
        </div>
      </div>
    </div>
  )
}

function StatisticsPanel() {
  const statistics = useAppStore((state) => state.statistics)

  return (
    <div className="panel-section">
      <div className="panel-title">温度统计</div>
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-value">{statistics.avgTemp.toFixed(1)}°</div>
          <div className="stat-label">平均温度</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#FF6B6B' }}>
            {statistics.maxTemp.toFixed(1)}°
          </div>
          <div className="stat-label">最高温度</div>
        </div>
        <div className="stat-item">
          <div className="stat-value" style={{ color: '#4ECDC4' }}>
            {statistics.minTemp.toFixed(1)}°
          </div>
          <div className="stat-label">最低温度</div>
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

function RegenerateButton() {
  const regenerate = useAppStore((state) => state.regenerateBuildings)

  return (
    <button className="regenerate-btn" onClick={regenerate}>
      重新生成城市
    </button>
  )
}

export default function ControlPanel() {
  return (
    <>
      <div className="app-header">
        <h1>城市热岛模拟器</h1>
        <div className="app-subtitle">Urban Heat Island Simulator</div>
      </div>
      <BuildingInfoPanel />
      <SliderPanel />
      <StatisticsPanel />
      <RegenerateButton />
    </>
  )
}
