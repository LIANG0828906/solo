import React, { useEffect, useRef, useCallback } from 'react'
import { GameEngine } from '../game/GameEngine'
import { Entity, EntityManager, PLAYER_SPRITES, SpriteFrame, CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_Y } from '../game/EntityManager'

interface GameCanvasProps {
  engine: GameEngine
  onStart: () => void
}

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

  const drawPixelSprite = useCallback((
    ctx: CanvasRenderingContext2D,
    sprite: SpriteFrame,
    x: number,
    y: number,
    scale: number
  ) => {
    for (let py = 0; py < sprite.length; py++) {
      for (let px = 0; px < sprite[py].length; px++) {
        const color = sprite[py][px]
        if (color) {
          ctx.fillStyle = color
          ctx.fillRect(
            x + px * scale,
            y + py * scale,
            scale,
            scale
          )
        }
      }
    }
  }, [])

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 3,
      50,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH
    )
    gradient.addColorStop(0, '#1a0a2e')
    gradient.addColorStop(0.5, '#150825')
    gradient.addColorStop(1, '#0a0a1a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    for (let i = 0; i < 50; i++) {
      const x = (i * 73) % CANVAS_WIDTH
      const y = (i * 37) % (CANVAS_HEIGHT * 0.5)
      const size = (i % 3) + 1
      ctx.fillRect(x, y, size, size)
    }

    const entityManager = entityManagerRef.current
    if (entityManager) {
      const bgSprites = entityManager.getBackgroundSprites()
      for (const bg of bgSprites) {
        if (bg.x > CANVAS_WIDTH + 50 || bg.x + bg.width < -50) continue

        const bgData = bg.data as Record<string, unknown>
        ctx.fillStyle = (bgData.color as string) || 'rgba(30, 20, 60, 0.6)'
        ctx.fillRect(bg.x, bg.y, bg.width, bg.height)

        const windowColor = (bgData.windowColor as string) || 'rgba(150, 200, 255, 0.4)'
        ctx.fillStyle = windowColor

        for (let wy = bg.y + 10; wy < bg.y + bg.height - 10; wy += 18) {
          for (let wx = bg.x + 8; wx < bg.x + bg.width - 8; wx += 14) {
            if (Math.random() > 0.25) {
              ctx.fillRect(wx, wy, 8, 10)
            }
          }
        }
      }
    }
  }, [])

  const drawBuilding = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 50 || entity.x + entity.width < -50) return

    const data = entity.data as Record<string, unknown>
    const wallColor = (data.wallColor as string) || '#2a1a4a'
    const roofColor = (data.roofColor as string) || '#3a2a6a'
    const windowColor = (data.windowColor as string) || 'rgba(0, 240, 255, 0.5)'
    const hasNeonSign = data.hasNeonSign as boolean
    const neonColor = (data.neonColor as string) || '#00f0ff'
    const windowPattern = (data.windowPattern as string) || 'grid'

    ctx.fillStyle = wallColor
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)

    ctx.fillStyle = roofColor
    ctx.fillRect(entity.x, entity.y, entity.width, 6)

    ctx.fillStyle = windowColor
    if (windowPattern === 'grid') {
      for (let wy = entity.y + 15; wy < entity.y + entity.height - 10; wy += 22) {
        for (let wx = entity.x + 15; wx < entity.x + entity.width - 15; wx += 28) {
          ctx.fillRect(wx, wy, 16, 18)
        }
      }
    } else if (windowPattern === 'rows') {
      for (let wy = entity.y + 15; wy < entity.y + entity.height - 10; wy += 25) {
        for (let wx = entity.x + 10; wx < entity.x + entity.width - 10; wx += 35) {
          ctx.fillRect(wx, wy, 25, 12)
        }
      }
    } else if (windowPattern === 'random') {
      for (let i = 0; i < 20; i++) {
        const wx = entity.x + 10 + Math.random() * (entity.width - 30)
        const wy = entity.y + 15 + Math.random() * (entity.height - 35)
        if (Math.random() > 0.3) {
          ctx.fillRect(wx, wy, 14, 16)
        }
      }
    }

    if (hasNeonSign) {
      ctx.shadowColor = neonColor
      ctx.shadowBlur = 15
      ctx.fillStyle = neonColor
      ctx.fillRect(entity.x + entity.width / 2 - 30, entity.y + 12, 60, 8)
      ctx.shadowBlur = 0
    }

    ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeRect(entity.x, entity.y, entity.width, entity.height)
  }, [])

  const drawStreetDecor = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 50 || entity.x + entity.width < -50) return

    const decorType = (entity.data?.decorType as string) || 'lamp'

    if (decorType === 'lamp') {
      const lampColor = (entity.data?.lampColor as string) || '#00f0ff'

      ctx.fillStyle = '#2a2a3a'
      ctx.fillRect(entity.x + 3, entity.y, 4, entity.height)

      ctx.fillStyle = '#1a1a2a'
      ctx.fillRect(entity.x, entity.y, 10, 4)

      ctx.fillStyle = lampColor
      ctx.shadowColor = lampColor
      ctx.shadowBlur = 12
      ctx.beginPath()
      ctx.arc(entity.x + 5, entity.y - 4, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.fillStyle = `${lampColor}15`
      ctx.beginPath()
      ctx.moveTo(entity.x - 15, entity.y + 2)
      ctx.lineTo(entity.x + 25, entity.y + 2)
      ctx.lineTo(entity.x + 12, entity.y + 50)
      ctx.lineTo(entity.x - 2, entity.y + 50)
      ctx.closePath()
      ctx.fill()
    } else if (decorType === 'trash') {
      ctx.fillStyle = '#3a3a4a'
      ctx.fillRect(entity.x, entity.y + 5, entity.width, entity.height - 5)

      ctx.fillStyle = '#4a4a5a'
      ctx.fillRect(entity.x - 2, entity.y, entity.width + 4, 6)

      ctx.strokeStyle = '#5a5a6a'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(entity.x + entity.width / 2, entity.y + 8)
      ctx.lineTo(entity.x + entity.width / 2, entity.y + entity.height - 3)
      ctx.stroke()
    } else if (decorType === 'sign') {
      const signColor = (entity.data?.signColor as string) || '#ff00aa'

      ctx.fillStyle = '#333'
      ctx.fillRect(entity.x + 6, entity.y, 3, entity.height)

      ctx.fillStyle = signColor
      ctx.shadowColor = signColor
      ctx.shadowBlur = 10
      ctx.fillRect(entity.x, entity.y + 5, 15, 20)
      ctx.shadowBlur = 0

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.font = 'bold 8px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('酒吧', entity.x + 7.5, entity.y + 18)
    }
  }, [])

  const drawPlatform = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 50 || entity.x + entity.width < -50) return

    ctx.fillStyle = '#3a2a5a'
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)

    ctx.fillStyle = '#ff00aa'
    ctx.shadowColor = '#ff00aa'
    ctx.shadowBlur = 8
    ctx.fillRect(entity.x, entity.y, entity.width, 3)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#2a1a4a'
    ctx.fillRect(entity.x, entity.y + entity.height - 4, entity.width, 4)

    ctx.fillStyle = 'rgba(0, 240, 255, 0.3)'
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(entity.x + 15 + i * 30, entity.y + 6, 12, 4)
    }
  }, [])

  const drawWindowObstacle = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 50 || entity.x + entity.width < -50) return

    ctx.fillStyle = '#050510'
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)

    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 3
    ctx.shadowColor = '#00ff00'
    ctx.shadowBlur = 12
    ctx.strokeRect(entity.x + 1, entity.y + 1, entity.width - 2, entity.height - 2)
    ctx.shadowBlur = 0

    ctx.strokeStyle = '#00ff00'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(entity.x + entity.width / 2, entity.y + 5)
    ctx.lineTo(entity.x + entity.width / 2, entity.y + entity.height - 5)
    ctx.moveTo(entity.x + 5, entity.y + entity.height / 2)
    ctx.lineTo(entity.x + entity.width - 5, entity.y + entity.height / 2)
    ctx.stroke()

    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'
    ctx.fillRect(entity.x + 3, entity.y + 3, entity.width - 6, entity.height - 6)
  }, [])

  const drawACObstacle = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 50 || entity.x + entity.width < -50) return

    const hit = entity.data?.hit as boolean
    const baseColor = hit ? '#555' : '#888'

    ctx.fillStyle = baseColor
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)

    ctx.fillStyle = hit ? '#444' : '#aaa'
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(entity.x + 4, entity.y + 4 + i * 8, entity.width - 8, 4)
    }

    ctx.strokeStyle = '#00f0ff'
    ctx.lineWidth = 2
    ctx.shadowColor = '#00f0ff'
    ctx.shadowBlur = 5
    ctx.strokeRect(entity.x + 1, entity.y + 1, entity.width - 2, entity.height - 2)
    ctx.shadowBlur = 0

    if (hit) {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.4)'
      ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
    }

    ctx.fillStyle = '#666'
    ctx.fillRect(entity.x + entity.width / 2 - 3, entity.y + entity.height - 6, 6, 4)
  }, [])

  const drawGapObstacle = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 50 || entity.x + entity.width < -50) return

    ctx.fillStyle = '#000000'
    ctx.fillRect(entity.x, GROUND_Y, entity.width, CANVAS_HEIGHT - GROUND_Y)

    ctx.fillStyle = 'rgba(255, 0, 170, 0.4)'
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(entity.x + i * 32 + 5, GROUND_Y - 8, 22, 6)
    }

    ctx.fillStyle = '#ff00aa'
    ctx.shadowColor = '#ff00aa'
    ctx.shadowBlur = 8

    ctx.beginPath()
    ctx.moveTo(entity.x - 6, GROUND_Y)
    ctx.lineTo(entity.x + 2, GROUND_Y - 18)
    ctx.lineTo(entity.x + 10, GROUND_Y)
    ctx.closePath()
    ctx.fill()

    ctx.beginPath()
    ctx.moveTo(entity.x + entity.width - 10, GROUND_Y)
    ctx.lineTo(entity.x + entity.width - 2, GROUND_Y - 18)
    ctx.lineTo(entity.x + entity.width + 6, GROUND_Y)
    ctx.closePath()
    ctx.fill()

    ctx.shadowBlur = 0

    const gradient = ctx.createLinearGradient(entity.x, GROUND_Y, entity.x, GROUND_Y + 60)
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.8)')
    ctx.fillStyle = gradient
    ctx.fillRect(entity.x, GROUND_Y, entity.width, 60)
  }, [])

  const drawCoin = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 50 || entity.x + entity.width < -50) return

    const rotation = ((entity.data?.rotation as number) || 0) + 0.08
    ;(entity.data as Record<string, unknown>).rotation = rotation

    const bobOffset = ((entity.data?.bobOffset as number) || 0) + 0.05
    const bobY = Math.sin(bobOffset) * 3

    const centerX = entity.x + entity.width / 2
    const centerY = entity.y + entity.height / 2 + bobY
    const scaleX = Math.abs(Math.cos(rotation))

    ctx.save()
    ctx.translate(centerX, centerY)
    ctx.scale(scaleX, 1)

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 12)
    gradient.addColorStop(0, '#ffffaa')
    gradient.addColorStop(0.5, '#ffdd00')
    gradient.addColorStop(1, '#cc8800')

    ctx.fillStyle = gradient
    ctx.shadowColor = '#ffdd00'
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(0, 0, 11, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = '#aa6600'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, 8, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = '#aa6600'
    ctx.font = 'bold 10px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('¥', 0, 0)

    ctx.restore()
  }, [])

  const drawSpeedBoost = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    if (entity.x > CANVAS_WIDTH + 50 || entity.x + entity.width < -50) return

    const used = entity.data?.used as boolean
    if (used) return

    const time = Date.now() / 150
    const glow = 0.6 + 0.4 * Math.sin(time)

    ctx.fillStyle = `rgba(0, 240, 255, ${glow * 0.5})`
    ctx.shadowColor = '#00f0ff'
    ctx.shadowBlur = 25
    ctx.fillRect(entity.x, entity.y, entity.width, entity.height)
    ctx.shadowBlur = 0

    ctx.fillStyle = '#00f0ff'
    for (let i = 0; i < 5; i++) {
      const arrowX = entity.x + 8 + i * 16
      const offset = Math.sin(time + i) * 2
      ctx.beginPath()
      ctx.moveTo(arrowX, entity.y + 1 + offset)
      ctx.lineTo(arrowX + 10, entity.y + entity.height / 2)
      ctx.lineTo(arrowX, entity.y + entity.height - 1 - offset)
      ctx.closePath()
      ctx.fill()
    }

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.8)'
    ctx.lineWidth = 2
    ctx.strokeRect(entity.x, entity.y, entity.width, entity.height)
  }, [])

  const drawPlayer = useCallback((ctx: CanvasRenderingContext2D, entity: Entity) => {
    const playerData = entity.data as Record<string, unknown>
    const animFrame = (playerData.animFrame as number) || 0

    const sprite = PLAYER_SPRITES[animFrame] || PLAYER_SPRITES[0]
    const scale = 2

    ctx.save()

    if (entity.velocityY < -3) {
      ctx.translate(entity.x + entity.width / 2, entity.y + entity.height / 2)
      ctx.rotate(-0.15)
      ctx.translate(-(entity.x + entity.width / 2), -(entity.y + entity.height / 2))
    }

    drawPixelSprite(ctx, sprite, entity.x, entity.y, scale)

    ctx.restore()
  }, [drawPixelSprite])

  const drawGround = useCallback((ctx: CanvasRenderingContext2D) => {
    const entityManager = entityManagerRef.current
    if (!entityManager) return

    const entities = entityManager.getEntities()

    for (let x = -50; x < CANVAS_WIDTH + 50; x += 8) {
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
      ctx.fillRect(x, GROUND_Y, 8, CANVAS_HEIGHT - GROUND_Y)

      ctx.fillStyle = '#ff00aa'
      ctx.shadowColor = '#ff00aa'
      ctx.shadowBlur = 4
      ctx.fillRect(x, GROUND_Y, 8, 3)
      ctx.shadowBlur = 0

      ctx.fillStyle = '#1a0a2a'
      ctx.fillRect(x, GROUND_Y + 5, 8, 10)
    }
  }, [])

  const drawReadyScreen = useCallback((ctx: CanvasRenderingContext2D, currentTime: number) => {
    if (currentTime - lastBlinkTime.current > 500) {
      showBlinkText.current = !showBlinkText.current
      lastBlinkTime.current = currentTime
    }

    ctx.shadowColor = '#00f0ff'
    ctx.shadowBlur = 30
    ctx.font = 'bold 72px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#00f0ff'
    ctx.lineWidth = 4
    ctx.strokeText('Night Roller', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
    ctx.fillText('Night Roller', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60)
    ctx.shadowBlur = 0

    if (showBlinkText.current) {
      ctx.font = '26px Arial, sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.textAlign = 'center'
      ctx.shadowColor = '#00f0ff'
      ctx.shadowBlur = 10
      ctx.fillText('按空格键或点击屏幕开始游戏', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20)
      ctx.shadowBlur = 0
    }

    ctx.font = '18px Arial, sans-serif'
    ctx.fillStyle = '#888'
    ctx.textAlign = 'center'
    ctx.fillText('空格/点击：跳跃   空中再按：二段跳', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 70)
    ctx.fillText('收集金币获得分数，躲避障碍物生存更久！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100)

    ctx.font = '14px Arial, sans-serif'
    ctx.fillStyle = '#666'
    ctx.fillText('🎮 移动端：左屏跳跃 | 右屏二段跳', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 140)
  }, [])

  const drawGameOverScreen = useCallback((ctx: CanvasRenderingContext2D, score: number, highScore: number) => {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    ctx.shadowColor = '#ff00aa'
    ctx.shadowBlur = 25
    ctx.font = 'bold 60px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    ctx.strokeStyle = '#ff00aa'
    ctx.lineWidth = 3
    ctx.strokeText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90)
    ctx.fillText('游戏结束', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 90)
    ctx.shadowBlur = 0

    ctx.font = '28px Arial, sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = '#00f0ff'
    ctx.shadowBlur = 10
    ctx.fillText(`最终得分: ${score.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10)
    ctx.shadowBlur = 0

    const isNewHighScore = score >= highScore && score > 0
    if (isNewHighScore) {
      ctx.shadowColor = '#ffff00'
      ctx.shadowBlur = 20
      ctx.fillStyle = '#ffff00'
      ctx.font = '24px Arial, sans-serif'
      ctx.fillText('🎉 新纪录！恭喜你！', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35)
      ctx.shadowBlur = 0
    } else {
      ctx.fillStyle = '#aaa'
      ctx.font = '20px Arial, sans-serif'
      ctx.fillText(`最高分: ${highScore.toLocaleString()}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 35)
    }

    ctx.fillStyle = '#666'
    ctx.font = '16px Arial, sans-serif'
    ctx.fillText('点击"再来一次"按钮或按空格键重新开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 80)
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.imageSmoothingEnabled = false

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

    const rect = canvas.getBoundingClientRect()

    if (e.touches.length >= 2) {
      engine.doubleJump()
      return
    }

    const touch = e.touches[0]
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
      } else if (jumpCount === 0) {
        engine.jump()
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
        background: 'linear-gradient(135deg, #00f0ff, #ff00aa, #00f0ff)',
        backgroundSize: '200% 200%',
        animation: 'gradientShift 3s ease infinite',
        boxShadow: '0 0 40px rgba(0, 240, 255, 0.4), 0 0 40px rgba(255, 0, 170, 0.3), inset 0 0 20px rgba(0, 240, 255, 0.2)'
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
      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  )
}
