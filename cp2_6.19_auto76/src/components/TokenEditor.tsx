import React, { useState, useMemo, useRef, useCallback } from 'react'
import { HexColorPicker } from 'react-colorful'
import { useTokenStore, generateShadowString, ColorToken } from '../store/tokenStore'

const Accordion: React.FC<{
  title: string
  defaultOpen?: boolean
  children: React.ReactNode
}> = ({ title, defaultOpen = true, children }) => {
  const [open, setOpen] = useState(defaultOpen)
  const contentRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{ borderBottom: '1px solid #313244', marginBottom: '8px' }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: '12px 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none',
          color: '#cdd6f4',
          fontWeight: 600,
          fontSize: '13px',
          letterSpacing: '0.3px',
        }}
      >
        <span>{title}</span>
        <span
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 300ms ease-out',
            fontSize: '14px',
            color: '#89b4fa',
          }}
        >
          ▼
        </span>
      </div>
      <div
        style={{
          maxHeight: open ? (contentRef.current?.scrollHeight ?? 2000) + 'px' : '0px',
          overflow: 'hidden',
          transition: 'max-height 300ms ease-out',
        }}
      >
        <div ref={contentRef} style={{ padding: '4px 0 16px 0' }}>
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
  const updateColor = useTokenStore(s => s.updateColor)
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
      onDragOver={e => {
        e.preventDefault()
        onDragOver(token.id)
      }}
      onDragEnd={onDragEnd}
      onDrop={e => {
        e.preventDefault()
        onDrop()
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 0',
        opacity: draggedId === token.id ? 0.5 : 1,
        borderTop: overId === token.id && orderIndex > 0 ? '2px solid #89b4fa' : '2px solid transparent',
        borderBottom: overId === token.id && orderIndex === totalCount - 1 ? '2px solid #89b4fa' : '2px solid transparent',
        transition: 'all 150ms ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span
          style={{
            cursor: 'grab',
            color: '#6c7086',
            fontSize: '16px',
            userSelect: 'none',
            lineHeight: 1,
          }}
          title="拖拽排序"
        >
          ≡
        </span>
        <div
          ref={pickerRef}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <div
            onClick={() => setShowPicker(!showPicker)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              backgroundColor: token.value,
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
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
                background: 'rgba(30, 30, 46, 0.85)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
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
        <span style={{ color: '#bac2de', fontSize: '13px', minWidth: '56px' }}>
          {token.name}
        </span>
      </div>
      <span
        style={{
          fontSize: '11px',
          fontFamily: 'monospace',
          color: '#a6adc8',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
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
  onChange: (v: number) => void
}> = ({ label, value, min, max, step = 1, unit = '', onChange }) => {
  const pct = ((value - min) / (max - min)) * 100
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
        <span style={{ color: '#bac2de', fontSize: '12px', fontWeight: 500 }}>
          {label}
        </span>
        <span
          style={{
            color: '#89b4fa',
            fontSize: '11px',
            fontFamily: 'monospace',
            fontWeight: 600,
          }}
        >
          {typeof value === 'number' ? (step < 1 ? value.toFixed(2) : value) : value}
          {unit}
        </span>
      </div>
      <div style={{ position: 'relative', height: '20px', display: 'flex', alignItems: 'center' }}>
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
            height: '20px',
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
          }}
        />
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

  const colors = useTokenStore(s => s.colors)
  const spacing = useTokenStore(s => s.spacing)
  const fonts = useTokenStore(s => s.fonts)
  const shadows = useTokenStore(s => s.shadows)
  const colorOrder = useTokenStore(s => s.colorOrder)
  const updateSpacing = useTokenStore(s => s.updateSpacing)
  const updateFont = useTokenStore(s => s.updateFont)
  const updateShadow = useTokenStore(s => s.updateShadow)
  const updateColorOrder = useTokenStore(s => s.updateColorOrder)

  const orderedColors = useMemo(() => {
    return [...colors].sort(
      (a, b) => colorOrder.indexOf(a.id) - colorOrder.indexOf(b.id)
    )
  }, [colors, colorOrder])

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
    () => orderedColors.filter(c => matchSearch(c.name, c.id)),
    [orderedColors, matchSearch]
  )
  const filteredSpacing = useMemo(
    () => spacing.filter(s => matchSearch(`间距 ${s.name}`, s.id)),
    [spacing, matchSearch]
  )
  const filteredFontsMatch = matchSearch('字体 font typography fontFamily')
  const filteredShadows = useMemo(
    () => shadows.filter(s => matchSearch(`阴影 ${s.name}`, s.id)),
    [shadows, matchSearch]
  )

  const hasAnyResults =
    filteredColors.length > 0 ||
    filteredSpacing.length > 0 ||
    filteredFontsMatch ||
    filteredShadows.length > 0

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
        width: '320px',
        minWidth: '320px',
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
          padding: '20px 20px 12px 20px',
          borderBottom: '1px solid #313244',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            margin: '0 0 4px 0',
            fontSize: '18px',
            fontWeight: 700,
            color: '#eff1f5',
            letterSpacing: '0.3px',
          }}
        >
          设计令牌工作台
        </h1>
        <p
          style={{
            margin: '0 0 16px 0',
            fontSize: '11px',
            color: '#7f849c',
          }}
        >
          Design Token Workbench
        </p>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索令牌，如：主色、间距、阴影..."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px 10px 34px',
              borderRadius: '8px',
              border: '1px solid #313244',
              background: '#181825',
              color: '#cdd6f4',
              fontSize: '12px',
              outline: 'none',
              transition: 'border-color 200ms ease',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#89b4fa'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#313244'
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: '10px',
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
              }}
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
          padding: '8px 20px 20px 20px',
        }}
      >
        {hasAnyResults ? (
          <>
            {filteredColors.length > 0 && (
              <Accordion title={`🎨 颜色 (${filteredColors.length})`} defaultOpen={true}>
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
              </Accordion>
            )}

            {filteredSpacing.length > 0 && (
              <Accordion title={`📐 间距 (${filteredSpacing.length})`} defaultOpen={true}>
                {filteredSpacing.map((s) => (
                  <Slider
                    key={s.id}
                    label={s.name}
                    value={s.value}
                    min={0}
                    max={48}
                    step={1}
                    unit="px"
                    onChange={(v) => updateSpacing(s.id, v)}
                  />
                ))}
              </Accordion>
            )}

            {filteredFontsMatch && (
              <Accordion title="🔤 字体" defaultOpen={true}>
                <div style={{ marginBottom: '14px' }}>
                  <span
                    style={{
                      display: 'block',
                      color: '#bac2de',
                      fontSize: '12px',
                      fontWeight: 500,
                      marginBottom: '6px',
                    }}
                  >
                    font-family
                  </span>
                  <select
                    value={fonts.fontFamily}
                    onChange={(e) => updateFont('fontFamily', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: '1px solid #313244',
                      background: '#181825',
                      color: '#cdd6f4',
                      fontSize: '12px',
                      outline: 'none',
                      cursor: 'pointer',
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
                    marginTop: '8px',
                    paddingTop: '12px',
                    borderTop: '1px dashed #313244',
                  }}
                >
                  {(['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const).map((k) => (
                    <Slider
                      key={k}
                      label={k.toUpperCase() + ' 字号'}
                      value={fonts[k]}
                      min={10}
                      max={60}
                      unit="px"
                      onChange={(v) => updateFont(k, v)}
                    />
                  ))}
                </div>
              </Accordion>
            )}

            {filteredShadows.length > 0 && (
              <Accordion title={`🌑 阴影 (${filteredShadows.length})`} defaultOpen={true}>
                {filteredShadows.map((s) => (
                  <div key={s.id} style={{ marginBottom: '14px' }}>
                    <Slider
                      label={`${s.name} 深度`}
                      value={s.depth}
                      min={0}
                      max={10}
                      onChange={(v) => updateShadow(s.id, v)}
                    />
                    <div
                      style={{
                        marginTop: '8px',
                        padding: '8px 10px',
                        background: '#181825',
                        borderRadius: '6px',
                        border: '1px solid #313244',
                        fontSize: '10px',
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
              </Accordion>
            )}
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 12px',
              color: '#6c7086',
              fontSize: '13px',
              userSelect: 'none',
            }}
          >
            <div style={{ fontSize: '36px', marginBottom: '12px', opacity: 0.5 }}>
              🔍
            </div>
            暂无匹配令牌
          </div>
        )}
      </div>
    </div>
  )
}

export default React.memo(TokenEditor)
