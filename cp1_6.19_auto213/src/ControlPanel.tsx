import { useCrystalStore } from './store'

function ControlPanel() {
  const temperature = useCrystalStore((s) => s.temperature)
  const concentration = useCrystalStore((s) => s.concentration)
  const impurity = useCrystalStore((s) => s.impurity)
  const stage = useCrystalStore((s) => s.stage)
  const setTemperature = useCrystalStore((s) => s.setTemperature)
  const setConcentration = useCrystalStore((s) => s.setConcentration)
  const setImpurity = useCrystalStore((s) => s.setImpurity)

  return (
    <div className="control-panel">
      <div className="panel-title">晶体生长控制</div>
      <div className="panel-subtitle">调节参数观察晶体形态变化</div>

      <div className="stage-title">{stage}</div>

      <div className="slider-group">
        <div className="slider-label">
          <span className="slider-name">温度</span>
          <span className="slider-value">{temperature}°</span>
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            className="temp-slider"
            min={100}
            max={1000}
            step={10}
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span className="slider-name">溶液浓度</span>
          <span className="slider-value">{concentration.toFixed(1)}</span>
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            className="conc-slider"
            min={0.1}
            max={2.0}
            step={0.1}
            value={concentration}
            onChange={(e) => setConcentration(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span className="slider-name">杂质干扰</span>
          <span className="slider-value">{impurity}</span>
        </div>
        <div className="slider-wrapper">
          <input
            type="range"
            className="imp-slider"
            min={0}
            max={100}
            step={1}
            value={impurity}
            onChange={(e) => setImpurity(Number(e.target.value))}
          />
        </div>
      </div>
    </div>
  )
}

export default ControlPanel
