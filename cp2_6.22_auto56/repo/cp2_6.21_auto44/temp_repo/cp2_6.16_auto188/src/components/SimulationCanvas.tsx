import { useRef, useEffect, useCallback } from 'react'
import { useGameStore } from '../store/gameStore'
import { getOrbitalParameters, isInOrbit, vectorMagnitude } from '../engine/physics'
import { getTargetOrbitRadius } from '../engine/orbitUtils'

export default function SimulationCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const successCheckRef = useRef<boolean>(false)
  const orbitAnimationRef = useRef<number>(0)

  const {
    mode,
    phase,
    targetOrbitType,
    zoom,
    planets,
    satellite,
    asteroids,
    particles,
    isTransitioning,
    launchPad,
    dragEnd,
    showSuccessMessage,
    update,
    addParticles,
    startDrag,
    updateDrag,
    endDrag,
  } = useGameStore()

  const storeRef = useRef(useGameStore.getState())
  useEffect(() => {
    storeRef.current = useGameStore.getState()
  })

  const drawStars = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const starCount = 200
    for (let i = 0; i < starCount; i++) {
      const x = ((i * 137.5) % width)
      const y = ((i * 239.3) % height)
      const size = (i % 3) * 0.5 + 0.5
      const brightness = 0.3 + (i % 5) * 0.15
      ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [])

  const drawAsteroids = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    currentZoom: number
  ) => {
    for (const asteroid of asteroids) {
      const x = centerX + asteroid.position.x * currentZoom
      const y = centerY + asteroid.position.y * currentZoom
      ctx.fillStyle = '#666666'
      ctx.beginPath()
      ctx.arc(x, y, asteroid.size * currentZoom, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [asteroids])

  const drawPlanet = useCallback((
    ctx: CanvasRenderingContext2D,
    planet: typeof planets[0],
    centerX: number,
    centerY: number,
    currentZoom: number
  ) => {
    const x = centerX + planet.position.x * currentZoom
    const y = centerY + planet.position.y * currentZoom
    const radius = planet.radius * currentZoom

    const gradient = ctx.createRadialGradient(x, y, radius * 0.3, x, y, radius * 1.5)
    gradient.addColorStop(0, planet.color + '40')
    gradient.addColorStop(1, planet.color + '00')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = planet.color
    ctx.shadowColor = planet.color
    ctx.shadowBlur = 20
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    if (planet.label) {
      ctx.fillStyle = '#00F0FF'
      ctx.font = `${12 * currentZoom}px 'JetBrains Mono', monospace`
      ctx.textAlign = 'center'
      ctx.fillText(planet.label, x, y + radius + 20 * currentZoom)
    }
  }, [])

  const drawTargetOrbit = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    currentZoom: number,
    time: number
  ) => {
    const primary = planets.find(p => p.type === 'primary')
    if (!primary) return

    const radius = getTargetOrbitRadius(targetOrbitType) * currentZoom
    const px = centerX + primary.position.x * currentZoom
    const py = centerY + primary.position.y * currentZoom

    const animationProgress = (time % 2000) / 2000
    const startAngle = -Math.PI / 2
    const endAngle = startAngle + Math.PI * 2 * animationProgress

    ctx.strokeStyle = '#00F0FF80'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 8])
    ctx.lineDashOffset = -animationProgress * 30
    ctx.beginPath()
    ctx.arc(px, py, radius, startAngle, endAngle)
    ctx.stroke()
    ctx.setLineDash([])
  }, [planets, targetOrbitType])

  const drawSatellite = useCallback((
    ctx: CanvasRenderingContext2D,
    sat: typeof satellite,
    centerX: number,
    centerY: number,
    currentZoom: number,
    time: number
  ) => {
    if (!sat) return

    const x = centerX + sat.position.x * currentZoom
    const y = centerY + sat.position.y * currentZoom

    if (sat.trail.length > 1) {
      ctx.strokeStyle = '#00F0FF40'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      const startX = centerX + sat.trail[0].x * currentZoom
      const startY = centerY + sat.trail[0].y * currentZoom
      ctx.moveTo(startX, startY)
      for (let i = 1; i < sat.trail.length; i++) {
        const tx = centerX + sat.trail[i].x * currentZoom
        const ty = centerY + sat.trail[i].y * currentZoom
        ctx.lineTo(tx, ty)
      }
      ctx.stroke()
    }

    const flash = phase === 'aiming' ? (Math.sin(time * 0.01) > 0 ? 1 : 0.5) : 1

    ctx.fillStyle = `rgba(0, 240, 255, ${flash})`
    ctx.shadowColor = '#00F0FF'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(x, y, 5 * currentZoom, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = '#00F0FF'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(x - 8 * currentZoom, y)
    ctx.lineTo(x + 8 * currentZoom, y)
    ctx.moveTo(x, y - 8 * currentZoom)
    ctx.lineTo(x, y + 8 * currentZoom)
    ctx.stroke()
  }, [phase])

  const drawParticles = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    currentZoom: number
  ) => {
    for (const particle of particles) {
      const alpha = particle.life / particle.maxLife
      const x = centerX + particle.position.x * currentZoom
      const y = centerY + particle.position.y * currentZoom

      ctx.fillStyle = particle.color + Math.floor(alpha * 255).toString(16).padStart(2, '0')
      ctx.shadowColor = particle.color
      ctx.shadowBlur = 5
      ctx.beginPath()
      ctx.arc(x, y, particle.size * currentZoom * alpha, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.shadowBlur = 0
  }, [particles])

  const drawAimLine = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    currentZoom: number
  ) => {
    if (phase !== 'aiming' || !dragEnd) return

    const startX = centerX + launchPad.x * currentZoom
    const startY = centerY + launchPad.y * currentZoom
    const endX = centerX + dragEnd.x * currentZoom
    const endY = centerY + dragEnd.y * currentZoom

    const dirX = startX - endX
    const dirY = startY - endY
    const len = Math.sqrt(dirX * dirX + dirY * dirY)
    const maxLen = 200 * currentZoom
    const scale = Math.min(len / maxLen, 1)
    const arrowLen = 15 * currentZoom

    const arrowEndX = startX + (dirX / len) * Math.min(len * 1.5, maxLen * 2)
    const arrowEndY = startY + (dirY / len) * Math.min(len * 1.5, maxLen * 2)

    ctx.strokeStyle = `rgba(255, 60, 0, ${0.5 + scale * 0.5})`
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(startX, startY)
    ctx.lineTo(arrowEndX, arrowEndY)
    ctx.stroke()
    ctx.setLineDash([])

    const angle = Math.atan2(arrowEndY - startY, arrowEndX - startX)
    ctx.fillStyle = '#FF3C00'
    ctx.beginPath()
    ctx.moveTo(arrowEndX, arrowEndY)
    ctx.lineTo(
      arrowEndX - arrowLen * Math.cos(angle - Math.PI / 6),
      arrowEndY - arrowLen * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      arrowEndX - arrowLen * Math.cos(angle + Math.PI / 6),
      arrowEndY - arrowLen * Math.sin(angle + Math.PI / 6)
    )
    ctx.closePath()
    ctx.fill()
  }, [phase, dragEnd, launchPad])

  const drawLaunchPad = useCallback((
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    currentZoom: number
  ) => {
    const x = centerX + launchPad.x * currentZoom
    const y = centerY + launchPad.y * currentZoom

    ctx.fillStyle = '#2A2A3A'
    ctx.strokeStyle = '#00F0FF'
    ctx.lineWidth = 2
    ctx.shadowColor = '#00F0FF'
    ctx.shadowBlur = 10

    const padWidth = 40 * currentZoom
    const padHeight = 15 * currentZoom
    ctx.fillRect(x - padWidth / 2, y, padWidth, padHeight)
    ctx.strokeRect(x - padWidth / 2, y, padWidth, padHeight)

    ctx.shadowBlur = 0

    if (phase === 'idle') {
      ctx.fillStyle = '#00F0FF'
      ctx.beginPath()
      ctx.arc(x, y - 5 * currentZoom, 6 * currentZoom, 0, Math.PI * 2)
      ctx.fill()
    }
  }, [launchPad, phase])

  const render = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number, time: number) => {
    const centerX = width / 2
    const centerY = height / 2
    const currentZoom = zoom

    ctx.fillStyle = '#0B0E14'
    ctx.fillRect(0, 0, width, height)

    drawStars(ctx, width, height)
    drawAsteroids(ctx, centerX, centerY, currentZoom)

    drawTargetOrbit(ctx, centerX, centerY, currentZoom, time)

    for (const planet of planets) {
      drawPlanet(ctx, planet, centerX, centerY, currentZoom)
    }

    drawLaunchPad(ctx, centerX, centerY, currentZoom)
    drawAimLine(ctx, centerX, centerY, currentZoom)
    drawSatellite(ctx, satellite, centerX, centerY, currentZoom, time)
    drawParticles(ctx, centerX, centerY, currentZoom)

    if (isTransitioning) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
      ctx.fillRect(0, 0, width, height)
    }
  }, [zoom, planets, satellite, asteroids, particles, isTransitioning, drawStars, drawAsteroids, drawTargetOrbit, drawPlanet, drawLaunchPad, drawAimLine, drawSatellite, drawParticles])

  const gameLoop = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05)
    lastTimeRef.current = timestamp

    const state = storeRef.current
    if (state.phase === 'launched' && state.satellite) {
      update(deltaTime)

      const primary = state.planets.find(p => p.type === 'primary')
      if (primary && state.satellite && !successCheckRef.current) {
        const currentSat = useGameStore.getState().satellite
        if (currentSat) {
          const inOrbit = isInOrbit(currentSat, primary, state.targetOrbitType)
          if (inOrbit) {
            successCheckRef.current = true
            addParticles(currentSat.position, 20, '#FFD700')
            useGameStore.setState({
              phase: 'success',
              showSuccessMessage: true,
              score: state.score + 1000,
            })
            setTimeout(() => {
              useGameStore.setState({ showSuccessMessage: false })
            }, 2000)
          }
        }
      }
    }

    render(ctx, canvas.width, canvas.height, timestamp)
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [update, render, addParticles])

  useEffect(() => {
    successCheckRef.current = false
  }, [phase, targetOrbitType])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    lastTimeRef.current = performance.now()
    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [gameLoop])

  const getWorldPosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }

    const rect = canvas.getBoundingClientRect()
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const currentZoom = useGameStore.getState().zoom

    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top

    return {
      x: (screenX - centerX) / currentZoom,
      y: (screenY - centerY) / currentZoom,
    }
  }, [])

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getWorldPosition(e)
    const state = useGameStore.getState()
    const dist = Math.sqrt(
      Math.pow(pos.x - state.launchPad.x, 2) +
      Math.pow(pos.y - state.launchPad.y, 2)
    )
    if (dist < 50 && state.phase === 'idle') {
      startDrag(pos)
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getWorldPosition(e)
    updateDrag(pos)
  }

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getWorldPosition(e)
    endDrag(pos)
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        cursor: phase === 'idle' ? 'pointer' : 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    />
  )
}
