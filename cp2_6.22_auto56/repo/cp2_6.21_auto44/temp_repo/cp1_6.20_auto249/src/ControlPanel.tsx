import React from 'react'
import { FlowerParams, hslToHex } from './utils/flowerUtils'
import './ControlPanel.css'

interface ControlPanelProps {
  params: FlowerParams
  onParamsChange: (params: FlowerParams) => void
  onPlant: () => void
  onSave: () => void
  isPlanted: boolean
  isBloomed: boolean
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onParamsChange,
  onPlant,
  onSave,
  isPlanted,
  isBloomed,
}) => {
  const handlePetalCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ ...params, petalCount: parseInt(e.target.value) })
  }

  const handlePetalHueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ ...params, petalHue: parseFloat(e.target.value) })
  }

  const handleFlowerDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ ...params, flowerDiameter: parseFloat(e.target.value) })
  }

  const handleStemBendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onParamsChange({ ...params, stemBend: parseFloat(e.target.value) })
  }

  const petalColor = hslToHex(params.petalHue, 0.7, 0.6)

  return (
    <div className="control-panel">
      <h2 className="panel-title">培育参数</h2>

      <div className="slider-group">
        <label className="slider-label">
          <span className="slider-name">花瓣数量</span>
          <span className="slider-value">{params.petalCount} 片</span>
        </label>
        <input
          type="range"
          min="5"
          max="12"
          step="1"
          value={params.petalCount}
          onChange={handlePetalCountChange}
          disabled={!isBloomed}
          className="slider slider-petal-count"
          style={{
            background: `linear-gradient(to right, #81c784 0%, #81c784 ${((params.petalCount - 5) / 7) * 100}%, #e0e0e0 ${((params.petalCount - 5) / 7) * 100}%, #e0e0e0 100%)`,
          }}
        />
        <div className="slider-range">
          <span>5</span>
          <span>12</span>
        </div>
      </div>

      <div className="slider-group">
        <label className="slider-label">
          <span className="slider-name">花瓣颜色</span>
          <span
            className="color-preview"
            style={{ backgroundColor: petalColor }}
          />
        </label>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={params.petalHue}
          onChange={handlePetalHueChange}
          disabled={!isBloomed}
          className="slider slider-hue"
          style={{
            background: `linear-gradient(to right,
              hsl(0, 70%, 60%),
              hsl(60, 70%, 60%),
              hsl(120, 70%, 60%),
              hsl(180, 70%, 60%),
              hsl(240, 70%, 60%),
              hsl(300, 70%, 60%),
              hsl(360, 70%, 60%)
            )`,
          }}
        />
        <div className="slider-range">
          <span>0°</span>
          <span>360°</span>
        </div>
      </div>

      <div className="slider-group">
        <label className="slider-label">
          <span className="slider-name">花朵直径</span>
          <span className="slider-value">{Math.round(params.flowerDiameter)} px</span>
        </label>
        <input
          type="range"
          min="40"
          max="120"
          step="1"
          value={params.flowerDiameter}
          onChange={handleFlowerDiameterChange}
          disabled={!isBloomed}
          className="slider slider-diameter"
          style={{
            background: `linear-gradient(to right, #f48fb1 0%, #f48fb1 ${((params.flowerDiameter - 40) / 80) * 100}%, #e0e0e0 ${((params.flowerDiameter - 40) / 80) * 100}%, #e0e0e0 100%)`,
          }}
        />
        <div className="slider-range">
          <span>40</span>
          <span>120</span>
        </div>
      </div>

      <div className="slider-group">
        <label className="slider-label">
          <span className="slider-name">茎弯曲角度</span>
          <span className="slider-value">{params.stemBend.toFixed(0)}°</span>
        </label>
        <input
          type="range"
          min="-30"
          max="30"
          step="1"
          value={params.stemBend}
          onChange={handleStemBendChange}
          disabled={!isBloomed}
          className="slider slider-bend"
          style={{
            background: `linear-gradient(to right, #e0e0e0 0%, #ad8a6b 50%, #e0e0e0 100%)`,
          }}
        />
        <div className="slider-range">
          <span>-30°</span>
          <span>30°</span>
        </div>
      </div>

      <div className="button-group">
        {!isPlanted ? (
          <button className="plant-btn" onClick={onPlant}>
            🌱 播种
          </button>
        ) : isBloomed ? (
          <button className="save-btn" onClick={onSave}>
            💾 保存截图
          </button>
        ) : (
          <button className="plant-btn" disabled>
            生长中...
          </button>
        )}
      </div>
    </div>
  )
}

export default ControlPanel
