import React from 'react'
import { useDesignTokens, SpacingTokens } from '../../context/DesignTokensContext'

const spacingLabels: Record<keyof SpacingTokens, string> = {
  xs: 'XS',
  s: 'S',
  m: 'M',
  l: 'L',
  xl: 'XL',
}

const SpacingGroup: React.FC = () => {
  const { tokens, updateSpacing } = useDesignTokens()
  const { spacing } = tokens

  return (
    <>
      {(Object.keys(spacingLabels) as (keyof SpacingTokens)[]).map((key) => (
        <div className="slider-row" key={key}>
          <div className="slider-header">
            <span className="slider-label">{spacingLabels[key]}</span>
            <span className="slider-value">{spacing[key]}px</span>
          </div>
          <input
            className="custom-slider"
            type="range"
            min={0}
            max={64}
            step={4}
            value={spacing[key]}
            onChange={(e) => updateSpacing(key, parseInt(e.target.value, 10))}
          />
        </div>
      ))}
    </>
  )
}

export default SpacingGroup
