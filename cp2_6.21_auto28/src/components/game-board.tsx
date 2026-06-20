import { useRef, useEffect, useCallback, useState } from 'react'
import { useGameStore } from '../store/game-store'
import { Enemy, getEnemyConfig, updateEnemies } from '../game-logic/enemy'
import {
  Tower,
  TOWER_CONFIGS,
  GameEffect,
  DeathEffect,
  GoldEffect,
  processTowerAttacks,
  cleanupEffects,
  getUpgradeCost,
} from '../game-logic/tower'
import {
  TILE_SIZE,
  GRID_COLS,
  GRID_ROWS,
  getPathTiles,
  isBuildable,
  pixelToGrid,
  gridToPixel,
  WAVE_INTERVAL_MS,
  ENEMY_DAMAGE,
} from '../utils/path-data'

const PATH_COLOR = '#5a5a5a'
const GRASS_COLOR = '#2d5a27'
const BUILDABLE_COLOR = '#8b7355'
const BORDER_COLOR = '#2a1e14'

const RANGE_PULSE_PERIOD = 1500

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const waveAccumRef = useRef<number>(0)
  const hoverPosRef = useRef<{ col: number; row: number } | null>(null)
  const livesRef = useRef<number>(20)
  const hoverTowerIdRef = useRef<string | null>(null)

  const gameState = useGameStore()
  const {
    selectedTowerType,
    selectedTowerId,
    wave,
    setEnemies,
    setTowers,
    setEffects,
    placeTower,
    selectTower,
    takeDamage,
    addGold,
    spawnWave,
    startGame,
    upgradeTowerById,
    addWaveKill,
    towers,
  } = gameState

  const enemiesRef = useRef<Enemy[]>([])
  const towersRef = useRef<Tower[]>([])
  const effectsRef = useRef<GameEffect[]>([])
  const isPausedRef = useRef<boolean>(false)
  const gameOverRef = useRef<boolean>(false)
  const waveRef = useRef<number>(0)

  useEffect(() => {
    enemiesRef.current = gameState.enemies
  }, [gameState.enemies])

  useEffect(() => {
    towersRef.current = gameState.towers
  }, [gameState.towers])

  useEffect(() => {
    effectsRef.current = gameState.effects
  }, [gameState.effects])

  useEffect(() => {
    isPausedRef.current = gameState.isPaused
  }, [gameState.isPaused])

  useEffect(() => {
    gameOverRef.current = gameState.gameOver
  }, [gameState.gameOver])

  useEffect(() => {
    waveRef.current = gameState.wave
  }, [gameState.wave])

  useEffect(() => {
    livesRef.current = gameState.lives
  }, [gameState.lives])

  const realPathTiles = useRef(getPathTiles())
  const canvasWidth = GRID_COLS * TILE_SIZE
  const canvasHeight = GRID_ROWS * TILE_SIZE

  const drawMap = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = GRASS_COLOR
      ctx.fillRect(0, 0, canvasWidth, canvasHeight)

      for (let row = 0; row < GRID_ROWS; row++) {
        for (let col = 0; col < GRID_COLS; col++) {
          const key = `${col},${row}`
          const x = col * TILE_SIZE
          const y = row * TILE_SIZE

          if (realPathTiles.current.has(key)) {
            ctx.fillStyle = PATH_COLOR
            ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE)
            ctx.strokeStyle = '#4a4a4a'
            ctx.lineWidth = 1
            ctx.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4)
          } else {
            ctx.fillStyle = BUILDABLE_COLOR
            ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4)
            ctx.fillStyle = 'rgba(0,0,0,0.1)'
            ctx.fillRect(x + 4, y + 4, 4, 4)
            ctx.fillRect(x + TILE_SIZE - 8, y + TILE_SIZE - 8, 4, 4)
          }
        }
      }

      ctx.strokeStyle = BORDER_COLOR
      ctx.lineWidth = 4
      ctx.strokeRect(2, 2, canvasWidth - 4, canvasHeight - 4)
    },
    [canvasWidth, canvasHeight]
  )

  const drawEnemy = useCallback((ctx: CanvasRenderingContext2D, enemy: Enemy) => {
    const config = getEnemyConfig(enemy.type)
    const size = enemy.type === 'heavy' ? 16 : enemy.type === 'fast' ? 12 : 14

    ctx.save()
    ctx.translate(enemy.x, enemy.y)

    if (enemy.type === 'normal') {
      ctx.fillStyle = config.color
      ctx.beginPath()
      ctx.arc(0, 0, size / 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.lineWidth = 1
      ctx.stroke()
    } else if (enemy.type === 'fast') {
      ctx.fillStyle = config.color
      ctx.beginPath()
      ctx.moveTo(0, -size / 2)
      ctx.lineTo(size / 2, size / 2)
      ctx.lineTo(-size / 2, size / 2)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.lineWidth = 1
      ctx.stroke()
    } else {
      ctx.fillStyle = config.color
      ctx.fillRect(-size / 2, -size / 2, size, size)
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'
      ctx.lineWidth = 1
      ctx.strokeRect(-size / 2, -size / 2, size, size)
    }

    ctx.restore()

    const hpPercent = enemy.hp / enemy.maxHp
    const barWidth = 24
    const barHeight = 4
    const barX = enemy.x - barWidth / 2
    const barY = enemy.y - size / 2 - 8

    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2)

    const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY)
    if (hpPercent > 0.6) {
      gradient.addColorStop(0, '#4caf50')
      gradient.addColorStop(1, '#8bc34a')
    } else if (hpPercent > 0.3) {
      gradient.addColorStop(0, '#ff9800')
      gradient.addColorStop(1, '#ffc107')
    } else {
      gradient.addColorStop(0, '#f44336')
      gradient.addColorStop(1, '#e53935')
    }
    ctx.fillStyle = gradient
    ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight)
  }, [])

  const drawRangeRing = useCallback(
    (ctx: CanvasRenderingContext2D, x: number, y: number, range: number, time: number) => {
      const pulsePhase = (time % RANGE_PULSE_PERIOD) / RANGE_PULSE_PERIOD
      const pulse = 0.5 + 0.5 * Math.sin(pulsePhase * Math.PI * 2)
      const alpha = 0.2 + pulse * 0.2
      const ringAlpha = 0.25 + pulse * 0.2
      const radiusPulse = 1 + pulse * 0.03

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.beginPath()
      ctx.arc(x, y, range * radiusPulse, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = `rgba(255, 255, 255, ${ringAlpha})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(x, y, range * radiusPulse, 0, Math.PI * 2)
      ctx.stroke()

      if (pulse > 0.5) {
        ctx.strokeStyle = `rgba(100, 200, 255, ${(pulse - 0.5) * 0.4})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(x, y, range * (1 + pulse * 0.08), 0, Math.PI * 2)
        ctx.stroke()
      }
    },
    []
  )

  const drawTower = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      tower: Tower,
      isSelected: boolean,
      isHovered: boolean,
      time: number
    ) => {
      const config = TOWER_CONFIGS[tower.type]
      const size = TILE_SIZE * 0.7

      if (isSelected || isHovered) {
        drawRangeRing(ctx, tower.x, tower.y, tower.range, time)
      }

      ctx.fillStyle = 'rgba(0,0,0,0.4)'
      ctx.beginPath()
      ctx.ellipse(tower.x, tower.y + size / 3, size / 2, size / 4, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#3e2723'
      ctx.beginPath()
      ctx.arc(tower.x, tower.y + 2, size / 2, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = config.color
      ctx.beginPath()
      ctx.arc(tower.x, tower.y - 2, size / 2.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'
      ctx.lineWidth = 2
      ctx.stroke()

      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.arc(tower.x - size / 6, tower.y - size / 3, size / 6, 0, Math.PI * 2)
      ctx.fill()

      if (tower.level > 1) {
        ctx.fillStyle = '#ffd700'
        ctx.font = 'bold 10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`Lv${tower.level}`, tower.x, tower.y - size / 2 - 2)
      }
    },
    [drawRangeRing]
  )

  const drawAttackEffect = useCallback(
    (ctx: CanvasRenderingContext2D, effect: GameEffect, now: number) => {
      if (effect.kind !== 'attack') return
      const progress = (now - effect.createdAt) / effect.duration
      const alpha = 1 - progress

      if (effect.type === 'arrow') {
        const moveProgress = Math.min(progress / 0.7, 1)
        const currentX = effect.x + (effect.targetX - effect.x) * moveProgress
        const currentY = effect.y + (effect.targetY - effect.y) * moveProgress
        const trailStartX = currentX - (effect.targetX - effect.x) * 0.2
        const trailStartY = currentY - (effect.targetY - effect.y) * 0.2

        const angle = Math.atan2(effect.targetY - effect.y, effect.targetX - effect.x)

        const tailGradient = ctx.createLinearGradient(trailStartX, trailStartY, currentX, currentY)
        tailGradient.addColorStop(0, `rgba(139, 195, 74, 0)`)
        tailGradient.addColorStop(1, `rgba(139, 195, 74, ${alpha})`)
        ctx.strokeStyle = tailGradient
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(trailStartX, trailStartY)
        ctx.lineTo(currentX, currentY)
        ctx.stroke()

        ctx.fillStyle = `rgba(139, 195, 74, ${alpha})`
        ctx.beginPath()
        ctx.moveTo(currentX, currentY)
        ctx.lineTo(
          currentX - 10 * Math.cos(angle - Math.PI / 6),
          currentY - 10 * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          currentX - 10 * Math.cos(angle + Math.PI / 6),
          currentY - 10 * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fill()

        ctx.fillStyle = `rgba(200, 230, 100, ${alpha * 0.6})`
        ctx.beginPath()
        ctx.arc(currentX, currentY, 3, 0, Math.PI * 2)
        ctx.fill()
      } else if (effect.type === 'cannon') {
        const explosionProgress = Math.min(progress / 0.6, 1)
        const baseRadius = 15
        const mainRadius = baseRadius + explosionProgress * 40
        const shockwaveRadius = baseRadius + explosionProgress * 70
        const mainAlpha = alpha * (1 - explosionProgress * 0.5)
        const shockwaveAlpha = alpha * (1 - explosionProgress)

        if (explosionProgress < 0.3) {
          const flashAlpha = (1 - explosionProgress / 0.3) * 0.6
          ctx.fillStyle = `rgba(255, 255, 200, ${flashAlpha})`
          ctx.beginPath()
          ctx.arc(effect.targetX, effect.targetY, 25, 0, Math.PI * 2)
          ctx.fill()
        }

        const innerGradient = ctx.createRadialGradient(
          effect.targetX,
          effect.targetY,
          0,
          effect.targetX,
          effect.targetY,
          mainRadius
        )
        innerGradient.addColorStop(0, `rgba(255, 200, 50, ${mainAlpha})`)
        innerGradient.addColorStop(0.4, `rgba(255, 120, 30, ${mainAlpha * 0.8})`)
        innerGradient.addColorStop(1, `rgba(255, 60, 20, 0)`)
        ctx.fillStyle = innerGradient
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, mainRadius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = `rgba(255, 150, 50, ${shockwaveAlpha})`
        ctx.lineWidth = 4 - explosionProgress * 2
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, shockwaveRadius, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = `rgba(255, 220, 100, ${shockwaveAlpha * 0.6})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, shockwaveRadius * 0.7, 0, Math.PI * 2)
        ctx.stroke()
      } else if (effect.type === 'magic') {
        const rippleProgress = Math.min(progress / 0.8, 1)
        const baseRadius = 10
        const outerRadius = baseRadius + rippleProgress * 35
        const midRadius = baseRadius + rippleProgress * 22
        const innerRadius = baseRadius + rippleProgress * 10
        const rippleAlpha = alpha * (1 - rippleProgress * 0.3)

        const innerGradient = ctx.createRadialGradient(
          effect.targetX,
          effect.targetY,
          0,
          effect.targetX,
          effect.targetY,
          outerRadius
        )
        innerGradient.addColorStop(0, `rgba(100, 180, 255, ${rippleAlpha * 0.3})`)
        innerGradient.addColorStop(0.5, `rgba(50, 130, 255, ${rippleAlpha * 0.15})`)
        innerGradient.addColorStop(1, `rgba(30, 80, 200, 0)`)
        ctx.fillStyle = innerGradient
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, outerRadius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = `rgba(100, 180, 255, ${rippleAlpha})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, outerRadius, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = `rgba(150, 210, 255, ${rippleAlpha * 0.8})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, midRadius, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = `rgba(200, 230, 255, ${rippleAlpha * 0.6})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, innerRadius, 0, Math.PI * 2)
        ctx.stroke()

        if (rippleProgress < 0.5) {
          const sparkAlpha = (1 - rippleProgress / 0.5) * rippleAlpha
          for (let i = 0; i < 5; i++) {
            const sparkAngle = (i / 5) * Math.PI * 2 + rippleProgress * Math.PI
            const sparkRadius = midRadius + Math.sin(rippleProgress * Math.PI * 3 + i) * 6
            const sx = effect.targetX + Math.cos(sparkAngle) * sparkRadius
            const sy = effect.targetY + Math.sin(sparkAngle) * sparkRadius
            ctx.fillStyle = `rgba(180, 220, 255, ${sparkAlpha})`
            ctx.beginPath()
            ctx.arc(sx, sy, 2, 0, Math.PI * 2)
            ctx.fill()
          }
        }
      }
    },
    []
  )

  const drawDeathEffect = useCallback(
    (ctx: CanvasRenderingContext2D, effect: DeathEffect, now: number) => {
      const progress = (now - effect.createdAt) / effect.duration
      const alpha = 1 - progress

      if (effect.type === 'normal') {
        const size = (1 - progress * 0.7) * 14
        ctx.fillStyle = `rgba(229, 57, 53, ${alpha})`
        ctx.beginPath()
        ctx.arc(effect.x, effect.y, size / 2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = `rgba(255, 150, 150, ${alpha * 0.5})`
        ctx.beginPath()
        ctx.arc(effect.x, effect.y, size / 2 + 4 + progress * 10, 0, Math.PI * 2)
        ctx.fill()
      } else if (effect.type === 'fast') {
        for (const particle of effect.particles) {
          const px = effect.x + particle.vx * progress
          const py = effect.y + particle.vy * progress - progress * progress * 40
          const particleAlpha = alpha * (1 - progress * 0.3)
          const particleSize = particle.size * (1 - progress * 0.5)

          ctx.fillStyle = particle.color
          ctx.globalAlpha = particleAlpha
          ctx.beginPath()
          ctx.arc(px, py, particleSize, 0, Math.PI * 2)
          ctx.fill()

          ctx.globalAlpha = particleAlpha * 0.3
          ctx.beginPath()
          ctx.arc(px, py, particleSize * 2, 0, Math.PI * 2)
          ctx.fill()
          ctx.globalAlpha = 1
        }
      } else {
        for (const particle of effect.particles) {
          const rotation = progress * 4 + particle.angle
          const px = effect.x + particle.vx * progress
          const py = effect.y + particle.vy * progress + progress * progress * 30
          const particleAlpha = alpha * (1 - progress * 0.2)
          const particleSize = particle.size * (1 - progress * 0.3)

          ctx.save()
          ctx.translate(px, py)
          ctx.rotate(rotation)
          ctx.fillStyle = particle.color
          ctx.globalAlpha = particleAlpha
          ctx.fillRect(-particleSize / 2, -particleSize / 2, particleSize, particleSize)
          ctx.globalAlpha = 1
          ctx.restore()
        }
      }
    },
    []
  )

  const drawGoldEffect = useCallback(
    (ctx: CanvasRenderingContext2D, effect: GoldEffect, now: number) => {
      const progress = (now - effect.createdAt) / effect.duration
      const floatProgress = Math.min(progress / 0.8, 1)
      const fadeProgress = Math.max(0, (progress - 0.5) / 0.5)
      const alpha = 1 - fadeProgress
      const floatY = -floatProgress * 40

      const coinSize = 10 + floatProgress * 2
      const wobble = Math.sin(progress * Math.PI * 4) * 3

      ctx.save()
      ctx.translate(effect.x + wobble, effect.y + floatY)

      const gradient = ctx.createRadialGradient(-coinSize / 3, -coinSize / 3, 0, 0, 0, coinSize)
      gradient.addColorStop(0, `rgba(255, 240, 150, ${alpha})`)
      gradient.addColorStop(0.5, `rgba(255, 215, 0, ${alpha})`)
      gradient.addColorStop(1, `rgba(184, 134, 11, ${alpha})`)
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(0, 0, coinSize, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = `rgba(150, 100, 0, ${alpha})`
      ctx.lineWidth = 1.5
      ctx.stroke()

      ctx.fillStyle = `rgba(150, 100, 0, ${alpha})`
      ctx.font = `bold ${coinSize}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('$', 0, 1)

      if (effect.amount > 1 && progress < 0.6) {
        ctx.fillStyle = `rgba(255, 215, 0, ${alpha * 0.8})`
        ctx.font = 'bold 12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`+${effect.amount}`, 0, -coinSize - 8)
      }

      if (progress < 0.3) {
        const sparkleAlpha = (1 - progress / 0.3) * alpha
        for (let i = 0; i < 4; i++) {
          const angle = (i / 4) * Math.PI * 2 + progress * Math.PI * 2
          const dist = coinSize + 4 + progress * 15
          const sx = Math.cos(angle) * dist
          const sy = Math.sin(angle) * dist
          ctx.fillStyle = `rgba(255, 255, 200, ${sparkleAlpha})`
          ctx.beginPath()
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      ctx.restore()
    },
    []
  )

  const render = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      drawMap(ctx)

      for (const tower of towersRef.current) {
        const isSelected = tower.id === selectedTowerId
        const isHovered = tower.id === hoverTowerIdRef.current
        drawTower(ctx, tower, isSelected, isHovered, timestamp)
      }

      for (const enemy of enemiesRef.current) {
        if (enemy.hp > 0) {
          drawEnemy(ctx, enemy)
        }
      }

      for (const effect of effectsRef.current) {
        if (effect.kind === 'attack') {
          drawAttackEffect(ctx, effect, timestamp)
        } else if (effect.kind === 'death') {
          drawDeathEffect(ctx, effect, timestamp)
        } else if (effect.kind === 'gold') {
          drawGoldEffect(ctx, effect, timestamp)
        }
      }

      if (selectedTowerType && hoverPosRef.current) {
        const { col, row } = hoverPosRef.current
        const canBuild = isBuildable(col, row)
        const config = TOWER_CONFIGS[selectedTowerType]
        const { x, y } = gridToPixel(col, row)

        ctx.fillStyle = canBuild ? 'rgba(76, 175, 80, 0.25)' : 'rgba(244, 67, 54, 0.25)'
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE)

        if (canBuild) {
          drawRangeRing(ctx, x, y, config.range, timestamp)
        }
      }
    },
    [drawMap, drawTower, drawEnemy, drawAttackEffect, drawDeathEffect, drawGoldEffect, drawRangeRing, selectedTowerType, selectedTowerId]
  )

  const gameLoop = useCallback(
    (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1)
      lastTimeRef.current = timestamp

      if (!isPausedRef.current && !gameOverRef.current && waveRef.current > 0) {
        waveAccumRef.current += deltaTime * 1000
        if (waveAccumRef.current >= WAVE_INTERVAL_MS) {
          waveAccumRef.current -= WAVE_INTERVAL_MS
          spawnWave()
        }

        const { updated, reachedEnd } = updateEnemies(
          enemiesRef.current,
          deltaTime,
          timestamp
        )

        if (reachedEnd.length > 0) {
          takeDamage(reachedEnd.length * ENEMY_DAMAGE)
        }

        const beforeEnemyCount = updated.length

        const attackResult = processTowerAttacks(
          towersRef.current,
          updated,
          timestamp
        )

        const killedCount = beforeEnemyCount - attackResult.updatedEnemies.length
        if (killedCount > 0 && attackResult.goldEarned > 0) {
          addGold(attackResult.goldEarned)
          addWaveKill(killedCount, attackResult.goldEarned)
        } else if (attackResult.goldEarned > 0) {
          addGold(attackResult.goldEarned)
        }

        const cleanedEffects = cleanupEffects(
          [...effectsRef.current, ...attackResult.newEffects],
          timestamp
        )

        enemiesRef.current = attackResult.updatedEnemies
        towersRef.current = attackResult.updatedTowers
        effectsRef.current = cleanedEffects

        setEnemies(attackResult.updatedEnemies)
        setTowers(attackResult.updatedTowers)
        setEffects(cleanedEffects)
      }

      render(timestamp)
      animationRef.current = requestAnimationFrame(gameLoop)
    },
    [render, spawnWave, takeDamage, addGold, addWaveKill, setEnemies, setTowers, setEffects]
  )

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return

      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      const { col, row } = pixelToGrid(x, y)

      if (selectedTowerType) {
        const hasTower = towersRef.current.some((t) => t.col === col && t.row === row)
        if (isBuildable(col, row) && !hasTower) {
          placeTower(selectedTowerType, col, row)
        }
      } else {
        const clickedTower = towersRef.current.find((t) => t.col === col && t.row === row)
        if (clickedTower) {
          selectTower(clickedTower.id)
        } else {
          selectTower(null)
        }
      }
    },
    [selectedTowerType, placeTower, selectTower]
  )

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY
      hoverPosRef.current = pixelToGrid(x, y)

      if (!selectedTowerType) {
        const { col, row } = pixelToGrid(x, y)
        const hoveredTower = towersRef.current.find((t) => t.col === col && t.row === row)
        hoverTowerIdRef.current = hoveredTower ? hoveredTower.id : null
      } else {
        hoverTowerIdRef.current = null
      }
    },
    [selectedTowerType]
  )

  const handleCanvasMouseLeave = useCallback(() => {
    hoverPosRef.current = null
    hoverTowerIdRef.current = null
  }, [])

  useEffect(() => {
    if (wave === 0 && !useGameStore.getState().gameOver) {
      startGame()
    }
  }, [wave, startGame])

  useEffect(() => {
    lastTimeRef.current = 0
    waveAccumRef.current = 0
    animationRef.current = requestAnimationFrame(gameLoop)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [gameLoop])

  const [selectedTower, setSelectedTower] = useState<Tower | null>(null)

  useEffect(() => {
    if (selectedTowerId) {
      const tower = towers.find((t) => t.id === selectedTowerId) || null
      setSelectedTower(tower)
    } else {
      setSelectedTower(null)
    }
  }, [selectedTowerId, towers])

  const handleUpgrade = useCallback(() => {
    if (selectedTower) {
      upgradeTowerById(selectedTower.id)
    }
  }, [selectedTower, upgradeTowerById])

  return (
    <div className="game-board-container">
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        className="game-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        style={{ cursor: selectedTowerType ? 'crosshair' : 'default' }}
      />

      {selectedTower && (
        <div
          className="tower-upgrade-popup"
          style={{
            left: selectedTower.x - 50,
            top: selectedTower.y - 75,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="upgrade-btn"
            onClick={handleUpgrade}
            disabled={selectedTower.level >= 3}
          >
            {selectedTower.level >= 3
              ? '已满级'
              : `升级 (${getUpgradeCost(selectedTower)}金)`}
          </button>
        </div>
      )}
    </div>
  )
}
