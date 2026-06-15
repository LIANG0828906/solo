import React, { useCallback } from 'react'
import { useDesignTokens, FontTokens, FontFamily } from '../../context/DesignTokensContext'

const fontLabels: Record<keyof FontTokens, string> = {
  heading: '标题字体',
  body: '正文字体',
}

const fontOptions: { value: FontFamily; label: string }[] = [
  { value: 'serif', label: '衬线体 (Serif)' },
  { value: 'sans-serif', label: '无衬线体 (Sans-serif)' },
  { value: 'monospace', label: '等宽字体 (Monospace)' },
]

const FontGroup: React.FC = () => {
  const { tokens, updateFont } = useDesignTokens()
  const { fonts } = tokens

  const handleChange = useCallback(
    (key: keyof FontTokens) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      updateFont(key, e.target.value as FontFamily)
    },
    [updateFont]
  )

  return (
    <>
      {(Object.keys(fontLabels) as (keyof FontTokens)[]).map((key) => (
        <div className="font-row" key={key}>
          <span className="font-label">{fontLabels[key]}</span>
          <select
            className="font-select"
            value={fonts[key]}
            onChange={handleChange(key)}
          >
            {fontOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      ))}
    </>
  )
}

export default React.memo(FontGroup)
