import React, { useState, useMemo, useRef, useCallback } from 'react'
import { HexColorPicker } from 'react-colorful'
import {
  useTokenStore,
  generateShadowString,
  ColorToken,
  RadiusToken,
  BorderToken,
  getRadiusById,
} from '../store/tokenStore'

const CategorySection: React.FC<{
  title: string
  count?: number
  defaultOpen?: boolean
  children: React.ReactNode
}> = ({ title, count, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div
      style={{
        marginBottom: '14px',
        padding: '10px 12px 0 12px',
        background: 'rgba(24, 24, 37, 0.55)',
        borderRadius: '10px',
        border: '1px solid #313244',
      }}
    >
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '6px 2px 10px 2px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          color: '#cdd6f4',
          fontWeight: 600,
          fontSize: '12.5px',
          letterSpacing: '0.3px',
        }}
      >
        <span>
          {title}
          {typeof count === 'number' && (
            <span
              style={{
                marginLeft: '8px',
                padding: '1px 7px',
                borderRadius: '999px',
                background: 'rgba(137, 180, 250, 0.12)',
                color: '#89b4fa',
                fontSize: '10.5px',
                fontWeight: 600,
                fontFamily: 'monospace',
              }}
            >
              {count}
            </span>
          )}
        </span>
        <span
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 300ms ease-out',
            fontSize: '12px',
            color: '#89b4fa',
          }}
        >
          ▼
        </span>
      </div>
      <div
        style={{
          maxHeight: open ? (contentRef.current?.scrollHeight ?? 3000) + 'px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 300ms ease-out',
        }}
      >
        <div
          ref={contentRef}
          style={{
            padding: '2px 2px 12px 2px',
            borderTop: '1px solid rgba(49, 50, 68, 0.7)',
            marginTop: open ? '2px' : '0',
            paddingTop: open ? '12px' : '0px',
            transition: 'padding-top 200ms ease-out, margin-top 200ms ease-out',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

const ColorItem: React.FC<{
  token: ColorToken
  orderIndex: number
  totalCount: number
  onDragStart: (id: string) => void
  onDragOver: (id: string) => void
  onDragEnd: () => void
  onDrop: () => void
  draggedId: string | null
  overId: string | null
}> = ({ token, orderIndex, totalCount, onDragStart, onDragOver, onDragEnd, onDrop, draggedId, overId }) => {
  const [showPicker, setShowPicker] = useState(false)
  const updateColor = useTokenStore((s) => s.updateColor)
  const pickerRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showPicker])

  return (
    <div
      draggable
      onDragStart={() => onDragStart(token.id)}
      onDragOver={(e) => {
        e.preventDefault()
        onDragOver(token.id)
      }}
      onDragEnd={onDragEnd}
      onDrop={(e) => {
        e.preventDefault()
        onDrop()
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 6px',
        marginBottom: '2px',
        borderRadius: '6px',
        opacity: draggedId === token.id ? 0.5 : 1,
        background: draggedId === token.id ? 'rgba(137,180,250,0.06)' : 'transparent',
        borderTop: overId === token.id && orderIndex > 0 ? '2px solid #89b4fa' : '2px solid transparent',
        borderBottom:
          overId === token.id && orderIndex === totalCount - 1 ? '2px solid #89b4fa' : '2px solid transparent',
        transition: 'all 150ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            cursor: 'grab',
            color: '#6c7086',
            fontSize: '15px',
            userSelect: 'none',
            lineHeight: 1,
            padding: '2px 1px',
          }}
          title="拖拽排序"
        >
          ≡
        </span>
        <div ref={pickerRef} style={{ position: 'relative', display: 'inline-block' }}>
          <div
            onClick={() => setShowPicker(!showPicker)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              backgroundColor: token.value,
              cursor: 'pointer',
              border: '1.5px solid rgba(255,255,255,0.12)',
              boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
            }}
          />
          {showPicker && (
            <div
              style={{
                position: 'absolute',
                top: '36px',
                left: '0',
                zIndex: 100,
                padding: '12px',
                borderRadius: '12px',
                background: 'rgba(30, 30, 46, 0.9)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
              }}
            >
              <HexColorPicker
                color={token.value}
                onChange={(v) => updateColor(token.id, v)}
                style={{ width: '200px' }}
              />
            </div>
          )}
        </div>
        <span style={{ color: '#bac2de', fontSize: '12.5px', minWidth: '56px', fontWeight: 500 }}>
          {token.name}
        </span>
      </div>
      <span
        style={{
          fontSize: '10.5px',
          fontFamily: 'monospace',
          color: '#a6adc8',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          padding: '2px 6px',
          background: 'rgba(49, 50, 68, 0.6)',
          borderRadius: '4px',
        }}
      >
        {token.value}
      </span>
    </div>
  )
}

