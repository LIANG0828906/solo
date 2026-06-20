import type { WaveformType } from './WallpaperCanvas'

export interface GradientPreset {
  name: string
  colors: [string, string]
}

export const GRADIENT_PRESETS: GradientPreset[] = [
  { name: '青紫渐变', colors: ['#00d4ff', '#9d4edd'] },
  { name: '橙粉渐变', colors: ['#ff6b35', '#ff4081'] },
  { name: '翠绿渐变', colors: ['#00f5a0', '#00d9f5'] },
  { name: '金橙渐变', colors: ['#ffd700', '#ff8c00'] },
  { name: '粉紫渐变', colors: ['#ff6ec4', '#7873f5'] },
]

export type WallpaperSize = '1920x1080' | '1080x1920'

interface ControlPanelProps {
  waveformType: WaveformType
  setWaveformType: (type: WaveformType) => void
  gradientColors: [string, string]
  setGradientColors: (colors: [string, string]) => void
  backgroundColor: string
  setBackgroundColor: (color: string) => void
  onExport: (size: WallpaperSize) => void
  isExporting: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function ControlPanel({
  waveformType,
  setWaveformType,
  gradientColors,
  setGradientColors,
  backgroundColor,
  setBackgroundColor,
  onExport,
  isExporting,
  isCollapsed,
  onToggleCollapse,
}: ControlPanelProps) {
  const waveformOptions: { type: WaveformType; label: string; icon: string }[] = [
    { type: 'bars', label: '条形', icon: '▮▮▮' },
    { type: 'line', label: '线条', icon: '〰' },
    { type: 'dots', label: '圆点', icon: '●●●' },
  ]

  if (isCollapsed) {
    return (
      <button
        onClick={onToggleCollapse}
        style={{
          position: 'fixed',
          right: '20px',
          top: '50%',
          transform: 'translateY(-50%)',
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%) translateY(-2px)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(-50%)'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)'
        }}
      >
        ⚙
      </button>
    )
  }

  return (
    <div
      style={{
        width: '340px',
        height: '100%',
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '24px',
        overflowY: 'auto',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <h2
          style={{
            fontSize: '20px',
            fontWeight: 600,
            color: '#fff',
            margin: 0,
          }}
        >
          控制面板
        </h2>
        <button
          onClick={onToggleCollapse}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: 'none',
            color: '#fff',
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
          }}
        >
          →
        </button>
      </div>

      <section style={{ marginBottom: '28px' }}>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          波形类型
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px',
          }}
        >
          {waveformOptions.map((opt) => (
            <button
              key={opt.type}
              onClick={() => setWaveformType(opt.type)}
              style={{
                padding: '14px 8px',
                borderRadius: '12px',
                border:
                  waveformType === opt.type
                    ? '2px solid rgba(0, 212, 255, 0.6)'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                background:
                  waveformType === opt.type
                    ? 'rgba(0, 212, 255, 0.12)'
                    : 'rgba(255, 255, 255, 0.04)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <span style={{ fontSize: '18px' }}>{opt.icon}</span>
              <span style={{ fontSize: '12px' }}>{opt.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          渐变配色
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(5, 1fr)',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {GRADIENT_PRESETS.map((preset) => {
            const isSelected =
              gradientColors[0] === preset.colors[0] &&
              gradientColors[1] === preset.colors[1]
            return (
              <button
                key={preset.name}
                onClick={() => setGradientColors(preset.colors)}
                title={preset.name}
                style={{
                  aspectRatio: '1',
                  borderRadius: '12px',
                  border: isSelected
                    ? '3px solid #fff'
                    : '2px solid rgba(255, 255, 255, 0.1)',
                  background: `linear-gradient(135deg, ${preset.colors[0]}, ${preset.colors[1]})`,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              />
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
          }}
        >
          <span style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>自定义:</span>
          {[0, 1].map((idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="color"
                value={gradientColors[idx]}
                onChange={(e) => {
                  const newColors: [string, string] = [...gradientColors] as [string, string]
                  newColors[idx] = e.target.value
                  setGradientColors(newColors)
                }}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              />
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                {gradientColors[idx]}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: '28px' }}>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          背景颜色
        </h3>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            background: 'rgba(255, 255, 255, 0.04)',
            borderRadius: '12px',
          }}
        >
          <input
            type="color"
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              background: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          />
          <div>
            <div style={{ fontSize: '14px', color: '#fff', marginBottom: '4px' }}>
              {backgroundColor.toUpperCase()}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
              点击拾色器修改背景
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3
          style={{
            fontSize: '14px',
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          导出壁纸
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {(['1920x1080', '1080x1920'] as WallpaperSize[]).map((size) => (
            <button
              key={size}
              onClick={() => onExport(size)}
              disabled={isExporting}
              style={{
                padding: '16px',
                borderRadius: '12px',
                border: 'none',
                background: isExporting
                  ? 'linear-gradient(135deg, rgba(0, 212, 255, 0.5), rgba(157, 78, 221, 0.5))'
                  : 'linear-gradient(135deg, #00d4ff, #9d4edd)',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 600,
                cursor: isExporting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
              }}
              onMouseEnter={(e) => {
                if (!isExporting) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 6px 28px rgba(0, 212, 255, 0.45)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 212, 255, 0.3)'
              }}
            >
              {isExporting ? (
                <>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  生成中...
                </>
              ) : (
                <>
                  <span>⬇</span>
                  {size === '1920x1080' ? '横屏 1920×1080 (桌面)' : '竖屏 1080×1920 (手机)'}
                </>
              )}
            </button>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
