import {
  GRID_SIZE,
  CELL_SIZE,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  INITIAL_TIME,
  CHARACTER_DISPLAY_DURATION,
  FOOTPRINT_DURATION,
  FOOTPRINT_INITIAL_OPACITY,
  DisplayCharacter,
  Footprint,
  GridCell
} from './Types'
import { MazeGenerator } from './MazeGenerator'
import { MemoryManager } from './MemoryManager'
import { Renderer } from './Renderer'
import { useGameStore } from './store'

export class GameEngine {
  private canvas: HTMLCanvasElement
  private renderer: Renderer
  private mazeGenerator: MazeGenerator
  private memoryManager: MemoryManager
  private animationFrameId: number | null = null
  private lastTime: number = 0
  private timerAccumulator: number = 0
  private keys: Set<string> = new Set()
  private lastFootprintTime: number = 0
  private initialized: boolean = false
  private failAnimationStart: number = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.renderer = new Renderer(canvas)
    this.mazeGenerator = new MazeGenerator()
    this.memoryManager = new MemoryManager()
  }

  init(): void {
    this.renderer.resize()
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('keydown', this.handleKeyDown)
    window.addEventListener('keyup', this.handleKeyUp)

    this.startNewGame()
    this.initialized = true
    this.lastTime = performance.now()
    this.gameLoop(this.lastTime)
  }

  destroy(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
    }
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('keydown', this.handleKeyDown)
    window.removeEventListener('keyup', this.handleKeyUp)
  }

  private handleResize = (): void => {
    this.renderer.resize()
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    const state = useGameStore.getState()

    if (state.showDialog) {
      if (e.key === 'Enter') {
        this.checkInputSequence()
      } else if (e.key === 'Backspace') {
        useGameStore.setState({ userInput: state.userInput.slice(0, -1) })
      } else if (/^[a-zA-Z0-9]$/.test(e.key)) {
        useGameStore.setState({ userInput: state.userInput + e.key.toUpperCase() })
      }
      return
    }

    if ((state.status === 'lost' || state.status === 'won') && e.key === ' ') {
      this.startNewGame()
      return
    }

    this.keys.add(e.key.toLowerCase())
  }

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase())
  }

  private checkInputSequence(): void {
    const state = useGameStore.getState()
    const isCorrect = this.memoryManager.checkSequence(state.userInput)
    if (isCorrect) {
      useGameStore.setState({ status: 'won', showDialog: false })
    } else {
      useGameStore.setState({ userInput: '' })
    }
  }

  startNewGame(): void {
    useGameStore.getState().resetGame()

    const startTime = performance.now()
    const grid = this.mazeGenerator.generate()
    console.log(`迷宫生成时间: ${performance.now() - startTime}ms`)

    this.memoryManager.init(this.mazeGenerator)

    useGameStore.setState({
      grid,
      fragments: this.memoryManager.getFragments()
    })

    this.keys.clear()
    this.timerAccumulator = 0
    this.failAnimationStart = 0
  }

  private gameLoop = (currentTime: number): void => {
    const deltaTime = Math.min(currentTime - this.lastTime, 50)
    this.lastTime = currentTime

    this.update(deltaTime, currentTime)

    const state = useGameStore.getState()
    this.renderer.draw(state, currentTime)

    this.animationFrameId = requestAnimationFrame(this.gameLoop)
  }

  private update(deltaTime: number, currentTime: number): void {
    const state = useGameStore.getState()

    if (state.status === 'lost') {
      if (this.failAnimationStart === 0) {
        this.failAnimationStart = currentTime
      }
      const animProgress = Math.min(1, (currentTime - this.failAnimationStart) / 800)
      useGameStore.setState({ failAnimation: animProgress })
      return
    }

    if (state.status === 'won') return

    if (state.status === 'playing' && !state.showDialog) {
      this.timerAccumulator += deltaTime
      if (this.timerAccumulator >= 1000) {
        this.timerAccumulator -= 1000
        const newTime = state.timeLeft - 1
        useGameStore.setState({ timeLeft: newTime })
        if (newTime <= 0) {
          useGameStore.setState({ status: 'lost' })
          return
        }
      }

      this.updatePlayer(deltaTime, currentTime)
      this.checkFragmentPickup(currentTime)
      this.memoryManager.updateAnimations(deltaTime)
      useGameStore.setState({ fragments: [...this.memoryManager.getFragments()] })
    }

    this.updateFootprints(currentTime)
    this.updateDisplayCharacter(currentTime)
    this.checkAllFragmentsPicked()
  }

  private updatePlayer(deltaTime: number, currentTime: number): void {
    const state = useGameStore.getState()
    let { x, y } = state.player
    const speed = PLAYER_SPEED

    let dx = 0
    let dy = 0

    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= speed
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += speed
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= speed
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += speed

    if (dx !== 0 || dy !== 0) {
      const newX = this.resolveCollisionX(x, y, dx)
      const newY = this.resolveCollisionY(newX, y, dy)

      if (newX !== x || newY !== y) {
        useGameStore.setState({
          player: { ...state.player, x: newX, y: newY }
        })

        if (currentTime - this.lastFootprintTime > 120) {
          this.addFootprint(newX, newY, currentTime)
          this.lastFootprintTime = currentTime
        }
      }
    }
  }

  private resolveCollisionX(x: number, y: number, dx: number): number {
    if (dx === 0) return x
    const newX = x + dx
    const state = useGameStore.getState()
    const grid = state.grid

    const checkPoints = [
      { px: newX + (dx > 0 ? PLAYER_RADIUS : -PLAYER_RADIUS), py: y - PLAYER_RADIUS + 1 },
      { px: newX + (dx > 0 ? PLAYER_RADIUS : -PLAYER_RADIUS), py: y },
      { px: newX + (dx > 0 ? PLAYER_RADIUS : -PLAYER_RADIUS), py: y + PLAYER_RADIUS - 1 }
    ]

    for (const pt of checkPoints) {
      if (pt.px < 0 || pt.px >= GRID_SIZE * CELL_SIZE) return x
      if (pt.py < 0 || pt.py >= GRID_SIZE * CELL_SIZE) continue

      const gridX = Math.floor(pt.px / CELL_SIZE)
      const gridY = Math.floor(pt.py / CELL_SIZE)
      const cell = grid[gridY]?.[gridX]
      if (!cell) continue

      const cellLeft = gridX * CELL_SIZE
      const cellRight = cellLeft + CELL_SIZE
      const cellTop = gridY * CELL_SIZE
      const cellBottom = cellTop + CELL_SIZE

      if (dx > 0 && cell.walls.left && pt.px > cellLeft && pt.px < cellLeft + 4) {
        return cellLeft - PLAYER_RADIUS - 0.1
      }
      if (dx < 0 && cell.walls.right && pt.px < cellRight && pt.px > cellRight - 4) {
        return cellRight + PLAYER_RADIUS + 0.1
      }
    }
    return newX
  }

  private resolveCollisionY(x: number, y: number, dy: number): number {
    if (dy === 0) return y
    const newY = y + dy
    const state = useGameStore.getState()
    const grid = state.grid

    const checkPoints = [
      { px: x - PLAYER_RADIUS + 1, py: newY + (dy > 0 ? PLAYER_RADIUS : -PLAYER_RADIUS) },
      { px: x, py: newY + (dy > 0 ? PLAYER_RADIUS : -PLAYER_RADIUS) },
      { px: x + PLAYER_RADIUS - 1, py: newY + (dy > 0 ? PLAYER_RADIUS : -PLAYER_RADIUS) }
    ]

    for (const pt of checkPoints) {
      if (pt.py < 0 || pt.py >= GRID_SIZE * CELL_SIZE) return y
      if (pt.px < 0 || pt.px >= GRID_SIZE * CELL_SIZE) continue

      const gridX = Math.floor(pt.px / CELL_SIZE)
      const gridY = Math.floor(pt.py / CELL_SIZE)
      const cell = grid[gridY]?.[gridX]
      if (!cell) continue

      const cellLeft = gridX * CELL_SIZE
      const cellRight = cellLeft + CELL_SIZE
      const cellTop = gridY * CELL_SIZE
      const cellBottom = cellTop + CELL_SIZE

      if (dy > 0 && cell.walls.top && pt.py > cellTop && pt.py < cellTop + 4) {
        return cellTop - PLAYER_RADIUS - 0.1
      }
      if (dy < 0 && cell.walls.bottom && pt.py < cellBottom && pt.py > cellBottom - 4) {
        return cellBottom + PLAYER_RADIUS + 0.1
      }
    }
    return newY
  }

  private addFootprint(x: number, y: number, currentTime: number): void {
    const footprint: Footprint = {
      x,
      y,
      opacity: FOOTPRINT_INITIAL_OPACITY,
      createdAt: currentTime
    }
    const state = useGameStore.getState()
    useGameStore.setState({ footprints: [...state.footprints, footprint] })
  }

  private updateFootprints(currentTime: number): void {
    const state = useGameStore.getState()
    const filtered = state.footprints.filter(
      fp => currentTime - fp.createdAt < FOOTPRINT_DURATION
    )
    if (filtered.length !== state.footprints.length) {
      useGameStore.setState({ footprints: filtered })
    }
  }

  private checkFragmentPickup(currentTime: number): void {
    const state = useGameStore.getState()
    const picked = this.memoryManager.pickFragment(state.player.x, state.player.y)
    if (picked) {
      const display: DisplayCharacter = {
        char: picked.character,
        rotation: 0,
        startTime: currentTime,
        duration: CHARACTER_DISPLAY_DURATION
      }
      useGameStore.setState({
        currentDisplay: display,
        pickedSequence: [...this.memoryManager.getPickedSequence()]
      })
    }
  }

  private updateDisplayCharacter(currentTime: number): void {
    const state = useGameStore.getState()
    if (state.currentDisplay && currentTime - state.currentDisplay.startTime >= state.currentDisplay.duration) {
      useGameStore.setState({ currentDisplay: null })
    }
  }

  private checkAllFragmentsPicked(): void {
    const state = useGameStore.getState()
    if (state.status === 'playing' && !state.showDialog && this.memoryManager.allPicked() && !state.currentDisplay) {
      useGameStore.setState({ showDialog: true, status: 'input', userInput: '' })
    }
  }
}
