import {
  GameState,
  GridCell,
  Player,
  MemoryFragment,
  Footprint,
  DisplayCharacter,
  GRID_SIZE,
  CELL_SIZE,
  PLAYER_RADIUS,
  PULSE_PERIOD,
  FRAGMENT_SIZE,
  ROTATION_SPEED,
  TIMER_COLOR,
  BG_COLOR,
  WALL_COLOR_DEFAULT,
  WALL_COLOR_HIGHLIGHT,
  HIGHLIGHT_RADIUS,
  FOOTPRINT_RADIUS,
  FOOTPRINT_DURATION,
  FOOTPRINT_INITIAL_OPACITY
} from './Types'

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 }
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1)
  const c2 = hexToRgb(color2)
  const r = Math.round(c1.r + (c2.r - c1.r) * t)
  const g = Math.round(c1.g + (c2.g - c1.g) * t)
  const b = Math.round(c1.b + (c2.b - c1.b) * t)
  return `rgb(${r}, ${g}, ${b})`
}

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private offsetX: number = 0
  private offsetY: number = 0
  private scale: number = 1

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Failed to get canvas context')
    this.ctx = ctx
  }

  resize(): void {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    const mazeWidth = GRID_SIZE * CELL_SIZE
    const mazeHeight = GRID_SIZE * CELL_SIZE
    const scaleX = this.canvas.width / mazeWidth
    const scaleY = this.canvas.height / mazeHeight
    this.scale = Math.min(scaleX, scaleY) * 0.9
    this.offsetX = (this.canvas.width - mazeWidth * this.scale) / 2
    this.offsetY = (this.canvas.height - mazeHeight * this.scale) / 2
  }

  draw(state: GameState, currentTime: number): void {
    this.ctx.fillStyle = BG_COLOR
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.save()
    this.ctx.translate(this.offsetX, this.offsetY)
    this.ctx.scale(this.scale, this.scale)

    this.drawFootprints(state.footprints, currentTime)
    this.drawMaze(state.grid, state.player)
    this.drawFragments(state.fragments, currentTime)
    this.drawPlayer(state.player, currentTime)
    this.drawDisplayCharacter(state.currentDisplay, currentTime)

    this.ctx.restore()

    this.drawTimer(state.timeLeft, currentTime)

    if (state.showDialog) {
      this.drawDialog(state.userInput)
    }

    if (state.status === 'lost') {
      this.drawFailScreen(state.failAnimation)
    }

    if (state.status === 'won') {
      this.drawWinScreen()
    }
  }

  private drawMaze(grid: GridCell[][], player: Player): void {
    const playerGridX = Math.floor(player.x / CELL_SIZE)
    const playerGridY = Math.floor(player.y / CELL_SIZE)
    const wallThickness = 3

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const cell = grid[y][x]
        const dist = Math.abs(x - playerGridX) + Math.abs(y - playerGridY)
        let color = WALL_COLOR_DEFAULT
        if (dist <= HIGHLIGHT_RADIUS) {
          const t = 1 - dist / (HIGHLIGHT_RADIUS + 1)
          color = lerpColor(WALL_COLOR_DEFAULT, WALL_COLOR_HIGHLIGHT, t)
        }
        this.ctx.strokeStyle = color
        this.ctx.lineWidth = wallThickness
        this.ctx.lineCap = 'round'

        const px = x * CELL_SIZE
        const py = y * CELL_SIZE

        if (cell.walls.top) {
          this.ctx.beginPath()
          this.ctx.moveTo(px, py)
          this.ctx.lineTo(px + CELL_SIZE, py)
          this.ctx.stroke()
        }
        if (cell.walls.right) {
          this.ctx.beginPath()
          this.ctx.moveTo(px + CELL_SIZE, py)
          this.ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE)
          this.ctx.stroke()
        }
        if (cell.walls.bottom) {
          this.ctx.beginPath()
          this.ctx.moveTo(px, py + CELL_SIZE)
          this.ctx.lineTo(px + CELL_SIZE, py + CELL_SIZE)
          this.ctx.stroke()
        }
        if (cell.walls.left) {
          this.ctx.beginPath()
          this.ctx.moveTo(px, py)
          this.ctx.lineTo(px, py + CELL_SIZE)
          this.ctx.stroke()
        }
      }
    }
  }

  private drawPlayer(player: Player, currentTime: number): void {
    const pulse = (Math.sin((currentTime / 1000) * Math.PI * 2 / PULSE_PERIOD) + 1) / 2
    const glowRadius = PLAYER_RADIUS + 8 + pulse * 10
    const glowAlpha = 0.15 + pulse * 0.2

    const gradient = this.ctx.createRadialGradient(
      player.x, player.y, PLAYER_RADIUS * 0.5,
      player.x, player.y, glowRadius
    )
    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.6 + pulse * 0.3})`)
    gradient.addColorStop(0.5, `rgba(200, 230, 255, ${glowAlpha})`)
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.arc(player.x, player.y, glowRadius, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
    this.ctx.shadowBlur = 15
    this.ctx.beginPath()
    this.ctx.arc(player.x, player.y, PLAYER_RADIUS, 0, Math.PI * 2)
    this.ctx.fill()
    this.ctx.shadowBlur = 0
  }

  private drawFragments(fragments: MemoryFragment[], currentTime: number): void {
    for (const fragment of fragments) {
      if (fragment.picked && fragment.pickAnimation >= 1) continue

      const centerX = fragment.gridX * CELL_SIZE + CELL_SIZE / 2
      const centerY = fragment.gridY * CELL_SIZE + CELL_SIZE / 2

      let scale = 1
      let alpha = 0.8
      if (fragment.picked) {
        scale = 1 + fragment.pickAnimation * 0.5
        alpha = 0.8 * (1 - fragment.pickAnimation)
      }

      const floatOffset = Math.sin(currentTime / 500 + fragment.gridX + fragment.gridY) * 3

      this.ctx.save()
      this.ctx.translate(centerX, centerY + floatOffset)
      this.ctx.scale(scale, scale)
      this.ctx.globalAlpha = alpha

      const gradient = this.ctx.createRadialGradient(0, 0, 2, 0, 0, FRAGMENT_SIZE / 2 + 8)
      gradient.addColorStop(0, 'rgba(100, 200, 255, 0.6)')
      gradient.addColorStop(1, 'rgba(79, 195, 247, 0)')
      this.ctx.fillStyle = gradient
      this.ctx.beginPath()
      this.ctx.arc(0, 0, FRAGMENT_SIZE / 2 + 8, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.fillStyle = 'rgba(79, 195, 247, 0.7)'
      this.ctx.strokeStyle = 'rgba(150, 220, 255, 0.9)'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2
        const px = Math.cos(angle) * (FRAGMENT_SIZE / 2)
        const py = Math.sin(angle) * (FRAGMENT_SIZE / 2)
        if (i === 0) this.ctx.moveTo(px, py)
        else this.ctx.lineTo(px, py)
      }
      this.ctx.closePath()
      this.ctx.fill()
      this.ctx.stroke()

      this.ctx.restore()
    }
  }

  private drawFootprints(footprints: Footprint[], currentTime: number): void {
    for (const fp of footprints) {
      const age = currentTime - fp.createdAt
      if (age >= FOOTPRINT_DURATION) continue
      const alpha = FOOTPRINT_INITIAL_OPACITY * (1 - age / FOOTPRINT_DURATION)
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      this.ctx.beginPath()
      this.ctx.arc(fp.x, fp.y, FOOTPRINT_RADIUS, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  private drawDisplayCharacter(display: DisplayCharacter | null, currentTime: number): void {
    if (!display) return
    const elapsed = currentTime - display.startTime
    if (elapsed >= display.duration) return

    const centerX = (GRID_SIZE * CELL_SIZE) / 2
    const centerY = (GRID_SIZE * CELL_SIZE) / 2
    const rotation = (elapsed / 1000) * ROTATION_SPEED

    let alpha = 1
    if (elapsed < 200) alpha = elapsed / 200
    else if (elapsed > display.duration - 300) alpha = (display.duration - elapsed) / 300

    this.ctx.save()
    this.ctx.globalAlpha = alpha
    this.ctx.translate(centerX, centerY)
    this.ctx.rotate((rotation * Math.PI) / 180)

    this.ctx.shadowColor = 'rgba(79, 195, 247, 0.8)'
    this.ctx.shadowBlur = 20

    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 48px SimSun, serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(display.char, 0, 0)

    this.ctx.restore()
  }

  private drawTimer(timeLeft: number, currentTime: number): void {
    const blink = Math.floor(currentTime / 500) % 2 === 0
    const alpha = blink ? 1.0 : 0.8

    this.ctx.fillStyle = `rgba(211, 47, 47, ${alpha})`
    this.ctx.font = 'bold 20px SimSun, serif'
    this.ctx.textAlign = 'left'
    this.ctx.textBaseline = 'top'
    this.ctx.shadowColor = TIMER_COLOR
    this.ctx.shadowBlur = 8
    this.ctx.fillText(`⏱ ${timeLeft}s`, 20, 20)
    this.ctx.shadowBlur = 0
  }

  private drawDialog(userInput: string): void {
    const dialogWidth = 400
    const dialogHeight = 200
    const dialogX = (this.canvas.width - dialogWidth) / 2
    const dialogY = (this.canvas.height - dialogHeight) / 2

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'
    this.ctx.beginPath()
    const radius = 16
    this.ctx.moveTo(dialogX + radius, dialogY)
    this.ctx.lineTo(dialogX + dialogWidth - radius, dialogY)
    this.ctx.quadraticCurveTo(dialogX + dialogWidth, dialogY, dialogX + dialogWidth, dialogY + radius)
    this.ctx.lineTo(dialogX + dialogWidth, dialogY + dialogHeight - radius)
    this.ctx.quadraticCurveTo(dialogX + dialogWidth, dialogY + dialogHeight, dialogX + dialogWidth - radius, dialogY + dialogHeight)
    this.ctx.lineTo(dialogX + radius, dialogY + dialogHeight)
    this.ctx.quadraticCurveTo(dialogX, dialogY + dialogHeight, dialogX, dialogY + dialogHeight - radius)
    this.ctx.lineTo(dialogX, dialogY + radius)
    this.ctx.quadraticCurveTo(dialogX, dialogY, dialogX + radius, dialogY)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.strokeStyle = 'rgba(79, 195, 247, 0.5)'
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 18px SimSun, serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'top'
    this.ctx.fillText('请按顺序输入记忆的字符', this.canvas.width / 2, dialogY + 30)

    this.ctx.fillStyle = 'rgba(79, 195, 247, 0.9)'
    this.ctx.font = 'bold 36px SimSun, serif'
    this.ctx.fillText(userInput + '_', this.canvas.width / 2, dialogY + 85)

    this.ctx.fillStyle = 'rgba(200, 200, 200, 0.8)'
    this.ctx.font = '14px SimSun, serif'
    this.ctx.fillText('输入完成后按 Enter 键确认', this.canvas.width / 2, dialogY + 155)
  }

  private drawFailScreen(animation: number): void {
    const scale = 1 - animation * 0.3
    this.ctx.fillStyle = 'rgba(180, 30, 30, 0.85)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.save()
    this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2)
    this.ctx.scale(scale, scale)

    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 56px SimSun, serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.shadowColor = 'rgba(255, 100, 100, 0.8)'
    this.ctx.shadowBlur = 30
    this.ctx.fillText('挑战失败', 0, 0)
    this.ctx.shadowBlur = 0

    this.ctx.restore()
  }

  private drawWinScreen(): void {
    this.ctx.fillStyle = 'rgba(13, 100, 60, 0.85)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 56px SimSun, serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.shadowColor = 'rgba(100, 255, 150, 0.8)'
    this.ctx.shadowBlur = 30
    this.ctx.fillText('挑战成功！', this.canvas.width / 2, this.canvas.height / 2)
    this.ctx.shadowBlur = 0
  }
}
