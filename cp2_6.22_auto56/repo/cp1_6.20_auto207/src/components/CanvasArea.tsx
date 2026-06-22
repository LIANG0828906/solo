import React, { useRef, useState, useEffect, useCallback } from 'react'
import {
  Card,
  GRID_SIZE,
  CARD_DEFAULT_WIDTH,
  CARD_DEFAULT_HEIGHT,
  PRESET_COLORS,
} from '../types'
import { snapToGrid } from '../utils/shadowSimulator'

interface Props {
  cards: Card[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  onAddCard: (card: Card) => void
  onUpdateCard: (id: string, patch: Partial<Card>) => void
  onOpenEditor: (id: string) => void
  onBoundsChange: (w: number, h: number) => void
}

const SWATCH_ICONS = ['fa-diamond', 'fa-square', 'fa-leaf', 'fa-star', 'fa-heart', 'fa-circle']

const CanvasArea: React.FC<Props> = ({
  cards,
  selectedId,
  onSelect,
  onAddCard,
  onUpdateCard,
  onOpenEditor,
  onBoundsChange,
}) => {
  const areaRef = useRef<HTMLDivElement | null>(null)
  const placingIdsRef = useRef<Set<string>>(new Set())
  const [placingTick, setPlacingTick] = useState(0)
  const [rotatingId, setRotatingId] = useState<string | null>(null)

  const [drag, setDrag] = useState<{
    id: string
    startX: number
    startY: number
    origX: number
    origY: number
    moved: boolean
  } | null>(null)

  useEffect(() => {
    const el = areaRef.current
    if (!el) return
    const update = () => onBoundsChange(el.clientWidth, el.clientHeight)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [onBoundsChange])

  const triggerPlacing = (id: string) => {
    placingIdsRef.current.add(id)
    setPlacingTick((t) => t + 1)
    window.setTimeout(() => {
      placingIdsRef.current.delete(id)
      setPlacingTick((t) => t + 1)
    }, 400)
  }

  const handleSwatchDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, color: string) => {
      e.dataTransfer.effectAllowed = 'copy'
      e.dataTransfer.setData('application/x-card-color', color)
      e.dataTransfer.setData('text/plain', color)
    },
    [],
  )

