import React from 'react'
import { useCrossroadSignalStore } from '../../store/crossroadSignalStore'
import { useUIStore } from '../../store/uiStore'
import { SignalColor } from '../../types'

export const ControlPanel: React.FC = () => {
  const { selectedCrossroadId, selectCrossroad } = useUIStore()
  const { crossroads, setSignalDuration } = useCrossroadSignalStore()

  const crossroad = selectedCrossroadId ? crossroads.get(selectedCrossroadId) : null

  if (!crossroad) return null

  const handleClose = () => {
    selectCrossroad(null)
  }

  const handleSliderChange = (color: SignalColor, value: number) => {
    setSignalDuration(crossroad.id, color, value)
  }

  const signalConfig = [
    { color: 'red' as SignalColor, label: '红灯', value: crossroad.redDuration, hex: '#FF0055' },
    { color: 'yellow' as SignalColor, label: '黄灯', value: crossroad.yellowDuration, hex: '#FFAA00' },
    { color: 'green' as SignalColor, label: '绿灯', value: crossroad.greenDuration, hex: '#00FFAA' },
  ]

  const currentColorHex = {
    red: '#FF0055',
    yellow: '#FFAA00',
    green: '#00FFAA',
  }[crossroad.currentColor]

  return (
    <div className="control-panel-overlay" onClick={handleClose}>
      <div className="control-panel" onClick={(e) => e.stopPropagation()}>
        <div className="control-panel-header">
          <h3>路口信号灯控制</h3>
          <span className="crossroad-coord">
            ({crossroad.gridX}, {crossroad.gridY})
          </span>
          <button className="close-btn" onClick={handleClose}>
            ×
          </button>
        </div>

        <div className="current-signal">
          <span className="current-signal-label">当前状态：</span>
          <span
            className="current-signal-value"
            style={{
              color: currentColorHex,
              textShadow: `0 0 10px ${currentColorHex}`,
            }}
          >
            {crossroad.currentColor === 'red' ? '红灯' : crossroad.currentColor === 'yellow' ? '黄灯' : '绿灯'}
          </span>
          <span className="remaining-time">
            剩余 {crossroad.remainingTime.toFixed(1)} 秒
          </span>
        </div>

        <div className="signal-sliders">
          {signalConfig.map((cfg) => (
            <div key={cfg.color} className="slider-group">
              <div className="slider-label">
                <span style={{ color: cfg.hex, textShadow: `0 0 5px ${cfg.hex}` }}>{cfg.label}</span>
                <span className="slider-value">{cfg.value}秒</span>
              </div>
              <input
                type="range"
                min="1"
                max="120"
                value={cfg.value}
                onChange={(e) => handleSliderChange(cfg.color, parseInt(e.target.value))}
                className="signal-slider"
                style={{
                  accentColor: cfg.hex,
                }}
              />
            </div>
          ))}
        </div>

        <div className="control-tip">调整滑块实时改变信号灯时长，车流会立即响应</div>
      </div>
    </div>
  )
}
