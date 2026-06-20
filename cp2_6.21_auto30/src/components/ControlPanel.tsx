import { useState } from 'react'
import { useBadgeStore, type ShapeType } from '../store'
import { ICONS } from '../modules/svgGenerator'
import ColorPicker from './ColorPicker'

interface ControlPanelProps {
  className?: string
  onClose?: () => void
}

interface SectionProps {
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 20 }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 600,
          color: '#222',
        }}
      >
        <span>{title}</span>
        <svg
          width={14}
          height={14}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
            color: '#555',
          }}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      <div
        style={{
          maxHeight: open ? 2000 : 0,
          opacity: open ? 1 : 0,
          overflow: open ? 'visible' : 'hidden',
          transition: 'max-height 0.3s ease, opacity 0.2s ease',
        }}
      >
        {children}
      </div>
    </div>
  )
}

const SHAPES: { id: ShapeType; label: string }[] = [
  { id: 'circle', label: '圆形' },
  { id: 'roundedRect', label: '圆角矩形' },
  { id: 'hexagon', label: '六边形' },
]

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  suffix = '',
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  suffix?: string
  onChange: (v: number) => void
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#444', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>{label}</span>
        <span style={{ fontSize: 13, color: '#6366f1', fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
          {value}{suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="custom-slider"
        style={{
          width: '100%',
          height: 6,
          appearance: 'none',
          WebkitAppearance: 'none',
          background: `linear-gradient(to right, #6366f1 0%, #8b5cf6 ${((value - min) / (max - min)) * 100}%, #e5e7eb ${((value - min) / (max - min)) * 100}%, #e5e7eb 100%)`,
          borderRadius: 999,
          outline: 'none',
          cursor: 'pointer',
        }}
      />
    </div>
  )
}

export default function ControlPanel({ className = '', onClose }: ControlPanelProps) {
  const shape = useBadgeStore((s) => s.shape)
  const icon = useBadgeStore((s) => s.icon)
  const backgroundColor = useBadgeStore((s) => s.backgroundColor)
  const foregroundColor = useBadgeStore((s) => s.foregroundColor)
  const borderColor = useBadgeStore((s) => s.borderColor)
  const borderWidth = useBadgeStore((s) => s.borderWidth)
  const borderRadius = useBadgeStore((s) => s.borderRadius)
  const scale = useBadgeStore((s) => s.scale)
  const setShape = useBadgeStore((s) => s.setShape)
  const setIcon = useBadgeStore((s) => s.setIcon)
  const setColor = useBadgeStore((s) => s.setColor)
  const setBorder = useBadgeStore((s) => s.setBorder)
  const setRadius = useBadgeStore((s) => s.setRadius)
  const setScale = useBadgeStore((s) => s.setScale)
  const reset = useBadgeStore((s) => s.reset)

  return (
    <aside
      className={className}
      style={{
        width: 280,
        background: 'rgba(255,255,255,0.6)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(255,255,255,0.5)',
        padding: 24,
        overflowY: 'auto',
        height: '100%',
        boxSizing: 'border-box',
        scrollbarWidth: 'thin',
      }}
    >
      <style>{`
        @media (hover: hover) {
          .custom-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 18px;
            height: 18px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
            transition: transform 0.15s ease;
          }
          .custom-slider::-webkit-slider-thumb:hover {
            transform: scale(1.15);
          }
          .custom-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 50%;
            cursor: pointer;
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
          }
        }
        @media (hover: none) {
          .custom-slider::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 22px;
            height: 22px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 50%;
            border: 2px solid #fff;
            box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
          }
          .custom-slider::-moz-range-thumb {
            width: 22px;
            height: 22px;
            background: linear-gradient(135deg, #6366f1, #8b5cf6);
            border-radius: 50%;
            border: 2px solid #fff;
          }
        }
        aside::-webkit-scrollbar {
          width: 6px;
        }
        aside::-webkit-scrollbar-track {
          background: transparent;
        }
        aside::-webkit-scrollbar-thumb {
          background: rgba(99, 102, 241, 0.3);
          border-radius: 3px;
        }
        aside::-webkit-scrollbar-thumb:hover {
          background: rgba(99, 102, 241, 0.5);
        }
        aside {
          scrollbar-color: rgba(99,102,241,0.3) transparent;
          scrollbar-width: thin;
        }
      `}</style>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            width: 36,
            height: 36,
            borderRadius: 10,
            border: 'none',
            background: 'rgba(99,102,241,0.08)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6366f1',
            minWidth: 44,
            minHeight: 44,
          }}
          aria-label="关闭面板"
        >
          <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      <Section title="形状选择">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SHAPES.map((sh) => {
            const selected = shape === sh.id
            return (
              <button
                key={sh.id}
                type="button"
                onClick={() => setShape(sh.id)}
                style={{
                  flex: 1,
                  minWidth: 68,
                  padding: '10px 6px',
                  borderRadius: 10,
                  border: selected ? 'none' : '1px solid #ddd',
                  background: selected
                    ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                    : 'transparent',
                  color: selected ? '#fff' : '#666',
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.2s ease',
                  minHeight: 44,
                }}
              >
                {sh.label}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="图标选择">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 10,
          }}
        >
          {ICONS.map((ic) => {
            const selected = icon === ic.id
            return (
              <button
                key={ic.id}
                type="button"
                onClick={() => setIcon(ic.id)}
                title={ic.name}
                aria-label={ic.name}
                style={{
                  width: '100%',
                  aspectRatio: '1 / 1',
                  borderRadius: '50%',
                  border: selected ? '2px solid #6366f1' : '2px solid transparent',
                  background: selected ? '#e0e7ff' : '#f5f5f5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  color: selected ? '#6366f1' : '#555',
                  transition: 'all 0.2s ease',
                  minWidth: 44,
                  minHeight: 44,
                  padding: 0,
                  boxSizing: 'border-box',
                }}
                className="icon-grid-btn"
              >
                <i className={ic.faClass} style={{ pointerEvents: 'none' }} />
              </button>
            )
          })}
        </div>
        <style>{`
          @media (hover: hover) {
            .icon-grid-btn:hover {
              background: #e0e7ff !important;
              transform: translateY(-2px);
            }
          }
        `}</style>
      </Section>

      <Section title="样式调整">
        <ColorPicker label="背景色" value={backgroundColor} onChange={(v) => setColor('backgroundColor', v)} />
        <ColorPicker label="前景色" value={foregroundColor} onChange={(v) => setColor('foregroundColor', v)} />
        <ColorPicker label="边框色" value={borderColor} onChange={(v) => setColor('borderColor', v)} />
        <Slider label="边框宽度" value={borderWidth} min={0} max={8} suffix="px" onChange={setBorder} />
        <Slider label="圆角大小" value={borderRadius} min={0} max={30} suffix="px" onChange={setRadius} />
        <Slider label="缩放比例" value={scale} min={80} max={150} suffix="%" onChange={setScale} />
        <button
          type="button"
          onClick={reset}
          style={{
            width: '100%',
            marginTop: 8,
            padding: '10px 16px',
            borderRadius: 10,
            border: '1px solid #e0e0e0',
            background: '#fff',
            color: '#555',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            transition: 'all 0.2s ease',
            minHeight: 44,
          }}
          className="reset-btn"
        >
          恢复默认设置
        </button>
        <style>{`
          @media (hover: hover) {
            .reset-btn:hover {
              background: #f8fafc;
              border-color: #cbd5e1;
            }
          }
        `}</style>
      </Section>
    </aside>
  )
}
