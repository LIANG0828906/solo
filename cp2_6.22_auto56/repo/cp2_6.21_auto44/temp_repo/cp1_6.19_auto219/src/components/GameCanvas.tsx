import { useEffect, useRef } from 'react'
import { useGameStore, LANE_POSITIONS, PLAYER_Y_BASE } from '../store/gameStore'

const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 500
const PLAYER_SIZE = 16

export const GameCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const scrollOffsetRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = (time: number) => {
      const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = time

      const state = useGameStore.getState()
      const { gameState, speed, obstacles, particles, notes, fireworks, currentLane, playerY, walkFrame, jumpRotation, isClearEffect, clearEffectProgress, screenFlash } = state

      if (gameState === 'playing') {
        scrollOffsetRef.current = (scrollOffsetRef.current + speed * deltaTime) % 40
      }

      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      const centerX = CANVAS_WIDTH / 2

      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 2
      ctx.setLineDash([10, 10])

      for (let i = 0; i < 4; i++) {
        const x = centerX + LANE_POSITIONS[0] - 40 + i * 80
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, CANVAS_HEIGHT)
        ctx.lineDashOffset = -scrollOffsetRef.current
        ctx.stroke()
      }

      ctx.setLineDash([])

      obstacles.forEach((obstacle) => {
        if (obstacle.hit) return
        const x = centerX + LANE_POSITIONS[obstacle.lane]
        ctx.globalAlpha = obstacle.opacity

        if (obstacle.type === 'note') {
          ctx.fillStyle = obstacle.color
          ctx.fillRect(x - 12, obstacle.y - 12, 24, 24)
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(x - 6, obstacle.y - 8, 3, 10)
          ctx.fillRect(x + 3, obstacle.y - 6, 3, 8)
        } else if (obstacle.type === 'beam') {
          ctx.fillStyle = obstacle.color
          ctx.fillRect(x - 1, obstacle.y - 25, 2, 50)
        } else if (obstacle.type === 'block') {
          ctx.fillStyle = obstacle.color
          ctx.fillRect(x - 16, obstacle.y - 16, 32, 32)
          ctx.fillStyle = 'rgba(255,255,255,0.4)'
          ctx.fillRect(x - 16, obstacle.y - 16, 32, 10)
        }

        ctx.globalAlpha = 1
      })

      const playerX = centerX + LANE_POSITIONS[currentLane]
      const drawPlayerY = PLAYER_Y_BASE + playerY

      ctx.save()
      ctx.translate(playerX, drawPlayerY)
      ctx.rotate((jumpRotation * Math.PI) / 180)

      ctx.fillStyle = '#4A90D9'
      ctx.fillRect(-PLAYER_SIZE / 2, -PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE)

      ctx.fillStyle = '#FFFFFF'
      ctx.fillRect(-5, -12, 4, 4)
      ctx.fillRect(2, -12, 4, 4)

      ctx.fillStyle = '#1E3A5F'
      if (walkFrame === 0) {
        ctx.fillRect(-6, 0, 4, 8)
        ctx.fillRect(2, 0, 4, 5)
      } else {
        ctx.fillRect(-6, 0, 4, 5)
        ctx.fillRect(2, 0, 4, 8)
      }

      ctx.restore()

      notes.forEach((note) => {
        if (!note.collected) {
          const noteX = centerX + note.x
          const noteY = note.y
          ctx.fillStyle = '#FFD700'
          ctx.fillRect(noteX - 5, noteY - 5, 10, 10)
          ctx.fillStyle = '#FFFACD'
          ctx.fillRect(noteX - 2, noteY - 2, 4, 4)
        }
      })

      particles.forEach((p) => {
        ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
        ctx.fillStyle = p.color
        const px = centerX + p.x
        ctx.fillRect(px - p.size / 2, p.y - p.size / 2, p.size, p.size)
      })
      ctx.globalAlpha = 1

      fireworks.forEach((fw) => {
        if (!fw.exploded) {
          const fwx = centerX + fw.x
          ctx.fillStyle = fw.color
          ctx.fillRect(fwx - 3, fw.y - 8, 6, 16)
          ctx.fillStyle = '#FFFF00'
          ctx.fillRect(fwx - 2, fw.y + 4, 4, 8)
        } else {
          fw.particles.forEach((p) => {
            ctx.globalAlpha = Math.max(0, p.life / p.maxLife)
            ctx.fillStyle = p.color
            const px = centerX + p.x
            ctx.fillRect(px - p.size / 2, p.y - p.size / 2, p.size, p.size)
          })
        }
      })
      ctx.globalAlpha = 1

      if (isClearEffect) {
        const radius = clearEffectProgress * Math.max(CANVAS_WIDTH, CANVAS_HEIGHT)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
        ctx.lineWidth = 6
        ctx.beginPath()
        ctx.arc(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, radius, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (screenFlash > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${screenFlash * 0.4})`
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      }

      animationFrameRef.current = requestAnimationFrame(render)
    }

    lastTimeRef.current = performance.now()
    animationFrameRef.current = requestAnimationFrame(render)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        imageRendering: 'pixelated',
        border: '2px solid #222',
        display: 'block',
      }}
    />
  )
}
