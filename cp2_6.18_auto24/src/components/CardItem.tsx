import React, { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { Card } from '../utils/randomCards'

interface CardItemProps {
  card: Card
  index: number
  deviceKey: 'mobile' | 'tablet' | 'desktop'
  isDragging: boolean
  isRemoving: boolean
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

  useEffect(() => {
    if (isRemoving && !localRemoving) {
      setLocalRemoving(true)
    }
  }, [isRemoving, localRemoving])

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
      }, 500)
    },
    [index, deviceKey, clearLongPressTimer, onLongPressTrigger, onDragStart]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const dx = Math.abs(e.clientX - startPos.current.x)
      const dy = Math.abs(e.clientY - startPos.current.y)
      if (dx > 5 || dy > 5) {
        moveDetected.current = true
        if (!longPressTriggered.current) {
          clearLongPressTimer()
        }
      }
      if (longPressTriggered.current) {
        onDragMove(e.clientX, e.clientY)
      }
    },
    [clearLongPressTimer, onDragMove]
  )

  const handlePointerUp = useCallback(() => {
    clearLongPressTimer()
    if (longPressTriggered.current) {
      onDragEnd()
    }
    longPressTriggered.current = false
  }, [clearLongPressTimer, onDragEnd])

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
  ]
    .filter(Boolean)
    .join(' ')

  const flexStyle =
    flexBasis > 0
      ? { flex: `1 1 ${flexBasis}px`, minWidth: 0 }
      : undefined

  return (
    <div
      className={classes}
      style={flexStyle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onContextMenu={handleContextMenu}
      data-card-id={card.id}
      data-card-index={index}
      data-device={deviceKey}
    >
      <div className="card-title">{card.title}</div>
      <div className="card-content">{card.content}</div>
    </div>
  )
})
