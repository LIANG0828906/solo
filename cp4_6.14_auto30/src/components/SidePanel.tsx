import { useEffect, useRef } from 'react'
import { useAppStore } from '../store/appStore'
import {
  ChevronLeft,
  ChevronRight,
  Sun,
  SunDim,
  MapPin,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Sliders,
} from 'lucide-react'

export default function SidePanel() {
  const leftPanelCollapsed = useAppStore((s) => s.leftPanelCollapsed)
  const toggleLeftPanel = useAppStore((s) => s.toggleLeftPanel)
  const ambientIntensity = useAppStore((s) => s.ambientIntensity)
  const setAmbientIntensity = useAppStore((s) => s.setAmbientIntensity)
  const directionalIntensity = useAppStore((s) => s.directionalIntensity)
  const setDirectionalIntensity = useAppStore((s) => s.setDirectionalIntensity)
  const isMarkMode = useAppStore((s) => s.isMarkMode)
  const toggleMarkMode = useAppStore((s) => s.toggleMarkMode)
  const clearAllMarks = useAppStore((s) => s.clearAllMarks)
  const markPointsCount = useAppStore((s) => s.markPoints.length)

  return (
    <>
      <div
        style={{
          ...styles.panel,
          width: leftPanelCollapsed ? 48 : 280,
          transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <button
          style={styles.collapseBtn}
          onClick={toggleLeftPanel}
          title={leftPanelCollapsed ? '展开面板' : '折叠面板'}
        >
          {leftPanelCollapsed ? (
            <ChevronRight size={18} />
          ) : (
            <ChevronLeft size={18} />
          )}
        </button>

        {leftPanelCollapsed ? (
          <div style={styles.iconBar}>
            <div style={styles.iconBarItem} title="光照参数">
              <Sliders size={20} color="var(--accent-blue)" />
            </div>
            <div
              style={{
                ...styles.iconBarItem,
                background: isMarkMode
                  ? 'rgba(79,195,247,0.15)'
                  : 'transparent',
                borderColor: isMarkMode
                  ? 'rgba(79,195,247,0.3)'
                  : 'transparent',
              }}
              title={isMarkMode ? '标记模式：开启' : '标记模式：关闭'}
              onClick={toggleMarkMode}
            >
              <MapPin
                size={20}
                color={isMarkMode ? 'var(--accent-blue)' : 'var(--text-secondary)'}
              />
            </div>
          </div>
        ) : (
          <div style={styles.content}>
            <Section title="光照参数微调" icon={<Sliders size={16} />}>
              <SliderRow
                icon={<SunDim size={16} />}
                label="环境光强度"
                value={ambientIntensity}
                min={0}
                max={2}
                step={0.01}
                onChange={setAmbientIntensity}
                displayValue={ambientIntensity.toFixed(2)}
              />
              <SliderRow
                icon={<Sun size={16} />}
                label="方向光强度"
                value={directionalIntensity}
                min={0}
                max={5}
                step={0.01}
                onChange={setDirectionalIntensity}
                displayValue={directionalIntensity.toFixed(2)}
              />
            </Section>

            <div style={styles.sectionDivider} />

            <Section title="标记点工具" icon={<MapPin size={16} />}>
              <div style={styles.markToggleRow}>
                <div style={styles.markToggleLabel}>
                  <MapPin
                    size={16}
                    color={isMarkMode ? 'var(--accent-blue)' : 'var(--text-secondary)'}
                  />
                  <span>开启标记模式</span>
                </div>
                <button
                  style={{
                    ...styles.markToggleBtn,
                    background: isMarkMode
                      ? 'rgba(79,195,247,0.2)'
                      : 'rgba(255,255,255,0.04)',
                    borderColor: isMarkMode
                      ? 'rgba(79,195,247,0.5)'
                      : 'rgba(255,255,255,0.08)',
                  }}
                  onClick={toggleMarkMode}
                >
                  {isMarkMode ? (
                    <ToggleRight size={26} color="var(--accent-blue)" />
                  ) : (
                    <ToggleLeft size={26} color="var(--text-secondary)" />
                  )}
                </button>
              </div>

              {isMarkMode && (
                <div style={styles.markHint}>
                  <MapPin size={12} color="var(--accent-amber)" />
                  <span>点击模型表面添加标记点</span>
                </div>
              )}

              <div style={styles.markInfoRow}>
                <span style={styles.markInfoLabel}>已添加标记</span>
                <span style={styles.markInfoCount}>{markPointsCount}</span>
              </div>

              <button
                style={{
                  ...styles.clearBtn,
                  opacity: markPointsCount === 0 ? 0.4 : 1,
                  pointerEvents: markPointsCount === 0 ? 'none' : 'auto',
                }}
                onClick={clearAllMarks}
              >
                <Trash2 size={15} />
                <span>清除全部标记</span>
              </button>
            </Section>
          </div>
        )}
      </div>

      <SidePanelStyles />
    </>
  )
}

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <div style={styles.sectionTitle}>
          <span style={{ color: 'var(--accent-blue)', display: 'flex' }}>
            {icon}
          </span>
          <span>{title}</span>
        </div>
      </div>
      <div style={styles.sectionBody}>{children}</div>
    </div>
  )
}

