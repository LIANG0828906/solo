import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useModuleStore, SynthModule } from '@/store/moduleStore'
import { ModuleCardPanel, CARD_WIDTH, CARD_HEIGHT } from '@/components/ModuleCard'

const PORT_SPACING = 30
const PORT_TOP_OFFSET = -PORT_SPACING

function getPortLocal(
  mod: { gridX: number; gridY: number },
  direction: 'input' | 'output',
  portIndex: number
): { x: number; y: number } {
  const centerY = mod.gridY + CARD_HEIGHT / 2
  const y = centerY + PORT_TOP_OFFSET + portIndex * PORT_SPACING
  const x = direction === 'input' ? mod.gridX : mod.gridX + CARD_WIDTH
  return { x, y }
}

export function getGlobalPortPosition(
  mod: SynthModule,
  direction: 'input' | 'output',
  portIndex: number,
  containerRect: { left: number; top: number }
) {
  const local = getPortLocal(mod, direction, portIndex)
  return {
    x: local.x + containerRect.left,
    y: local.y + containerRect.top,
  }
}

function bezierPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { cp1x: number; cp1y: number; cp2x: number; cp2y: number } {
  const dx = Math.abs(x2 - x1)
  const offset = Math.max(dx * 0.5, 60)
  return {
    cp1x: x1 + offset,
    cp1y: y1,
    cp2x: x2 - offset,
    cp2y: y2,
  }
}

interface DrawWireArgs {
  ctx: CanvasRenderingContext2D
  x1: number
  y1: number
  x2: number
  y2: number
  pulse: number
  isActive?: boolean
  accent?: string
  glowAccent?: string
}

function drawWire({ ctx, x1, y1, x2, y2, pulse, isActive = true, accent = '#22d3ee', glowAccent = 'rgba(34,211,238,0.45)' }: DrawWireArgs) {
  const { cp1x, cp1y, cp2x, cp2y } = bezierPoints(x1, y1, x2, y2)

  ctx.save()

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2)
  ctx.strokeStyle = glowAccent
  ctx.lineWidth = 8
  ctx.lineCap = 'round'
  ctx.shadowColor = glowAccent
  ctx.shadowBlur = 20
  ctx.globalAlpha = 0.35 + Math.sin(pulse) * 0.1
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x2, y2)
  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  ctx.shadowColor = accent
  ctx.shadowBlur = 10
  ctx.globalAlpha = isActive ? 0.9 + Math.sin(pulse * 1.3) * 0.1 : 0.6
  ctx.stroke()

  if (isActive) {
    const totalLen = estimateBezierLength(x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2)
    const dotsCount = Math.max(2, Math.floor(totalLen / 120))
    for (let i = 0; i < dotsCount; i++) {
      const baseT = (i / dotsCount + (pulse * 0.08) % 1) % 1
      const { x: dx, y: dy } = evaluateBezier(baseT, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2)
      ctx.beginPath()
      ctx.arc(dx, dy, 3, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.shadowColor = accent
      ctx.shadowBlur = 10
      ctx.globalAlpha = 0.9
      ctx.fill()

      ctx.beginPath()
      ctx.arc(dx, dy, 5, 0, Math.PI * 2)
      const grad = ctx.createRadialGradient(dx, dy, 0, dx, dy, 7)
      grad.addColorStop(0, 'rgba(255,255,255,0.6)')
      grad.addColorStop(1, 'rgba(34,211,238,0)')
      ctx.fillStyle = grad
      ctx.globalAlpha = 0.7
      ctx.shadowBlur = 0
      ctx.fill()
    }
  }

  ctx.beginPath()
  ctx.arc(x1, y1, 3.5, 0, Math.PI * 2)
  ctx.fillStyle = '#7c3aed'
  ctx.shadowColor = '#7c3aed'
  ctx.shadowBlur = 10
  ctx.globalAlpha = 1
  ctx.fill()

  ctx.beginPath()
  ctx.arc(x2, y2, 3.5, 0, Math.PI * 2)
  ctx.fillStyle = accent
  ctx.shadowColor = accent
  ctx.shadowBlur = 10
  ctx.fill()

  ctx.restore()
}

function estimateBezierLength(x1: number, y1: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x2: number, y2: number): number {
  let len = 0
  let prevX = x1
  let prevY = y1
  const STEPS = 30
  for (let i = 1; i <= STEPS; i++) {
    const t = i / STEPS
    const { x, y } = evaluateBezier(t, x1, y1, cp1x, cp1y, cp2x, cp2y, x2, y2)
    const dx = x - prevX
    const dy = y - prevY
    len += Math.sqrt(dx * dx + dy * dy)
    prevX = x
    prevY = y
  }
  return len
}

function evaluateBezier(t: number, x1: number, y1: number, cp1x: number, cp1y: number, cp2x: number, cp2y: number, x2: number, y2: number) {
  const u = 1 - t
  const u2 = u * u
  const u3 = u2 * u
  const t2 = t * t
  const t3 = t2 * t
  const x = u3 * x1 + 3 * u2 * t * cp1x + 3 * u * t2 * cp2x + t3 * x2
  const y = u3 * y1 + 3 * u2 * t * cp1y + 3 * u * t2 * cp2y + t3 * y2
  return { x, y }
}

