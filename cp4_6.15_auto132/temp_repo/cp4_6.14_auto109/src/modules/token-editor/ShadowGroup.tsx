import React, { useCallback } from 'react'
import { useDesignTokens, ShadowTokens } from '../../context/DesignTokensContext'
import CustomSlider from '../../components/CustomSlider'

const shadowLabels: Record<keyof ShadowTokens, string> = {
  sm: 'SM (小阴影)',
  md: 'MD (中阴影)',
  lg: 'LG (大阴影)',
}

const ShadowGroup: React.FC = () => {
  const { tokens, updateShadow } = useDesignTokens()
  const { shadows } = tokens

  const handleChange = useCallback(
    (key: keyof ShadowTokens) => (value: number) => {
      updateShadow(key, value)
    },
    [updateShadow]
  )

  return (
    <>
      {(Object.keys(shadowLabels) as (keyof ShadowTokens)[]).map((key) => (
        <div className="slider-row" key={key}>
          <div className="slider-header">
            <span className="slider-label">{shadowLabels[key]}</span>
            <span className="slider-value">{shadows[key]}px</span>
          </div>
          <CustomSlider
            value={shadows[key]}
            min={0}
            max={20}
            step={1}
            onChange={handleChange(key)}
          />
        </div>
      ))}
    </>
  )
}

export default React.memo(ShadowGroup)
