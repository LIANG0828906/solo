import { useEffect, useRef, useCallback } from 'react'
import { GameEngine } from '../engine/gameEngine'
import { drawCarOnCanvas } from '../engine/carCustomizer'
import { useGameStore } from '../store/useGameStore'
import { usePlayerStore } from '../store/usePlayerStore'
import type { InputState } from '../types'

interface GameCanvasProps {
  width?: number
  height?: number
}

export function GameCanvas({ width = 1280, height = 720 }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const inputRef = useRef<InputState>({
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
  })
  const lastLapRef = useRef(0)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef(0)
  const cameraRef = useRef({ x: 0, y: 0, scale: 1 })

  const { gameStatus, setGameStatus, setLapData, setShowResultPanel, setLastLapStats } =
    useGameStore()
  const { player } = usePlayerStore()

  const initEngine = useCallback(() => {
    if (!engineRef.current) {
      engineRef.current = new GameEngine()
      lastLapRef.current = 0
    }
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        inputRef.current.up = true
        break
      case 's':
      case 'arrowdown':
        inputRef.current.down = true
        break
      case 'a':
      case 'arrowleft':
        inputRef.current.left = true
        break
      case 'd':
      case 'arrowright':
        inputRef.current.right = true
        break
      case ' ':
        inputRef.current.space = true
        e.preventDefault()
        break
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    switch (e.key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        inputRef.current.up = false
        break
      case 's':
      case 'arrowdown':
        inputRef.current.down = false
        break
      case 'a':
      case 'arrowleft':
        inputRef.current.left = false
        break
      case 'd':
      case 'arrowright':
        inputRef.current.right = false
        break
      case ' ':
        inputRef.current.space = false
        break
    }
  }, [])

  const drawTrack = useCallback(
    (ctx: CanvasRenderingContext2D, engine: GameEngine) => {
      const { track } = engine
      const waypoints = track.waypoints

      ctx.fillStyle = '#14532d'
      ctx.fillRect(0, 0, track.worldSize, track.worldSize)

      ctx.fillStyle = '#166534'
      for (let i = 0; i < 50; i++) {
        const x = (i * 137.5) % track.worldSize
        const y = (i * 263.3) % track.worldSize
        const size = 20 + (i % 5) * 10
        ctx.beginPath()
        ctx.arc(x, y, size, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.strokeStyle = '#3d2817'
      ctx.lineWidth = track.width + 20
      ctx.beginPath()
      waypoints.forEach((wp, i) => {
        if (i === 0) ctx.moveTo(wp.x, wp.y)
        else ctx.lineTo(wp.x, wp.y)
      })
      ctx.closePath()
      ctx.stroke()

      ctx.strokeStyle = '#4b5563'
      ctx.lineWidth = track.width
      ctx.beginPath()
      waypoints.forEach((wp, i) => {
        if (i === 0) ctx.moveTo(wp.x, wp.y)
        else ctx.lineTo(wp.x, wp.y)
      })
      ctx.closePath()
      ctx.stroke()

      ctx.strokeStyle = '#6b7280'
      ctx.lineWidth = track.width * 0.85
      ctx.beginPath()
      waypoints.forEach((wp, i) => {
        if (i === 0) ctx.moveTo(wp.x, wp.y)
        else ctx.lineTo(wp.x, wp.y)
      })
      ctx.closePath()
      ctx.stroke()

      ctx.strokeStyle = 'rgba(255,255,255,0.15)'
      ctx.lineWidth = 2
      ctx.setLineDash([20, 20])
      ctx.beginPath()
      waypoints.forEach((wp, i) => {
        if (i === 0) ctx.moveTo(wp.x, wp.y)
        else ctx.lineTo(wp.x, wp.y)
      })
      ctx.closePath()
      ctx.stroke()
      ctx.setLineDash([])

      const segmentLengths: number[] = []
      let totalLength = 0
      for (let i = 0; i < waypoints.length; i++) {
        const wp1 = waypoints[i]
        const wp2 = waypoints[(i + 1) % waypoints.length]
        const len = Math.hypot(wp2.x - wp1.x, wp2.y - wp1.y)
        segmentLengths.push(len)
        totalLength += len
      }

      const kerbSpacing = 30
      let distance = 0
      for (let i = 0; i < waypoints.length; i++) {
        const wp1 = waypoints[i]
        const wp2 = waypoints[(i + 1) % waypoints.length]
        const segLen = segmentLengths[i]

        const angle = Math.atan2(wp2.y - wp1.y, wp2.x - wp1.x)
        const perpAngle = angle + Math.PI / 2
        const halfWidth = track.width / 2

        for (let t = 0; t < 1; t += kerbSpacing / segLen) {
          const x = wp1.x + (wp2.x - wp1.x) * t
          const y = wp1.y + (wp2.y - wp1.y) * t

          const isRed = Math.floor(distance / 15) % 2 === 0
          const color = isRed ? '#ef4444' : '#ffffff'

          const leftX = x + Math.cos(perpAngle) * halfWidth
          const leftY = y + Math.sin(perpAngle) * halfWidth
          const rightX = x - Math.cos(perpAngle) * halfWidth
          const rightY = y - Math.sin(perpAngle) * halfWidth

          ctx.fillStyle = color
          ctx.fillRect(leftX - 7, leftY - 4, 14, 8)
          ctx.fillRect(rightX - 7, rightY - 4, 14, 8)

          distance += kerbSpacing
        }
        distance += segLen % kerbSpacing
      }

      const startWp = waypoints[0]
      const nextWp = waypoints[1]
      const startAngle = Math.atan2(nextWp.y - startWp.y, nextWp.x - startWp.x)
      const perpAngle = startAngle + Math.PI / 2
      const halfWidth = track.width / 2

      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.moveTo(
        startWp.x + Math.cos(perpAngle) * halfWidth,
        startWp.y + Math.sin(perpAngle) * halfWidth
      )
      ctx.lineTo(
        startWp.x - Math.cos(perpAngle) * halfWidth,
        startWp.y - Math.sin(perpAngle) * halfWidth
      )
      ctx.stroke()
    },
    []
  )

  const drawNitroBar = useCallback(
    (ctx: CanvasRenderingContext2D, engine: GameEngine, screenX: number, screenY: number) => {
      const car = engine.car
      const energy = car.nitroEnergy
      const maxRadius = 45

      const gradient = ctx.createRadialGradient(screenX, screenY, 10, screenX, screenY, maxRadius)
      gradient.addColorStop(0, 'rgba(147, 51, 234, 0)')
      gradient.addColorStop(0.5, 'rgba(147, 51, 234, 0.2)')
      gradient.addColorStop(1, 'rgba(147, 51, 234, 0)')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(screenX, screenY, maxRadius, 0, Math.PI * 2)
      ctx.fill()

      const barRadius = 35
      const progress = energy / 100

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.arc(screenX, screenY, barRadius, 0, Math.PI * 2)
      ctx.stroke()

      if (energy > 0) {
        const startAngle = -Math.PI / 2
        const endAngle = startAngle + Math.PI * 2 * progress

        const barGradient = ctx.createLinearGradient(
          screenX - barRadius,
          screenY - barRadius,
          screenX + barRadius,
          screenY + barRadius
        )
        barGradient.addColorStop(0, '#a855f7')
        barGradient.addColorStop(1, '#6366f1')

        ctx.strokeStyle = energy >= 100 ? '#fbbf24' : barGradient
        ctx.lineWidth = 6
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.arc(screenX, screenY, barRadius, startAngle, endAngle)
        ctx.stroke()

        if (energy >= 100) {
          ctx.shadowColor = '#fbbf24'
          ctx.shadowBlur = 15
          ctx.strokeStyle = '#fbbf24'
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(screenX, screenY, barRadius + 3, 0, Math.PI * 2)
          ctx.stroke()
          ctx.shadowBlur = 0
        }
      }
    },
    []
  )

  const drawHUD = useCallback(
    (ctx: CanvasRenderingContext2D, engine: GameEngine, w: number, h: number) => {
      const lapData = engine.getLapData()

      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.beginPath()
      ctx.roundRect(20, 20, 220, 100, 12)
      ctx.fill()

      ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(20, 20, 220, 100, 12)
      ctx.stroke()

      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 18px Orbitron, sans-serif'
      ctx.fillText(`圈数: ${lapData.lap + 1}`, 35, 50)

      ctx.fillStyle = '#a78bfa'
      ctx.font = 'bold 22px Orbitron, sans-serif'
      const timeStr = lapData.lapTime.toFixed(2)
      ctx.fillText(`${timeStr}s`, 35, 82)

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
      ctx.font = '14px Orbitron, sans-serif'
      ctx.fillText(`漂移分: ${lapData.driftScore}`, 35, 105)

      if (lapData.bestLapTime !== null) {
        ctx.fillStyle = '#fbbf24'
        ctx.font = '12px Orbitron, sans-serif'
        ctx.fillText(`最佳: ${lapData.bestLapTime.toFixed(2)}s`, 140, 50)
      }

      const speed = Math.abs(engine.car.speed)
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
      ctx.beginPath()
      ctx.roundRect(w - 140, 20, 120, 60, 12)
      ctx.fill()

      ctx.strokeStyle = 'rgba(147, 51, 234, 0.5)'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(w - 140, 20, 120, 60, 12)
      ctx.stroke()

      ctx.fillStyle = '#22c55e'
      ctx.font = 'bold 24px Orbitron, sans-serif'
      ctx.textAlign = 'right'
      ctx.fillText(`${Math.floor(speed)}`, w - 35, 50)
      ctx.font = '12px Orbitron, sans-serif'
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.fillText('km/h', w - 30, 50)
      ctx.textAlign = 'left'
    },
    []
  )

  const render = useCallback(
    (ctx: CanvasRenderingContext2D, engine: GameEngine, w: number, h: number) => {
      ctx.clearRect(0, 0, w, h)

      const car = engine.car
      const camera = cameraRef.current

      const targetScale = Math.min(w, h) / 800
      camera.scale += (targetScale - camera.scale) * 0.1

      const targetX = car.position.x - w / 2 / camera.scale
      const targetY = car.position.y - h / 2 / camera.scale
      camera.x += (targetX - camera.x) * 0.1
      camera.y += (targetY - camera.y) * 0.1

      ctx.save()
      ctx.scale(camera.scale, camera.scale)
      ctx.translate(-camera.x, -camera.y)

      drawTrack(ctx, engine)

      const particles = engine.particles.getActiveParticles()
      for (const p of particles) {
        const alpha = p.life / p.maxLife
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.position.x, p.position.y, p.size * alpha, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1

      const color = player?.currentCustomization.color || '#ffffff'
      const sticker = player?.currentCustomization.sticker || 'none'
      drawCarOnCanvas(ctx, car.position.x, car.position.y, car.angle, color, sticker, 1)

      const nitroScreenX = car.position.x
      const nitroScreenY = car.position.y + 45
      drawNitroBar(ctx, engine, nitroScreenX, nitroScreenY)

      ctx.restore()

      drawHUD(ctx, engine, w, h)
    },
    [drawTrack, drawNitroBar, drawHUD, player]
  )

  const gameLoop = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      const engine = engineRef.current

      if (!canvas || !ctx || !engine) {
        animationRef.current = requestAnimationFrame(gameLoop)
        return
      }

      const dt = lastTimeRef.current ? (timestamp - lastTimeRef.current) / 1000 : 0.016
      lastTimeRef.current = timestamp

      if (gameStatus === 'racing') {
        engine.update(dt, inputRef.current)

        const lapData = engine.getLapData()
        setLapData({
          status: gameStatus,
          lap: lapData.lap,
          lapTime: lapData.lapTime,
          bestLapTime: lapData.bestLapTime,
          driftScore: lapData.driftScore,
          nitroUses: lapData.nitroUses,
          currentWaypointIndex: engine.currentWaypointIndex,
        })

        if (engine.lap > lastLapRef.current && lastLapRef.current > 0) {
          setLastLapStats({
            time: engine.bestLapTime || engine.lapTime,
            driftScore: engine.driftScore,
            nitroUses: engine.nitroUses,
          })
          setShowResultPanel(true)
          setGameStatus('paused')
        }
        lastLapRef.current = engine.lap
      }

      render(ctx, engine, canvas.width, canvas.height)

      animationRef.current = requestAnimationFrame(gameLoop)
    },
    [gameStatus, render, setGameStatus, setLapData, setLastLapStats, setShowResultPanel]
  )

  useEffect(() => {
    initEngine()

    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = width
      canvas.height = height
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initEngine, handleKeyDown, handleKeyUp, gameLoop, width, height])

  useEffect(() => {
    if (gameStatus === 'racing' && engineRef.current) {
      lastLapRef.current = engineRef.current.lap
    }
  }, [gameStatus])

  return (
    <canvas
      ref={canvasRef}
      className="game-canvas rounded-lg shadow-2xl"
      style={{
        width: '100%',
        height: '100%',
        maxWidth: width,
        maxHeight: height,
      }}
    />
  )
}