  const handleAreaDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('application/x-card-color')) {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    }
  }, [])

  const handleAreaDrop = useCallback(
    (e: React.DragEvent) => {
      const color = e.dataTransfer.getData('application/x-card-color')
      if (!color || !areaRef.current) return
      e.preventDefault()
      const rect = areaRef.current.getBoundingClientRect()
      let x = e.clientX - rect.left
      let y = e.clientY - rect.top
      x = snapToGrid(x, GRID_SIZE)
      y = snapToGrid(y, GRID_SIZE)
      const id = `card_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const newCard: Card = {
        id,
        x,
        y,
        rotation: 0,
        width: CARD_DEFAULT_WIDTH,
        height: CARD_DEFAULT_HEIGHT,
        color,
        opacity: 0.7,
        zIndex: cards.length + 1,
      }
      onAddCard(newCard)
      triggerPlacing(id)
      onSelect(id)
    },
    [cards.length, onAddCard, onSelect],
  )

  useEffect(() => {
    if (!drag) return

    const handleMove = (e: MouseEvent) => {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      const moved = Math.abs(dx) + Math.abs(dy) > 2
      onUpdateCard(drag.id, {
        x: drag.origX + dx,
        y: drag.origY + dy,
        zIndex: Date.now(),
      })
      if (moved && !drag.moved) {
        setDrag((d) => (d ? { ...d, moved: true } : d))
      }
    }

    const handleUp = (e: MouseEvent) => {
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      const rawX = drag.origX + dx
      const rawY = drag.origY + dy
      onUpdateCard(drag.id, {
        x: snapToGrid(rawX, GRID_SIZE),
        y: snapToGrid(rawY, GRID_SIZE),
      })
      setDrag(null)
    }

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [drag, onUpdateCard])

  const handleCardMouseDown = (e: React.MouseEvent, card: Card) => {
    e.stopPropagation()
    onSelect(card.id)
    setDrag({
      id: card.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: card.x,
      origY: card.y,
      moved: false,
    })
  }

  const handleCardDoubleClick = (e: React.MouseEvent, card: Card) => {
    e.stopPropagation()
    onOpenEditor(card.id)
  }

  const handleCardWheel = (e: React.WheelEvent, card: Card) => {
    if (selectedId !== card.id) return
    e.preventDefault()
    const step = 2
    const delta = e.deltaY > 0 ? step : -step
    onUpdateCard(card.id, { rotation: card.rotation + delta })
    setRotatingId(card.id)
    window.clearTimeout((handleCardWheel as unknown as { _t?: number })._t)
    ;(handleCardWheel as unknown as { _t?: number })._t = window.setTimeout(
      () => setRotatingId(null),
      600,
    )
  }

  useEffect(() => {
    const prevent = (e: WheelEvent) => {
      const target = e.target as HTMLElement | null
      if (target && target.closest('.card')) {
        e.preventDefault()
      }
    }
    const el = areaRef.current
    if (el) el.addEventListener('wheel', prevent, { passive: false })
    return () => {
      if (el) el.removeEventListener('wheel', prevent)
    }
  }, [])

  const sortedCards = [...cards].sort((a, b) => a.zIndex - b.zIndex)

  return (
    <section
      className="canvas-area"
      ref={areaRef}
      onClick={() => onSelect(null)}
      onDragOver={handleAreaDragOver}
      onDrop={handleAreaDrop}
    >
      <div className="canvas-grid" />

      {/* 强制刷新 placing 状态 */}
      <span style={{ display: 'none' }}>{placingTick}</span>

      {sortedCards.map((card) => {
        const selected = selectedId === card.id
        const isDragging = drag?.id === card.id && drag.moved
        const isPlacing = placingIdsRef.current.has(card.id)
        const showAngle = rotatingId === card.id && selected
        const rot = ((card.rotation % 360) + 360) % 360
        const classes = ['card']
        if (selected) classes.push('selected')
        if (isDragging) classes.push('dragging')
        if (isPlacing) classes.push('placing')
        return (
          <div
            key={card.id}
            className={classes.join(' ')}
            style={{
              left: card.x,
              top: card.y,
              width: card.width,
              height: card.height,
              background: card.color.replace(
                /rgba?\(([^)]+)\)/,
                (_m, inner: string) => {
                  const parts = inner.split(',').map((s) => parseFloat(s.trim()))
                  const r = parts[0] ?? 128
                  const g = parts[1] ?? 128
                  const b = parts[2] ?? 128
                  const a = (parts[3] != null ? parts[3] : 0.7) * card.opacity
                  return `rgba(${r}, ${g}, ${b}, ${a})`
                },
              ),
              transform: `translate(-50%, -50%) rotate(${card.rotation}deg)`,
              zIndex: card.zIndex,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ['--rot' as any]: `${card.rotation}deg`,
            }}
            onMouseDown={(e) => handleCardMouseDown(e, card)}
            onDoubleClick={(e) => handleCardDoubleClick(e, card)}
            onWheel={(e) => handleCardWheel(e, card)}
            title={`${card.id} · 双击编辑`}
          >
            {showAngle && (
              <div className="angle-badge">
                <i className="fa fa-compass" style={{ marginRight: 4 }} />
                {rot.toFixed(0)}°
              </div>
            )}
          </div>
        )
      })}

      <div className="toolbar" onMouseDown={(e) => e.stopPropagation()}>
        <div className="toolbar-label">
          <i className="fa fa-magic" style={{ color: '#c084fc' }} />
          拖拽卡片到画布
        </div>
        {PRESET_COLORS.map((color, idx) => (
          <div
            key={color}
            className="color-swatch"
            style={{ background: color }}
            draggable
            onDragStart={(e) => handleSwatchDragStart(e, color)}
            title="拖拽到画布创建卡片"
          >
            <i
              className={`fa ${SWATCH_ICONS[idx % SWATCH_ICONS.length]}`}
              style={{ color: 'rgba(255,255,255,0.85)', fontSize: 16 }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

export default CanvasArea
