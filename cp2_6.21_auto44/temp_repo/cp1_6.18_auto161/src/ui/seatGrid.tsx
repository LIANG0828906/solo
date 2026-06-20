import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useTheaterStore } from '../stores/theaterStore'
import type { Seat } from '../engine/layoutEngine'
import {
  SEAT_DIAMETER,
  GRID_SIZE,
  screenToWorld,
  worldToScreen,
  clampScale,
  snapToGrid,
  checkSeatCollision,
  getSeatLabel,
  generateRectangularSeats,
} from '../engine/layoutEngine'
import {
  createBookingPopup,
  closeBookingPopup,
  canBookSeat,
  confirmSeatBooking,
  generateTicketData,
} from '../engine/bookingEngine'

interface ContextMenuState {
  visible: boolean
  x: number
  y: number
  seatId: string | null
}

export const SeatGrid: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const seats = useTheaterStore((s) => s.seats)
  const viewport = useTheaterStore((s) => s.viewport)
  const setViewport = useTheaterStore((s) => s.setViewport)
  const mode = useTheaterStore((s) => s.mode)
  const animatedSeatId = useTheaterStore((s) => s.animatedSeatId)
  const setAnimatedSeatId = useTheaterStore((s) => s.setAnimatedSeatId)
  const addSeat = useTheaterStore((s) => s.addSeat)
  const removeSeat = useTheaterStore((s) => s.removeSeat)
  const batchAddSeats = useTheaterStore((s) => s.batchAddSeats)
  const selectedSeatId = useTheaterStore((s) => s.selectedSeatId)
  const selectSeat = useTheaterStore((s) => s.selectSeat)
  const multiSelectedIds = useTheaterStore((s) => s.multiSelectedIds)
  const toggleMultiSelect = useTheaterStore((s) => s.toggleMultiSelect)
  const clearMultiSelect = useTheaterStore((s) => s.clearMultiSelect)
  const updateSeatStatus = useTheaterStore((s) => s.updateSeatStatus)
  const bookingPopup = useTheaterStore((s) => s.bookingPopup)
  const setBookingPopup = useTheaterStore((s) => s.setBookingPopup)
  const setCurrentTicket = useTheaterStore((s) => s.setCurrentTicket)
  const setShowTicketModal = useTheaterStore((s) => s.setShowTicketModal)

  const [isDragging, setIsDragging] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isDrawing, setIsDrawing] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [panStart, setPanStart] = useState({ x: 0, y: 0, offsetX: 0, offsetY: 0 })
  const [drawStart, setDrawStart] = useState({ row: 0, col: 0 })
  const [drawEnd, setDrawEnd] = useState({ row: 0, col: 0 })
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    seatId: null,
  })

  const getSeatColor = (seat: Seat): string => {
    switch (seat.status) {
      case 'sold':
        return '#E94560'
      case 'reserved':
        return '#FFB347'
      default:
        return '#2D2D44'
    }
  }

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newScale = clampScale(viewport.scale * delta)
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top
        const world = screenToWorld(mouseX, mouseY, viewport)
        const newOffsetX = mouseX - world.x * newScale
        const newOffsetY = mouseY - world.y * newScale
        setViewport({
          offsetX: newOffsetX,
          offsetY: newOffsetY,
          scale: newScale,
        })
      }
    },
    [viewport, setViewport]
  )

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true)
      setPanStart({
        x: e.clientX,
        y: e.clientY,
        offsetX: viewport.offsetX,
        offsetY: viewport.offsetY,
      })
      return
    }

    if (mode === 'editor' && e.button === 0 && !e.ctrlKey) {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, viewport)
      const col = Math.floor(world.x / GRID_SIZE)
      const row = Math.floor(world.y / GRID_SIZE)
      setIsDrawing(true)
      setDrawStart({ row, col })
      setDrawEnd({ row, col })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x
      const dy = e.clientY - panStart.y
      setViewport({
        ...viewport,
        offsetX: panStart.offsetX + dx,
        offsetY: panStart.offsetY + dy,
      })
      return
    }

    if (isDrawing && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, viewport)
      const col = Math.floor(world.x / GRID_SIZE)
      const row = Math.floor(world.y / GRID_SIZE)
      setDrawEnd({ row, col })
    }
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    if (isPanning) {
      setIsPanning(false)
      return
    }

    if (isDrawing && mode === 'editor') {
      const minRow = Math.min(drawStart.row, drawEnd.row)
      const maxRow = Math.max(drawStart.row, drawEnd.row)
      const minCol = Math.min(drawStart.col, drawEnd.col)
      const maxCol = Math.max(drawStart.col, drawEnd.col)
      const rows = maxRow - minRow + 1
      const cols = maxCol - minCol + 1
      if (rows > 0 && cols > 0) {
        const newSeats = generateRectangularSeats(
          minRow,
          minCol,
          rows,
          cols,
          0,
          0,
          50
        ).filter((s) => !checkSeatCollision(s.x, s.y, seats))
        if (newSeats.length > 0) {
          batchAddSeats(newSeats)
        }
      }
      setIsDrawing(false)
    }
  }

  const handleSeatClick = (e: React.MouseEvent, seat: Seat) => {
    e.stopPropagation()
    if (contextMenu.visible) {
      setContextMenu({ ...contextMenu, visible: false })
    }

    if (mode === 'editor') {
      if (e.ctrlKey) {
        toggleMultiSelect(seat.id)
      } else {
        selectSeat(seat.id)
        clearMultiSelect()
      }
      return
    }

    if (!canBookSeat(seat)) {
      return
    }

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const screen = worldToScreen(seat.x, seat.y, viewport)
      const popup = createBookingPopup(
        seat,
        screen.x + rect.left + SEAT_DIAMETER / 2,
        screen.y + rect.top
      )
      setBookingPopup(popup)
    }
  }

  const handleSeatContextMenu = (e: React.MouseEvent, seat: Seat) => {
    e.preventDefault()
    e.stopPropagation()
    if (mode === 'editor') {
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        seatId: seat.id,
      })
    }
  }

  const handleConfirmBooking = () => {
    if (!bookingPopup.seatId) return
    const seat = seats.find((s) => s.id === bookingPopup.seatId)
    if (!seat) return

    const updated = confirmSeatBooking(seat)
    updateSeatStatus(seat.id, updated.status)
    setAnimatedSeatId(seat.id)
    setBookingPopup(closeBookingPopup())

    setTimeout(() => {
      setAnimatedSeatId(null)
    }, 400)

    const ticket = generateTicketData(seat)
    setCurrentTicket(ticket)
    setTimeout(() => {
      setShowTicketModal(true)
    }, 500)
  }

  const handleContextDelete = () => {
    if (contextMenu.seatId) {
      removeSeat(contextMenu.seatId)
    }
    setContextMenu({ ...contextMenu, visible: false })
  }

  const handleContextDuplicateRow = () => {
    const seat = seats.find((s) => s.id === contextMenu.seatId)
    if (seat) {
      const rowSeats = seats.filter((s) => s.row === seat.row)
      const newRow = Math.max(...seats.map((s) => s.row)) + 1
      const duplicated = rowSeats.map((s) => ({
        ...s,
        id: Math.random().toString(36).slice(2, 10),
        row: newRow,
        y: s.y + GRID_SIZE,
        status: 'available' as const,
      }))
      batchAddSeats(duplicated)
    }
    setContextMenu({ ...contextMenu, visible: false })
  }

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.visible) {
        setContextMenu({ ...contextMenu, visible: false })
      }
      if (bookingPopup.visible) {
        setBookingPopup(closeBookingPopup())
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [contextMenu.visible, bookingPopup.visible])

  const rows = [...new Set(seats.map((s) => s.row))].sort((a, b) => a - b)
  const rowMap = new Map(rows.map((r, i) => [r, i]))

  const getGridSelectionBox = () => {
    if (!isDrawing) return null
    const minRow = Math.min(drawStart.row, drawEnd.row)
    const maxRow = Math.max(drawStart.row, drawEnd.row)
    const minCol = Math.min(drawStart.col, drawEnd.col)
    const maxCol = Math.max(drawStart.col, drawEnd.col)
    const screen1 = worldToScreen(minCol * GRID_SIZE, minRow * GRID_SIZE, viewport)
    const screen2 = worldToScreen(
      (maxCol + 1) * GRID_SIZE,
      (maxRow + 1) * GRID_SIZE,
      viewport
    )
    return {
      left: screen1.x,
      top: screen1.y,
      width: screen2.x - screen1.x,
      height: screen2.y - screen1.y,
    }
  }

  const selectionBox = getGridSelectionBox()

  return (
    <div className="seat-grid-wrapper">
      {mode === 'viewer' && (
        <div className="screen-wall">
          <div className="screen-curve" />
          <div className="screen-label">银 幕</div>
        </div>
      )}

      <div
        ref={containerRef}
        className={`seat-canvas ${mode === 'editor' ? 'editor-mode' : 'viewer-mode'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        style={{
          cursor: isPanning ? 'grabbing' : isDrawing ? 'crosshair' : mode === 'editor' ? 'cell' : 'default',
        }}
      >
        <div
          className="seat-world"
          style={{
            transform: `translate(${viewport.offsetX}px, ${viewport.offsetY}px) scale(${viewport.scale})`,
            transformOrigin: '0 0',
          }}
        >
          {mode === 'editor' && (
            <div
              className="grid-bg"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
              }}
            />
          )}

          {rows.map((row) => {
            const rowIndex = rowMap.get(row) ?? 0
            const minY = Math.min(...seats.filter((s) => s.row === row).map((s) => s.y))
            return (
              <div
                key={`row-${row}`}
                className="row-label"
                style={{
                  left: -40,
                  top: minY + SEAT_DIAMETER / 2 - 6,
                }}
              >
                {String.fromCharCode(65 + rowIndex)}
              </div>
            )
          })}

          {seats.map((seat) => {
            const screen = worldToScreen(seat.x, seat.y, { offsetX: 0, offsetY: 0, scale: 1 })
            const isAnimated = animatedSeatId === seat.id
            const isSelected = selectedSeatId === seat.id
            const isMultiSelected = multiSelectedIds.includes(seat.id)
            return (
              <div
                key={seat.id}
                className={`seat-circle ${isAnimated ? 'seat-pulse' : ''} ${isSelected ? 'seat-selected' : ''} ${isMultiSelected ? 'seat-multi-selected' : ''}`}
                style={{
                  left: screen.x,
                  top: screen.y,
                  width: SEAT_DIAMETER,
                  height: SEAT_DIAMETER,
                  backgroundColor: getSeatColor(seat),
                }}
                onClick={(e) => handleSeatClick(e, seat)}
                onContextMenu={(e) => handleSeatContextMenu(e, seat)}
                title={getSeatLabel(seat)}
              />
            )
          })}

          {selectionBox && (
            <div
              className="selection-box"
              style={{
                left: selectionBox.left,
                top: selectionBox.top,
                width: selectionBox.width,
                height: selectionBox.height,
              }}
            />
          )}
        </div>
      </div>

      {bookingPopup.visible && (
        <div
          className="booking-popup"
          style={{
            left: bookingPopup.positionX,
            top: bookingPopup.positionY,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="booking-seat">座位: {bookingPopup.seatNumber}</div>
          <div className="booking-price">票价: ¥{bookingPopup.price}</div>
          <button className="btn-primary booking-btn" onClick={handleConfirmBooking}>
            确认购票
          </button>
        </div>
      )}

      {contextMenu.visible && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-item" onClick={handleContextDelete}>
            删除座位
          </div>
          <div className="context-item" onClick={handleContextDuplicateRow}>
            复制整行
          </div>
        </div>
      )}
    </div>
  )
}
