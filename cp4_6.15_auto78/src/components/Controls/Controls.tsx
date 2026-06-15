import { useMemo } from 'react'
import { useSimStore, BuildingType } from '@/store/useSimStore'
import {
  calculateSolarPosition,
  formatDayOfYear,
  formatTimeHours,
  formatDaylightDuration,
  radToDeg,
} from '@/utils/solarCalculator'
import './Controls.css'

const buildingOptions: { value: BuildingType; label: string }[] = [
  { value: 'box', label: '长方体' },
  { value: 'lshape', label: 'L形' },
  { value: 'courtyard', label: '回字形' },
]

export function Controls() {
  const dayOfYear = useSimStore((state) => state.dayOfYear)
  const timeHours = useSimStore((state) => state.timeHours)
  const latitude = useSimStore((state) => state.latitude)
  const longitude = useSimStore((state) => state.longitude)
  const selectedBuilding = useSimStore((state) => state.selectedBuilding)

  const setDayOfYear = useSimStore((state) => state.setDayOfYear)
  const setTimeHours = useSimStore((state) => state.setTimeHours)
  const setLatitude = useSimStore((state) => state.setLatitude)
  const setLongitude = useSimStore((state) => state.setLongitude)
  const setSelectedBuilding = useSimStore((state) => state.setSelectedBuilding)

  const solar = useMemo(
    () => calculateSolarPosition(dayOfYear, timeHours, latitude, longitude),
    [dayOfYear, timeHours, latitude, longitude],
  )

  const elevationDeg = radToDeg(solar.elevation)
  const elevationPercent = Math.max(0, Math.min(100, (elevationDeg / 90) * 100))
  const isLowAngle = elevationDeg < 10 && elevationDeg > 0

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDayOfYear(Number(e.target.value))
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value)
    const rounded = Math.round(value * 4) / 4
    setTimeHours(rounded)
  }

  const handleLatitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      setLatitude(value)
    }
  }

  const handleLongitudeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value)
    if (!isNaN(value)) {
      setLongitude(value)
    }
  }

  return (
    <div className="controls-panel">
      <div className="controls-header">
        <h1 className="controls-title">日照分析</h1>
        <p className="controls-subtitle">3D建筑阴影模拟</p>
      </div>

      <div className="controls-section">
        <div className="control-group">
          <label className="control-label">日期</label>
          <input
            type="range"
            min="1"
            max="365"
            step="1"
            value={dayOfYear}
            onChange={handleDayChange}
            className="slider"
          />
          <div className="slider-value">{formatDayOfYear(dayOfYear)}</div>
        </div>

        <div className="control-group">
          <label className="control-label">时间</label>
          <input
            type="range"
            min="6"
            max="19"
            step="0.25"
            value={timeHours}
            onChange={handleTimeChange}
            className="slider"
          />
          <div className="slider-value">{formatTimeHours(timeHours)}</div>
        </div>

        <div className="control-row">
          <div className="control-group control-half">
            <label className="control-label">纬度</label>
            <input
              type="number"
              min="-90"
              max="90"
              step="0.1"
              value={latitude}
              onChange={handleLatitudeChange}
              className="number-input"
            />
          </div>
          <div className="control-group control-half">
            <label className="control-label">经度</label>
            <input
              type="number"
              min="-180"
              max="180"
              step="0.1"
              value={longitude}
              onChange={handleLongitudeChange}
              className="number-input"
            />
          </div>
        </div>

        <div className="control-group">
          <label className="control-label">建筑体块</label>
          <div className="building-buttons">
            {buildingOptions.map((option) => (
              <button
                key={option.value}
                className={`building-btn ${selectedBuilding === option.value ? 'active' : ''}`}
                onClick={() => setSelectedBuilding(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="report-section">
        <h2 className="report-title">日照分析报告</h2>

        <div className="report-item">
          <span className="report-label">总日照时长</span>
          <span className="report-value">
            {formatDaylightDuration(solar.daylightDuration)}
          </span>
        </div>

        <div className="report-item">
          <span className="report-label">日出</span>
          <span className="report-value">{formatTimeHours(solar.sunriseHours)}</span>
        </div>

        <div className="report-item">
          <span className="report-label">日落</span>
          <span className="report-value">{formatTimeHours(solar.sunsetHours)}</span>
        </div>

        <div className="report-item">
          <span className="report-label">当前太阳仰角</span>
          <span className={`report-value elevation-value ${isLowAngle ? 'low-angle' : ''}`}>
            {elevationDeg.toFixed(1)}°
          </span>
        </div>

        <div className="elevation-progress-container">
          <div
            className={`elevation-progress-bar ${isLowAngle ? 'low-angle' : ''}`}
            style={{ width: `${elevationPercent}%` }}
          />
          <div className="elevation-progress-track" />
        </div>

        {isLowAngle && (
          <div className="low-angle-warning">
            <span className="warning-icon">⚠</span>
            <span>低角度光照</span>
          </div>
        )}
      </div>
    </div>
  )
}
