import React, { useRef, useEffect, useCallback, useState, forwardRef, useImperativeHandle } from 'react'

export type RuneColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple'

export interface SkillState {
  id: string
  name: string
  icon: string
  color: string
  fragments: number
  maxFragments: number
}

export interface GameStateSnapshot {
  score: number
  combo: number
  nextRune: RuneColor
  skills: SkillState[]
  gameOver: boolean
  totalCleared: number
}

export interface GameBoardHandle {
  useSkill: (skillId: string) => boolean
  getState: () => GameStateSnapshot
  reset: () => void
}

const RUNE_COLORS: Record<RuneColor, string> = {
  red: '#ff4757',
  blue: '#1e90ff',
  green: '#2ed573',
  yellow: '#ffa502',
  purple: '#a55eea',
}

const COLOR_KEYS: RuneColor[] = ['red', 'blue', 'green', 'yellow', 'purple']

const GRID_ROWS = 7
const GRID_COLS = 7
const HEX_SIZE = 40
const HEX_GAP = 2
const HEX_WIDTH = HEX_SIZE * Math.sqrt(3)
const HEX_HEIGHT = HEX_SIZE * 2
const HEX_HORIZ_SPACING = HEX_WIDTH + HEX_GAP
const HEX_VERT_SPACING = HEX_SIZE * 1.5 + HEX_GAP

const BASE_SCORE_PER_RUNE = 10
const COMBO_MULTIPLIER = 0.5

interface Rune {
  id: number
  color: RuneColor
}

type Cell = Rune | null
type Grid = Cell[][]

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  size: number
  life: number
  maxLife: number
}

interface HighlightCell {
  row: number
  col: number
  startTime: number
  duration: number
}

interface PlaceAnimation {
  row: number
  col: number
  startTime: number
  duration: number
  color: RuneColor
}

interface DropAnimation {
  rune: Rune
  fromRow: number
  toRow: number
  col: number
  startTime: number
  duration: number
}

interface DetonationWave {
  row: number
  col: number
  startTime: number
  delay: number
  color: RuneColor
}

let runeIdCounter = 0

function getRandomRune(): RuneColor {
  return COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]
}

function createEmptyGrid(): Grid {
  const grid: Grid = []
  for (let r = 0; r < GRID_ROWS; r++) {
    const row: Cell[] = []
    for (let c = 0; c < GRID_COLS; c++) {
      row.push(null)
    }
    grid.push(row)
  }
  return grid
}

function getNeighbors(row: number, col: number): Array<{ row: number; col: number }> {
  const neighbors: Array<{ row: number; col: number }> = []
  const isOddRow = row % 2 === 1

  const directions = isOddRow
    ? [
        [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, 0], [1, 1],
      ]
    : [
        [-1, -1], [-1, 0],
        [0, -1], [0, 1],
        [1, -1], [1, 0],
      ]

  for (const [dr, dc] of directions) {
    const nr = row + dr
    const nc = col + dc
    if (nr >= 0 && nr < GRID_ROWS && nc >= 0 && nc < GRID_COLS) {
      neighbors.push({ row: nr, col: nc })
    }
  }

  return neighbors
}

function findConnectedRegion(grid: Grid, row: number, col: number): Array<{ row: number; col: number }> {
  const target = grid[row][col]
  if (!target) return []

  const visited = new Set<string>()
  const result: Array<{ row: number; col: number }> = []
  const stack: Array<{ row: number; col: number }> = [{ row, col }]

  while (stack.length > 0) {
    const curr = stack.pop()!
    const key = `${curr.row},${curr.col}`
    if (visited.has(key)) continue

    const cell = grid[curr.row][curr.col]
    if (!cell || cell.color !== target.color) continue

    visited.add(key)
    result.push(curr)

    for (const n of getNeighbors(curr.row, curr.col)) {
      stack.push(n)
    }
  }

  return result
}

function hexCenter(row: number, col: number, offsetX: number, offsetY: number): { x: number; y: number } {
  const x = offsetX + col * HEX_HORIZ_SPACING + (row % 2) * (HEX_HORIZ_SPACING / 2) + HEX_WIDTH / 2
  const y = offsetY + row * HEX_VERT_SPACING + HEX_SIZE
  return { x, y }
}

function drawHexagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  fillStyle: string | CanvasGradient,
  strokeStyle?: string,
  lineWidth?: number
) {
  ctx.beginPath()
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i + Math.PI / 2
    const px = x + size * Math.cos(angle)
    const py = y + size * Math.sin(angle)
    if (i === 0) {
      ctx.moveTo(px, py)
    } else {
      ctx.lineTo(px, py)
    }
  }
  ctx.closePath()
  ctx.fillStyle = fillStyle
  ctx.fill()
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle
    ctx.lineWidth = lineWidth ?? 1
    ctx.stroke()
  }
}

