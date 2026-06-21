import React, { useEffect, useRef, useCallback } from 'react'
import { GameEngine } from '../game/GameEngine'
import { Entity, EntityManager } from '../game/EntityManager'

interface GameCanvasProps {
  engine: GameEngine
  onStart: () => void
}

const CANVAS_WIDTH = 1000
const CANVAS_HEIGHT = 600
const GROUND_Y = 500

export const GameCanvas: React.FC<GameCanvasProps> = ({ engine, onStart }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const entityManagerRef = useRef<EntityManager | null>(null)
  const lastBlinkTime = useRef(0)
  const showBlinkText = useRef(true)

  useEffect(() => {
    entityManagerRef.current = engine.getEntityManager()
    entityManagerRef.current.generateInitialSegments()
  }, [engine])

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      0,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH
    )
    gradient.addColorStop(0, '#1a0a2e')
    gradient.addColorStop(1, '#0a0a1a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    const entityManager = entityManagerRef.current
    if (entityManager) {
      const bgSprites = entityManager.getBackgroundSprites()
      for (const bg of bgSprites) {
        if (bg.x > CANVAS_WIDTH + 100 || bg.x + bg.width < -100) continue
        ctx.fillStyle = (bg.data?.color as string) || 'rgba(30, 20, 60, 0.6)'
        ctx.fillRect(bg.x, bg.y, bg.width, bg.height)

        ctx.fillStyle = 'rgba(0, 240, 255, 0.3)'
        for (let wy = bg.y + 10; wy < bg.y + bg.height - 10; wy += 20) {
          for (let wx = bg.x + 8; wx < bg.x + bg.width - 8; wx += 15) {
            if (Math.random() > 0.3) {
              ctx.fillRect(wx, wy, 6, 8)
            }
          }
        }
      }
    }
  }, [])

  const drawBuilding = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 100 || entity.x + entity.width < -100) return

    const color = (entity.data?.color as string) || '#2a1a4a'
    ctx.fillStyle = color
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)

    ctx.fillStyle = '#00f0ff'
    ctx.fillRect(entity.x, entity.y, entity.width, 3)

    ctx.fillStyle = 'rgba(0, 240, 255, 0.4)'
    for (let wy = entity.y + 15; wy < entity.y + entity.height - 10; wy += 25) {
      for (let wx = entity.x + 15; wx < entity.x + entity.width - 15; wx += 30) {
        if (Math.random() > 0.2) {
          ctx.fillRect(wx, wy, 12, 16)
        }
      }
    }

    ctx.fillStyle = '#1a0525'
    ctx.fillRect(entity.x, entity.y + entity.height, entity.width, 5)
  }, [])

  const drawStreetDecor = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 100 || entity.x + entity.width < -100) return

    const decorType = entity.data?.decorType as string

    if (decorType === 'lamp') {
      ctx.fillStyle = '#333'
      ctx.fillRect(entity.x + 3, entity.y, 2, entity.height)

      ctx.fillStyle = '#00f0ff'
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(entity.x + 4, entity.y - 5, 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = 'rgba(0, 240, 255, 0.1)'
      ctx.beginPath()
      ctx.moveTo(entity.x - 20, entity.y)
      ctx.lineTo(entity.x + 28, entity.y)
      ctx.lineTo(entity.x + 8, entity.y + 50)
      ctx.lineTo(entity.x, entity.y + 50)
      ctx.closePath()
      ctx.fill()
    } else if (decorType === 'trash') {
      ctx.fillStyle = '#444'
      ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
      ctx.fillStyle = '#555'
      ctx.fillRect(entity.x - 2, entity.y - 3, entity.width + 4, 5)
    }
  }, [])

  const drawPlatform = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 100 || entity.x + entity.width < -100) return

    ctx.fillStyle = '#3a2a5a'
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)

    ctx.fillStyle = '#ff00aa'
    ctx.fillRect(entity.x, entity.y, entity.width, 2)
    ctx.fillRect(entity.x, entity.y + entity.height - 2, entity.width, 2)

    ctx.fillStyle = 'rgba(255, 0, 170, 0.3)'
    ctx.shadowColor = '#ff00aa'
    ctx.shadowBlur = 10
    ctx.fillRect(entity.x - 2, entity.y - 2, entity.width + 4, entity.height + 4)
    ctx.shadowBlur = 0
  }, [])

  const drawWindowObstacle = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 100 || entity.x + entity.width < -100) return

    ctx.fillStyle = '#0a0a1a'
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)

    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 3
    ctx.shadowColor = '#00ff00'
    ctx.shadowBlur = 10
    ctx.strokeRect(entity.x, entity.y, entity.width, entity.height)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#00ff00'
    ctx.beginPath()
    ctx.moveTo(entity.x + entity.width / 2, entity.y + 5)
    ctx.lineTo(entity.x + entity.width / 2, entity.y + entity.height - 5)
    ctx.moveTo(entity.x + 5, entity.y + entity.height / 2)
    ctx.lineTo(entity.x + entity.width - 5, entity.y + entity.height / 2)
    ctx.stroke()
  }, [])

  const drawACObstacle = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 100 || entity.x + entity.width < -100) return

    const hit = entity.data?.hit as boolean
    const baseColor = hit ? '#555' : '#888'

    ctx.fillStyle = baseColor
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)

    ctx.fillStyle = hit ? '#444' : '#666'
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(entity.x + 5, entity.y + 5 + i * 10, entity.width - 10, 5)
    }

    ctx.strokeStyle = '#00f0ff'
    ctx.lineWidth = 2
    ctx.strokeRect(entity.x, entity.y, entity.width, entity.height)

    if (hit) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'
      ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
    }
  }, [])

  const drawGapObstacle = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 100 || entity.x + entity.width < -100) return

    ctx.fillStyle = '#000'
    ctx.fillRect(entity.x, GROUND_Y, entity.width, CANVAS_HEIGHT - GROUND_Y)

    ctx.fillStyle = 'rgba(255, 0, 170, 0.3)'
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(entity.x + i * 40, GROUND_Y - 10, 30, 5)
    }

    ctx.fillStyle = '#ff00aa'
    ctx.beginPath()
    ctx.moveTo(entity.x - 5, GROUND_Y)
    ctx.lineTo(entity.x, GROUND_Y - 15)
    ctx.lineTo(entity.x + 5, GROUND_Y)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(entity.x + entity.width - 5, GROUND_Y)
    ctx.lineTo(entity.x + entity.width, GROUND_Y - 15)
    ctx.lineTo(entity.x + entity.width + 5, GROUND_Y)
    ctx.closePath()
    ctx.fill()
  }, [])

  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 100 || entity.x + entity.width < -100) return

    const rotation = ((entity.data?.rotation as number) || 0) + 0.1
    ;(entity.data as Record<string, unknown>).rotation = rotation

    const centerX = entity.x + entity.width / 2
    const centerY = entity.y + entity.height / 2
    const scaleX = Math.abs(Math.cos(rotation))

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(scaleX, 1)

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 10)
    gradient.addColorStop(0, '#ffff00')
    gradient.addColorStop(0.7, '#ffcc00')
    gradient.addColorStop(1, '#ff9900')

    ctx.fillStyle = gradient
    ctx.shadowColor = '#ffff00'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(0, 0, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.fillStyle = '#ffcc00'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('$', 0, 0)

    ctx.restore()
  }, [])

  const drawSpeedBoost = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 100 || entity.x + entity.width < -100) return

    const used = entity.data?.used as boolean
    if (used) return

    const time = Date.now() / 200
    const glow = 0.5 + 0.3 * Math.sin(time)

    ctx.fillStyle = `rgba(0, 240, 255, ${glow})`
    ctx.shadowColor = '#00f0ff'
    ctx.shadowBlur = 20
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#00f0ff'
    for (let i = 0; i < 4; i++) {
      const arrowX = entity.x + 10 + i * 18
      ctx.beginPath()
      ctx.moveTo(arrowX, entity.y + 2)
      ctx.lineTo(arrowX + 10, entity.y + 4)
      ctx.lineTo(arrowX, entity.y + 6)
      ctx.closePath()
      ctx.fill()
    }
  }, [])

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    const playerData = entity.data as Record<string, unknown>
    const animFrame = (playerData.animFrame as number) || 0
    const isOnGround = playerData.isOnGround as boolean

    const x = entity.x
    const y = entity.y

    ctx.save()

    if (entity.velocityY < -5) {
      ctx.translate(x + entity.width / 2, y + entity.height / 2)
      ctx.rotate(-0.2)
      ctx.translate(-(x + entity.width / 2), -(y + entity.height / 2))
    }

    ctx.fillStyle = '#ff00aa'
    ctx.fillRect(x + 8, y + 4, 16, 16)

    ctx.fillStyle = '#ffcc99'
    ctx.fillRect(x + 10, y - 4, 12, 10)

    ctx.fillStyle = '#000'
    ctx.fillRect(x + 12, y - 1, 2, 2)
    ctx.fillRect(x + 18, y - 1, 2, 2)

    ctx.fillStyle = '#00f0ff'
    ctx.fillRect(x + 10, y - 6, 12, 3)

    const legOffset = isOnGround ? [0, 4, 0, -4][animFrame] : 2
    ctx.fillStyle = '#333'
    ctx.fillRect(x + 10, y + 20, 5, 18 + legOffset)
    ctx.fillRect(x + 17, y + 20, 5, 18 - legOffset)

    ctx.fillStyle = '#555'
    ctx.fillRect(x + 8, y + 38 + Math.max(0, legOffset), 8, 6)
    ctx.fillRect(x + 16, y + 38 - Math.max(0, legOffset), 8, 6)

    ctx.fillStyle = '#ff00aa'
    const armOffset = isOnGround ? [2, 0, -2, 0][animFrame] : -5
    ctx.fillRect(x + 4, y + 6 + armOffset, 4, 12)
    ctx.fillRect(x + 24, y + 6 - armOffset, 4, 12)

    ctx.fillStyle = '#000'
    ctx.fillRect(x + 6, y + 44 + Math.max(0, legOffset), 12, 4)
    ctx.fillRect(x + 14, y + 44 - Math.max(0, legOffset), 12, 4)

    ctx.fillStyle = '#00f0ff'
    ctx.fillRect(x + 5, y + 45 + Math.max(0, legOffset), 2, 2)
    ctx.fillRect(x + 25, y + 45 - Math.max(0, legOffset), 2, 2)

    ctx.restore()
  }, [])

  const drawGround = useCallback((ctx: CanvasRenderingContext2D) => {
    const entityManager = entityManagerRef.current
    if (!entityManager) return

    const entities = entityManager.getEntities()

    for (let x = -100; x < CANVAS_WIDTH + 100; x += 10) {
      let hasBuilding = false
      let hasGap = false

      for (const entity of entities) {
        if (entity.type === 'building' || entity.type === 'platform') {
          if (x >= entity.x && x < entity.x + entity.width) {
            hasBuilding = true
            break
          }
        }
        if (entity.type === 'obstacle_gap') {
          if (x >= entity.x && x < entity.x + entity.width) {
            hasGap = true
            break
          }
        }
      }

      if (hasBuilding || hasGap) continue

      ctx.fillStyle = '#2a1a3a'
      ctx.fillRect(x, GROUND_Y, 10, CANVAS_HEIGHT - GROUND_Y)

      ctx.fillStyle = '#ff00aa'
      ctx.fillRect(x, GROUND_Y, 10, 2)
    }
  }, [])

  const drawReadyScreen = useCallback((ctx: CanvasRenderingContext2D, currentTime: number) => {
    if (currentTime - lastBlinkTime.current > 500) {
      showBlinkText.current = !showBlinkText.current
      lastBlinkTime.current = currentTime
    }

    ctx.shadowColor = '#00f0ff'
    ctx.shadowBlur = 20
    ctx.font = 'bold 72px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#00f0ff'
    ctx.lineWidth = 3
    ctx.strokeText('Night Roller', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50)
    ctx.fillText('Night Roller', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 50)
    ctx.shadowBlur = 0

    if (showBlinkText.current) {
      ctx.font = '24px Arial, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.fillText('按空格键或点击屏幕开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }

    ctx.font = '18px Arial, sans-serif'
    ctx.fillStyle = '#888'
    ctx.fillText('空格/点击：跳跃   空中再按：二段跳', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
    ctx.fillText('收集金币获得分数，躲避障碍物生存更久！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 110)
  }, [])

  const drawGameOverScreen = useCallback((ctx: CanvasRenderingContext2D, score: number, highScore: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.shadowColor = '#ff00aa'
    ctx.shadowBlur = 20
    ctx.font = 'bold 56px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#ff00aa'
    ctx.lineWidth = 3
    ctx.strokeText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80)
    ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80)
    ctx.shadowBlur = 0

    ctx.font = '28px Arial, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(`最终得分: ${score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)

    const isNewHighScore = score >= highScore && score > 0
    if (isNewHighScore) {
      ctx.shadowColor = '#ffff00'
      ctx.shadowBlur = 15
      ctx.fillStyle = '#ffff00'
      ctx.fillText('🎉 新纪录！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
      ctx.shadowBlur = 0
    } else {
      ctx.fillStyle = '#aaa'
      ctx.fillText(`最高分: ${highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 30)
    }
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    drawBackground(ctx)
    drawGround(ctx)

    const entityManager = entityManagerRef.current
    if (entityManager) {
      const entities = entityManager.getEntities()

      for (const entity of entities) {
        if (!entity.active) continue

        switch (entity.type) {
          case 'building':
            drawBuilding(ctx, entity)
            break
          case 'street_decor':
            drawStreetDecor(ctx, entity)
            break
          case 'platform':
            drawPlatform(ctx, entity)
            break
          case 'obstacle_window':
            drawWindowObstacle(ctx, entity)
            break
          case 'obstacle_ac':
            drawACObstacle(ctx, entity)
            break
          case 'obstacle_gap':
            drawGapObstacle(ctx, entity)
            break
          case 'coin':
            drawCoin(ctx, entity)
            break
          case 'speed_boost':
            drawSpeedBoost(ctx, entity)
            break
          case 'player':
            drawPlayer(ctx, entity)
            break
        }
      }
    }

    const status = engine.getStatus()
    const state = engine.getState()
    const currentTime = Date.now()

    if (status === 'ready') {
      drawReadyScreen(ctx, currentTime)
    } else if (status === 'gameover') {
      drawGameOverScreen(ctx, state.score, state.highScore)
    }

    animationRef.current = requestAnimationFrame(render)
  }, [
    engine,
    drawBackground,
    drawGround,
    drawBuilding,
    drawStreetDecor,
    drawPlatform,
    drawWindowObstacle,
    drawACObstacle,
    drawGapObstacle,
    drawCoin,
    drawSpeedBoost,
    drawPlayer,
    drawReadyScreen,
    drawGameOverScreen
  ])

  useEffect(() => {
    animationRef.current = requestAnimationFrame(render)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [render])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        const status = engine.getStatus()
        if (status === 'ready' || status === 'gameover') {
          onStart()
        } else if (status === 'running') {
          const player = entityManagerRef.current?.getPlayer()
          const playerData = player?.data as Record<string, unknown>
          const jumpCount = playerData?.jumpCount as number

          if (jumpCount === 0) {
            engine.jump()
          } else if (jumpCount === 1) {
            engine.doubleJump()
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [engine, onStart])

  const handleCanvasClick = useCallback(() => {
    const status = engine.getStatus()
    if (status === 'ready' || status === 'gameover') {
      onStart()
    } else if (status === 'running') {
      const player = entityManagerRef.current?.getPlayer()
      const playerData = player?.data as Record<string, unknown>
      const jumpCount = playerData?.jumpCount as number

      if (jumpCount === 0) {
        engine.jump()
      } else if (jumpCount === 1) {
        engine.doubleJump()
      }
    }
  }, [engine, onStart])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.preventDefault()
    const status = engine.getStatus()

    if (status === 'ready' || status === 'gameover') {
      onStart()
      return
    }

    if (status !== 'running') return

    const canvas = canvasRef.current
    if (!canvas) return

    const touch = e.touches[0]
    const rect = canvas.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const scaledX = x * (CANVAS_WIDTH / rect.width)

    const player = entityManagerRef.current?.getPlayer()
    const playerData = player?.data as Record<string, unknown>
    const jumpCount = playerData?.jumpCount as number

    if (scaledX < CANVAS_WIDTH / 2) {
      if (jumpCount === 0) {
        engine.jump()
      }
    } else {
      if (jumpCount === 1) {
        engine.doubleJump()
      }
    }
  }, [engine, onStart])

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'inline-block',
        padding: '5px',
        borderRadius: '8px',
        background: 'linear-gradient(135deg, #00f0ff, #ff00aa)',
        boxShadow: '0 0 30px rgba(0, 240, 255, 0.5), 0 0 30px rgba(255, 0, 170, 0.3)'
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        onClick={handleCanvasClick}
        onTouchStart={handleTouchStart}
        style={{
          display: 'block',
          borderRadius: '4px',
          cursor: 'pointer',
          touchAction: 'none'
        }}
      />
    </div>
  )
}
