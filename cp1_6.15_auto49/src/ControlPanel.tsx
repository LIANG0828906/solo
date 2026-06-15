import { useState, useEffect } from 'react'
import { eventBus, type AnimationMode } from './eventBus'
import { lightController } from './lightController'

const LIGHT_COUNT = 12

const presetColors = [
  '#ff3366', '#ff6b35', '#ffd93d', '#6bcb77',
  '#4d96ff', '#6f42c1', '#ff69b4', '#00d4ff',
  '#ff0000', '#00ff00', '#0000ff', '#ffffff',
]

export default function ControlPanel() {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [brightness, setBrightness] = useState(80)
  const [color, setColor] = useState('#0096ff')
  const [animationMode, setAnimationMode] = useState<AnimationMode>('static')

  useEffect(() => {
    const handleSelectLight = (id: number | null) => {
      setSelectedId(id)
      lightController.setSelectedLight(id)
      setBrightness(lightController.getSelectedBrightness())
      setColor(rgbToHex(lightController.getSelectedColor()))
    }
    eventBus.on('selectLight', handleSelectLight)
    return () => eventBus.off('selectLight', handleSelectLight)
  }, [])

  const rgbToHex = (rgb: string): string => {
    const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (match) {
      const r = parseInt(match[1]).toString(16).padStart(2, '0')
      const g = parseInt(match[2]).toString(16).padStart(2, '0')
      const b = parseInt(match[3]).toString(16).padStart(2, '0')
      return `#${r}${g}${b}`
    }
    return '#0096ff'
  }

  const handleLightClick = (id: number) => {
    const newId = selectedId === id ? null : id
    setSelectedId(newId)
    eventBus.emit('selectLight', newId)
    if (newId !== null) {
      setBrightness(lightController.getSelectedBrightness())
      setColor(rgbToHex(lightController.getSelectedColor()))
    }
  }

  const handleSelectAll = () => {
    setSelectedId(null)
    eventBus.emit('selectAll')
    eventBus.emit('selectLight', null)
    setBrightness(lightController.getSelectedBrightness())
    setColor(rgbToHex(lightController.getSelectedColor()))
  }

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value)
    setBrightness(value)
    lightController.setBrightness(value)
  }

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setColor(value)
    lightController.setColor(value)
  }

  const handlePresetColor = (c: string) => {
    setColor(c)
    lightController.setColor(c)
  }

  const handleAnimationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const mode = e.target.value as AnimationMode
    setAnimationMode(mode)
    lightController.setAnimationMode(mode)
    eventBus.emit('animationChange', mode)
  }

  return (
    <div className="control-panel">
      <h2 className="panel-title">灯光控制台</h2>

      <div className="control-section">
        <h3 className="section-title">灯珠选择</h3>
        <div className="light-selector">
          {Array.from({ length: LIGHT_COUNT }, (_, i) => (
            <button
              key={i}
              className={`light-btn ${selectedId === i ? 'active' : ''}`}
              onClick={() => handleLightClick(i)}
              title={`灯珠 ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <button className="select-all-btn" onClick={handleSelectAll}>
          全选
        </button>
      </div>

      <div className="control-section">
        <h3 className="section-title">亮度调节</h3>
        <div className="brightness-control">
          <input
            type="range"
            min="0"
            max="100"
            value={brightness}
            onChange={handleBrightnessChange}
            className="brightness-slider"
          />
          <span className="brightness-value">{brightness}%</span>
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">颜色设置</h3>
        <div className="color-control">
          <div className="color-picker-wrapper">
            <input
              type="color"
              value={color}
              onChange={handleColorChange}
              className="color-picker"
            />
          </div>
          <div className="preset-colors">
            {presetColors.map((c, i) => (
              <button
                key={i}
                className="preset-color-btn"
                style={{ backgroundColor: c }}
                onClick={() => handlePresetColor(c)}
                title={c}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="control-section">
        <h3 className="section-title">动画模式</h3>
        <select
          value={animationMode}
          onChange={handleAnimationChange}
          className="animation-select"
        >
          <option value="static">静态</option>
          <option value="breathing">呼吸灯</option>
          <option value="alternating">交替闪烁</option>
          <option value="flowing">流水灯</option>
        </select>
      </div>

      <div className="control-section info-section">
        <h3 className="section-title">当前状态</h3>
        <div className="status-info">
          <p>选中灯珠: {selectedId === null ? '全部' : `第 ${selectedId + 1} 号`}</p>
          <p>亮度: {brightness}%</p>
          <p>颜色: {color}</p>
          <p>模式: {getModeName(animationMode)}</p>
        </div>
      </div>
    </div>
  )
}

function getModeName(mode: AnimationMode): string {
  const names: Record<AnimationMode, string> = {
    static: '静态',
    breathing: '呼吸灯',
    alternating: '交替闪烁',
    flowing: '流水灯',
  }
  return names[mode]
}
