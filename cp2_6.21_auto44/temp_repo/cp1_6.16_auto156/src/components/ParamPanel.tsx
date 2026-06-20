import React, { useState } from 'react'
import { useTypographyStore, Alignment, PathType } from '../store/typographyStore'
import { fontManager } from '../modules/font-manager/FontManager'

export const ParamPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false)

  const {
    fontFamily,
    fontSize,
    fontWeight,
    lineHeight,
    letterSpacing,
    textColor,
    backgroundColor,
    accentColor,
    text,
    pathType,
    pathRadius,
    spiralTurns,
    waveAmplitude,
    themeId,
    themes,
    lastCharSpecial,
    lines,
    setFontFamily,
    setFontSize,
    setFontWeight,
    setLineHeight,
    setLetterSpacing,
    setTextColor,
    setBackgroundColor,
    setAccentColor,
    setText,
    setPathType,
    setPathRadius,
    setSpiralTurns,
    setWaveAmplitude,
    setThemeId,
    setLineAlignment,
    setLastCharSpecial,
  } = useTypographyStore()

  const systemFonts = fontManager.getSystemFonts()
  const googleFonts = fontManager.getGoogleFonts()

  const handleFontChange = async (fontName: string) => {
    setFontFamily(fontName)
    await fontManager.loadGoogleFont(fontName)
  }

  const pathTypes: { value: PathType; label: string }[] = [
    { value: 'linear', label: '线性' },
    { value: 'circle', label: '圆形' },
    { value: 'spiral', label: '螺旋' },
    { value: 'wave', label: '波浪' },
  ]

  const alignments: { value: Alignment; label: string }[] = [
    { value: 'left', label: '左' },
    { value: 'center', label: '中' },
    { value: 'right', label: '右' },
    { value: 'justify', label: '两端' },
  ]

  return (
    <div className={`param-panel ${isExpanded ? 'expanded' : ''}`}>
      <button className="panel-toggle-btn" onClick={() => setIsExpanded(!isExpanded)}>
        <span>⚙</span>
        <span>排版参数</span>
      </button>

      <div className="control-group">
        <div className="control-title">诗句文本</div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="输入诗句，每行一句..."
        />
      </div>

      <div className="control-group">
        <div className="control-title">字体设置</div>

        <label className="control-label">系统字体</label>
        <select value={systemFonts.find(f => f.name === fontFamily) ? fontFamily : ''}
                onChange={(e) => handleFontChange(e.target.value)}>
          <option value="">-- 选择系统字体 --</option>
          {systemFonts.map(font => (
            <option key={font.name} value={font.name}>{font.name}</option>
          ))}
        </select>

        <label className="control-label">Google 字体</label>
        <select value={googleFonts.find(f => f.name === fontFamily) ? fontFamily : ''}
                onChange={(e) => handleFontChange(e.target.value)}>
          <option value="">-- 选择在线字体 --</option>
          {googleFonts.map(font => (
            <option key={font.name} value={font.name}>{font.name}</option>
          ))}
        </select>

        <label className="control-label">字号: {fontSize}px</label>
        <div className="control-row">
          <input
            type="range"
            min={10}
            max={200}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
          />
        </div>

        <label className="control-label">字重</label>
        <select value={fontWeight} onChange={(e) => setFontWeight(Number(e.target.value))}>
          {[100, 200, 300, 400, 500, 600, 700, 800, 900].map(w => (
            <option key={w} value={w}>{w}</option>
          ))}
        </select>

        <label className="control-label">行距: {lineHeight.toFixed(1)}</label>
        <input
          type="range"
          min={1}
          max={3}
          step={0.1}
          value={lineHeight}
          onChange={(e) => setLineHeight(Number(e.target.value))}
        />

        <label className="control-label">字距: {letterSpacing}px</label>
        <input
          type="range"
          min={-5}
          max={20}
          value={letterSpacing}
          onChange={(e) => setLetterSpacing(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <div className="control-title">行对齐方式</div>
        {lines.map((line, idx) => (
          <div key={line.id} style={{ marginBottom: 8 }}>
            <label className="control-label">第 {idx + 1} 行</label>
            <div className="alignment-buttons">
              {alignments.map(al => (
                <button
                  key={al.value}
                  className={`alignment-btn ${line.alignment === al.value ? 'active' : ''}`}
                  onClick={() => setLineAlignment(line.id, al.value)}
                >
                  {al.label}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div className="checkbox-row">
          <input
            type="checkbox"
            id="lastCharSpecial"
            checked={lastCharSpecial}
            onChange={(e) => setLastCharSpecial(e.target.checked)}
          />
          <label htmlFor="lastCharSpecial">行尾字特殊样式（斜体、加粗、高亮）</label>
        </div>
      </div>

      <div className="control-group">
        <div className="control-title">排列路径</div>
        <div className="path-buttons">
          {pathTypes.map(pt => (
            <button
              key={pt.value}
              className={`path-btn ${pathType === pt.value ? 'active' : ''}`}
              onClick={() => setPathType(pt.value)}
            >
              {pt.label}
            </button>
          ))}
        </div>

        {pathType === 'circle' && (
          <>
            <label className="control-label">半径: {pathRadius}px</label>
            <input
              type="range"
              min={50}
              max={500}
              value={pathRadius}
              onChange={(e) => setPathRadius(Number(e.target.value))}
            />
          </>
        )}

        {pathType === 'spiral' && (
          <>
            <label className="control-label">半径: {pathRadius}px</label>
            <input
              type="range"
              min={50}
              max={500}
              value={pathRadius}
              onChange={(e) => setPathRadius(Number(e.target.value))}
            />
            <label className="control-label">圈数: {spiralTurns}</label>
            <input
              type="range"
              min={1}
              max={5}
              value={spiralTurns}
              onChange={(e) => setSpiralTurns(Number(e.target.value))}
            />
          </>
        )}

        {pathType === 'wave' && (
          <>
            <label className="control-label">波形振幅: {waveAmplitude}px</label>
            <input
              type="range"
              min={10}
              max={50}
              value={waveAmplitude}
              onChange={(e) => setWaveAmplitude(Number(e.target.value))}
            />
          </>
        )}
      </div>

      <div className="control-group">
        <div className="control-title">配色主题</div>
        <div className="theme-buttons">
          {themes.map(theme => (
            <button
              key={theme.id}
              className={`theme-btn ${themeId === theme.id ? 'active' : ''}`}
              onClick={() => setThemeId(theme.id)}
              title={`文字: ${theme.textColor} 背景: ${theme.backgroundColor} 点缀: ${theme.accentColor}`}
            >
              {theme.name}
            </button>
          ))}
        </div>

        <label className="control-label">文字颜色</label>
        <div className="control-row">
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
          />
          <span className="value-display">{textColor}</span>
        </div>

        <label className="control-label">背景颜色</label>
        <div className="control-row">
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
          />
          <span className="value-display">{backgroundColor}</span>
        </div>

        <label className="control-label">点缀颜色</label>
        <div className="control-row">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => setAccentColor(e.target.value)}
          />
          <span className="value-display">{accentColor}</span>
        </div>
      </div>
    </div>
  )
}
