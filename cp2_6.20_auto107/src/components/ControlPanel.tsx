import { useState } from 'react'
import { Palette, Brush, Type, Layers, Eye, ChevronDown, ChevronUp, X } from 'lucide-react'
import {
  useAppStore,
  type HandwritingStyle,
  type BackgroundTexture,
  type SystemFont,
} from '../store/appStore'

const styleOptions: { value: HandwritingStyle; label: string; desc: string }[] = [
  { value: 'roundChild', label: '圆润童体', desc: '可爱圆润，适合童趣内容' },
  { value: 'elegantRunning', label: '潇洒行书', desc: '流畅优雅，富有艺术感' },
  { value: 'neatRegular', label: '工整楷体', desc: '端庄规范，清晰易读' },
  { value: 'cursiveScript', label: '潦草连笔', desc: '快速连写，随性自然' },
  { value: 'retroBrush', label: '复古毛笔', desc: '苍劲有力，古典韵味' },
]

const textureOptions: { value: BackgroundTexture; label: string }[] = [
  { value: 'kraftPaper', label: '牛皮纸肌理' },
  { value: 'chalkboard', label: '黑板质感' },
  { value: 'ricePaper', label: '宣纸水印' },
  { value: 'linen', label: '亚麻布纹' },
  { value: 'frostedGlass', label: '磨砂玻璃' },
  { value: 'gradient', label: '纯色渐变' },
]

const fontOptions: { value: SystemFont; label: string }[] = [
  { value: 'SimSun', label: '宋体' },
  { value: 'SimHei', label: '黑体' },
  { value: 'KaiTi', label: '楷体' },
]

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  unit?: string
}

function Slider({ label, value, min, max, step, onChange, unit = '' }: SliderProps) {
  const percent = ((value - min) / (max - min)) * 100
  return (
    <div className="slider-group">
      <div className="slider-header">
        <span className="slider-label">{label}</span>
        <span className="slider-value">
          {value.toFixed(step < 1 ? 1 : 0)}
          {unit}
        </span>
      </div>
      <div className="slider-track">
        <div className="slider-fill" style={{ width: `${percent}%` }} />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="slider-input"
        />
      </div>
    </div>
  )
}

interface SectionProps {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}

function Section({ title, icon, children, defaultOpen = true }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="panel-section">
      <button className="section-header" onClick={() => setOpen(!open)}>
        <div className="section-title">
          <span className="section-icon">{icon}</span>
          <span>{title}</span>
        </div>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div className="section-content">{children}</div>}
    </div>
  )
}

interface ControlPanelProps {
  isMobile?: boolean
  onClose?: () => void
}

