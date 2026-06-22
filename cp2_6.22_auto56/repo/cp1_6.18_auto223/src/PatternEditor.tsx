import { useRef, useCallback } from 'react'
import { useStore, PRESETS, THEME_ACCENT } from './App'
import type { ShapeType, ColorTheme, DynamicType } from './App'
import { usePatternEngine } from './usePatternEngine'
import { Gallery } from './Gallery'

const SHAPES: { key: ShapeType; label: string }[] = [
  { key: 'circle', label: '圆形' },
  { key: 'spiral', label: '螺旋' },
  { key: 'ripple', label: '波纹' },
]

const COLOR_THEMES: { key: ColorTheme; label: string }[] = [
  { key: 'warmSun', label: '暖阳' },
  { key: 'aurora', label: '极光' },
  { key: 'darkNight', label: '暗夜' },
]

const DYNAMIC_TYPES: { key: DynamicType; label: string }[] = [
  { key: 'breathe', label: '呼吸' },
  { key: 'flow', label: '流动' },
  { key: 'blink', label: '闪烁' },
]

export function PatternEditor() {
  const { params, setParams, savedPatterns, savePattern, isGalleryOpen, setGalleryOpen } = useStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { captureThumbnail } = usePatternEngine(canvasRef, params)

  const accent = THEME_ACCENT[params.colorTheme]

  const handleSave = useCallback(() => {
    const thumb = captureThumbnail()
    if (thumb) savePattern(thumb)
  }, [captureThumbnail, savePattern])

  const sectionLabel: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#888',
    marginBottom: 8,
  }

  const btnGroup: React.CSSProperties = {
    display: 'flex',
    gap: 6,
  }

  const btnBase: React.CSSProperties = {
    flex: 1,
    padding: '8px 0',
    border: '1px solid #333',
    borderRadius: 6,
    background: 'transparent',
    color: '#aaa',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    outline: 'none',
  }

  const panelBg = params.colorTheme === 'warmSun'
    ? 'linear-gradient(180deg, #1A1A2E 0%, #2A1A1E 100%)'
    : params.colorTheme === 'aurora'
      ? 'linear-gradient(180deg, #1A1A2E 0%, #1A2A22 100%)'
      : 'linear-gradient(180deg, #1A1A2E 0%, #1A1A2E 100%)'

  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh', overflow: 'hidden' }}>
      <div
        style={{
          width: 400,
          minWidth: 400,
          height: '100vh',
          background: panelBg,
          padding: '28px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 22,
          overflowY: 'auto',
          transition: 'background 0.5s ease',
          borderRight: `1px solid ${accent}22`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${accent}, ${accent}88)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
            }}
          >
            ✦
          </div>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            background: `linear-gradient(90deg, #FFD93D, ${accent})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            光影织梦
          </h1>
        </div>

        <div>
          <div style={sectionLabel}>形状</div>
          <div style={btnGroup}>
            {SHAPES.map((s) => (
              <button
                key={s.key}
                onClick={() => setParams({ shape: s.key })}
                style={{
                  ...btnBase,
                  borderColor: params.shape === s.key ? accent : '#333',
                  color: params.shape === s.key ? '#FFD93D' : '#aaa',
                  background: params.shape === s.key ? `${accent}18` : 'transparent',
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={sectionLabel}>颜色主题</div>
          <div style={btnGroup}>
            {COLOR_THEMES.map((c) => (
              <button
                key={c.key}
                onClick={() => setParams({ colorTheme: c.key })}
                style={{
                  ...btnBase,
                  borderColor: params.colorTheme === c.key ? THEME_ACCENT[c.key] : '#333',
                  color: params.colorTheme === c.key ? THEME_ACCENT[c.key] : '#aaa',
                  background: params.colorTheme === c.key ? `${THEME_ACCENT[c.key]}18` : 'transparent',
                }}
              >
                <span style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: THEME_ACCENT[c.key],
                  marginRight: 6,
                  verticalAlign: 'middle',
                }} />
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={sectionLabel}>动态类型</div>
          <div style={btnGroup}>
            {DYNAMIC_TYPES.map((d) => (
              <button
                key={d.key}
                onClick={() => setParams({ dynamicType: d.key })}
                style={{
                  ...btnBase,
                  borderColor: params.dynamicType === d.key ? accent : '#333',
                  color: params.dynamicType === d.key ? '#FFD93D' : '#aaa',
                  background: params.dynamicType === d.key ? `${accent}18` : 'transparent',
                }}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div style={{ ...sectionLabel, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>速度</span>
            <span style={{
              color: '#FFD93D',
              fontSize: 12,
              fontWeight: 700,
              background: '#FFD93D18',
              padding: '2px 8px',
              borderRadius: 4,
            }}>
              {params.speed.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0.1}
            max={2.0}
            step={0.1}
            value={params.speed}
            onChange={(e) => setParams({ speed: parseFloat(e.target.value) })}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <div style={sectionLabel}>预设</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setParams(preset.params)}
                style={{
                  padding: '6px 14px',
                  border: `1px solid ${accent}44`,
                  borderRadius: 20,
                  background: 'transparent',
                  color: '#ccc',
                  fontSize: 12,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#333'
                  e.currentTarget.style.color = '#FFD93D'
                  e.currentTarget.style.borderColor = accent
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = '#ccc'
                  e.currentTarget.style.borderColor = `${accent}44`
                }}
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '10px 0',
              border: 'none',
              borderRadius: 8,
              background: `linear-gradient(135deg, ${accent}, ${accent}AA)`,
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              outline: 'none',
            }}
          >
            💾 保存图案
          </button>
          <button
            onClick={() => setGalleryOpen(true)}
            style={{
              flex: 1,
              padding: '10px 0',
              border: `1px solid #FFD93D44`,
              borderRadius: 8,
              background: 'transparent',
              color: '#FFD93D',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontFamily: 'inherit',
              outline: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#333'
              e.currentTarget.style.color = '#FFD93D'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            🖼️ 画廊 ({savedPatterns.length})
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          height: '100vh',
          position: 'relative',
          background: 'linear-gradient(180deg, #0D0D1A 0%, #1A1A2E 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        />
      </div>

      {isGalleryOpen && <Gallery />}
    </div>
  )
}
