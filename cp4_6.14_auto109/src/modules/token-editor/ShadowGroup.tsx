import React from 'react'
import { useDesignTokens, ShadowTokens } from '../../context/DesignTokensContext'

const shadowLabels: Record<keyof ShadowTokens, string> = {
  sm: 'SM (小阴影)',
  md: 'MD (中阴影)',
  lg: 'LG (大阴影)',
}

const ShadowGroup: React.FC = () => {
  const { tokens, updateShadow } = useDesignTokens()
  const { shadows } = tokens

  return (
    <>
      {(Object.keys(shadowLabels) as (keyof ShadowTokens)[]).map((key) => (
        <div className="slider-row" key={key}>
          <div className="slider-header">
            <span className="slider-label">{shadowLabels[key]}</span>
            <span className="slider-value">{shadows[key]}px</span>
          </div>
          <input
            className="custom-slider"
            type="range"
            min={0}
            max={20}
            step={1}
            value={shadows[key]}
            onChange={(e) => updateShadow(key, parseInt(e.target.value, 10))}
          />
        </div>
      ))}
    </>
  )
}

export default ShadowGroup