export default function ControlPanel({ isMobile, onClose }: ControlPanelProps) {
  const {
    text,
    style,
    styleParams,
    background,
    comparisonSample,
    savedStyles,
    setText,
    setStyle,
    setStyleParams,
    setBackground,
    setComparisonSample,
  } = useAppStore()

  const [saveName, setSaveName] = useState('')
  const saveCurrentStyle = useAppStore((s) => s.saveCurrentStyle)

  return (
    <aside className={`control-panel ${isMobile ? 'mobile' : ''}`}>
      {isMobile && (
        <div className="panel-mobile-header">
          <span>设置面板</span>
          <button className="panel-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
      )}
      <div className="panel-scroll">
        <Section title="文本输入" icon={<Type size={16} />}>
          <div className="textarea-wrapper">
            <textarea
              className="text-input"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="请输入要转换的文字（最多200字符）..."
              rows={3}
              maxLength={200}
            />
            <div className="char-count">{text.length}/200</div>
          </div>
        </Section>

        <Section title="手写风格" icon={<Brush size={16} />}>
          <div className="style-grid">
            {styleOptions.map((opt) => (
              <button
                key={opt.value}
                className={`style-card ${style === opt.value ? 'active' : ''}`}
                onClick={() => setStyle(opt.value)}
              >
                <span className="style-card-indicator" />
                <div className="style-card-info">
                  <span className="style-card-name">{opt.label}</span>
                  <span className="style-card-desc">{opt.desc}</span>
                </div>
              </button>
            ))}
          </div>

          <div className="sliders-group">
            <Slider
              label="笔触粗细"
              value={styleParams.strokeWidth}
              min={1}
              max={20}
              step={1}
              onChange={(v) => setStyleParams({ strokeWidth: v })}
              unit="px"
            />
            <Slider
              label="墨迹浓度"
              value={styleParams.inkDensity}
              min={0.3}
              max={1.0}
              step={0.05}
              onChange={(v) => setStyleParams({ inkDensity: v })}
            />
            <Slider
              label="倾斜角度"
              value={styleParams.skewAngle}
              min={-30}
              max={30}
              step={1}
              onChange={(v) => setStyleParams({ skewAngle: v })}
              unit="°"
            />
            <Slider
              label="动画时长"
              value={styleParams.animationDuration}
              min={1}
              max={5}
              step={0.5}
              onChange={(v) => setStyleParams({ animationDuration: v })}
              unit="s"
            />
          </div>
        </Section>

        <Section title="背景纹理" icon={<Layers size={16} />}>
          <div className="texture-grid">
            {textureOptions.map((opt) => (
              <button
                key={opt.value}
                className={`texture-card ${background.texture === opt.value ? 'active' : ''}`}
                onClick={() => setBackground({ texture: opt.value })}
              >
                <div className={`texture-preview bg-${opt.value}`} />
                <span className="texture-label">{opt.label}</span>
              </button>
            ))}
          </div>
          <Slider
            label="背景不透明度"
            value={background.opacity}
            min={0.2}
            max={1.0}
            step={0.05}
            onChange={(v) => setBackground({ opacity: v })}
          />
        </Section>

        <Section title="对比样本" icon={<Eye size={16} />}>
          <div className="comparison-options">
            <label className="comparison-toggle">
              <input
                type="checkbox"
                checked={!!comparisonSample?.enabled}
                onChange={(e) => {
                  if (e.target.checked) {
                    setComparisonSample({
                      enabled: true,
                      type: 'system',
                      font: 'SimSun',
                    })
                  } else {
                    setComparisonSample(null)
                  }
                }}
              />
              <span>启用对比模式</span>
            </label>

            {comparisonSample?.enabled && (
              <div className="comparison-settings">
                <div className="comparison-type">
                  <button
                    className={`type-btn ${comparisonSample.type === 'system' ? 'active' : ''}`}
                    onClick={() =>
                      setComparisonSample({ ...comparisonSample, type: 'system', font: 'SimSun' })
                    }
                  >
                    系统字体
                  </button>
                  <button
                    className={`type-btn ${comparisonSample.type === 'saved' ? 'active' : ''}`}
                    onClick={() =>
                      setComparisonSample({
                        ...comparisonSample,
                        type: 'saved',
                        savedStyle: style,
                        savedParams: styleParams,
                      })
                    }
                  >
                    已保存风格
                  </button>
                </div>

                {comparisonSample.type === 'system' && (
                  <div className="dropdown-wrapper">
                    <select
                      className="dropdown"
                      value={comparisonSample.font || 'SimSun'}
                      onChange={(e) =>
                        setComparisonSample({
                          ...comparisonSample,
                          font: e.target.value as SystemFont,
                        })
                      }
                    >
                      {fontOptions.map((f) => (
                        <option key={f.value} value={f.value}>
                          {f.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {comparisonSample.type === 'saved' && savedStyles.length > 0 && (
                  <div className="saved-styles-list">
                    {savedStyles.map((s) => (
                      <button
                        key={s.id}
                        className={`saved-style-item ${
                          comparisonSample.savedStyle === s.style ? 'active' : ''
                        }`}
                        onClick={() =>
                          setComparisonSample({
                            ...comparisonSample,
                            savedStyle: s.style,
                            savedParams: s.params,
                          })
                        }
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </Section>

        <Section title="保存风格" icon={<Palette size={16} />}>
          <div className="save-style-group">
            <input
              type="text"
              className="save-input"
              placeholder="输入风格名称..."
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
            />
            <button
              className="save-btn"
              onClick={() => {
                if (saveName.trim()) {
                  saveCurrentStyle(saveName.trim())
                  setSaveName('')
                }
              }}
            >
              保存
            </button>
          </div>
          {savedStyles.length > 0 && (
            <div className="saved-list">
              {savedStyles.map((s) => (
                <div key={s.id} className="saved-item">
                  <span>{s.name}</span>
                  <button
                    className="delete-saved-btn"
                    onClick={() => useAppStore.getState().deleteSavedStyle(s.id)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>
    </aside>
  )
}