function SliderRow({
  icon,
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}: {
  icon: React.ReactNode
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  displayValue: string
}) {
  return (
    <div style={styles.sliderRow}>
      <div style={styles.sliderLabelRow}>
        <div style={styles.sliderLabel}>
          <span style={{ color: 'var(--text-secondary)', display: 'flex' }}>
            {icon}
          </span>
          <span>{label}</span>
        </div>
        <span style={styles.sliderValue}>{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={styles.sliderInput}
      />
    </div>
  )
}

function SidePanelStyles() {
  const injected = useRef(false)
  useEffect(() => {
    if (injected.current) return
    injected.current = true
    const css = document.createElement('style')
    css.setAttribute('data-sidepanel-styles', 'true')
    css.textContent = `
      .side-panel-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        background: var(--accent-blue);
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 8px rgba(79,195,247,0.6);
        transition: transform 0.15s ease;
      }
      .side-panel-slider::-webkit-slider-thumb:hover {
        transform: scale(1.2);
      }
    `
    document.head.appendChild(css)
  }, [])
  return null
}

const styles: Record<string, React.CSSProperties> = {
  panel: {
    position: 'relative',
    height: '100%',
    background: 'rgba(22, 33, 62, 0.85)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderRight: '1px solid rgba(79,195,247,0.12)',
    flexShrink: 0,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  collapseBtn: {
    position: 'absolute',
    top: 12,
    right: 6,
    width: 28,
    height: 28,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    transition: 'all 0.2s ease',
  },
  iconBar: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 52,
    gap: 8,
  },
  iconBarItem: {
    width: 36,
    height: 36,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    border: '1px solid',
    transition: 'all 0.2s ease',
  },
  content: {
    padding: '56px 18px 20px 18px',
    overflowY: 'auto',
    overflowX: 'hidden',
    height: '100%',
  },
  section: {
    marginBottom: 4,
  },
  sectionDivider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
    margin: '18px 0',
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: 0.2,
  },
  sectionBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  sliderRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  sliderLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  sliderValue: {
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: 12,
    color: 'var(--accent-blue)',
    fontWeight: 600,
    background: 'rgba(79,195,247,0.08)',
    padding: '2px 8px',
    borderRadius: 4,
    minWidth: 42,
    textAlign: 'center',
  },
  sliderInput: {
    width: '100%',
  },
  markToggleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 12px',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.06)',
  },
  markToggleLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 13,
    color: 'var(--text-primary)',
  },
  markToggleBtn: {
    background: 'transparent',
    border: '1px solid',
    borderRadius: 6,
    padding: 2,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  markHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    background: 'rgba(255,183,77,0.08)',
    border: '1px solid rgba(255,183,77,0.2)',
    borderRadius: 6,
    fontSize: 11,
    color: 'var(--accent-amber)',
  },
  markInfoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 2px',
  },
  markInfoLabel: {
    fontSize: 12,
    color: 'var(--text-secondary)',
  },
  markInfoCount: {
    fontSize: 14,
    fontWeight: 700,
    color: 'var(--accent-blue)',
    fontFamily: "'JetBrains Mono', monospace",
  },
  clearBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '10px 14px',
    background: 'rgba(239,83,80,0.08)',
    border: '1px solid rgba(239,83,80,0.25)',
    borderRadius: 8,
    color: 'var(--danger)',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 500,
    transition: 'all 0.2s ease',
  },
}

const hoverCss = document.createElement('style')
hoverCss.textContent = `
  [style*="collapseBtn"]:hover,
  [style*="iconBarItem"]:hover,
  [style*="clearBtn"]:not([style*="opacity: 0.4"]):hover {
    border-color: rgba(79,195,247,0.3) !important;
    background: rgba(79,195,247,0.1) !important;
    color: var(--text-primary) !important;
  }
  [style*="clearBtn"]:not([style*="opacity: 0.4"]):hover {
    background: rgba(239,83,80,0.18) !important;
    border-color: rgba(239,83,80,0.5) !important;
  }
`
if (!document.querySelector('style[data-sidepanel-hover]')) {
  hoverCss.setAttribute('data-sidepanel-hover', 'true')
  document.head.appendChild(hoverCss)
}
