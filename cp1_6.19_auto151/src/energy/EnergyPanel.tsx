import { useEffect, useState } from 'react'
import { useGame } from '../store'
import { eventBus } from '../eventBus'

export default function EnergyPanel() {
  const { state, dispatch } = useGame()
  const [engineRatio, setEngineRatio] = useState(50)
  const [shieldRatio, setShieldRatio] = useState(50)
  const [warning, setWarning] = useState({ engineLow: false, shieldLow: false })

  useEffect(() => {
    const off = eventBus.on('ENERGY_WARNING', (data) => setWarning(data))
    return off
  }, [])

  const handleEngineChange = (v: number) => {
    const newEngine = v
    const newShield = 100 - v
    setEngineRatio(newEngine)
    setShieldRatio(newShield)
    dispatch({ type: 'SET_ENERGY_RATIO', engineRatio: newEngine, shieldRatio: newShield })
    eventBus.emit('ENERGY_ALLOCATED', { engineRatio: newEngine, shieldRatio: newShield })
  }

  const handleShieldChange = (v: number) => {
    const newShield = v
    const newEngine = 100 - v
    setEngineRatio(newEngine)
    setShieldRatio(newShield)
    dispatch({ type: 'SET_ENERGY_RATIO', engineRatio: newEngine, shieldRatio: newShield })
    eventBus.emit('ENERGY_ALLOCATED', { engineRatio: newEngine, shieldRatio: newShield })
  }

  const lowEnergy = warning.engineLow || warning.shieldLow

  return (
    <div
      className={`energy-panel ${lowEnergy ? 'energy-warning' : ''}`}
    >
      <h2 className="panel-title">能源管理中心</h2>

      <div className="energy-section">
        <div className="energy-label-row">
          <span className="energy-label">引擎能量</span>
          <span className="energy-value">{Math.round(state.energy.engine)}%</span>
        </div>
        <div className="energy-bar-container">
          <div
            className="energy-bar energy-bar-engine"
            style={{ width: `${state.energy.engine}%` }}
          />
        </div>
        <div className="slider-container">
          <label className="slider-label">分配比例: {engineRatio}%</label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={engineRatio}
            onChange={(e) => handleEngineChange(Number(e.target.value))}
            className="custom-slider slider-engine"
          />
        </div>
      </div>

      <div className="energy-section">
        <div className="energy-label-row">
          <span className="energy-label">护盾能量</span>
          <span className="energy-value">{Math.round(state.energy.shield)}%</span>
        </div>
        <div className="energy-bar-container">
          <div
            className="energy-bar energy-bar-shield"
            style={{ width: `${state.energy.shield}%` }}
          />
        </div>
        <div className="slider-container">
          <label className="slider-label">分配比例: {shieldRatio}%</label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={shieldRatio}
            onChange={(e) => handleShieldChange(Number(e.target.value))}
            className="custom-slider slider-shield"
          />
        </div>
      </div>

      {state.energy.shield < 20 && (
        <div className="shield-warning-text">
          ⚠ 护盾低于20%，飞船速度降低30%
        </div>
      )}

      <div className="energy-tips">
        <p>提示：引擎能量决定飞船速度</p>
        <p>护盾能量抵御星尘冲击</p>
      </div>
    </div>
  )
}
