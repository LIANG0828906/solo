import type { TypographyParams, FontData } from '../App'

interface EditorPanelProps {
  params: TypographyParams
  onChange: (params: Partial<TypographyParams>) => void
  onLanguageChange: (lang: 'zh' | 'en') => void
  compareEnabled: boolean
  onToggleCompare: () => void
  fonts: FontData[]
  compareFontId: string | null
  onCompareFontChange: (fontId: string) => void
}

function roundToStep(value: number, step: number): number {
  return Math.round(value / step) * step
}

export default function EditorPanel({
  params,
  onChange,
  onLanguageChange,
  compareEnabled,
  onToggleCompare,
  fonts,
  compareFontId,
  onCompareFontChange
}: EditorPanelProps) {
  return (
    <div className="editor-panel">
      <h2>
        <i className="fas fa-sliders-h"></i>
        排版控制
      </h2>

      <div className="control-group">
        <label>
          <span>字号</span>
          <span className="control-value">{params.fontSize.toFixed(1)} px</span>
        </label>
        <input
          type="range"
          min="12"
          max="72"
          step="0.5"
          value={params.fontSize}
          onChange={(e) => onChange({ fontSize: roundToStep(Number(e.target.value), 0.5) })}
        />
      </div>

      <div className="control-group">
        <label>
          <span>行高</span>
          <span className="control-value">{params.lineHeight.toFixed(1)} 倍</span>
        </label>
        <input
          type="range"
          min="1"
          max="2.5"
          step="0.05"
          value={params.lineHeight}
          onChange={(e) => onChange({ lineHeight: roundToStep(Number(e.target.value), 0.05) })}
        />
      </div>

      <div className="control-group">
        <label>
          <span>字间距</span>
          <span className="control-value">{params.letterSpacing.toFixed(1)} px</span>
        </label>
        <input
          type="range"
          min="-5"
          max="20"
          step="0.5"
          value={params.letterSpacing}
          onChange={(e) => onChange({ letterSpacing: roundToStep(Number(e.target.value), 0.5) })}
        />
      </div>

      <div className="control-group">
        <label>
          <span>段落宽度</span>
          <span className="control-value">{Math.round(params.paragraphWidth)}%</span>
        </label>
        <input
          type="range"
          min="30"
          max="100"
          step="1"
          value={params.paragraphWidth}
          onChange={(e) => onChange({ paragraphWidth: Number(e.target.value) })}
        />
      </div>

      <div className="control-group">
        <label>
          <span>示例语言</span>
        </label>
        <div className="language-toggle">
          <button
            className={`lang-btn ${params.language === 'zh' ? 'active' : ''}`}
            onClick={() => onLanguageChange('zh')}
          >
            中文
          </button>
          <button
            className={`lang-btn ${params.language === 'en' ? 'active' : ''}`}
            onClick={() => onLanguageChange('en')}
          >
            English
          </button>
        </div>
      </div>

      <div className="control-group">
        <label>
          <span>示例文本</span>
        </label>
        <textarea
          className="textarea-control"
          value={params.sampleText}
          onChange={(e) => onChange({ sampleText: e.target.value })}
          placeholder="输入您想要预览的文本..."
        />
      </div>

      <div className="compare-section">
        <button
          className={`compare-toggle ${compareEnabled ? 'active' : ''}`}
          onClick={onToggleCompare}
        >
          <i className="fas fa-columns"></i>
          {compareEnabled ? '关闭对比模式' : '开启对比模式'}
        </button>

        {compareEnabled && fonts.length > 1 && (
          <div className="control-group" style={{ marginTop: '16px' }}>
            <label>
              <span>对比字体</span>
            </label>
            <select
              className="font-select"
              value={compareFontId || ''}
              onChange={(e) => onCompareFontChange(e.target.value)}
            >
              {fonts.map((font) => (
                <option key={font.id} value={font.id}>
                  {font.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {compareEnabled && fonts.length <= 1 && (
          <p style={{ fontSize: '12px', color: '#6b7a8d', marginTop: '12px', textAlign: 'center' }}>
            <i className="fas fa-info-circle"></i> 请上传至少两款字体以使用对比功能
          </p>
        )}
      </div>
    </div>
  )
}
