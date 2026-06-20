import React from 'react'
import { useStore, colorSchemes } from '../store/useStore'
import '../styles/ControlPanel.css'

const ControlPanel: React.FC = () => {
  const { brushSettings, setColorScheme, setBrushSize, resetNebula } = useStore()

  return (
    <div className="control-panel">
      <div className="section">
        <div className="label">颜色方案</div>
        <div className="color-schemes">
          {Object.entries(colorSchemes).map(([key, scheme]) => (
            <button
              key={key}
              onClick={() => setColorScheme(key)}
              className={`color-button ${brushSettings.colorScheme === key ? 'selected' : ''}`}
              style={{
                background: `linear-gradient(135deg, ${scheme.start}, ${scheme.end})`
              }}
              title={scheme.name}
            />
          ))}
        </div>
      </div>

      <div className="section">
        <div className="label">画笔尺寸: {brushSettings.size.toFixed(1)}</div>
        <div className="slider-container">
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={brushSettings.size}
            onChange={(e) => setBrushSize(parseFloat(e.target.value))}
          />
        </div>
      </div>

      <div className="section">
        <button onClick={resetNebula} className="reset-button">
          重置星云
        </button>
      </div>
    </div>
  )
}

export default ControlPanel
