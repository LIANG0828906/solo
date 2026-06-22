import { useStore } from '../store/useStore'

function ControlPanel() {
  const {
    lightIntensity,
    humidity,
    soilType,
    growthTime,
    setLightIntensity,
    setHumidity,
    setSoilType,
    setGrowthTime,
  } = useStore()

  const formatDay = (day: number) => `第${Math.floor(day)}天`

  return (
    <div className="control-panel">
      <div className="panel-title">🌿 植物园控制台</div>

      <div className="control-group">
        <div className="control-label">
          <span>光照强度</span>
          <span className="control-value">{lightIntensity}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="100"
          value={lightIntensity}
          onChange={(e) => setLightIntensity(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>环境湿度</span>
          <span className="control-value">{humidity}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={humidity}
          onChange={(e) => setHumidity(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>土壤类型</span>
        </div>
        <select
          value={soilType}
          onChange={(e) => setSoilType(e.target.value as 'sand' | 'clay' | 'humus')}
        >
          <option value="sand">沙土 - 浅褐色</option>
          <option value="clay">黏土 - 深棕色</option>
          <option value="humus">腐殖土 - 黑褐色</option>
        </select>
      </div>

      <div className="control-group">
        <div className="control-label">
          <span>时光轴</span>
          <span className="control-value">{formatDay(growthTime)}</span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          value={growthTime}
          onChange={(e) => setGrowthTime(Number(e.target.value))}
        />
      </div>
    </div>
  )
}

export default ControlPanel
