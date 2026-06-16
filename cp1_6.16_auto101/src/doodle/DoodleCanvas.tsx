import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import { PRESET_COLORS, drawGrid, getBrushSettings } from '../utils/canvasUtils'
import type { BrushType } from '../types'
import { ArrowLeft, Eraser, Undo2, Trash2, Upload, PenTool } from 'lucide-react'
import './DoodleCanvas.css'

const CANVAS_WIDTH = 800
const CANVAS_HEIGHT = 600
const MAX_UNDO = 5

export function DoodleCanvas() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const addDoodle = useAppStore(state => state.addDoodle)
  const books = useAppStore(state => state.books)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gridCanvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  
  const [currentColor, setCurrentColor] = useState(PRESET_COLORS[0])
  const [brushType, setBrushType] = useState<BrushType>('ballpoint')
  const [isEraser, setIsEraser] = useState(false)
  const [undoStack, setUndoStack] = useState<ImageData[]>([])
  
  const book = books.find(b => b.id === id)
  
  useEffect(() => {
    const canvas = canvasRef.current
    const gridCanvas = gridCanvasRef.current
    if (!canvas || !gridCanvas) return
    
    const dpr = window.devicePixelRatio || 1
    
    canvas.width = CANVAS_WIDTH * dpr
    canvas.height = CANVAS_HEIGHT * dpr
    canvas.style.width = `${CANVAS_WIDTH}px`
    canvas.style.height = `${CANVAS_HEIGHT}px`
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.fillStyle = '#F5F5F5'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }
    
    gridCanvas.width = CANVAS_WIDTH * dpr
    gridCanvas.height = CANVAS_HEIGHT * dpr
    gridCanvas.style.width = `${CANVAS_WIDTH}px`
    gridCanvas.style.height = `${CANVAS_HEIGHT}px`
    
    const gridCtx = gridCanvas.getContext('2d')
    if (gridCtx) {
      gridCtx.scale(dpr, dpr)
      gridCtx.globalAlpha = 1
      drawGrid(gridCtx, CANVAS_WIDTH, CANVAS_HEIGHT, 20, '#E0E0E0')
    }
  }, [])
  
  const getCanvasPos = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    
    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    }
  }, [])
  
  const saveState = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const dpr = window.devicePixelRatio || 1
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH * dpr, CANVAS_HEIGHT * dpr)
    
    setUndoStack(prev => {
      const newStack = [...prev, imageData]
      if (newStack.length > MAX_UNDO) {
        newStack.shift()
      }
      return newStack
    })
  }, [])
  
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    saveState()
    isDrawing.current = true
    lastPos.current = getCanvasPos(e)
  }, [getCanvasPos, saveState])
  
  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (!isDrawing.current || !lastPos.current) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const pos = getCanvasPos(e)
    const settings = getBrushSettings(brushType)
    
    ctx.save()
    
    if (isEraser) {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = 20
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.globalAlpha = 1
    } else {
      ctx.strokeStyle = currentColor
      ctx.lineWidth = settings.lineWidth
      ctx.lineCap = settings.lineCap
      ctx.lineJoin = settings.lineJoin
      ctx.globalAlpha = settings.globalAlpha
      
      if (settings.isWatercolor) {
        ctx.globalAlpha = 0.3 + Math.random() * 0.3
      }
    }
    
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    
    ctx.restore()
    
    lastPos.current = pos
  }, [brushType, currentColor, isEraser, getCanvasPos])
  
  const stopDrawing = useCallback(() => {
    isDrawing.current = false
    lastPos.current = null
  }, [])
  
  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return
    
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    const dpr = window.devicePixelRatio || 1
    const prevImage = undoStack[undoStack.length - 1]
    
    ctx.putImageData(prevImage, 0, 0)
    
    setUndoStack(prev => prev.slice(0, -1))
  }, [undoStack])
  
  const handleClear = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    saveState()
    
    ctx.save()
    ctx.globalAlpha = 1
    ctx.fillStyle = '#F5F5F5'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    ctx.restore()
  }, [saveState])
  
  const handleSubmit = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !id) return
    
    const tempCanvas = document.createElement('canvas')
    tempCanvas.width = CANVAS_WIDTH
    tempCanvas.height = CANVAS_HEIGHT
    const tempCtx = tempCanvas.getContext('2d')
    
    if (!tempCtx) return
    
    tempCtx.fillStyle = '#F5F5F5'
    tempCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    tempCtx.drawImage(canvas, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    
    const imageData = tempCanvas.toDataURL('image/png')
    addDoodle(id, imageData)
    navigate(`/book/${id}`)
  }, [addDoodle, id, navigate])
  
  const handleBack = () => {
    if (id) {
      navigate(`/book/${id}`)
    } else {
      navigate('/')
    }
  }
  
  const brushButtons: { type: BrushType; label: string; icon: React.ReactNode }[] = [
    { type: 'ballpoint', label: '圆珠笔', icon: <PenTool size={16} /> },
    { type: 'watercolor', label: '水彩笔', icon: <PenTool size={20} /> },
    { type: 'marker', label: '马克笔', icon: <PenTool size={24} /> },
  ]
  
  return (
    <div className="doodle-canvas-page">
      <div className="doodle-nav">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
          <span>返回</span>
        </button>
        <h2 className="doodle-title">🎨 创意涂鸦板</h2>
        {book && <span className="doodle-book-name">《{book.title}》</span>}
      </div>
      
      <div className="canvas-container">
        <div className="canvas-wrapper">
          <canvas
            ref={gridCanvasRef}
            className="grid-canvas"
          />
          <canvas
            ref={canvasRef}
            className="drawing-canvas"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          
          <div className="color-palette">
            <div className="palette-title">颜色</div>
            <div className="color-buttons">
              {PRESET_COLORS.map((color, index) => (
                <button
                  key={index}
                  className={`color-btn ${currentColor === color && !isEraser ? 'active' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    setCurrentColor(color)
                    setIsEraser(false)
                  }}
                  title={`颜色 ${index + 1}`}
                />
              ))}
            </div>
          </div>
          
          <div className="brush-palette">
            <div className="palette-title">笔触</div>
            <div className="brush-buttons">
              {brushButtons.map(brush => (
                <button
                  key={brush.type}
                  className={`brush-btn ${brushType === brush.type && !isEraser ? 'active' : ''}`}
                  onClick={() => {
                    setBrushType(brush.type)
                    setIsEraser(false)
                  }}
                  title={brush.label}
                >
                  {brush.icon}
                </button>
              ))}
              <button
                className={`brush-btn eraser-btn ${isEraser ? 'active' : ''}`}
                onClick={() => setIsEraser(!isEraser)}
                title="橡皮擦"
              >
                <Eraser size={18} />
              </button>
            </div>
          </div>
        </div>
        
        <div className="toolbar">
          <button
            className="tool-btn"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            title={`撤销 (${undoStack.length}/${MAX_UNDO})`}
          >
            <Undo2 size={20} />
            <span>撤销</span>
            <span className="undo-count">{undoStack.length}/{MAX_UNDO}</span>
          </button>
          
          <button
            className="tool-btn danger"
            onClick={handleClear}
            title="清空画布"
          >
            <Trash2 size={20} />
            <span>清空</span>
          </button>
          
          <button
            className="tool-btn submit"
            onClick={handleSubmit}
            title="上传涂鸦"
          >
            <Upload size={20} />
            <span>完成上传</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default DoodleCanvas