interface WirePanelProps {
  onModuleDragStart: (moduleId: string, e: React.MouseEvent) => void
  onModuleDrag: (moduleId: string, e: React.MouseEvent) => void
  onModuleDragEnd: (moduleId: string) => void
  onPortMouseDown: (moduleId: string, direction: 'input' | 'output', portIndex: number, e: React.MouseEvent) => void
}

export const WirePanel: React.FC<WirePanelProps> = ({
  onModuleDragStart,
  onModuleDrag,
  onModuleDragEnd,
  onPortMouseDown,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animFrameRef = useRef<number>(0)
  const pulseRef = useRef<number>(0)
  const rectRef = useRef<{ left: number; top: number; width: number; height: number }>({ left: 0, top: 0, width: 0, height: 0 })

  const modules = useModuleStore((s) => s.modules)
  const connections = useModuleStore((s) => s.connections)
  const wiring = useModuleStore((s) => s.wiring)
  const isPlaying = useModuleStore((s) => s.isPlaying)

  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 })

  const updateRect = useCallback(() => {
    const c = containerRef.current
    if (!c) return
    const r = c.getBoundingClientRect()
    rectRef.current = { left: r.left, top: r.top, width: r.width, height: r.height }
    setPanelOffset({ x: r.left, y: r.top })
  }, [])

  useEffect(() => {
    updateRect()
    const handle = () => updateRect()
    window.addEventListener('resize', handle)
    window.addEventListener('scroll', handle, true)

    const container = containerRef.current
    let ro: ResizeObserver | null = null
    if (container && 'ResizeObserver' in window) {
      ro = new ResizeObserver(handle)
      ro.observe(container)
    }
    return () => {
      window.removeEventListener('resize', handle)
      window.removeEventListener('scroll', handle, true)
      if (ro) ro.disconnect()
    }
  }, [updateRect])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) {
      animFrameRef.current = requestAnimationFrame(draw)
      return
    }

    const { width, height } = rectRef.current
    if (width <= 0 || height <= 0) {
      updateRect()
      animFrameRef.current = requestAnimationFrame(draw)
      return
    }

    const dpr = window.devicePixelRatio || 1
    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = width + 'px'
      canvas.style.height = height + 'px'
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      animFrameRef.current = requestAnimationFrame(draw)
      return
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, width, height)

    pulseRef.current += 0.04
    const pulse = pulseRef.current

    for (const conn of connections) {
      const sMod = modules.find((m) => m.id === conn.sourceModuleId)
      const tMod = modules.find((m) => m.id === conn.targetModuleId)
      if (!sMod || !tMod) continue

      const s = getPortLocal(sMod, 'output', conn.sourcePortIndex)
      const t = getPortLocal(tMod, 'input', conn.targetPortIndex)

      const sActivated = sMod.activated && isPlaying
      const tActivated = tMod.activated && isPlaying
      const accent = sActivated || tActivated
        ? '#22d3ee'
        : '#22d3ee'
      const glow = sActivated || tActivated
        ? 'rgba(34,211,238,0.55)'
        : 'rgba(34,211,238,0.35)'

      drawWire({
        ctx,
        x1: s.x,
        y1: s.y,
        x2: t.x,
        y2: t.y,
        pulse,
        isActive: sActivated || tActivated || !isPlaying,
        accent,
        glowAccent: glow,
      })
    }

    if (wiring.active && wiring.sourceModuleId) {
      const sMod = modules.find((m) => m.id === wiring.sourceModuleId)
      if (sMod) {
        const s = getPortLocal(sMod, 'output', wiring.sourcePortIndex)
        const tx = wiring.mouseX - panelOffset.x
        const ty = wiring.mouseY - panelOffset.y

        drawWire({
          ctx,
          x1: s.x,
          y1: s.y,
          x2: tx,
          y2: ty,
          pulse,
          isActive: true,
          accent: '#7c3aed',
          glowAccent: 'rgba(124,58,237,0.55)',
        })
      }
    }

    animFrameRef.current = requestAnimationFrame(draw)
  }, [modules, connections, wiring, panelOffset, isPlaying, updateRect])

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(animFrameRef.current)
  }, [draw])

  return (
    <div
      ref={containerRef}
      className="relative flex-1 wire-panel-grid overflow-hidden"
      style={{ background: '#0f0f1b' }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 8 }}
      />

      <div className="absolute inset-0" style={{ zIndex: 6 }}>
        {modules.map((mod) => (
          <ModuleCardPanel
            key={mod.id}
            module={mod}
            panelOffset={panelOffset}
            onPortMouseDown={onPortMouseDown}
            onModuleDragStart={onModuleDragStart}
            onModuleDrag={onModuleDrag}
            onModuleDragEnd={onModuleDragEnd}
          />
        ))}
      </div>

      {modules.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4 }}>
          <div className="text-center px-8">
            <div className="text-6xl mb-4 opacity-20">⋎</div>
            <div className="font-display text-xl text-slate-600 mb-2">拖拽模块到此处开始创作</div>
            <div className="font-mono text-xs text-slate-700">从左侧模块库选择振荡器、滤波器等元件 → 拖入面板 → 连线并播放</div>
          </div>
        </div>
      )}
    </div>
  )
}
