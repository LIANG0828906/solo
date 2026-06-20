import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { useGameStore } from '../store/game-store'
import { Enemy, getEnemyConfig, updateEnemies } from '../game-logic/enemy'
import {
  Tower,
  TOWER_CONFIGS,
  AttackEffect,
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

export function GameBoard() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const waveAccumRef = useRef<number>(0)
  const hoverPosRef = useRef<{ col: number; row: number } | null>(null)

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
  } = useGameStore()

  const enemiesRef = useRef<Enemy[]>([])
  const towersRef = useRef<Tower[]>([])
  const effectsRef = useRef<AttackEffect[]>([])
  const isPausedRef = useRef<boolean>(false)
  const gameOverRef = useRef<boolean>(false)
  const waveRef = useRef<number>(0)

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(
      (state) => state.enemies,
      (enemies) => {
        enemiesRef.current = enemies
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(
      (state) => state.towers,
      (towers) => {
        towersRef.current = towers
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(
      (state) => state.effects,
      (effects) => {
        effectsRef.current = effects
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(
      (state) => state.isPaused,
      (isPaused) => {
        isPausedRef.current = isPaused
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(
      (state) => state.gameOver,
      (gameOver) => {
        gameOverRef.current = gameOver
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(
      (state) => state.wave,
      (w) => {
        waveRef.current = w
      }
    )
    return unsubscribe
  }, [])

  useEffect(() => {
    const unsubscribe = useGameStore.subscribe(
      (state) => state.lives,
      (lives) => {
        livesRef.current = lives
      }
    )
    return unsubscribe
  }, [])

  const pathTiles = useMemo(() => getPathTiles(), [])
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

          if (pathTiles.has(key)) {
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
    [pathTiles, canvasWidth, canvasHeight]
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

  const drawTower = useCallback(
    (ctx: CanvasRenderingContext2D, tower: Tower, isSelected: boolean) => {
      const config = TOWER_CONFIGS[tower.type]
      const size = TILE_SIZE * 0.7

      if (isSelected) {
        ctx.fillStyle = 'rgba(255,255,255,0.12)'
        ctx.beginPath()
        ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = 'rgba(255,255,255,0.35)'
        ctx.lineWidth = 2
        ctx.stroke()
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
    []
  )

  const drawEffect = useCallback(
    (ctx: CanvasRenderingContext2D, effect: AttackEffect, now: number) => {
      const progress = (now - effect.createdAt) / effect.duration
      const alpha = 1 - progress

      if (effect.type === 'arrow') {
        ctx.strokeStyle = `rgba(139, 195, 74, ${alpha})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(effect.x, effect.y)
        ctx.lineTo(effect.targetX, effect.targetY)
        ctx.stroke()

        const angle = Math.atan2(effect.targetY - effect.y, effect.targetX - effect.x)
        ctx.fillStyle = `rgba(139, 195, 74, ${alpha})`
        ctx.beginPath()
        ctx.moveTo(effect.targetX, effect.targetY)
        ctx.lineTo(
          effect.targetX - 8 * Math.cos(angle - Math.PI / 6),
          effect.targetY - 8 * Math.sin(angle - Math.PI / 6)
        )
        ctx.lineTo(
          effect.targetX - 8 * Math.cos(angle + Math.PI / 6),
          effect.targetY - 8 * Math.sin(angle + Math.PI / 6)
        )
        ctx.closePath()
        ctx.fill()
      } else if (effect.type === 'cannon') {
        const radius = 20 + progress * 30
        ctx.strokeStyle = `rgba(255, 152, 0, ${alpha})`
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, radius, 0, Math.PI * 2)
        ctx.stroke()

        ctx.fillStyle = `rgba(255, 87, 34, ${alpha * 0.3})`
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, radius * 0.6, 0, Math.PI * 2)
        ctx.fill()
      } else if (effect.type === 'magic') {
        const radius = 10 + progress * 25
        ctx.strokeStyle = `rgba(33, 150, 243, ${alpha})`
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, radius, 0, Math.PI * 2)
        ctx.stroke()

        ctx.strokeStyle = `rgba(100, 181, 246, ${alpha * 0.6})`
        ctx.beginPath()
        ctx.arc(effect.targetX, effect.targetY, radius * 0.6, 0, Math.PI * 2)
        ctx.stroke()
      }
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
        drawTower(ctx, tower, tower.id === selectedTowerId)
      }

      for (const enemy of enemiesRef.current) {
        if (enemy.hp > 0) {
          drawEnemy(ctx, enemy)
        }
      }

      for (const effect of effectsRef.current) {
        drawEffect(ctx, effect, timestamp)
      }

      if (selectedTowerType && hoverPosRef.current) {
        const { col, row } = hoverPosRef.current
        const canBuild = isBuildable(col, row)
        const config = TOWER_CONFIGS[selectedTowerType]
        const { x, y } = gridToPixel(col, row)

        ctx.fillStyle = canBuild ? 'rgba(76, 175, 80, 0.25)' : 'rgba(244, 67, 54, 0.25)'
        ctx.fillRect(col * TILE_SIZE, row * TILE_SIZE, TILE_SIZE, TILE_SIZE)

        if (canBuild) {
          ctx.fillStyle = 'rgba(255,255,255,0.08)'
          ctx.beginPath()
          ctx.arc(x, y, config.range, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = 'rgba(255,255,255,0.25)'
          ctx.lineWidth = 2
          ctx.stroke()
        }
      }
    },
    [drawMap, drawTower, drawEnemy, drawEffect, selectedTowerType, selectedTowerId]
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
    },
    []
  )

  const handleCanvasMouseLeave = useCallback(() => {
    hoverPosRef.current = null
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