function pointInHex(px: number, py: number, hx: number, hy: number, size: number): boolean {
  const dx = Math.abs(px - hx)
  const dy = Math.abs(py - hy)
  if (dy > size) return false
  if (dx > size * Math.sqrt(3) / 2) return false
  return dy + dx / Math.sqrt(3) <= size
}

interface GameBoardProps {
  onStateChange: (state: GameStateSnapshot) => void
}

const GameBoard = forwardRef<GameBoardHandle, GameBoardProps>(({ onStateChange }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<Grid>(createEmptyGrid())
  const nextRuneRef = useRef<RuneColor>(getRandomRune())
  const scoreRef = useRef(0)
  const comboRef = useRef(0)
  const gameOverRef = useRef(false)
  const totalClearedRef = useRef(0)
  const isAnimatingRef = useRef(false)

  const particlesRef = useRef<Particle[]>([])
  const highlightsRef = useRef<HighlightCell[]>([])
  const placeAnimRef = useRef<PlaceAnimation | null>(null)
  const dropAnimRef = useRef<DropAnimation[]>([])
  const detonationWavesRef = useRef<DetonationWave[]>([])
  const flashCellsRef = useRef<Array<{ row: number; col: number; startTime: number; duration: number }>>([])

  const skillsRef = useRef<SkillState[]>([
    { id: 'firestorm', name: '烈焰风暴', icon: '🔥', color: '#ff4757', fragments: 0, maxFragments: 20 },
    { id: 'double', name: '双倍祝福', icon: '✨', color: '#ffd700', fragments: 0, maxFragments: 12 },
  ])

  const doubleScoreActiveRef = useRef(false)

  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 500 })
  const [gridOffset, setGridOffset] = useState({ x: 0, y: 0 })

  const pushState = useCallback(() => {
    onStateChange({
      score: scoreRef.current,
      combo: comboRef.current,
      nextRune: nextRuneRef.current,
      skills: skillsRef.current.map(s => ({ ...s })),
      gameOver: gameOverRef.current,
      totalCleared: totalClearedRef.current,
    })
  }, [onStateChange])

  const countEmptyCells = useCallback((): number => {
    let count = 0
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (!gridRef.current[r][c]) count++
      }
    }
    return count
  }, [])

  const checkGameOver = useCallback(() => {
    if (countEmptyCells() < 3) {
      gameOverRef.current = true
      pushState()
    }
  }, [countEmptyCells, pushState])

  const spawnParticles = useCallback((x: number, y: number, color: string, count: number) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color,
        size: 2 + Math.random() * 4,
        life: 1,
        maxLife: 0.6 + Math.random() * 0.4,
      })
    }
  }, [])

  const addSkillFragments = useCallback((amount: number) => {
    for (const skill of skillsRef.current) {
      if (skill.fragments < skill.maxFragments) {
        skill.fragments = Math.min(skill.fragments + amount, skill.maxFragments)
      }
    }
  }, [])

  const detonateCells = useCallback((cells: Array<{ row: number; col: number }>, startTime: number) => {
    if (cells.length === 0) return

    const firstCell = cells[0]
    const firstRune = gridRef.current[firstCell.row][firstCell.col]
    if (!firstRune) return

    const color = firstRune.color
    const colorHex = RUNE_COLORS[color]

    const waveDelay = 0.04
    for (let i = 0; i < cells.length; i++) {
      detonationWavesRef.current.push({
        row: cells[i].row,
        col: cells[i].col,
        startTime,
        delay: i * waveDelay,
        color,
      })
    }

    const maxDelay = (cells.length - 1) * waveDelay
    const flashDuration = 0.2
    const clearDelay = maxDelay + flashDuration

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i]
      const center = hexCenter(cell.row, cell.col, gridOffset.x, gridOffset.y)
      const particleTime = startTime + i * waveDelay + flashDuration / 2

      setTimeout(() => {
        spawnParticles(center.x, center.y, colorHex, 10 + Math.floor(Math.random() * 11))
        highlightsRef.current.push({
          row: cell.row,
          col: cell.col,
          startTime: performance.now(),
          duration: 500,
        })
      }, (i * waveDelay + flashDuration / 2) * 1000)

      flashCellsRef.current.push({
        row: cell.row,
        col: cell.col,
        startTime: startTime + i * waveDelay,
        duration: flashDuration,
      })
    }

    setTimeout(() => {
      for (const cell of cells) {
        gridRef.current[cell.row][cell.col] = null
      }

      const baseScore = cells.length * BASE_SCORE_PER_RUNE
      const comboMultiplier = 1 + comboRef.current * COMBO_MULTIPLIER
      const doubleMultiplier = doubleScoreActiveRef.current ? 2 : 1
      const scoreGain = Math.floor(baseScore * comboMultiplier * doubleMultiplier)
      scoreRef.current += scoreGain
      totalClearedRef.current += cells.length
      addSkillFragments(cells.length)
      doubleScoreActiveRef.current = false

      pushState()

      setTimeout(() => {
        applyGravityAndCheckChain(startTime + clearDelay + 0.4)
      }, 100)
    }, clearDelay * 1000)
  }, [gridOffset, spawnParticles, addSkillFragments, pushState])

  const applyGravityAndCheckChain = useCallback((_startTime: number) => {
    const drops: DropAnimation[] = []
    const dropStartTime = performance.now()

    for (let c = 0; c < GRID_COLS; c++) {
      let writeRow = GRID_ROWS - 1
      for (let r = GRID_ROWS - 1; r >= 0; r--) {
        if (gridRef.current[r][c]) {
          if (r !== writeRow) {
            const rune = gridRef.current[r][c]!
            drops.push({
              rune,
              fromRow: r,
              toRow: writeRow,
              col: c,
              startTime: dropStartTime,
              duration: 400,
            })
            gridRef.current[writeRow][c] = rune
            gridRef.current[r][c] = null
          }
          writeRow--
        }
      }
    }

    if (drops.length > 0) {
      dropAnimRef.current = drops
      isAnimatingRef.current = true

      setTimeout(() => {
        dropAnimRef.current = []
        comboRef.current++
        pushState()

        let bestRegion: Array<{ row: number; col: number }> = []
        const visited = new Set<string>()

        for (let r = 0; r < GRID_ROWS; r++) {
          for (let c = 0; c < GRID_COLS; c++) {
            if (!gridRef.current[r][c]) continue
            const key = `${r},${c}`
            if (visited.has(key)) continue

            const region = findConnectedRegion(gridRef.current, r, c)
            for (const cell of region) {
              visited.add(`${cell.row},${cell.col}`)
            }

            if (region.length >= 3 && region.length > bestRegion.length) {
              bestRegion = region
            }
          }
        }

        if (bestRegion.length > 0) {
          const chainDelay = 200
          setTimeout(() => {
            const t = performance.now() / 1000
            detonateCells(bestRegion, t)
          }, chainDelay)
        } else {
          comboRef.current = 0
          isAnimatingRef.current = false
          pushState()
          checkGameOver()
        }
      }, 500)
    } else {
      comboRef.current = 0
      isAnimatingRef.current = false
      pushState()
      checkGameOver()
    }
  }, [detonateCells, pushState, checkGameOver])

  const placeRune = useCallback((row: number, col: number) => {
    if (gameOverRef.current || isAnimatingRef.current) return
    if (gridRef.current[row][col]) return

    const color = nextRuneRef.current
    const rune: Rune = { id: runeIdCounter++, color }
    gridRef.current[row][col] = rune

    const center = hexCenter(row, col, gridOffset.x, gridOffset.y)
    spawnParticles(center.x, center.y, RUNE_COLORS[color], 8)

    placeAnimRef.current = {
      row,
      col,
      startTime: performance.now(),
      duration: 300,
      color,
    }

    nextRuneRef.current = getRandomRune()
    pushState()

    setTimeout(() => {
      placeAnimRef.current = null

      const region = findConnectedRegion(gridRef.current, row, col)
      if (region.length >= 3) {
        comboRef.current = 1
        isAnimatingRef.current = true
        pushState()
        const t = performance.now() / 1000
        detonateCells(region, t)
      } else {
        checkGameOver()
      }
    }, 320)
  }, [gridOffset, spawnParticles, detonateCells, pushState, checkGameOver])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const px = (e.clientX - rect.left) * scaleX
    const py = (e.clientY - rect.top) * scaleY

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const center = hexCenter(r, c, gridOffset.x, gridOffset.y)
        if (pointInHex(px, py, center.x, center.y, HEX_SIZE - HEX_GAP / 2)) {
          const cell = gridRef.current[r][c]
          if (cell) {
            if (!isAnimatingRef.current) {
              const region = findConnectedRegion(gridRef.current, r, c)
              if (region.length >= 2) {
                comboRef.current = 1
                isAnimatingRef.current = true
                pushState()
                const t = performance.now() / 1000
                detonateCells(region, t)
              }
            }
          } else {
            placeRune(r, c)
          }
          return
        }
      }
    }
  }, [gridOffset, placeRune, detonateCells, pushState])

  const useSkill = useCallback((skillId: string): boolean => {
    if (gameOverRef.current || isAnimatingRef.current) return false

    const skill = skillsRef.current.find(s => s.id === skillId)
    if (!skill || skill.fragments < skill.maxFragments) return false

    skill.fragments = 0

    if (skillId === 'firestorm') {
      const targetColor = COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)]
      const cells: Array<{ row: number; col: number }> = []
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          if (gridRef.current[r][c]?.color === targetColor) {
            cells.push({ row: r, col: c })
          }
        }
      }
      if (cells.length > 0) {
        comboRef.current = 1
        isAnimatingRef.current = true
        pushState()
        const t = performance.now() / 1000
        detonateCells(cells, t)
      }
    } else if (skillId === 'double') {
      doubleScoreActiveRef.current = true
      pushState()
    }

    pushState()
    return true
  }, [detonateCells, pushState])

  const reset = useCallback(() => {
    gridRef.current = createEmptyGrid()
    nextRuneRef.current = getRandomRune()
    scoreRef.current = 0
    comboRef.current = 0
    gameOverRef.current = false
    totalClearedRef.current = 0
    isAnimatingRef.current = false
    particlesRef.current = []
    highlightsRef.current = []
    placeAnimRef.current = null
    dropAnimRef.current = []
    detonationWavesRef.current = []
    flashCellsRef.current = []
    doubleScoreActiveRef.current = false
    skillsRef.current = [
      { id: 'firestorm', name: '烈焰风暴', icon: '🔥', color: '#ff4757', fragments: 0, maxFragments: 20 },
      { id: 'double', name: '双倍祝福', icon: '✨', color: '#ffd700', fragments: 0, maxFragments: 12 },
    ]
    pushState()
  }, [pushState])

  useImperativeHandle(ref, () => ({
    useSkill,
    getState: () => ({
      score: scoreRef.current,
      combo: comboRef.current,
      nextRune: nextRuneRef.current,
      skills: skillsRef.current.map(s => ({ ...s })),
      gameOver: gameOverRef.current,
      totalCleared: totalClearedRef.current,
    }),
    reset,
  }), [useSkill, reset])

  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current
      if (!container) return

      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight

      const gridPixelWidth = (GRID_COLS - 0.5) * HEX_HORIZ_SPACING + HEX_WIDTH + HEX_GAP * 2
      const gridPixelHeight = (GRID_ROWS - 1) * HEX_VERT_SPACING + HEX_HEIGHT + HEX_GAP * 2

      const scaleX = containerWidth / gridPixelWidth
      const scaleY = containerHeight / gridPixelHeight
      const scale = Math.min(scaleX, scaleY, 1.5)

      const canvasWidth = gridPixelWidth * scale
      const canvasHeight = gridPixelHeight * scale

      setCanvasSize({ width: canvasWidth, height: canvasHeight })
      setGridOffset({ x: HEX_GAP, y: HEX_GAP })

      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = gridPixelWidth
        canvas.height = gridPixelHeight
        canvas.style.width = `${canvasWidth}px`
        canvas.style.height = `${canvasHeight}px`
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    let lastTime = performance.now()

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05)
      lastTime = now

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const center = hexCenter(r, c, gridOffset.x, gridOffset.y)
          drawHexagon(ctx, center.x, center.y, HEX_SIZE - HEX_GAP / 2, 'rgba(42, 42, 78, 0.6)', 'rgba(201, 168, 76, 0.2)', 1)
        }
      }

      const highlightTime = now
      for (let i = highlightsRef.current.length - 1; i >= 0; i--) {
        const hl = highlightsRef.current[i]
        const elapsed = highlightTime - hl.startTime
        if (elapsed >= hl.duration) {
          highlightsRef.current.splice(i, 1)
          continue
        }
        const alpha = 0.5 * (1 - elapsed / hl.duration)
        const center = hexCenter(hl.row, hl.col, gridOffset.x, gridOffset.y)
        drawHexagon(ctx, center.x, center.y, HEX_SIZE - HEX_GAP / 2, `rgba(255, 255, 255, ${alpha})`)
      }

      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const rune = gridRef.current[r][c]
          if (!rune) continue

          let skipDraw = false
          for (const drop of dropAnimRef.current) {
            if (drop.rune.id === rune.id) {
              skipDraw = true
              break
            }
          }
          if (skipDraw) continue

          let isFlashing = false
          let flashProgress = 0
          for (const flash of flashCellsRef.current) {
            if (flash.row === r && flash.col === c) {
              const elapsed = now / 1000 - flash.startTime
              if (elapsed >= 0 && elapsed < flash.duration) {
                isFlashing = true
                flashProgress = elapsed / flash.duration
              }
              break
            }
          }

          const center = hexCenter(r, c, gridOffset.x, gridOffset.y)
          const colorHex = RUNE_COLORS[rune.color]

          let scale = 1
          if (placeAnimRef.current && placeAnimRef.current.row === r && placeAnimRef.current.col === c) {
            const elapsed = now - placeAnimRef.current.startTime
            const progress = Math.min(elapsed / placeAnimRef.current.duration, 1)
            scale = 0.3 + 0.7 * (1 - Math.pow(1 - progress, 3))
          }

          if (isFlashing) {
            const flashIntensity = Math.sin(flashProgress * Math.PI * 3) * 0.5 + 0.5
            ctx.save()
            ctx.shadowColor = '#ffffff'
            ctx.shadowBlur = 20 * flashIntensity
            drawHexagon(
              ctx,
              center.x,
              center.y,
              (HEX_SIZE - HEX_GAP / 2 - 6) * scale,
              `rgba(255, 255, 255, ${0.5 + flashIntensity * 0.5})`,
            )
            ctx.restore()
          } else {
            const gradient = ctx.createRadialGradient(
              center.x - 5, center.y - 5, 0,
              center.x, center.y, (HEX_SIZE - HEX_GAP / 2 - 6) * scale
            )
            gradient.addColorStop(0, colorHex)
            gradient.addColorStop(1, shadeColor(colorHex, -30))

            ctx.save()
            ctx.shadowColor = colorHex
            ctx.shadowBlur = 12
            drawHexagon(
              ctx,
              center.x,
              center.y,
              (HEX_SIZE - HEX_GAP / 2 - 6) * scale,
              gradient,
              colorHex,
              1.5,
            )
            ctx.restore()

            ctx.save()
            ctx.globalAlpha = 0.4
            drawHexagon(
              ctx,
              center.x - 3,
              center.y - 3,
              (HEX_SIZE - HEX_GAP / 2 - 12) * scale,
              'rgba(255, 255, 255, 0.4)',
            )
            ctx.restore()
          }
        }
      }

      for (const drop of dropAnimRef.current) {
        const elapsed = now - drop.startTime
        const progress = Math.min(elapsed / drop.duration, 1)

        const easeProgress = cubicBezier(0.34, 1.56, 0.64, 1, progress)

        const fromCenter = hexCenter(drop.fromRow, drop.col, gridOffset.x, gridOffset.y)
        const toCenter = hexCenter(drop.toRow, drop.col, gridOffset.x, gridOffset.y)
        const y = fromCenter.y + (toCenter.y - fromCenter.y) * easeProgress
        const x = fromCenter.x

        const colorHex = RUNE_COLORS[drop.rune.color]
        const gradient = ctx.createRadialGradient(
          x - 5, y - 5, 0,
          x, y, HEX_SIZE - HEX_GAP / 2 - 6
        )
        gradient.addColorStop(0, colorHex)
        gradient.addColorStop(1, shadeColor(colorHex, -30))

        ctx.save()
        ctx.shadowColor = colorHex
        ctx.shadowBlur = 12
        drawHexagon(
          ctx,
          x,
          y,
          HEX_SIZE - HEX_GAP / 2 - 6,
          gradient,
          colorHex,
          1.5,
        )
        ctx.restore()
      }

      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        p.life -= dt / p.maxLife
        if (p.life <= 0) {
          particlesRef.current.splice(i, 1)
          continue
        }

        p.vy += 8 * dt
        p.x += p.vx
        p.y += p.vy

        ctx.save()
        ctx.globalAlpha = p.life
        ctx.fillStyle = p.color
        ctx.shadowColor = p.color
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animationId = requestAnimationFrame(render)
    }

    animationId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animationId)
  }, [gridOffset])

  return (
    <div ref={containerRef} className="game-board-container">
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onClick={handleClick}
      />
    </div>
  )
})

function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const R = (num >> 16) + amt
  const G = ((num >> 8) & 0x00ff) + amt
  const B = (num & 0x0000ff) + amt
  return (
    '#' +
    (0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255))
      .toString(16)
      .slice(1)
  )
}

function cubicBezier(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

export default GameBoard
