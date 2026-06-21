import { useState } from 'react'
import { Mountain, Droplets, Wind, Snowflake, Play, Pause, RotateCcw, Save, Clock } from 'lucide-react'
import { useTerrainStore, TerrainType } from '../store/terrainStore'
import './ControlPanel.css'

const terrainTypes: { type: TerrainType; label: string; icon: string; color: string }[] = [
  { type: 'mountain', label: '山脉', icon: '⛰️', color: '#4a6741' },
  { type: 'basin', label: '盆地', icon: '🏞️', color: '#1e90ff' },
  { type: 'plain', label: '平原', icon: '🌾', color: '#228b22' },
  { type: 'volcano', label: '火山', icon: '🌋', color: '#8b0000' },
]

const timeScales = [
  { value: 1, label: '1x' },
  { value: 2, label: '2x' },
  { value: 5, label: '5x' },
]

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  unit: string
  icon: React.ReactNode
  onChange: (value: number) => void
  onReset: () => void
  color?: string
}

function Slider({ label, value, min, max, step, unit, icon, onChange, onReset, color = '#00d4ff' }: SliderProps) {
  const percentage = ((value - min) / (max - min)) * 100
  
  return (
    <div className="slider-container">
      <div className="slider-header">
        <div className="slider-label">
          <span className="slider-icon" style={{ color }}>{icon}</span>
          <span>{label}</span>
        </div>
        <div className="slider-value">
          <span className="value-text">{value.toFixed(step < 1 ? 1 : 0)}</span>
          <span className="value-unit">{unit}</span>
          <button className="reset-btn" onClick={onReset} title="重置">
            <RotateCcw size={12} />
          </button>
        </div>
      </div>
      <div className="slider-track">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="slider-input"
          style={{
            background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, rgba(0, 212, 255, 0.2) ${percentage}%, rgba(0, 212, 255, 0.2) 100%)`
          }}
        />
      </div>
    </div>
  )
}

export default function ControlPanel() {
  const [menuOpen, setMenuOpen] = useState(false)
  
  const {
    terrainType,
    windSpeed,
    waterFlow,
    glacierStrength,
    duration,
    isSimulating,
    timeScale,
    simulationTime,
    setTerrainType,
    setWindSpeed,
    setWaterFlow,
    setGlacierStrength,
    setDuration,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    setTimeScale,
    saveSnapshot,
  } = useTerrainStore()

  const handleResetWind = () => setWindSpeed(30)
  const handleResetWater = () => setWaterFlow(20)
  const handleResetGlacier = () => setGlacierStrength(0)
  const handleResetDuration = () => setDuration(50)

  const progress = Math.min(100, (simulationTime / duration) * 100)

  return (
    <>
      <button 
        className="mobile-menu-btn"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <div className={`hamburger ${menuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </button>
      
      <div className={`control-panel ${menuOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h2>地貌选择</h2>
        </div>
        
        <div className="terrain-selector">
          {terrainTypes.map(({ type, label, icon, color }) => (
            <button
              key={type}
              className={`terrain-btn ${terrainType === type ? 'active' : ''}`}
              onClick={() => setTerrainType(type)}
              style={{ '--btn-color': color } as React.CSSProperties}
            >
              <span className="terrain-icon">{icon}</span>
              <span className="terrain-label">{label}</span>
            </button>
          ))}
        </div>

        <div className="panel-divider" />

        <div className="panel-header">
          <h2>侵蚀参数</h2>
        </div>

        <div className="sliders-section">
          <Slider
            label="风速"
            value={windSpeed}
            min={0}
            max={100}
            step={1}
            unit="m/s"
            icon={<Wind size={16} />}
            onChange={setWindSpeed}
            onReset={handleResetWind}
            color="#87ceeb"
          />
          
          <Slider
            label="水流量"
            value={waterFlow}
            min={0}
            max={50}
            step={0.5}
            unit="单位/秒"
            icon={<Droplets size={16} />}
            onChange={setWaterFlow}
            onReset={handleResetWater}
            color="#4169e1"
          />
          
          <Slider
            label="冰川强度"
            value={glacierStrength}
            min={0}
            max={10}
            step={1}
            unit="级"
            icon={<Snowflake size={16} />}
            onChange={setGlacierStrength}
            onReset={handleResetGlacier}
            color="#e0ffff"
          />
          
          <Slider
            label="侵蚀持续时间"
            value={duration}
            min={1}
            max={100}
            step={1}
            unit="年"
            icon={<Clock size={16} />}
            onChange={setDuration}
            onReset={handleResetDuration}
            color="#daa520"
          />
        </div>

        <div className="panel-divider" />

        <div className="panel-header">
          <h2>模拟控制</h2>
        </div>

        <div className="time-scale-selector">
          <span className="scale-label">时间流速</span>
          <div className="scale-buttons">
            {timeScales.map(({ value, label }) => (
              <button
                key={value}
                className={`scale-btn ${timeScale === value ? 'active' : ''}`}
                onClick={() => setTimeScale(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="progress-section">
          <div className="progress-header">
            <span>模拟进度</span>
            <span>{simulationTime.toFixed(1)} / {duration} 年</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="control-buttons">
          <button
            className={`control-btn play-btn ${isSimulating ? 'pause' : ''}`}
            onClick={isSimulating ? pauseSimulation : startSimulation}
          >
            {isSimulating ? (
              <>
                <Pause size={18} />
                <span>暂停</span>
              </>
            ) : (
              <>
                <Play size={18} />
                <span>开始模拟</span>
              </>
            )}
          </button>
          
          <button
            className="control-btn reset-btn-lg"
            onClick={resetSimulation}
          >
            <RotateCcw size={18} />
            <span>重置</span>
          </button>
        </div>

        <div className="panel-divider" />

        <button
          className="snapshot-btn"
          onClick={() => saveSnapshot()}
        >
          <Save size={16} />
          <span>保存快照</span>
        </button>
      </div>
    </>
  )
}
