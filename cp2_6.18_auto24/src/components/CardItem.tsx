import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { Card } from '../utils/randomCards'

interface CardItemProps {
  card: Card
  index: number
  deviceKey: 'mobile' | 'tablet' | 'desktop'
  isDragging: boolean
  isRemoving: boolean
  isNewlyPlaced?: boolean
  onDragStart: (index: number, deviceKey: 'mobile' | 'tablet' | 'desktop', e: React.PointerEvent) => void
  onDragMove: (x: number, y: number) => void
  onDragEnd: () => void
  onContextMenu: (cardId: string, deviceKey: 'mobile' | 'tablet' | 'desktop', e: React.MouseEvent) => void
  onLongPressTrigger: (index: number, deviceKey: 'mobile' | 'tablet' | 'desktop') => void
  flexBasis: number
}

export const CardItem = memo(function CardItem(props: CardItemProps) {
  const {
    card,
    index,
    deviceKey,
    isDragging,
    isRemoving,
    isNewlyPlaced,
    onDragStart,
    onDragMove,
    onDragEnd,
    onContextMenu,
    onLongPressTrigger,
    flexBasis,
  } = props

  const longPressTimer = useRef<number | null>(null)
  const longPressTriggered = useRef(false)
  const moveDetected = useRef(false)
  const startPos = useRef({ x: 0, y: 0 })

  const [localRemoving, setLocalRemoving] = useState(false)
  const [bounceAnim, setBounceAnim] = useState(false)

  useEffect(() => {
    if (isRemoving && !localRemoving) {
      setLocalRemoving(true)
    }
  }, [isRemoving, localRemoving])

  useEffect(() => {
    if (isNewlyPlaced) {
      setBounceAnim(true)
      const t = window.setTimeout(() => setBounceAnim(false), 300)
      return () => window.clearTimeout(t)
    }
  }, [isNewlyPlaced])

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current != null) {
      window.clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button === 2) return
      longPressTriggered.current = false
      moveDetected.current = false
      startPos.current = { x: e.clientX, y: e.clientY }

      clearLongPressTimer()
      longPressTimer.current = window.setTimeout(() => {
        longPressTriggered.current = true
        onLongPressTrigger(index, deviceKey)
        onDragStart(index, deviceKey, e)
        try {
          ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
        } catch {
          /* ignore */
        }
      }, 500)
    },
    [index, deviceKey, clearLongPressTimer, onLongPressTrigger, onDragStart]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const dx = Math.abs(e.clientX - startPos.current.x)
      const dy = Math.abs(e.clientY - startPos.current.y)
      if (!longPressTriggered.current && (dx > 5 || dy > 5)) {
        moveDetected.current = true
        clearLongPressTimer()
      }
      if (longPressTriggered.current) {
        e.preventDefault()
        onDragMove(e.clientX, e.clientY)
      }
    },
    [clearLongPressTimer, onDragMove]
  )

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      clearLongPressTimer()
      if (longPressTriggered.current) {
        try {
          ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
        } catch {
          /* ignore */
        }
        onDragEnd()
      }
      longPressTriggered.current = false
    },
    [clearLongPressTimer, onDragEnd]
  )

  const handlePointerCancel = useCallback(() => {
    clearLongPressTimer()
    longPressTriggered.current = false
  }, [clearLongPressTimer])

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      clearLongPressTimer()
      onContextMenu(card.id, deviceKey, e)
    },
    [card.id, deviceKey, clearLongPressTimer, onContextMenu]
  )

  const classes = [
    'card-item',
    isDragging ? 'dragging' : '',
    localRemoving ? 'removing' : '',
    bounceAnim ? 'bounce-in' : '',
  ]
    .filter(Boolean)
    .join(' ')

  const sizeStyle: React.CSSProperties = {
    width: '100%',
    minHeight: `${card.height}px`,
  }

  if (flexBasis > 0) {
    sizeStyle.flex = `1 1 ${flexBasis}px`
    sizeStyle.minWidth = 0
  }

  return (
    <div
      className={classes}
      style={sizeStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={handleContextMenu}
      data-card-id={card.id}
      data-card-index={index}
      data-device={deviceKey}
    >
      <div
        style={{
          width: '100%',
          height: Math.max(20, Math.floor((card.height ?? 80) / 4)),
          borderRadius: 4,
          background:
            'linear-gradient(135deg, ' +
            (card.width > 180 ? '#DBEAFE' : '#FCE7F3') +
            ', ' +
            (card.height > 120 ? '#E0E7FF' : '#ECFCCB') +
            ')',
          marginBottom: 6,
        }}
      />
      <div className="card-title">{card.title}</div>
      <div className="card-content">{card.content}</div>
    </div>
  )
})
