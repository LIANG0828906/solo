import React, { useCallback } from 'react'
import { useDesignTokens, SpacingTokens } from '../../context/DesignTokensContext'
import CustomSlider from '../../components/CustomSlider'

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

  const handleChange = useCallback(
    (key: keyof SpacingTokens) => (value: number) => {
      updateSpacing(key, value)
    },
    [updateSpacing]
  )

  return (
    <>
      {(Object.keys(spacingLabels) as (keyof SpacingTokens)[]).map((key) => (
        <div className="slider-row" key={key}>
          <div className="slider-header">
            <span className="slider-label">{spacingLabels[key]}</span>
            <span className="slider-value">{spacing[key]}px</span>
          </div>
          <CustomSlider
            value={spacing[key]}
            min={0}
            max={64}
            step={4}
            onChange={handleChange(key)}
          />
        </div>
      ))}
    </>
  )
}

export default React.memo(SpacingGroup)
