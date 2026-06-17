import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useAppStore } from './store'
import type { Layer, FilterSettings } from './types'

type HandleType = 'tl' | 'tr' | 'bl' | 'br' | 'rotate' | 'move' | null

interface DragState {
  isDragging: boolean
  startX: number
  startY: number
  startLayerX: number
  startLayerY: number
  startWidth: number
  startHeight: number
  startRotation: number
  handleType: HandleType
  layerId: string | null
}

const CanvasPreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map())
  const animationFrameRef = useRef<number>(0)
  const [scale, setScale] = useState(1)

  const {
    layers,
    selectedLayerId,
    canvasSize,
    selectLayer,
    updateLayer,
  } = useAppStore()

  const dragStateRef = useRef<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    startLayerX: 0,
    startLayerY: 0,
    startWidth: 0,
    startHeight: 0,
    startRotation: 0,
    handleType: null,
    layerId: null,
  })

  const getFilterString = useCallback((filter: FilterSettings): string => {
    return `brightness(${filter.brightness}) contrast(${filter.contrast}) hue-rotate(${filter.hue}deg) saturate(${filter.saturation}) blur(${filter.blur}px) sepia(${filter.sepia}) grayscale(${filter.grayscale})`
  }, [])

  const loadImage = useCallback((src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const cached = imageCacheRef.current.get(src)
      if (cached && cached.complete) {
        resolve(cached)
        return
      }

      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        imageCacheRef.current.set(src, img)
        resolve(img)
      }
      img.onerror = reject
      img.src = src
    })
  }, [])

  const drawCanvas = useCallback(async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvasSize.width * dpr
    canvas.height = canvasSize.height * dpr
    ctx.scale(dpr, dpr)

    ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)

    for (const layer of layers) {
      if (!layer.visible) continue

      ctx.save()

      const centerX = layer.x + layer.width / 2
      const centerY = layer.y + layer.height / 2

      ctx.translate(centerX, centerY)
      ctx.rotate((layer.rotation * Math.PI) / 180)
      ctx.translate(-centerX, -centerY)

      if (layer.type === 'image' && layer.imageSrc) {
        try {
          const img = await loadImage(layer.imageSrc)
          ctx.filter = getFilterString(layer.filter)
          ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height)
        } catch (e) {
          console.error('Failed to load image:', e)
        }
      } else if (layer.type === 'text' && layer.text) {
        const t = layer.text
        ctx.font = `${t.fontWeight} ${t.fontSize}px ${t.fontFamily}`
        ctx.fillStyle = t.color
        ctx.globalAlpha = t.opacity
        ctx.textAlign = t.textAlign
        ctx.textBaseline = 'top'

        const textX = layer.x + layer.width / 2
        const textY = layer.y

        const lines = t.text.split('\n')
        const lineHeight = t.fontSize * 1.2
        const totalHeight = lines.length * lineHeight

        let startY = textY
        if (t.textAlign === 'center') {
          startY = textY + (layer.height - totalHeight) / 2
        }

        lines.forEach((line, index) => {
          let x = textX
          if (t.textAlign === 'left') {
            x = layer.x
          } else if (t.textAlign === 'right') {
            x = layer.x + layer.width
          }
          ctx.fillText(line, x, startY + index * lineHeight)
        })

        ctx.globalAlpha = 1
      }

      ctx.restore()
    }

    if (selectedLayerId) {
      const selectedLayer = layers.find((l) => l.id === selectedLayerId)
      if (selectedLayer) {
        ctx.save()

        const centerX = selectedLayer.x + selectedLayer.width / 2
        const centerY = selectedLayer.y + selectedLayer.height / 2

        ctx.translate(centerX, centerY)
        ctx.rotate((selectedLayer.rotation * Math.PI) / 180)
        ctx.translate(-centerX, -centerY)

        ctx.strokeStyle = '#1976D2'
        ctx.lineWidth = 1.5
        ctx.setLineDash([6, 4])
        ctx.strokeRect(
          selectedLayer.x,
          selectedLayer.y,
          selectedLayer.width,
          selectedLayer.height
        )

        ctx.setLineDash([])
        ctx.fillStyle = '#1976D2'
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.5

        const handleSize = 8
        const handles = [
          { x: selectedLayer.x - handleSize / 2, y: selectedLayer.y - handleSize / 2, type: 'tl' },
          { x: selectedLayer.x + selectedLayer.width - handleSize / 2, y: selectedLayer.y - handleSize / 2, type: 'tr' },
          { x: selectedLayer.x - handleSize / 2, y: selectedLayer.y + selectedLayer.height - handleSize / 2, type: 'bl' },
          { x: selectedLayer.x + selectedLayer.width - handleSize / 2, y: selectedLayer.y + selectedLayer.height - handleSize / 2, type: 'br' },
        ]

        handles.forEach((handle) => {
          ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
          ctx.strokeRect(handle.x, handle.y, handleSize, handleSize)
        })

        const rotateX = selectedLayer.x + selectedLayer.width / 2 - 4
        const rotateY = selectedLayer.y - 20
        ctx.beginPath()
        ctx.arc(rotateX + 4, rotateY + 4, 6, 0, Math.PI * 2)
        ctx.fillStyle = '#1976D2'
        ctx.fill()
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 1.5
        ctx.stroke()

        ctx.restore()
      }
    }
  }, [layers, selectedLayerId, canvasSize, loadImage, getFilterString])

  useEffect(() => {
    let mounted = true

    const render = () => {
      if (mounted) {
        drawCanvas()
        animationFrameRef.current = requestAnimationFrame(render)
      }
    }

    animationFrameRef.current = requestAnimationFrame(render)

    return () => {
      mounted = false
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [drawCanvas])

  useEffect(() => {
    const updateScale = () => {
      const container = containerRef.current
      if (!container) return

      const maxWidth = Math.min(container.clientWidth - 40, 900)
      const maxHeight = container.clientHeight - 40

      const scaleX = maxWidth / canvasSize.width
      const scaleY = maxHeight / canvasSize.height
      const newScale = Math.min(scaleX, scaleY, 1.5)
      setScale(Math.max(newScale, 0.3))
    }

    updateScale()
    window.addEventListener('resize', updateScale)

    const resizeObserver = new ResizeObserver(updateScale)
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    return () => {
      window.removeEventListener('resize', updateScale)
      resizeObserver.disconnect()
    }
  }, [canvasSize])

  const getCanvasCoords = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) / scale,
      y: (e.clientY - rect.top) / scale,
    }
  }, [scale])

  const getHandleAtPosition = useCallback(
    (x: number, y: number): { handleType: HandleType; layerId: string | null } => {
      if (!selectedLayerId) return { handleType: null, layerId: null }

      const layer = layers.find((l) => l.id === selectedLayerId)
      if (!layer) return { handleType: null, layerId: null }

      const rad = (layer.rotation * Math.PI) / 180
      const cos = Math.cos(-rad)
      const sin = Math.sin(-rad)
      const cx = layer.x + layer.width / 2
      const cy = layer.y + layer.height / 2

      const dx = x - cx
      const dy = y - cy
      const localX = cos * dx - sin * dy + cx
      const localY = sin * dx + cos * dy + cy

      const handleSize = 10

      const rotateDist = Math.sqrt(
        Math.pow(localX - (layer.x + layer.width / 2), 2) +
          Math.pow(localY - (layer.y - 20), 2)
      )
      if (rotateDist < 10) {
        return { handleType: 'rotate', layerId: layer.id }
      }

      const corners: { type: HandleType; x: number; y: number }[] = [
        { type: 'tl', x: layer.x, y: layer.y },
        { type: 'tr', x: layer.x + layer.width, y: layer.y },
        { type: 'bl', x: layer.x, y: layer.y + layer.height },
        { type: 'br', x: layer.x + layer.width, y: layer.y + layer.height },
      ]

      for (const corner of corners) {
        if (
          localX >= corner.x - handleSize &&
          localX <= corner.x + handleSize &&
          localY >= corner.y - handleSize &&
          localY <= corner.y + handleSize
        ) {
          return { handleType: corner.type, layerId: layer.id }
        }
      }

      if (
        localX >= layer.x &&
        localX <= layer.x + layer.width &&
        localY >= layer.y &&
        localY <= layer.y + layer.height
      ) {
        return { handleType: 'move', layerId: layer.id }
      }

      return { handleType: null, layerId: null }
    },
    [selectedLayerId, layers]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCanvasCoords(e)

      const { handleType, layerId } = getHandleAtPosition(x, y)

      if (handleType && layerId) {
        const layer = layers.find((l) => l.id === layerId)
        if (layer) {
          dragStateRef.current = {
            isDragging: true,
            startX: x,
            startY: y,
            startLayerX: layer.x,
            startLayerY: layer.y,
            startWidth: layer.width,
            startHeight: layer.height,
            startRotation: layer.rotation,
            handleType,
            layerId,
          }
        }
      } else {
        let clickedLayer: Layer | null = null
        for (let i = layers.length - 1; i >= 0; i--) {
          const layer = layers[i]
          if (!layer.visible) continue

          const rad = (layer.rotation * Math.PI) / 180
          const cos = Math.cos(-rad)
          const sin = Math.sin(-rad)
          const cx = layer.x + layer.width / 2
          const cy = layer.y + layer.height / 2

          const dx = x - cx
          const dy = y - cy
          const localX = cos * dx - sin * dy + cx
          const localY = sin * dx + cos * dy + cy

          if (
            localX >= layer.x &&
            localX <= layer.x + layer.width &&
            localY >= layer.y &&
            localY <= layer.y + layer.height
          ) {
            clickedLayer = layer
            break
          }
        }

        if (clickedLayer) {
          selectLayer(clickedLayer.id)
        } else {
          selectLayer(null)
        }
      }
    },
    [getCanvasCoords, getHandleAtPosition, layers, selectLayer]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const drag = dragStateRef.current
      if (!drag.isDragging || !drag.layerId) return

      const { x, y } = getCanvasCoords(e)
      const dx = x - drag.startX
      const dy = y - drag.startY

      if (drag.handleType === 'move') {
        updateLayer(drag.layerId, {
          x: drag.startLayerX + dx,
          y: drag.startLayerY + dy,
        })
      } else if (drag.handleType === 'rotate') {
        const layer = layers.find((l) => l.id === drag.layerId)
        if (layer) {
          const cx = layer.x + layer.width / 2
          const cy = layer.y + layer.height / 2
          const angle = Math.atan2(y - cy, x - cx) * (180 / Math.PI) + 90
          updateLayer(drag.layerId, { rotation: angle })
        }
      } else if (
        drag.handleType === 'tl' ||
        drag.handleType === 'tr' ||
        drag.handleType === 'bl' ||
        drag.handleType === 'br'
      ) {
        const aspect = drag.startWidth / drag.startHeight
        let newWidth = drag.startWidth
        let newHeight = drag.startHeight
        let newX = drag.startLayerX
        let newY = drag.startLayerY

        if (drag.handleType === 'br') {
          newWidth = Math.max(20, drag.startWidth + dx)
          newHeight = newWidth / aspect
        } else if (drag.handleType === 'bl') {
          newWidth = Math.max(20, drag.startWidth - dx)
          newHeight = newWidth / aspect
          newX = drag.startLayerX + (drag.startWidth - newWidth)
        } else if (drag.handleType === 'tr') {
          newWidth = Math.max(20, drag.startWidth + dx)
          newHeight = newWidth / aspect
          newY = drag.startLayerY + (drag.startHeight - newHeight)
        } else if (drag.handleType === 'tl') {
          newWidth = Math.max(20, drag.startWidth - dx)
          newHeight = newWidth / aspect
          newX = drag.startLayerX + (drag.startWidth - newWidth)
          newY = drag.startLayerY + (drag.startHeight - newHeight)
        }

        updateLayer(drag.layerId, {
          width: newWidth,
          height: newHeight,
          x: newX,
          y: newY,
        })
      }
    },
    [getCanvasCoords, updateLayer, layers]
  )

  const handleMouseUp = useCallback(() => {
    dragStateRef.current.isDragging = false
    dragStateRef.current.handleType = null
    dragStateRef.current.layerId = null
  }, [])

  return (
    <div ref={containerRef} className="canvas-container">
      <div
        className="canvas-wrapper"
        style={{
          width: canvasSize.width * scale,
          height: canvasSize.height * scale,
        }}
      >
        <div
          className="checkerboard-bg"
          style={{
            position: 'absolute',
            width: canvasSize.width * scale,
            height: canvasSize.height * scale,
            zIndex: 0,
          }}
        />
        <canvas
          ref={canvasRef}
          className="canvas-board"
          style={{
            width: canvasSize.width * scale,
            height: canvasSize.height * scale,
            position: 'relative',
            zIndex: 1,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />
      </div>
    </div>
  )
}

export default CanvasPreview
