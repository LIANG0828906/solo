import React, { useRef, useState, useEffect, useCallback } from 'react'
import { useEditorStore, Layer, TextLayer, StickerLayer, BrushLayer } from '../store/editorStore'
import { exportCanvasAsPNG, downloadImage, saveToCommunity, formatCreatedAt } from '../utils/exportImage'
import '../styles/canvas.css'

const EditorCanvas: React.FC = () => {
  const {
    layers,
    currentTool,
    selectedLayerId,
    canvasScale,
    canvasOffset,
    setCanvasScale,
    setCanvasOffset,
    addBackgroundImage,
    addTextLayer,
    addBrushLayer,
    updateLayer,
    selectLayer,
    isDrawing,
    currentPath,
    setIsDrawing,
    setCurrentPath,
    brushSize,
    brushColor,
    highlightLayerId,
  } = useEditorStore()

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggingLayer, setDraggingLayer] = useState<string | null>(null)
  const [dragLayerOffset, setDragLayerOffset] = useState({ x: 0, y: 0 })
  const [isResizing, setIsResizing] = useState(false)
  const [isRotating, setIsRotating] = useState(false)
  const [transformStart, setTransformStart] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
    distance: 0,
    initialAngle: 0,
  })
  const [editingTextId, setEditingTextId] = useState<string | null>(null)
  const [pinchStartDist, setPinchStartDist] = useState(0)
  const [pinchStartScale, setPinchStartScale] = useState(1)
  const [isExporting, setIsExporting] = useState(false)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)

  const CANVAS_SIZE = 300

  const handleQuickExport = async () => {
    if (layers.length === 0) {
      alert('请先添加一些内容到画布')
      return
    }

    setIsExporting(true)
    try {
      const now = new Date()
      const createdAtIso = now.toISOString()
      const createdAtFormatted = formatCreatedAt(createdAtIso)
      const creatorName = '画布创作者'

      console.log('========== EditorCanvas 开始导出 ==========')
      console.log('创作者昵称:', creatorName)
      console.log('创作时间 (本地格式化):', createdAtFormatted)
      console.log('画布尺寸: 300x300 像素')
      console.log('PNG格式导出')
      console.log('图层总数:', layers.length)
      console.log('============================================')

      const dataUrl = await exportCanvasAsPNG(layers, 300)
      const timestamp = createdAtIso.replace(/[:.]/g, '-')
      downloadImage(dataUrl, `meme_${timestamp}.png`)

      await saveToCommunity(layers, creatorName)
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  const screenToCanvas = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: 0, y: 0 }
      const rect = containerRef.current.getBoundingClientRect()
      const centerX = rect.width / 2 + canvasOffset.x
      const centerY = rect.height / 2 + canvasOffset.y
      const x = (screenX - rect.left - centerX) / canvasScale + CANVAS_SIZE / 2
      const y = (screenY - rect.top - centerY) / canvasScale + CANVAS_SIZE / 2
      return { x, y }
    },
    [canvasScale, canvasOffset]
  )

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        addBackgroundImage(event.target?.result as string, img.width, img.height)
        bgImageRef.current = img
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in e
    if (isTouch && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }
    const mouseEvent = e as React.MouseEvent
    return { x: mouseEvent.clientX, y: mouseEvent.clientY }
  }

  const handleCanvasMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in e

    if (isTouch && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      setPinchStartDist(dist)
      setPinchStartScale(canvasScale)
      setIsDraggingCanvas(true)
      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      setDragStart({ x: midX - canvasOffset.x, y: midY - canvasOffset.y })
      lastTouchRef.current = { x: midX, y: midY }
      return
    }

    const { x: clientX, y: clientY } = getEventPos(e)

    if (currentTool === 'select') {
      const pos = screenToCanvas(clientX, clientY)
      const clickedLayer = findLayerAtPosition(pos.x, pos.y)

      if (clickedLayer) {
        selectLayer(clickedLayer.id)
        setDraggingLayer(clickedLayer.id)
        setDragLayerOffset({
          x: pos.x - clickedLayer.x,
          y: pos.y - clickedLayer.y,
        })
        return
      }
    }

    if (currentTool === 'text') {
      const pos = screenToCanvas(clientX, clientY)
      addTextLayer(pos.x, pos.y)
      return
    }

    if (currentTool === 'brush') {
      const pos = screenToCanvas(clientX, clientY)
      setIsDrawing(true)
      setCurrentPath([{ x: pos.x, y: pos.y }])
      return
    }

    setIsDraggingCanvas(true)
    setDragStart({ x: clientX - canvasOffset.x, y: clientY - canvasOffset.y })
    selectLayer(null)
  }

  const findLayerAtPosition = (x: number, y: number): Layer | null => {
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i]
      if (!layer.visible || layer.type === 'background') continue

      const dx = x - layer.x
      const dy = y - layer.y
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (layer.type === 'text') {
        const textLayer = layer as TextLayer
        const hitRadius = Math.max(textLayer.text.length * textLayer.fontSize * 0.3, textLayer.fontSize)
        if (distance < hitRadius * layer.scale) return layer
      } else if (layer.type === 'sticker') {
        const stickerLayer = layer as StickerLayer
        if (distance < stickerLayer.size * layer.scale * 0.6) return layer
      } else if (layer.type === 'brush') {
        if (distance < 30 * layer.scale) return layer
      }
    }
    return null
  }

  const handleCanvasMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in e

    if (isTouch && e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const scale = (dist / pinchStartDist) * pinchStartScale
      setCanvasScale(scale)

      const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2
      if (lastTouchRef.current) {
        const deltaX = midX - lastTouchRef.current.x
        const deltaY = midY - lastTouchRef.current.y
        setCanvasOffset({
          x: canvasOffset.x + deltaX,
          y: canvasOffset.y + deltaY,
        })
      }
      lastTouchRef.current = { x: midX, y: midY }
      return
    }

    const { x: clientX, y: clientY } = getEventPos(e)

    if (isDraggingCanvas) {
      setCanvasOffset({
        x: clientX - dragStart.x,
        y: clientY - dragStart.y,
      })
      return
    }

    if (isDrawing) {
      const pos = screenToCanvas(clientX, clientY)
      setCurrentPath([...currentPath, { x: pos.x, y: pos.y }])
      return
    }

    if (draggingLayer && !isResizing && !isRotating) {
      const pos = screenToCanvas(clientX, clientY)
      updateLayer(draggingLayer, {
        x: pos.x - dragLayerOffset.x,
        y: pos.y - dragLayerOffset.y,
      })
      return
    }

    if (isResizing && selectedLayerId) {
      const pos = screenToCanvas(clientX, clientY)
      const layer = layers.find((l) => l.id === selectedLayerId)
      if (!layer) return

      const dx = pos.x - layer.x
      const dy = pos.y - layer.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      const newScale = (distance / transformStart.distance) * transformStart.scale
      updateLayer(selectedLayerId, { scale: Math.max(0.1, Math.min(5, newScale)) })
      return
    }

    if (isRotating && selectedLayerId) {
      const pos = screenToCanvas(clientX, clientY)
      const layer = layers.find((l) => l.id === selectedLayerId)
      if (!layer) return

      const angle = Math.atan2(pos.y - layer.y, pos.x - layer.x) * (180 / Math.PI)
      const newRotation = angle - transformStart.initialAngle + transformStart.rotation
      updateLayer(selectedLayerId, { rotation: newRotation })
      return
    }
  }

  const handleCanvasMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      addBrushLayer([currentPath])
    }
    setIsDraggingCanvas(false)
    setIsDrawing(false)
    setCurrentPath([])
    setDraggingLayer(null)
    setIsResizing(false)
    setIsRotating(false)
    lastTouchRef.current = null
  }

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    setCanvasScale(canvasScale * delta)
  }

  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, layerId: string) => {
    e.stopPropagation()
    const { x: clientX, y: clientY } = getEventPos(e)

    const layer = layers.find((l) => l.id === layerId)
    if (!layer) return

    const pos = screenToCanvas(clientX, clientY)
    const dx = pos.x - layer.x
    const dy = pos.y - layer.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    setIsResizing(true)
    setTransformStart({
      ...transformStart,
      x: clientX,
      y: clientY,
      scale: layer.scale,
      distance,
    })
  }

  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent, layerId: string) => {
    e.stopPropagation()
    const { x: clientX, y: clientY } = getEventPos(e)

    const layer = layers.find((l) => l.id === layerId)
    if (!layer) return

    const pos = screenToCanvas(clientX, clientY)
    const angle = Math.atan2(pos.y - layer.y, pos.x - layer.x) * (180 / Math.PI)

    setIsRotating(true)
    setTransformStart({
      ...transformStart,
      x: clientX,
      y: clientY,
      rotation: layer.rotation,
      initialAngle: angle,
      distance: 0,
    })
  }

  const handleTextDoubleClick = (layerId: string) => {
    setEditingTextId(layerId)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>, layerId: string) => {
    const text = e.target.value.slice(0, 20)
    updateLayer(layerId, { text, name: text || '文字' })
  }

  const handleTextBlur = () => {
    setEditingTextId(null)
  }

  const renderLayer = (layer: Layer) => {
    if (!layer.visible) return null

    const isSelected = selectedLayerId === layer.id
    const isHighlighted = highlightLayerId === layer.id

    const commonStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${layer.x}px`,
      top: `${layer.y}px`,
      transform: `translate(-50%, -50%) rotate(${layer.rotation}deg) scale(${layer.scale})`,
      cursor: currentTool === 'select' ? 'move' : 'default',
      zIndex: isSelected ? 50 : 10,
      transformOrigin: 'center center',
    }

    if (layer.type === 'text') {
      const textLayer = layer as TextLayer
      return (
        <div
          key={layer.id}
          className={`text-layer ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlight' : ''} ${editingTextId === layer.id ? 'editing' : ''}`}
          style={{
            ...commonStyle,
            fontSize: textLayer.fontSize,
            fontFamily: textLayer.fontFamily,
            color: textLayer.color,
            WebkitTextStroke: `${textLayer.strokeWidth}px ${textLayer.strokeColor}`,
            paintOrder: 'stroke fill',
            whiteSpace: 'nowrap',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${textLayer.color}40`,
          }}
          onMouseDown={(e) => {
            if (currentTool === 'select') {
              e.stopPropagation()
              selectLayer(layer.id)
              setDraggingLayer(layer.id)
              const pos = screenToCanvas(e.clientX, e.clientY)
              setDragLayerOffset({ x: pos.x - layer.x, y: pos.y - layer.y })
            }
          }}
          onTouchStart={(e) => {
            if (currentTool === 'select') {
              e.stopPropagation()
              selectLayer(layer.id)
              setDraggingLayer(layer.id)
              const pos = screenToCanvas(e.touches[0].clientX, e.touches[0].clientY)
              setDragLayerOffset({ x: pos.x - layer.x, y: pos.y - layer.y })
            }
          }}
          onDoubleClick={() => handleTextDoubleClick(layer.id)}
        >
          {editingTextId === layer.id ? (
            <input
              type="text"
              value={textLayer.text}
              onChange={(e) => handleTextChange(e, layer.id)}
              onBlur={handleTextBlur}
              autoFocus
              maxLength={20}
              className="text-input"
              style={{
                fontSize: textLayer.fontSize,
                fontFamily: textLayer.fontFamily,
                color: textLayer.color,
              }}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
            />
          ) : (
            textLayer.text
          )}
          {isSelected && (
            <>
              <div
                className="resize-handle"
                onMouseDown={(e) => handleResizeStart(e, layer.id)}
                onTouchStart={(e) => handleResizeStart(e, layer.id)}
              />
              <div className="rotate-handle-line" />
              <div
                className="rotate-handle"
                onMouseDown={(e) => handleRotateStart(e, layer.id)}
                onTouchStart={(e) => handleRotateStart(e, layer.id)}
              />
            </>
          )}
        </div>
      )
    }

    if (layer.type === 'sticker') {
      const stickerLayer = layer as StickerLayer
      return (
        <div
          key={layer.id}
          className={`sticker-layer ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlight' : ''}`}
          style={{
            ...commonStyle,
            fontSize: stickerLayer.size,
            lineHeight: 1,
            filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.3))',
          }}
          onMouseDown={(e) => {
            if (currentTool === 'select') {
              e.stopPropagation()
              selectLayer(layer.id)
              setDraggingLayer(layer.id)
              const pos = screenToCanvas(e.clientX, e.clientY)
              setDragLayerOffset({ x: pos.x - layer.x, y: pos.y - layer.y })
            }
          }}
          onTouchStart={(e) => {
            if (currentTool === 'select') {
              e.stopPropagation()
              selectLayer(layer.id)
              setDraggingLayer(layer.id)
              const pos = screenToCanvas(e.touches[0].clientX, e.touches[0].clientY)
              setDragLayerOffset({ x: pos.x - layer.x, y: pos.y - layer.y })
            }
          }}
        >
          {stickerLayer.emoji}
          {isSelected && (
            <>
              <div
                className="resize-handle"
                onMouseDown={(e) => handleResizeStart(e, layer.id)}
                onTouchStart={(e) => handleResizeStart(e, layer.id)}
              />
              <div className="rotate-handle-line" />
              <div
                className="rotate-handle"
                onMouseDown={(e) => handleRotateStart(e, layer.id)}
                onTouchStart={(e) => handleRotateStart(e, layer.id)}
              />
            </>
          )}
        </div>
      )
    }

    return null
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)
      ctx.fillStyle = '#1a1a2e'
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

      layers.forEach((layer) => {
        if (!layer.visible) return

        if (layer.type === 'background') {
          const bgLayer = layer as any
          if (bgImageRef.current && bgImageRef.current.src === bgLayer.imageUrl) {
            const scale = Math.min(CANVAS_SIZE / bgLayer.width, CANVAS_SIZE / bgLayer.height)
            const w = bgLayer.width * scale
            const h = bgLayer.height * scale
            ctx.drawImage(bgImageRef.current, (CANVAS_SIZE - w) / 2, (CANVAS_SIZE - h) / 2, w, h)
          } else {
            const img = new Image()
            img.onload = () => {
              bgImageRef.current = img
              const scale = Math.min(CANVAS_SIZE / bgLayer.width, CANVAS_SIZE / bgLayer.height)
              const w = bgLayer.width * scale
              const h = bgLayer.height * scale
              ctx.drawImage(img, (CANVAS_SIZE - w) / 2, (CANVAS_SIZE - h) / 2, w, h)
            }
            img.src = bgLayer.imageUrl
          }
        }

        if (layer.type === 'brush') {
          const brushLayer = layer as BrushLayer
          ctx.save()
          ctx.translate(layer.x, layer.y)
          ctx.rotate((layer.rotation * Math.PI) / 180)
          ctx.scale(layer.scale, layer.scale)
          ctx.strokeStyle = brushLayer.color
          ctx.lineWidth = brushLayer.strokeWidth
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.shadowColor = brushLayer.color
          ctx.shadowBlur = 2

          brushLayer.paths.forEach((path) => {
            if (path.length < 2) return
            ctx.beginPath()
            ctx.moveTo(path[0].x, path[0].y)
            for (let i = 1; i < path.length; i++) {
              ctx.lineTo(path[i].x, path[i].y)
            }
            ctx.stroke()
          })
          ctx.restore()
        }
      })

      if (isDrawing && currentPath.length > 1) {
        ctx.strokeStyle = brushColor
        ctx.lineWidth = brushSize
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.shadowColor = brushColor
        ctx.shadowBlur = 2
        ctx.beginPath()
        ctx.moveTo(currentPath[0].x, currentPath[0].y)
        for (let i = 1; i < currentPath.length; i++) {
          ctx.lineTo(currentPath[i].x, currentPath[i].y)
        }
        ctx.stroke()
      }
    }

    render()
  }, [layers, isDrawing, currentPath, brushColor, brushSize])

  const hasBackground = layers.some((l) => l.type === 'background')

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onTouchStart={handleCanvasMouseDown}
      onTouchMove={handleCanvasMouseMove}
      onTouchEnd={handleCanvasMouseUp}
      onWheel={handleWheel}
    >
      <div
        className="canvas-wrapper"
        style={{
          transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="canvas-glow"
        />
        {!hasBackground && (
          <div className="empty-canvas-hint" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
            <div className="hint-icon">+</div>
            <div className="hint-text">点击上传底图</div>
          </div>
        )}
        {layers.map((layer) => renderLayer(layer))}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      <div className="upload-btn" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
        📁 上传图片
      </div>
      <button
        className={`canvas-export-btn ${isExporting ? 'exporting' : ''}`}
        onClick={(e) => { e.stopPropagation(); handleQuickExport() }}
        disabled={isExporting}
      >
        {isExporting ? '导出中...' : '📤 导出 PNG'}
      </button>
      <div className="zoom-controls">
        <button className="zoom-btn" onClick={() => setCanvasScale(canvasScale * 1.2)}>
          +
        </button>
        <span className="zoom-value">{Math.round(canvasScale * 100)}%</span>
        <button className="zoom-btn" onClick={() => setCanvasScale(canvasScale * 0.8)}>
          −
        </button>
        <button
          className="zoom-btn reset"
          onClick={() => {
            setCanvasScale(1)
            setCanvasOffset({ x: 0, y: 0 })
          }}
        >
          ⟲
        </button>
      </div>
    </div>
  )
}

export default EditorCanvas
