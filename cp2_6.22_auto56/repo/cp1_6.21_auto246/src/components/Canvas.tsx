import { useRef, useState, useEffect, useCallback } from 'react'
import { useStore } from '@/store'
import type { CanvasComponent, ComponentType } from '@/types'
import { componentDefaults } from '@/types'

const GRID_SIZE = 20
const SNAP_THRESHOLD = 8

function snapToGrid(value: number): number {
  const mod = value % GRID_SIZE
  if (mod <= SNAP_THRESHOLD) {
    return value - mod
  }
  if (mod >= GRID_SIZE - SNAP_THRESHOLD) {
    return value + (GRID_SIZE - mod)
  }
  return value
}

function renderComponentContent(comp: CanvasComponent) {
  const { style } = comp
  const baseStyle = {
    width: '100%',
    height: '100%',
    backgroundColor: style.backgroundColor,
    color: style.color,
    fontSize: `${style.fontSize}px`,
    borderColor: style.borderColor,
    borderWidth: `${style.borderWidth}px`,
    borderRadius: `${style.borderRadius}px`,
    boxShadow: style.boxShadow,
    padding: `${style.padding}px`,
    boxSizing: 'border-box' as const,
  }

  switch (comp.type) {
    case 'button':
      return (
        <button style={{ ...baseStyle, borderStyle: style.borderWidth > 0 ? 'solid' : 'none', cursor: 'default' }}>
          {comp.content || '按钮'}
        </button>
      )
    case 'input':
      return (
        <input
          style={{ ...baseStyle, borderStyle: style.borderWidth > 0 ? 'solid' : 'none', outline: 'none' }}
          placeholder={comp.placeholder || '请输入内容'}
          readOnly
        />
      )
    case 'text':
      return (
        <div style={{ ...baseStyle, borderStyle: style.borderWidth > 0 ? 'solid' : 'none', display: 'flex', alignItems: 'center' }}>
          {comp.content || '文本内容'}
        </div>
      )
    case 'image':
      return (
        <img
          src={comp.src}
          alt=""
          style={{ ...baseStyle, borderStyle: style.borderWidth > 0 ? 'solid' : 'none', objectFit: 'cover' }}
          draggable={false}
        />
      )
    case 'container':
      return (
        <div style={{ ...baseStyle, borderStyle: style.borderWidth > 0 ? 'solid' : 'none' }} />
      )
    default:
      return null
  }
}

interface DragPosition {
  x: number
  y: number
}

interface ResizeSize {
  width: number
  height: number
}