const Slider: React.FC<{
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  valueSuffix?: React.ReactNode
  onChange: (v: number) => void
}> = ({ label, value, min, max, step = 1, unit = '', valueSuffix, onChange }) => {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div style={{ marginBottom: '16px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '7px',
        }}
      >
        <span style={{ color: '#bac2de', fontSize: '11.5px', fontWeight: 500 }}>{label}</span>
        <span
          style={{
            color: '#89b4fa',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 600,
            padding: '1px 6px',
            background: 'rgba(137, 180, 250, 0.08)',
            borderRadius: '4px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {typeof value === 'number' ? (step < 1 ? value.toFixed(2) : value) : value}
          {unit}
          {valueSuffix}
        </span>
      </div>
      <div style={{ position: 'relative', height: '22px', display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            position: 'absolute',
            height: '4px',
            width: '100%',
            borderRadius: '2px',
            background: '#313244',
          }}
        />
        <div
          style={{
            position: 'absolute',
            height: '4px',
            width: `${pct}%`,
            borderRadius: '2px',
            background: 'linear-gradient(90deg, #89b4fa, #cba6f7)',
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          style={{
            position: 'absolute',
            width: '100%',
            opacity: 0,
            height: '22px',
            margin: 0,
            cursor: 'pointer',
            zIndex: 2,
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: `calc(${pct}% - 8px)`,
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
            pointerEvents: 'none',
            zIndex: 1,
            border: '2px solid #89b4fa',
          }}
        />
      </div>
    </div>
  )
}

const NumberInput: React.FC<{
  label: string
  value: number
  min?: number
  max?: number
  unit?: string
  onChange: (v: number) => void
}> = ({ label, value, min = 0, max = 20, unit = 'px', onChange }) => {
  return (
    <div style={{ marginBottom: '14px' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '6px',
        }}
      >
        <span style={{ color: '#bac2de', fontSize: '11.5px', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#313244',
            border: 'none',
            color: '#cdd6f4',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          −
        </button>
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <input
            type="number"
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
              const v = Number(e.target.value)
              if (!isNaN(v)) onChange(Math.min(max, Math.max(min, Math.round(v))))
            }}
            style={{
              width: '100%',
              padding: '6px 34px 6px 10px',
              borderRadius: '6px',
              border: '1px solid #45475a',
              background: '#181825',
              color: '#cdd6f4',
              fontSize: '12px',
              fontFamily: 'monospace',
              fontWeight: 600,
              outline: 'none',
              textAlign: 'center',
              MozAppearance: 'textfield',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#89b4fa'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#45475a'
            }}
          />
          <span
            style={{
              position: 'absolute',
              right: '10px',
              color: '#7f849c',
              fontSize: '10.5px',
              fontFamily: 'monospace',
              pointerEvents: 'none',
            }}
          >
            {unit}
          </span>
        </div>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            background: '#313244',
            border: 'none',
            color: '#cdd6f4',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>
    </div>
  )
}

const RadiusItem: React.FC<{
  token: RadiusToken
  onUpdate: (v: number | 'full') => void
}> = ({ token, onUpdate }) => {
  const isFull = token.value === 'full'

  return (
    <div
      style={{
        marginBottom: '14px',
        padding: '10px',
        borderRadius: '8px',
        background: 'rgba(49, 50, 68, 0.4)',
        border: '1px solid rgba(79, 80, 98, 0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <div>
          <div
            style={{
              color: '#eff1f5',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span
              style={{
                width: '34px',
                height: '20px',
                display: 'inline-block',
                background:
                  'linear-gradient(135deg, rgba(137,180,250,0.8), rgba(203,166,247,0.8))',
                borderRadius: getRadiusById([token], token.id),
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            />
            {token.label}
          </div>
          <div
            style={{
              color: '#7f849c',
              fontSize: '10.5px',
              fontFamily: 'monospace',
              marginTop: '2px',
            }}
          >
            {token.name}
          </div>
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 7px',
            borderRadius: '4px',
            background: '#181825',
            border: '1px solid #45475a',
            fontSize: '10.5px',
            fontFamily: 'monospace',
            color: '#a6e3a1',
            fontWeight: 600,
          }}
        >
          {token.value === 'full' ? '9999' : token.value}
          px
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
        {[4, 8, 12, 16].map((v) => (
          <button
            key={v}
            onClick={() => onUpdate(v)}
            style={{
              flex: '0 0 auto',
              padding: '5px 10px',
              fontSize: '10.5px',
              fontFamily: 'monospace',
              fontWeight: 600,
              borderRadius: '6px',
              border:
                !isFull && Number(token.value) === v
                  ? '1px solid #89b4fa'
                  : '1px solid #45475a',
              background:
                !isFull && Number(token.value) === v
                  ? 'rgba(137, 180, 250, 0.15)'
                  : '#181825',
              color: !isFull && Number(token.value) === v ? '#89b4fa' : '#bac2de',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
          >
            {v}px
          </button>
        ))}
        <button
          onClick={() => onUpdate('full')}
          style={{
            flex: '0 0 auto',
            padding: '5px 10px',
            fontSize: '10.5px',
            fontFamily: 'monospace',
            fontWeight: 600,
            borderRadius: '999px',
            border: isFull ? '1px solid #f9e2af' : '1px solid #45475a',
            background: isFull ? 'rgba(249, 226, 175, 0.12)' : '#181825',
            color: isFull ? '#f9e2af' : '#bac2de',
            cursor: 'pointer',
            transition: 'all 150ms ease',
          }}
        >
          ⭕ 圆
        </button>
      </div>

      {!isFull && (
        <Slider
          label="微调滑块"
          value={Number(token.value)}
          min={0}
          max={32}
          unit="px"
          onChange={(v) => onUpdate(v)}
        />
      )}
      {!isFull && <div style={{ marginTop: '-4px' }} />}

      <div
        style={{
          marginTop: isFull ? '0' : '-10px',
          padding: '6px 9px',
          background: '#181825',
          borderRadius: '6px',
          border: '1px solid #45475a',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#a6adc8',
          lineHeight: 1.5,
        }}
      >
        border-radius: {token.value === 'full' ? '9999px' : `${token.value}px`}
      </div>
    </div>
  )
}

const BorderItem: React.FC<{
  token: BorderToken
  onWidth: (w: number) => void
  onColor: (c: string) => void
  onStyle: (s: 'solid' | 'dashed') => void
}> = ({ token, onWidth, onColor, onStyle }) => {
  const [showPicker, setShowPicker] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false)
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [showPicker])

  return (
    <div
      style={{
        marginBottom: '14px',
        padding: '10px',
        borderRadius: '8px',
        background: 'rgba(49, 50, 68, 0.4)',
        border: '1px solid rgba(79, 80, 98, 0.4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
        }}
      >
        <div>
          <div
            style={{
              color: '#eff1f5',
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span
              style={{
                width: '34px',
                height: '20px',
                borderRadius: '4px',
                background: '#181825',
                display: 'inline-block',
                borderWidth: `${token.width}px`,
                borderStyle: token.style,
                borderColor: token.color,
              }}
            />
            {token.name}
          </div>
          <div
            style={{
              color: '#7f849c',
              fontSize: '10.5px',
              fontFamily: 'monospace',
              marginTop: '2px',
            }}
          >
            {token.id}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div style={{ flex: 1.4, minWidth: 0 }}>
          <NumberInput
            label="边框宽度"
            value={token.width}
            min={0}
            max={12}
            unit="px"
            onChange={onWidth}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              display: 'block',
              color: '#bac2de',
              fontSize: '11.5px',
              fontWeight: 500,
              marginBottom: '6px',
            }}
          >
            边框颜色
          </span>
          <div style={{ position: 'relative' }} ref={pickerRef}>
            <button
              onClick={() => setShowPicker(!showPicker)}
              style={{
                width: '100%',
                height: '30px',
                padding: '3px',
                borderRadius: '6px',
                border: '1px solid #45475a',
                background: '#181825',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#cdd6f4',
                fontSize: '10.5px',
                fontFamily: 'monospace',
              }}
            >
              <span
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '4px',
                  background: token.color,
                  border: '1px solid rgba(255,255,255,0.15)',
                  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.05)',
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  color: '#a6adc8',
                }}
              >
                {token.color}
              </span>
            </button>
            {showPicker && (
              <div
                style={{
                  position: 'absolute',
                  top: '36px',
                  right: '0',
                  zIndex: 100,
                  padding: '12px',
                  borderRadius: '12px',
                  background: 'rgba(30, 30, 46, 0.92)',
                  backdropFilter: 'blur(14px)',
                  WebkitBackdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
              >
                <HexColorPicker
                  color={token.color}
                  onChange={onColor}
                  style={{ width: '200px' }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: '10px' }}>
        <span
          style={{
            display: 'block',
            color: '#bac2de',
            fontSize: '11.5px',
            fontWeight: 500,
            marginBottom: '6px',
          }}
        >
          边框样式
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['solid', 'dashed'] as const).map((s) => (
            <button
              key={s}
              onClick={() => onStyle(s)}
              style={{
                flex: 1,
                padding: '6px 10px',
                fontSize: '10.5px',
                fontFamily: 'monospace',
                fontWeight: 600,
                borderRadius: '6px',
                border:
                  token.style === s
                    ? '1px solid #a6e3a1'
                    : '1px solid #45475a',
                background:
                  token.style === s
                    ? 'rgba(166, 227, 161, 0.12)'
                    : '#181825',
                color: token.style === s ? '#a6e3a1' : '#bac2de',
                cursor: 'pointer',
                transition: 'all 150ms ease',
                textTransform: 'uppercase',
              }}
            >
              {s === 'solid' ? '━━ 实线' : '╍╍ 虚线'}
            </button>
          ))}
        </div>
      </div>

      <Slider
        label="宽度滑块微调"
        value={token.width}
        min={0}
        max={10}
        unit="px"
        onChange={onWidth}
      />

      <div
        style={{
          marginTop: '-6px',
          padding: '6px 9px',
          background: '#181825',
          borderRadius: '6px',
          border: '1px solid #45475a',
          fontSize: '10px',
          fontFamily: 'monospace',
          color: '#a6adc8',
          lineHeight: 1.5,
          wordBreak: 'break-all',
        }}
      >
        border: {token.width}px {token.style} {token.color}
      </div>
    </div>
  )
}

const fontFamilies = [
  'Inter, sans-serif',
  'Roboto, sans-serif',
  'Open Sans, sans-serif',
  'Noto Sans SC, sans-serif',
  'Poppins, sans-serif',
  'system-ui, -apple-system, sans-serif',
]

const TokenEditor: React.FC = () => {
  const [search, setSearch] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)
  const tempOverIdRef = useRef<string | null>(null)

  const colors = useTokenStore((s) => s.colors)
  const spacing = useTokenStore((s) => s.spacing)
  const fonts = useTokenStore((s) => s.fonts)
  const shadows = useTokenStore((s) => s.shadows)
  const radii = useTokenStore((s) => s.radii)
  const borders = useTokenStore((s) => s.borders)
  const colorOrder = useTokenStore((s) => s.colorOrder)
  const updateSpacing = useTokenStore((s) => s.updateSpacing)
  const updateFont = useTokenStore((s) => s.updateFont)
  const updateShadow = useTokenStore((s) => s.updateShadow)
  const updateRadius = useTokenStore((s) => s.updateRadius)
  const updateBorderWidth = useTokenStore((s) => s.updateBorderWidth)
  const updateBorderColor = useTokenStore((s) => s.updateBorderColor)
  const updateBorderStyle = useTokenStore((s) => s.updateBorderStyle)
  const updateColorOrder = useTokenStore((s) => s.updateColorOrder)

  const orderedColors = useMemo(
    () =>
      [...colors].sort(
        (a, b) => colorOrder.indexOf(a.id) - colorOrder.indexOf(b.id)
      ),
    [colors, colorOrder]
  )

  const searchLower = search.trim().toLowerCase()

  const matchSearch = useCallback(
    (name: string, extra?: string): boolean => {
      if (!searchLower) return true
      const text = `${name} ${extra || ''}`.toLowerCase()
      return text.includes(searchLower)
    },
    [searchLower]
  )

  const filteredColors = useMemo(
    () => orderedColors.filter((c) => matchSearch(c.name, c.id)),
    [orderedColors, matchSearch]
  )
  const filteredSpacing = useMemo(
    () => spacing.filter((s) => matchSearch(`间距 ${s.name}`, s.id)),
    [spacing, matchSearch]
  )
  const filteredFontsMatch = matchSearch('字体 font typography fontFamily 字号 行高')
  const filteredShadows = useMemo(
    () => shadows.filter((s) => matchSearch(`阴影 ${s.name}`, s.id)),
    [shadows, matchSearch]
  )
  const filteredRadii = useMemo(
    () =>
      radii.filter((r) =>
        matchSearch(`圆角 radius 圆角半径 border-radius ${r.name} ${r.label}`, r.id)
      ),
    [radii, matchSearch]
  )
  const filteredBorders = useMemo(
    () =>
      borders.filter((b) =>
        matchSearch(`边框 border 边线 线 ${b.name} ${b.id}`, b.id)
      ),
    [borders, matchSearch]
  )

  const hasAnyResults =
    filteredColors.length > 0 ||
    filteredSpacing.length > 0 ||
    filteredFontsMatch ||
    filteredShadows.length > 0 ||
    filteredRadii.length > 0 ||
    filteredBorders.length > 0

  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (id: string) => {
    tempOverIdRef.current = id
    setOverId(id)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setOverId(null)
    tempOverIdRef.current = null
  }

  const handleDrop = () => {
    const srcId = draggedId
    const targetId = tempOverIdRef.current
    if (!srcId || !targetId || srcId === targetId) {
      handleDragEnd()
      return
    }
    const newOrder = [...colorOrder]
    const srcIdx = newOrder.indexOf(srcId)
    const tgtIdx = newOrder.indexOf(targetId)
    if (srcIdx === -1 || tgtIdx === -1) {
      handleDragEnd()
      return
    }
    newOrder.splice(srcIdx, 1)
    newOrder.splice(tgtIdx, 0, srcId)
    updateColorOrder(newOrder)
    handleDragEnd()
  }

  return (
    <div
      style={{
        width: '340px',
        minWidth: '340px',
        height: '100vh',
        background: '#1e1e2e',
        color: '#cdd6f4',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <div
        style={{
          padding: '18px 18px 14px 18px',
          borderBottom: '1px solid #313244',
          flexShrink: 0,
          background:
            'linear-gradient(180deg, rgba(137,180,250,0.05) 0%, transparent 100%)',
        }}
      >
        <h1
          style={{
            margin: '0 0 2px 0',
            fontSize: '17px',
            fontWeight: 700,
            color: '#eff1f5',
            letterSpacing: '0.3px',
          }}
        >
          设计令牌工作台
        </h1>
        <p
          style={{
            margin: '0 0 14px 0',
            fontSize: '10.5px',
            color: '#7f849c',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}
        >
          Design Token Workbench
        </p>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索令牌，如：主色、圆角、边框..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px 10px 34px',
              borderRadius: '9px',
              border: '1.5px solid #313244',
              background: '#181825',
              color: '#cdd6f4',
              fontSize: '12px',
              outline: 'none',
              transition: 'border-color 200ms ease, box-shadow 200ms ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#89b4fa'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(137,180,250,0.12)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#313244'
              e.currentTarget.style.boxShadow = 'none'
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '11px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#6c7086',
              fontSize: '13px',
              pointerEvents: 'none',
            }}
          >
            🔍
          </span>
          {search && (
            <span
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6c7086',
                fontSize: '14px',
                cursor: 'pointer',
                padding: '2px 4px',
                userSelect: 'none',
                width: '18px',
                height: '18px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                transition: 'background 150ms ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')
              }
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              ✕
            </span>
          )}
        </div>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 12px 20px 12px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#45475a #181825',
        }}
      >
        {hasAnyResults ? (
          <>
            {filteredColors.length > 0 && (
              <CategorySection title="🎨 颜色" count={filteredColors.length} defaultOpen={true}>
                {filteredColors.map((c, idx) => (
                  <ColorItem
                    key={c.id}
                    token={c}
                    orderIndex={idx}
                    totalCount={filteredColors.length}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDrop={handleDrop}
                    draggedId={draggedId}
                    overId={overId}
                  />
                ))}
              </CategorySection>
            )}

            {filteredSpacing.length > 0 && (
              <CategorySection title="📐 间距" count={filteredSpacing.length} defaultOpen={false}>
                {filteredSpacing.map((s) => (
                  <Slider
                    key={s.id}
                    label={s.name.toUpperCase()}
                    value={s.value}
                    min={0}
                    max={48}
                    step={1}
                    unit="px"
                    onChange={(v) => updateSpacing(s.id, v)}
                  />
                ))}
              </CategorySection>
            )}

            {filteredRadii.length > 0 && (
              <CategorySection title="⭕ 圆角" count={filteredRadii.length} defaultOpen={true}>
                {filteredRadii.map((r) => (
                  <RadiusItem
                    key={r.id}
                    token={r}
                    onUpdate={(v) => updateRadius(r.id, v)}
                  />
                ))}
              </CategorySection>
            )}

            {filteredBorders.length > 0 && (
              <CategorySection title="🧱 边框" count={filteredBorders.length} defaultOpen={true}>
                {filteredBorders.map((b) => (
                  <BorderItem
                    key={b.id}
                    token={b}
                    onWidth={(w) => updateBorderWidth(b.id, w)}
                    onColor={(c) => updateBorderColor(b.id, c)}
                    onStyle={(s) => updateBorderStyle(b.id, s)}
                  />
                ))}
              </CategorySection>
            )}

            {filteredFontsMatch && (
              <CategorySection title="🔤 字体" defaultOpen={false}>
                <div style={{ marginBottom: '16px' }}>
                  <span
                    style={{
                      display: 'block',
                      color: '#bac2de',
                      fontSize: '11.5px',
                      fontWeight: 500,
                      marginBottom: '6px',
                    }}
                  >
                    字体族 · font-family
                  </span>
                  <select
                    value={fonts.fontFamily}
                    onChange={(e) => updateFont('fontFamily', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '7px',
                      border: '1px solid #45475a',
                      background: '#181825',
                      color: '#cdd6f4',
                      fontSize: '12px',
                      outline: 'none',
                      cursor: 'pointer',
                      fontWeight: 500,
                    }}
                  >
                    {fontFamilies.map((f) => (
                      <option key={f} value={f}>
                        {f.split(',')[0]}
                      </option>
                    ))}
                  </select>
                </div>
                <Slider
                  label="基础字号"
                  value={fonts.baseSize}
                  min={12}
                  max={24}
                  unit="px"
                  onChange={(v) => updateFont('baseSize', v)}
                />
                <Slider
                  label="行高"
                  value={fonts.lineHeight}
                  min={1.0}
                  max={2.0}
                  step={0.05}
                  onChange={(v) => updateFont('lineHeight', v)}
                />
                <div
                  style={{
                    marginTop: '4px',
                    paddingTop: '12px',
                    borderTop: '1px dashed #45475a',
                  }}
                >
                  {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((k) => (
                    <Slider
                      key={k}
                      label={`${k.toUpperCase()} 字号`}
                      value={fonts[k]}
                      min={10}
                      max={60}
                      unit="px"
                      onChange={(v) => updateFont(k, v)}
                    />
                  ))}
                </div>
              </CategorySection>
            )}

            {filteredShadows.length > 0 && (
              <CategorySection title="🌑 阴影" count={filteredShadows.length} defaultOpen={false}>
                {filteredShadows.map((s) => (
                  <div key={s.id} style={{ marginBottom: '16px' }}>
                    <Slider
                      label={`${s.name} 深度`}
                      value={s.depth}
                      min={0}
                      max={10}
                      onChange={(v) => updateShadow(s.id, v)}
                    />
                    <div
                      style={{
                        marginTop: '4px',
                        padding: '7px 10px',
                        background: '#181825',
                        borderRadius: '6px',
                        border: '1px solid #45475a',
                        fontSize: '9.5px',
                        fontFamily: 'monospace',
                        color: '#a6adc8',
                        wordBreak: 'break-all',
                        lineHeight: 1.6,
                      }}
                    >
                      {generateShadowString(s.depth)}
                    </div>
                  </div>
                ))}
              </CategorySection>
            )}
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '70px 14px',
              color: '#6c7086',
              fontSize: '13px',
              userSelect: 'none',
            }}
          >
            <div style={{ fontSize: '40px', marginBottom: '14px', opacity: 0.45 }}>🔍</div>
            <div style={{ color: '#7f849c', fontWeight: 600, marginBottom: '4px' }}>
              暂无匹配令牌
            </div>
            <div style={{ fontSize: '11px', color: '#585b70', marginTop: '6px' }}>
              试试搜索「主色」「圆角」「边框」等关键词
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(TokenEditor)
