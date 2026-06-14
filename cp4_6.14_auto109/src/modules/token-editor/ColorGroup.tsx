import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useDesignTokens, ColorTokens } from '../../context/DesignTokensContext'
import ColorPicker from './ColorPicker'
import { meetsWCAGAA } from '../../utils/contrastChecker'

const colorLabels: Record<keyof ColorTokens, string> = {
  primary: '主色',
  accent: '强调色',
  background: '背景色',
  text: '文字色',
}

const ColorGroup: React.FC = () => {
  const { tokens, updateColor } = useDesignTokens()
  const { colors } = tokens

  const showTextPrimaryWarning = !meetsWCAGAA(colors.text, colors.primary)
  const showTextBackgroundWarning = !meetsWCAGAA(colors.text, colors.background)

  return (
    <>
      {(Object.keys(colorLabels) as (keyof ColorTokens)[]).map((colorKey) => (
        <div className="color-row" key={colorKey}>
          <span className="color-label">{colorLabels[colorKey]}</span>
          <div className="color-swatch-wrapper">
            <ColorPicker color={colors[colorKey]} onChange={(v) => updateColor(colorKey, v)} />
            <span className="color-value">{colors[colorKey]}</span>
          </div>
          {colorKey === 'text' && (showTextPrimaryWarning || showTextBackgroundWarning) && (
            <div className="contrast-warning">
              <AlertTriangle size={12} />
              <span>对比度不足</span>
            </div>
          )}
        </div>
      ))}
    </>
  )
}

export default React.memo(ColorGroup)