export default function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const components = useStore(state => state.components)
  const selectedId = useStore(state => state.selectedId)
  const addComponent = useStore(state => state.addComponent)
  const updateComponent = useStore(state => state.updateComponent)
  const selectComponent = useStore(state => state.selectComponent)
  const removeComponent = useStore(state => state.removeComponent)

  const [dropIndicator, setDropIndicator] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  const dragStateRef = useRef<{
    active: boolean
    compId: string
    startX: number
    startY: number
    compStartX: number
    compStartY: number
  }>({
    active: false,
    compId: '',
    startX: 0,
    startY: 0,
    compStartX: 0,
    compStartY: 0,
  })

  const resizeStateRef = useRef<{
    active: boolean
    compId: string
    startX: number
    startY: number
    startWidth: number
    startHeight: number
  }>({
    active: false,
    compId: '',
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
  })

  const tempPositionRef = useRef<Record<string, DragPosition>>({})
  const tempSizeRef = useRef<Record<string, ResizeSize>>({})
  const [, forceRender] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && selectedId) {
        removeComponent(selectedId)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedId, removeComponent])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/component-type') as ComponentType
    if (!type) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const defaults = componentDefaults[type]
    const rawX = e.clientX - rect.left - (defaults.width ?? 100) / 2
    const rawY = e.clientY - rect.top - (defaults.height ?? 100) / 2
    const snappedX = snapToGrid(Math.max(0, rawX))
    const snappedY = snapToGrid(Math.max(0, rawY))

    setDropIndicator({
      x: snappedX,
      y: snappedY,
      width: defaults.width ?? 100,
      height: defaults.height ?? 100,
    })
  }, [])

  const handleDragLeave = useCallback(() => {
    setDropIndicator(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const type = e.dataTransfer.getData('application/component-type') as ComponentType
    if (!type) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) {
      setDropIndicator(null)
      return
    }

    const defaults = componentDefaults[type]
    const rawX = e.clientX - rect.left - (defaults.width ?? 100) / 2
    const rawY = e.clientY - rect.top - (defaults.height ?? 100) / 2
    const snappedX = snapToGrid(Math.max(0, rawX))
    const snappedY = snapToGrid(Math.max(0, rawY))

    addComponent(type, snappedX, snappedY)
    setDropIndicator(null)
  }, [addComponent])

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target === e.currentTarget) {
      selectComponent(null)
    }
  }, [selectComponent])

  const handleComponentPointerDown = useCallback((e: React.PointerEvent, comp: CanvasComponent) => {
    e.stopPropagation()
    selectComponent(comp.id)
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    dragStateRef.current = {
      active: true,
      compId: comp.id,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      compStartX: comp.x,
      compStartY: comp.y,
    }
    tempPositionRef.current[comp.id] = { x: comp.x, y: comp.y }
  }, [selectComponent])

  const handleComponentPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragStateRef.current.active && !resizeStateRef.current.active) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    if (dragStateRef.current.active) {
      const { compId, startX, startY, compStartX, compStartY } = dragStateRef.current
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      const deltaX = currentX - startX
      const deltaY = currentY - startY
      const rawX = compStartX + deltaX
      const rawY = compStartY + deltaY
      const snappedX = snapToGrid(Math.max(0, rawX))
      const snappedY = snapToGrid(Math.max(0, rawY))

      tempPositionRef.current[compId] = { x: snappedX, y: snappedY }

      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const pos = tempPositionRef.current[compId]
        if (pos) {
          updateComponent(compId, { x: pos.x, y: pos.y })
          forceRender(n => n + 1)
        }
      })
    }

    if (resizeStateRef.current.active) {
      const { compId, startX, startY, startWidth, startHeight } = resizeStateRef.current
      const currentX = e.clientX - rect.left
      const currentY = e.clientY - rect.top
      const deltaX = currentX - startX
      const deltaY = currentY - startY
      const newWidth = Math.max(20, snapToGrid(startWidth + deltaX))
      const newHeight = Math.max(20, snapToGrid(startHeight + deltaY))

      tempSizeRef.current[compId] = { width: newWidth, height: newHeight }

      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        const size = tempSizeRef.current[compId]
        if (size) {
          updateComponent(compId, { width: size.width, height: size.height })
          forceRender(n => n + 1)
        }
      })
    }
  }, [updateComponent])

  const handleComponentPointerUp = useCallback((e: React.PointerEvent) => {
    if (dragStateRef.current.active) {
      const { compId } = dragStateRef.current
      const pos = tempPositionRef.current[compId]
      if (pos) {
        updateComponent(compId, { x: pos.x, y: pos.y })
      }
      dragStateRef.current.active = false
      delete tempPositionRef.current[compId]
    }

    if (resizeStateRef.current.active) {
      const { compId } = resizeStateRef.current
      const size = tempSizeRef.current[compId]
      if (size) {
        updateComponent(compId, { width: size.width, height: size.height })
      }
      resizeStateRef.current.active = false
      delete tempSizeRef.current[compId]
    }

    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [updateComponent])

  const handleResizePointerDown = useCallback((e: React.PointerEvent, comp: CanvasComponent) => {
    e.stopPropagation()
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    resizeStateRef.current = {
      active: true,
      compId: comp.id,
      startX: e.clientX - rect.left,
      startY: e.clientY - rect.top,
      startWidth: comp.width,
      startHeight: comp.height,
    }
    tempSizeRef.current[comp.id] = { width: comp.width, height: comp.height }
  }, [])

  const getEffectivePosition = (comp: CanvasComponent): DragPosition => {
    return tempPositionRef.current[comp.id] ?? { x: comp.x, y: comp.y }
  }

  const getEffectiveSize = (comp: CanvasComponent): ResizeSize => {
    return tempSizeRef.current[comp.id] ?? { width: comp.width, height: comp.height }
  }

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full overflow-auto"
      style={{
        backgroundColor: '#F8FAFC',
        backgroundImage: `
          linear-gradient(to right, #E2E8F0 1px, transparent 1px),
          linear-gradient(to bottom, #E2E8F0 1px, transparent 1px)
        `,
        backgroundSize: `${GRID_SIZE}px ${GRID_SIZE}px`,
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handleComponentPointerMove}
      onPointerUp={handleComponentPointerUp}
    >
      {dropIndicator && (
        <div
          style={{
            position: 'absolute',
            left: dropIndicator.x,
            top: dropIndicator.y,
            width: dropIndicator.width,
            height: dropIndicator.height,
            border: '2px dashed #3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointerEvents: 'none',
            zIndex: 1,
            boxSizing: 'border-box',
          }}
        />
      )}

      {components.map(comp => {
        const isSelected = selectedId === comp.id
        const pos = getEffectivePosition(comp)
        const size = getEffectiveSize(comp)

        return (
          <div
            key={comp.id}
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: size.width,
              height: size.height,
              zIndex: comp.zIndex,
              transform: `translate(${pos.x}px, ${pos.y}px)`,
              transition: 'transform 0.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              willChange: 'transform',
              boxSizing: 'border-box',
              outline: isSelected ? '2px solid #3B82F6' : 'none',
              outlineOffset: isSelected ? '0px' : undefined,
              cursor: isSelected ? 'move' : 'default',
            }}
            onPointerDown={(e) => handleComponentPointerDown(e, comp)}
          >
            {renderComponentContent(comp)}

            {isSelected && (
              <div
                onPointerDown={(e) => handleResizePointerDown(e, comp)}
                style={{
                  position: 'absolute',
                  right: -5,
                  bottom: -5,
                  width: 10,
                  height: 10,
                  backgroundColor: '#3B82F6',
                  borderRadius: '50%',
                  cursor: 'nwse-resize',
                  zIndex: comp.zIndex + 1,
                  boxSizing: 'border-box',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
