import React, { useRef, useEffect, useCallback, useState } from 'react'
import { useModuleStore, Connection } from '@/store/moduleStore'
import { ModuleCardPanel } from '@/components/ModuleCard'

const CARD_W = 180
const CARD_H = 200

function drawBezierGlow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  glowColor: string,
  pulsePhase: number
) {
  const dx = Math.abs(x2 - x1)
  const cpOffset = Math.max(dx * 0.4, 50)

  ctx.save()

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(x1 + cpOffset, y1, x2 - cpOffset, y2, x2, y2)
  ctx.strokeStyle = glowColor
  ctx.lineWidth = 6
  ctx.shadowColor = glowColor
  ctx.shadowBlur = 12
  ctx.globalAlpha = 0.3 + Math.sin(pulsePhase) * 0.15
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(x1 + cpOffset, y1, x2 - cpOffset, y2, x2, y2)
  ctx.strokeStyle = color
  ctx.lineWidth = 2.5
  ctx.shadowColor = color
  ctx.shadowBlur = 8
  ctx.globalAlpha = 0.8 + Math.sin(pulsePhase) * 0.2
  ctx.stroke()

  const dashOffset = (pulsePhase * 8) % 20
  ctx.beginPath()
  ctx.moveTo(x1, y1)
  ctx.bezierCurveTo(x1 + cpOffset, y1, x2 - cpOffset, y2, x2, y2)
  ctx.setLineDash([4, 8])
  ctx.lineDashOffset = -dashOffset
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 1.2
  ctx.shadowBlur = 4
  ctx.shadowColor = '#ffffff'
  ctx.globalAlpha = 0.6
  ctx.stroke()
  ctx.setLineDash([])

  ctx.restore()
}

function getPortPosition(
  module: { gridX: number; gridY: number },
  direction: 'input' | 'output',
  portIndex: number
): { x: number; y: number } {
  const portSpacing = 30
  const portsTop = module.gridY + CARD_H / 2 - portSpacing
  return {
    x: direction === 'input' ? module.gridX : module.gridX + CARD_W,
    y: portsTop + portIndex * portSpacing,
  }
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

  const modules = useModuleStore((s) => s.modules)
  const connections = useModuleStore((s) => s.connections)
  const wiring = useModuleStore((s) => s.wiring)

  const [panelOffset, setPanelOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    setPanelOffset({ x: rect.left, y: rect.top })

    const handleResize = () => {
      const r = container.getBoundingClientRect()
      setPanelOffset({ x: r.left, y: r.top })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver(() => {
      const r = container.getBoundingClientRect()
      setPanelOffset({ x: r.left, y: r.top })
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, rect.width, rect.height)

    pulseRef.current += 0.03
    const pulse = pulseRef.current

    for (const conn of connections) {
      const sourceMod = modules.find((m) => m.id === conn.sourceModuleId)
      const targetMod = modules.find((m) => m.id === conn.targetModuleId)
      if (!sourceMod || !targetMod) continue

      const src = getPortPosition(sourceMod, 'output', conn.sourcePortIndex)
      const tgt = getPortPosition(targetMod, 'input', conn.targetPortIndex)

      drawBezierGlow(
        ctx,
        src.x - panelOffset.x,
        src.y - panelOffset.y,
        tgt.x - panelOffset.x,
        tgt.y - panelOffset.y,
        '#22d3ee',
        'rgba(34, 211, 238, 0.4)',
        pulse
      )
    }

    if (wiring.active && wiring.sourceModuleId) {
      const sourceMod = modules.find((m) => m.id === wiring.sourceModuleId)
      if (sourceMod) {
        const src = getPortPosition(sourceMod, 'output', wiring.sourcePortIndex)
        drawBezierGlow(
          ctx,
          src.x - panelOffset.x,
          src.y - panelOffset.y,
          wiring.mouseX - panelOffset.x,
          wiring.mouseY - panelOffset.y,
          '#7c3aed',
          'rgba(124, 58, 237, 0.4)',
          pulse
        )
      }
    }

    animFrameRef.current = requestAnimationFrame(draw)
  }, [modules, connections, wiring, panelOffset])

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
        style={{ zIndex: 10 }}
      />

      <div className="absolute inset-0" style={{ zIndex: 5 }}>
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
    </div>
  )
}
