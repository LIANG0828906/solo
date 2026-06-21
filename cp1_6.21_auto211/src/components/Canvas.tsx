import { useRef, useEffect, useState, useCallback } from 'react'
import { Pencil, Eraser } from 'lucide-react'
import { useCanvasStore, type Point } from '@/store/canvasStore'
import { cn } from '@/lib/utils'

const MAGIC_COLORS = [
  '#6366F1', '#EC4899', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#F97316', '#14B8A6', '#A855F7', '#E11D48',
]

type Tool = 'brush' | 'eraser'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  maxLife: number
  size: number
}

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const isDrawingRef = useRef(false)
  const currentStrokeRef = useRef<Point[]>([])
  const particlesRef = useRef<Particle[]>([])
  const lastPointRef = useRef<Point | null>(null)

  const [tool, setTool] = useState<Tool>('brush')
  const [selectedColor, setSelectedColor] = useState(MAGIC_COLORS[0])
  const [brushWidth, setBrushWidth] = useState(4)
  const [isPanelOpen] = useState(true)

  const { socket, players, remoteStrokes, addStroke, addRemoteStroke, updatePlayerPosition } =
    useCanvasStore()

  const canvasWidth = 800
  const canvasHeight = 600
  const toolbarWidth = 60
  const gridSize = 40

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = '#334155'
    ctx.lineWidth = 0.5
    for (let x = 0; x <= canvasWidth; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasHeight)
      ctx.stroke()
    }
    for (let y = 0; y <= canvasHeight; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasWidth, y)
      ctx.stroke()
    }
  }, [])

  const drawStroke = useCallback(
    (ctx: CanvasRenderingContext2D, points: Point[], color: string, width: number, opacity = 1) => {
      if (points.length < 2) return
      ctx.globalAlpha = opacity
      ctx.strokeStyle = color
      ctx.lineWidth = width
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.beginPath()
      ctx.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y)
      }
      ctx.stroke()
      ctx.globalAlpha = 1
    },
    []
  )

  const spawnParticles = useCallback((x: number, y: number, color: string) => {
    const count = 5 + Math.floor(Math.random() * 6)
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        color,
        life: 0.5,
        maxLife: 0.5,
        size: Math.random() * 3 + 1,
      })
    }
  }, [])

  const updateParticles = useCallback((dt: number) => {
    particlesRef.current = particlesRef.current.filter((p) => {
      p.x += p.vx
      p.y += p.vy
      p.life -= dt
      return p.life > 0
    })
  }, [])

  const drawParticles = useCallback((ctx: CanvasRenderingContext2D) => {
    particlesRef.current.forEach((p) => {
      const alpha = p.life / p.maxLife
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.globalAlpha = 1
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.fillStyle = '#1E293B'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    drawGrid(ctx)

    const { strokes } = useCanvasStore.getState()
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.width)
    })

    remoteStrokes.forEach((stroke) => {
      drawStroke(ctx, stroke.points, stroke.color, stroke.width, 0.3)
    })

    if (currentStrokeRef.current.length > 1) {
      const color = tool === 'eraser' ? '#1E293B' : selectedColor
      const width = tool === 'eraser' ? brushWidth * 3 : brushWidth
      drawStroke(ctx, currentStrokeRef.current, color, width)
    }

    drawParticles(ctx)
  }, [drawGrid, drawStroke, drawParticles, remoteStrokes, tool, selectedColor, brushWidth])

  useEffect(() => {
    let lastTime = performance.now()
    const animate = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000
      lastTime = currentTime
      updateParticles(dt)
      render()
      animationRef.current = requestAnimationFrame(animate)
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => {
      cancelAnimationFrame(animationRef.current)
    }
  }, [render, updateParticles])

  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  const handleStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const pos = getCanvasPos(e)
      isDrawingRef.current = true
      currentStrokeRef.current = [pos]
      lastPointRef.current = pos
      if (tool === 'brush') {
        spawnParticles(pos.x, pos.y, selectedColor)
      }
    },
    [getCanvasPos, tool, selectedColor, spawnParticles]
  )

  const handleMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault()
      const pos = getCanvasPos(e)

      const localPlayer = useCanvasStore.getState().players.find((p) => p.id.startsWith('local-'))
      if (localPlayer) {
        updatePlayerPosition(localPlayer.id, pos.x, pos.y)
      }

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'position',
            x: pos.x,
            y: pos.y,
          })
        )
      }

      if (!isDrawingRef.current) return
      currentStrokeRef.current.push(pos)

      if (lastPointRef.current && tool === 'brush') {
        const dx = pos.x - lastPointRef.current.x
        const dy = pos.y - lastPointRef.current.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 5) {
          spawnParticles(pos.x, pos.y, selectedColor)
          lastPointRef.current = pos
        }
      }
    },
    [getCanvasPos, socket, updatePlayerPosition, tool, selectedColor, spawnParticles]
  )

  const handleEnd = useCallback(() => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false

    if (currentStrokeRef.current.length > 1) {
      const stroke = {
        id: Math.random().toString(36).slice(2),
        points: [...currentStrokeRef.current],
        color: tool === 'eraser' ? '#1E293B' : selectedColor,
        width: tool === 'eraser' ? brushWidth * 3 : brushWidth,
        playerId: 'local',
        playerName: '我',
      }
      addStroke(stroke)

      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: 'stroke',
            stroke,
          })
        )
      }
    }

    currentStrokeRef.current = []
    lastPointRef.current = null
  }, [addStroke, socket, tool, selectedColor, brushWidth])

  useEffect(() => {
    if (!socket) return
    const handleMessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data)
        if (data.type === 'stroke' && data.stroke) {
          addRemoteStroke(data.stroke)
        }
      } catch {
        // ignore parse errors
      }
    }
    socket.addEventListener('message', handleMessage)
    return () => socket.removeEventListener('message', handleMessage)
  }, [socket, addRemoteStroke])

  const onlineCount = players.length > 0 ? players.length : 1

  return (
    <div
      ref={containerRef}
      className="relative inline-block select-none"
      style={{ width: canvasWidth + toolbarWidth, height: canvasHeight }}
    >
      <div
        className="absolute left-0 top-0 h-full flex flex-col gap-2 p-2"
        style={{
          width: toolbarWidth,
          backgroundColor: '#0F172A',
          borderRadius: '0 12px 12px 0',
        }}
      >
        <button
          className={cn(
            'flex items-center justify-center rounded-xl transition-all duration-200',
            'hover:bg-slate-600',
            tool === 'brush' ? 'ring-2 ring-indigo-500 bg-slate-600' : 'bg-slate-700'
          )}
          style={{ width: 48, height: 48 }}
          onClick={() => setTool('brush')}
        >
          <Pencil className="w-5 h-5 text-white" />
        </button>
        <button
          className={cn(
            'flex items-center justify-center rounded-xl transition-all duration-200',
            'hover:bg-slate-600',
            tool === 'eraser' ? 'ring-2 ring-indigo-500 bg-slate-600' : 'bg-slate-700'
          )}
          style={{ width: 48, height: 48 }}
          onClick={() => setTool('eraser')}
        >
          <Eraser className="w-5 h-5 text-white" />
        </button>
      </div>

      <div className="relative" style={{ marginLeft: toolbarWidth }}>
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="block cursor-crosshair"
          style={{ borderRadius: '0 12px 12px 0' }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        <div
          className="absolute top-3 right-3 flex items-center justify-center text-white text-sm font-medium"
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: 'rgba(99, 102, 241, 0.8)',
          }}
        >
          {onlineCount}
        </div>

        {players
          .filter((p) => !p.id.startsWith('local-'))
          .map((player) => (
            <div
              key={player.id}
              className="absolute pointer-events-none text-xs text-white px-2 py-1 rounded"
              style={{
                left: player.x + toolbarWidth + 12,
                top: player.y - 24,
                backgroundColor: '#1E293B',
                transform: 'translateX(-50%)',
              }}
            >
              {player.name}
            </div>
          ))}

        {isPanelOpen && (
          <div
            className="absolute bottom-4 left-4 rounded-xl p-3"
            style={{
              backgroundColor: 'rgba(30, 41, 59, 0.9)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <div className="flex items-center gap-2 mb-3 flex-wrap" style={{ maxWidth: 280 }}>
              {MAGIC_COLORS.map((color) => (
                <button
                  key={color}
                  className="transition-all duration-200"
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    backgroundColor: color,
                    boxShadow:
                      selectedColor === color
                        ? `0 0 12px ${color}, 0 0 4px ${color}`
                        : 'none',
                    transform: selectedColor === color ? 'scale(1.1)' : 'scale(1)',
                  }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
            <div className="flex items-center gap-3">
              <span className="text-white text-xs whitespace-nowrap">粗细</span>
              <input
                type="range"
                min={2}
                max={20}
                value={brushWidth}
                onChange={(e) => setBrushWidth(Number(e.target.value))}
                className="flex-1 accent-indigo-500"
              />
              <div
                className="rounded-full bg-white"
                style={{ width: brushWidth, height: brushWidth }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
