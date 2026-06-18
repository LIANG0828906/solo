import { GameEngine } from '../core/GameEngine'
import {
  Unit,
  ELEMENT_COLORS,
  ELEMENT_NAMES,
  CardConfig
} from '../data/GameData'

interface CardRenderState {
  hoveredCardIndex: number | null
  draggingCardIndex: number | null
  dragOffset: { x: number; y: number }
  selectedUnitId: string | null
  hoveredEnemyId: string | null
}

export class Renderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private engine: GameEngine
  private width: number = 0
  private height: number = 0

  private renderState: CardRenderState = {
    hoveredCardIndex: null,
    draggingCardIndex: null,
    dragOffset: { x: 0, y: 0 },
    selectedUnitId: null,
    hoveredEnemyId: null
  }

  private frameWarningThreshold: number = 14

  private pulseAlpha: number = 0
  private pulseDirection: number = 1

  private victoryTextAlpha: number = 0
  private defeatTextAlpha: number = 0

  constructor(canvas: HTMLCanvasElement, engine: GameEngine) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法获取Canvas上下文')
    this.ctx = ctx
    this.engine = engine

    this.resize()
    window.addEventListener('resize', () => this.resize())
    this.setupInputHandlers()
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.canvas.width = this.width * dpr
    this.canvas.height = this.height * dpr
    this.ctx.scale(dpr, dpr)
    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`
  }

  private setupInputHandlers(): void {
    let isDragging = false
    let startX = 0
    let startY = 0

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      this.updateHoverState(x, y)

      if (isDragging && this.renderState.draggingCardIndex !== null) {
        this.renderState.dragOffset = {
          x: x - startX,
          y: y - startY
        }
      }
    })

    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      const cardIndex = this.getCardAtPosition(x, y)
      if (cardIndex !== null) {
        isDragging = true
        this.renderState.draggingCardIndex = cardIndex
        startX = x
        startY = y
        this.renderState.dragOffset = { x: 0, y: 0 }
      }
    })

    this.canvas.addEventListener('mouseup', (e) => {
      if (isDragging && this.renderState.draggingCardIndex !== null) {
        const rect = this.canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        const hand = this.engine.getPlayerHand()
        const playerUnits = this.engine.getPlayerUnits()
        const card = hand[this.renderState.draggingCardIndex]

        if (card && playerUnits.length < 3) {
          const droppedOnEnemy = this.getEnemyUnitAtPosition(x, y)
          if (droppedOnEnemy) {
            const playerUnitsAlive = playerUnits.filter(u => u.hp > 0)
            if (playerUnitsAlive.length > 0) {
              const attacker = playerUnitsAlive[0]
              this.engine.playerAttack(attacker.id, droppedOnEnemy)
            }
          } else {
            this.engine.playerPlayCard(card.id)
          }
        }

        isDragging = false
        this.renderState.draggingCardIndex = null
      }
    })

    this.canvas.addEventListener('mouseleave', () => {
      this.renderState.hoveredCardIndex = null
      this.renderState.hoveredEnemyId = null
    })
  }

  private updateHoverState(x: number, y: number): void {
    this.renderState.hoveredCardIndex = this.getCardAtPosition(x, y)
    this.renderState.hoveredEnemyId = this.getEnemyUnitAtPosition(x, y)
  }

  private getCardAtPosition(x: number, y: number): number | null {
    const hand = this.engine.getPlayerHand()
    if (hand.length === 0) return null

    const cardWidth = 70
    const cardHeight = 100
    const spacing = 15
    const totalWidth = hand.length * cardWidth + (hand.length - 1) * spacing
    const startX = (this.width - totalWidth) / 2
    const cardY = this.height - 120 + 10

    for (let i = 0; i < hand.length; i++) {
      const cardX = startX + i * (cardWidth + spacing)
      if (x >= cardX && x <= cardX + cardWidth &&
          y >= cardY && y <= cardY + cardHeight) {
        return i
      }
    }
    return null
  }

  private getEnemyUnitAtPosition(x: number, y: number): string | null {
    const aiUnits = this.engine.getAiUnits()
    const unitRadius = 36

    for (let i = 0; i < aiUnits.length; i++) {
      const unit = aiUnits[i]
      if (unit.hp <= 0) continue

      const pos = this.getUnitPosition(i, aiUnits.length, false)
      const dx = x - pos.x
      const dy = y - pos.y
      if (dx * dx + dy * dy <= unitRadius * unitRadius) {
        return unit.id
      }
    }
    return null
  }

  private getUnitPosition(index: number, total: number, isPlayer: boolean): { x: number; y: number } {
    const spacing = 100
    const totalWidth = total * 36 * 2 + (total - 1) * spacing
    const startX = (this.width - totalWidth) / 2 + 36
    const y = isPlayer ? this.height - 200 : 120

    return {
      x: startX + index * (72 + spacing),
      y
    }
  }

  render(_timestamp: number): void {
    const frameStartTime = performance.now()

    const shake = this.engine.getScreenShake()

    this.ctx.save()
    this.ctx.translate(shake.x, shake.y)

    this.drawBackground()
    this.drawPulseEffect()
    this.drawBattleLogs()
    this.drawTurnInfo()
    this.drawAiUnits()
    this.drawPlayerUnits()
    this.drawHandCards()
    this.drawGameEndText()
    this.drawAiThinking()
    this.drawParticles()
    this.drawFps()

    this.ctx.restore()

    const frameTime = performance.now() - frameStartTime
    if (frameTime > this.frameWarningThreshold) {
      console.warn(`帧渲染时间过长: ${frameTime.toFixed(2)}ms`)
    }
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, '#1a1a3e')
    gradient.addColorStop(0.5, '#0f0f2e')
    gradient.addColorStop(1, '#1a1a3e')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height)

    this.ctx.strokeStyle = 'rgba(100, 100, 150, 0.1)'
    this.ctx.lineWidth = 1
    const gridSize = 50
    for (let x = 0; x < this.width; x += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(x, 0)
      this.ctx.lineTo(x, this.height)
      this.ctx.stroke()
    }
    for (let y = 0; y < this.height; y += gridSize) {
      this.ctx.beginPath()
      this.ctx.moveTo(0, y)
      this.ctx.lineTo(this.width, y)
      this.ctx.stroke()
    }
  }

  private drawPulseEffect(): void {
    const phase = this.engine.getBattlePhase()
    const isPlayerTurn = this.engine.getIsPlayerTurn()

    let pulseColor: string
    if (phase === 'prepare') {
      pulseColor = isPlayerTurn ? '#4CAF50' : '#F44336'
    } else if (phase === 'action') {
      pulseColor = isPlayerTurn ? '#2196F3' : '#F44336'
    } else {
      pulseColor = '#FFD700'
    }

    this.pulseAlpha += 0.02 * this.pulseDirection
    if (this.pulseAlpha >= 0.3) this.pulseDirection = -1
    if (this.pulseAlpha <= 0.1) this.pulseDirection = 1

    this.ctx.save()
    this.ctx.strokeStyle = pulseColor
    this.ctx.lineWidth = 4
    this.ctx.globalAlpha = this.pulseAlpha
    this.ctx.strokeRect(10, 10, this.width - 20, this.height - 20)
    this.ctx.restore()
  }

  private drawTurnInfo(): void {
    const turn = this.engine.getCurrentTurn()
    const phase = this.engine.getBattlePhase()
    const isPlayerTurn = this.engine.getIsPlayerTurn()
    const timeRemaining = this.engine.getPhaseTimeRemaining()

    this.ctx.save()
    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 18px Microsoft YaHei'
    this.ctx.textAlign = 'center'

    const turnText = `第 ${turn} 回合`
    this.ctx.fillText(turnText, this.width / 2, 30)

    let phaseText = ''
    switch (phase) {
      case 'prepare': phaseText = '准备阶段'; break
      case 'action': phaseText = '行动阶段'; break
      case 'settle': phaseText = '结算阶段'; break
    }
    this.ctx.font = '14px Microsoft YaHei'
    this.ctx.fillStyle = isPlayerTurn ? '#4CAF50' : '#F44336'
    this.ctx.fillText(phaseText, this.width / 2, 55)

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    this.ctx.fillText(`${(timeRemaining / 1000).toFixed(1)}s`, this.width / 2, 75)

    const barWidth = 200
    const barHeight = 4
    const barX = (this.width - barWidth) / 2
    const barY = 85
    const progress = this.engine.getPhaseProgress()

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'
    this.ctx.fillRect(barX, barY, barWidth, barHeight)

    this.ctx.fillStyle = isPlayerTurn ? '#4CAF50' : '#F44336'
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight)

    this.ctx.restore()
  }

  private drawBattleLogs(): void {
    const logs = this.engine.getBattleLogs()
    const maxLogs = 5
    const startY = 110

    this.ctx.save()
    this.ctx.font = '12px Microsoft YaHei'
    this.ctx.textAlign = 'center'

    for (let i = 0; i < Math.min(logs.length, maxLogs); i++) {
      const log = logs[i]
      const y = startY + i * 20
      const alpha = 1 - i * 0.15
      this.ctx.globalAlpha = alpha

      switch (log.type) {
        case 'damage':
          this.ctx.fillStyle = '#FF6B6B'
          break
        case 'counter':
          this.ctx.fillStyle = '#FFD700'
          break
        case 'skill':
          this.ctx.fillStyle = '#4CAF50'
          break
        case 'system':
          this.ctx.fillStyle = '#9C27B0'
          break
        default:
          this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      }

      this.ctx.fillText(log.message, this.width / 2, y)
    }

    this.ctx.restore()
  }

  private drawAiUnits(): void {
    const units = this.engine.getAiUnits()
    this.drawUnits(units, false)
  }

  private drawPlayerUnits(): void {
    const units = this.engine.getPlayerUnits()
    this.drawUnits(units, true)
  }

  private drawUnits(units: Unit[], isPlayer: boolean): void {
    const unitRadius = 36

    for (let i = 0; i < units.length; i++) {
      const unit = units[i]
      const pos = this.getUnitPosition(i, units.length, isPlayer)
      const isHovered = !isPlayer && this.renderState.hoveredEnemyId === unit.id
      const isSelected = isPlayer && this.renderState.selectedUnitId === unit.id

      this.ctx.save()

      if (unit.hp <= 0) {
        this.ctx.globalAlpha = 0.3
      }

      const color = ELEMENT_COLORS[unit.element]

      if (isHovered || isSelected) {
        this.ctx.shadowColor = color
        this.ctx.shadowBlur = 20
      }

      this.ctx.beginPath()
      this.ctx.arc(pos.x, pos.y, unitRadius, 0, Math.PI * 2)
      this.ctx.fillStyle = color
      this.ctx.fill()

      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      this.ctx.lineWidth = 2
      this.ctx.stroke()

      this.ctx.shadowBlur = 0
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
      this.ctx.beginPath()
      this.ctx.arc(pos.x, pos.y, unitRadius - 8, 0, Math.PI * 2)
      this.ctx.fill()

      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = 'bold 16px Microsoft YaHei'
      this.ctx.textAlign = 'center'
      this.ctx.textBaseline = 'middle'
      this.ctx.fillText(ELEMENT_NAMES[unit.element], pos.x, pos.y - 5)

      this.ctx.font = '10px Microsoft YaHei'
      this.ctx.fillText(unit.name, pos.x, pos.y + 12)

      const hpBarWidth = 60
      const hpBarHeight = 6
      const hpBarX = pos.x - hpBarWidth / 2
      const hpBarY = pos.y + unitRadius + 8

      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth, hpBarHeight)

      const hpPercent = unit.hp / unit.maxHp
      let hpColor = '#4CAF50'
      if (hpPercent < 0.3) hpColor = '#F44336'
      else if (hpPercent < 0.6) hpColor = '#FFC107'

      this.ctx.fillStyle = hpColor
      this.ctx.fillRect(hpBarX, hpBarY, hpBarWidth * hpPercent, hpBarHeight)

      this.ctx.fillStyle = '#ffffff'
      this.ctx.font = '10px Microsoft YaHei'
      this.ctx.fillText(`${unit.hp}/${unit.maxHp}`, pos.x, hpBarY + hpBarHeight + 12)

      if (unit.shield > 0) {
        this.ctx.fillStyle = '#2196F3'
        this.ctx.font = '10px Microsoft YaHei'
        this.ctx.fillText(`护盾: ${unit.shield}`, pos.x, hpBarY + hpBarHeight + 24)
      }

      if (unit.isStunned) {
        this.ctx.fillStyle = '#9C27B0'
        this.ctx.font = 'bold 12px Microsoft YaHei'
        this.ctx.fillText('眩晕', pos.x, pos.y - unitRadius - 10)
      }

      if (unit.statusEffects.length > 0) {
        let effectY = pos.y - unitRadius - 25
        unit.statusEffects.forEach(effect => {
          this.ctx.fillStyle = '#FF9800'
          this.ctx.font = '9px Microsoft YaHei'
          this.ctx.fillText(`${effect.type}(${effect.remainingTurns}`, pos.x, effectY)
          effectY -= 12
        })
      }

      this.ctx.restore()
    }
  }

  private drawHandCards(): void {
    const hand = this.engine.getPlayerHand()
    if (hand.length === 0) return

    const cardWidth = 70
    const cardHeight = 100
    const spacing = 15
    const totalWidth = hand.length * cardWidth + (hand.length - 1) * spacing
    const startX = (this.width - totalWidth) / 2
    const cardY = this.height - 120 + 10

    this.ctx.save()
    this.ctx.fillStyle = 'rgba(10, 10, 30, 0.7)'
    this.ctx.fillRect(0, this.height - 120, this.width, 120)

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(0, this.height - 120, this.width, 1)

    for (let i = 0; i < hand.length; i++) {
      const card = hand[i]
      let x = startX + i * (cardWidth + spacing)
      let y = cardY
      let scale = 1

      const isHovered = this.renderState.hoveredCardIndex === i
      const isDragging = this.renderState.draggingCardIndex === i

      if (isHovered || isDragging) {
        scale = 1.1
        y -= 12
      }

      if (isDragging) {
        x += this.renderState.dragOffset.x
        y += this.renderState.dragOffset.y
      }

      const centerX = x + cardWidth / 2
      const centerY = y + cardHeight / 2

      this.ctx.save()
      this.ctx.translate(centerX, centerY)
      this.ctx.scale(scale, scale)
      this.ctx.translate(-cardWidth / 2, -cardHeight / 2)

      this.drawCard(card, 0, 0, cardWidth, cardHeight)

      this.ctx.restore()
    }

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    this.ctx.font = '12px Microsoft YaHei'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`牌库: ${this.engine.getCardSystem().getPlayerDeckCount()}`, 20, this.height - 10)
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`手牌: ${hand.length}/${this.engine.getCardSystem().getMaxHandSize()}`, this.width - 20, this.height - 10)

    this.ctx.restore()
  }

  private drawCard(card: CardConfig, x: number, y: number, width: number, height: number): void {
    const radius = 8
    const color = ELEMENT_COLORS[card.element]

    this.ctx.fillStyle = color
    this.roundRect(x, y, width, height, radius)
    this.ctx.fill()

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    this.ctx.lineWidth = 1
    this.roundRect(x, y, width, height, radius)
    this.ctx.stroke()

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
    this.ctx.beginPath()
    this.ctx.arc(x + width / 2, y + 30, 20, 0, Math.PI * 2)
    this.ctx.fill()

    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 16px Microsoft YaHei'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText(ELEMENT_NAMES[card.element], x + width / 2, y + 30)

    this.ctx.fillStyle = '#ffffff'
    this.ctx.font = 'bold 11px Microsoft YaHei'
    this.ctx.fillText(card.name, x + width / 2, y + 58)

    this.ctx.font = '9px Microsoft YaHei'
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    this.ctx.fillText(`攻: ${card.attack}`, x + width / 2, y + 75)

    this.ctx.fillText(`血: ${card.maxHp}`, x + width / 2, y + 88)
  }

  private roundRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + r, y)
    this.ctx.lineTo(x + w - r, y)
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    this.ctx.lineTo(x + w, y + h - r)
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    this.ctx.lineTo(x + r, y + h)
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    this.ctx.lineTo(x, y + r)
    this.ctx.quadraticCurveTo(x, y, x + r, y)
    this.ctx.closePath()
  }

  private drawParticles(): void {
    const particles = this.engine.getParticles()

    this.ctx.save()
    particles.forEach(p => {
      const alpha = p.life / p.maxLife
      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = p.color
      this.ctx.beginPath()
      this.ctx.arc(this.width / 2 + p.x * 10, this.height / 2 + p.y * 10, p.size, 0, Math.PI * 2)
      this.ctx.fill()
    })
    this.ctx.restore()
  }

  private drawGameEndText(): void {
    const gameState = this.engine.getGameState()
    if (gameState === 'playing') return

    this.ctx.save()
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    if (gameState === 'playerWin') {
      if (this.victoryTextAlpha < 1) {
        this.victoryTextAlpha += 0.02
      }
      this.ctx.globalAlpha = this.victoryTextAlpha
      this.ctx.fillStyle = '#FFD700'
      this.ctx.font = 'bold 64px Microsoft YaHei'
      this.ctx.shadowColor = '#FFD700'
      this.ctx.shadowBlur = 30
      this.ctx.fillText('胜', this.width / 2, this.height / 2)
    } else if (gameState === 'aiWin') {
      if (this.defeatTextAlpha < 1) {
        this.defeatTextAlpha += 0.02
      }
      this.ctx.globalAlpha = this.defeatTextAlpha
      this.ctx.fillStyle = '#8B0000'
      this.ctx.font = 'bold 64px Microsoft YaHei'
      this.ctx.shadowColor = '#8B0000'
      this.ctx.shadowBlur = 30
      this.ctx.fillText('败', this.width / 2, this.height / 2)
    }

    this.ctx.restore()
  }

  private drawAiThinking(): void {
    if (!this.engine.isAiThinking()) return

    this.ctx.save()
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    this.ctx.font = '16px Microsoft YaHei'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('AI思考中...', this.width / 2, this.height / 2)
    this.ctx.restore()
  }

  private drawFps(): void {
    const fps = this.engine.getFps()
    this.ctx.save()
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    this.ctx.font = '12px monospace'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`FPS: ${fps}`, 10, 20)
    this.ctx.restore()
  }

  getWidth(): number {
    return this.width
  }

  getHeight(): number {
    return this.height
  }
}
