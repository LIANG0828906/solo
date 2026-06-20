import { CardSystem } from './CardSystem'
import { BattleSystem, BattleResult } from './BattleSystem'
import {
  Unit,
  BattlePhase,
  GameState,
  ElementType,
  createUnitFromCard,
  CardConfig
} from '../data/GameData'

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

export interface DamageNumber {
  x: number
  y: number
  value: number
  life: number
  maxLife: number
  color: string
  isCritical: boolean
}

export interface TweenAnimation {
  targetId: string
  property: string
  startValue: number
  endValue: number
  duration: number
  elapsed: number
  ease: (t: number) => number
}

export class GameEngine {
  private cardSystem: CardSystem
  private battleSystem: BattleSystem

  private playerUnits: Unit[] = []
  private aiUnits: Unit[] = []

  private battlePhase: BattlePhase = 'prepare'
  private gameState: GameState = 'playing'
  private currentTurn: number = 1
  private isPlayerTurn: boolean = true

  private phaseTimer: number = 0
  private readonly prepareDuration = 5000
  private readonly actionDuration = 20000
  private readonly settleDuration = 2000

  private particles: Particle[] = []
  private damageNumbers: DamageNumber[] = []
  private animations: TweenAnimation[] = []

  private lastTime: number = 0
  private deltaTime: number = 0
  private frameCount: number = 0
  private fps: number = 0
  private fpsUpdateTime: number = 0

  private aiThinking: boolean = false
  private aiThinkTimer: number = 0
  private readonly aiThinkDuration = 500

  private screenShake: number = 0
  private screenShakeIntensity: number = 0

  private onStateChange?: () => void

  constructor() {
    this.cardSystem = new CardSystem()
    this.battleSystem = new BattleSystem()
  }

  initialize(): void {
    this.particles = []
    this.damageNumbers = []
    this.animations = []
    this.currentTurn = 1
    this.isPlayerTurn = true
    this.gameState = 'playing'
    this.screenShake = 0
    this.aiThinking = false

    this.cardSystem.reset()

    for (let i = 0; i < 3; i++) {
      this.cardSystem.drawPlayerCard()
      this.cardSystem.drawAiCard()
    }

    const playerHand = this.cardSystem.getPlayerHand()
    const aiHand = this.cardSystem.getAiHand()

    if (playerHand.length > 0) {
      const firstCard = playerHand[0]
      const playerUnit = createUnitFromCard(firstCard)
      playerUnit.id = `player_unit_start_${Date.now()}`
      this.playerUnits = [playerUnit]
      this.cardSystem.playCard(firstCard.id, 'player', [])
    }

    if (aiHand.length > 0) {
      const firstCard = aiHand[0]
      const aiUnit = createUnitFromCard(firstCard)
      aiUnit.id = `ai_unit_start_${Date.now()}`
      this.aiUnits = [aiUnit]
      this.cardSystem.playCard(firstCard.id, 'ai', [])
    }

    this.startPhase('prepare')
    this.battleSystem.addLog('战斗开始！第 1 回合', 'system')
  }

  update(timestamp: number): void {
    if (this.lastTime === 0) this.lastTime = timestamp
    this.deltaTime = timestamp - this.lastTime
    this.lastTime = timestamp

    this.frameCount++
    this.fpsUpdateTime += this.deltaTime
    if (this.fpsUpdateTime >= 1000) {
      this.fps = Math.round((this.frameCount * 1000) / this.fpsUpdateTime)
      this.frameCount = 0
      this.fpsUpdateTime = 0
    }

    if (this.gameState !== 'playing') return

    this.updatePhase()
    this.updateAnimations()
    this.updateParticles()
    this.updateDamageNumbers()
    this.updateScreenShake()

    if (this.aiThinking) {
      this.aiThinkTimer += this.deltaTime
      if (this.aiThinkTimer >= this.aiThinkDuration) {
        this.aiThinking = false
        this.executeAiTurn()
      }
    }
  }

  private updatePhase(): void {
    if (this.aiThinking && !this.isPlayerTurn) return

    this.phaseTimer += this.deltaTime

    let phaseDuration: number
    switch (this.battlePhase) {
      case 'prepare':
        phaseDuration = this.prepareDuration
        break
      case 'action':
        phaseDuration = this.actionDuration
        break
      case 'settle':
        phaseDuration = this.settleDuration
        break
    }

    if (this.phaseTimer >= phaseDuration) {
      this.nextPhase()
    }
  }

  private nextPhase(): void {
    this.phaseTimer = 0

    switch (this.battlePhase) {
      case 'prepare':
        this.startPhase('action')
        break
      case 'action':
        this.startPhase('settle')
        this.settlePhase()
        break
      case 'settle':
        this.endTurn()
        break
    }
  }

  private startPhase(phase: BattlePhase): void {
    this.battlePhase = phase
    this.phaseTimer = 0

    if (phase === 'prepare') {
      if (this.isPlayerTurn) {
        this.cardSystem.drawPlayerCard()
        this.battleSystem.addLog('玩家抽牌', 'info')
      } else {
        this.cardSystem.drawAiCard()
        this.battleSystem.addLog('AI抽牌', 'info')
      }
    }
  }

  private settlePhase(): void {
    const currentUnits = this.isPlayerTurn ? this.playerUnits : this.aiUnits

    currentUnits.forEach(unit => {
      if (unit.hp <= 0) return
      const messages = this.battleSystem.processTurnStart(unit)
      messages.forEach(msg => this.battleSystem.addLog(msg, 'damage'))
    })

    currentUnits.forEach(unit => {
      if (unit.hp <= 0 || unit.isStunned) return

      const enemyUnits = this.isPlayerTurn ? this.aiUnits : this.playerUnits
      const aliveEnemies = enemyUnits.filter(u => u.hp > 0)

      if (aliveEnemies.length > 0) {
        const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)]
        this.performAttack(unit, target)
      }
    })

    currentUnits.forEach(unit => {
      if (unit.hp > 0) {
        this.battleSystem.processTurnEnd(unit)
      }
    })

    const result = this.battleSystem.checkGameOver(this.playerUnits, this.aiUnits)
    if (result !== 'playing') {
      this.gameState = result
      this.onGameEnd(result)
    }
  }

  private endTurn(): void {
    if (this.gameState !== 'playing') return

    this.isPlayerTurn = !this.isPlayerTurn

    if (this.isPlayerTurn) {
      this.currentTurn++
      this.battleSystem.addLog(`第 ${this.currentTurn} 回合 - 玩家回合`, 'system')
    } else {
      this.battleSystem.addLog(`AI回合`, 'system')
      this.startAiTurn()
    }

    this.startPhase('prepare')
    this.notifyStateChange()
  }

  private startAiTurn(): void {
    this.aiThinking = true
    this.aiThinkTimer = 0
  }

  private executeAiTurn(): void {
    const aiHand = this.cardSystem.getAiHand()
    const aiFieldUnits = this.aiUnits.filter(u => u.hp > 0)
    const playerUnits = this.playerUnits.filter(u => u.hp > 0)

    if (aiHand.length > 0 && aiFieldUnits.length < this.cardSystem.getMaxFieldUnits()) {
      let selectedCard: CardConfig | null = null

      const weakestPlayer = this.battleSystem.getWeakestUnit(playerUnits)
      if (weakestPlayer) {
        const counterElement = this.battleSystem.getCounterElement(weakestPlayer.element)
        const counterCards = aiHand.filter(c => c.element === counterElement)
        if (counterCards.length > 0) {
          selectedCard = counterCards[Math.floor(Math.random() * counterCards.length)]
        }
      }

      if (!selectedCard) {
        selectedCard = aiHand.reduce((max, card) =>
          card.attack > max.attack ? card : max
        , aiHand[0])
      }

      if (selectedCard) {
        const effect = this.cardSystem.playCard(selectedCard.id, 'ai', this.aiUnits)
        if (effect) {
          const newUnit = createUnitFromCard(selectedCard)
          newUnit.id = `ai_unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          this.aiUnits.push(newUnit)
          this.battleSystem.addLog(`AI 召唤了 ${newUnit.name}`, 'skill')
          this.spawnSummonParticles(newUnit, false)
        }
      }
    }

    this.notifyStateChange()
  }

  playerPlayCard(cardId: string): boolean {
    if (!this.isPlayerTurn || this.battlePhase !== 'action') return false
    if (this.playerUnits.length >= this.cardSystem.getMaxFieldUnits()) return false

    const card = this.cardSystem.getCardById(cardId, 'player')
    if (!card) return false

    const effect = this.cardSystem.playCard(cardId, 'player', this.playerUnits)
    if (!effect) return false

    const newUnit = createUnitFromCard(card)
    newUnit.id = `player_unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.playerUnits.push(newUnit)

    this.battleSystem.addLog(`玩家 召唤了 ${newUnit.name}`, 'skill')
    this.spawnSummonParticles(newUnit, true)
    this.notifyStateChange()

    return true
  }

  playerAttack(sourceId: string, targetId: string): boolean {
    if (!this.isPlayerTurn || this.battlePhase !== 'action') return false

    const source = this.playerUnits.find(u => u.id === sourceId)
    const target = this.aiUnits.find(u => u.id === targetId)

    if (!source || !target || source.hp <= 0 || target.hp <= 0) return false
    if (source.isStunned) return false

    this.performAttack(source, target)
    this.notifyStateChange()

    return true
  }

  private performAttack(attacker: Unit, defender: Unit): BattleResult {
    const result = this.battleSystem.calculateAttack(attacker, defender)
    this.battleSystem.applyDamage(defender, result.damage)

    let logMessage = `${attacker.name} 攻击 ${defender.name}，造成 ${result.damage} 点伤害`
    if (result.counterType === 'counter') {
      logMessage += `【${result.counterText}，克制！】`
      this.battleSystem.addLog(logMessage, 'counter')
    } else if (result.counterType === 'countered') {
      logMessage += `【被克制】`
      this.battleSystem.addLog(logMessage, 'damage')
    } else {
      this.battleSystem.addLog(logMessage, 'damage')
    }

    this.spawnDamageNumber(defender, result.damage, result.isCritical)
    this.spawnHitParticles(defender, result.counterType)

    if (defender.hp <= 0) {
      this.battleSystem.addLog(`${defender.name} 被击败！`, 'system')
    }

    return result
  }

  private spawnSummonParticles(unit: Unit, _isPlayer: boolean): void {
    const colors: Record<ElementType, string> = {
      gold: '#FFD700',
      wood: '#4CAF50',
      water: '#2196F3',
      fire: '#F44336',
      earth: '#8D6E63'
    }

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * (2 + Math.random() * 2),
        vy: Math.sin(angle) * (2 + Math.random() * 2),
        life: 1,
        maxLife: 1,
        color: colors[unit.element],
        size: 3 + Math.random() * 3
      })
    }
  }

  private spawnDamageNumber(_unit: Unit, damage: number, isCritical: boolean): void {
    this.damageNumbers.push({
      x: 0,
      y: 0,
      value: damage,
      life: 1,
      maxLife: 1,
      color: isCritical ? '#FFD700' : '#FF6B6B',
      isCritical
    })
  }

  private spawnHitParticles(_unit: Unit, counterType: 'counter' | 'countered' | 'neutral'): void {
    const color = counterType === 'counter' ? '#FFD700' :
                  counterType === 'countered' ? '#666666' : '#FFFFFF'

    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      this.particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.8,
        maxLife: 0.8,
        color,
        size: 2 + Math.random() * 3
      })
    }
  }

  private updateParticles(): void {
    const dt = this.deltaTime / 1000
    this.particles = this.particles.filter(p => {
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.1
      p.life -= dt
      return p.life > 0
    })
  }

  private updateDamageNumbers(): void {
    const dt = this.deltaTime / 1000
    this.damageNumbers = this.damageNumbers.filter(d => {
      d.y -= 0.5
      d.life -= dt
      return d.life > 0
    })
  }

  private updateAnimations(): void {
    const dt = this.deltaTime / 1000
    this.animations = this.animations.filter(a => {
      a.elapsed += dt
      return a.elapsed < a.duration
    })
  }

  private updateScreenShake(): void {
    if (this.screenShake > 0) {
      this.screenShake -= this.deltaTime / 1000
      if (this.screenShake < 0) this.screenShake = 0
    }
  }

  private onGameEnd(result: GameState): void {
    if (result === 'playerWin') {
      this.battleSystem.addLog('胜利！', 'system')
    } else {
      this.battleSystem.addLog('失败...', 'system')
      this.screenShake = 0.5
      this.screenShakeIntensity = 10
    }
    this.notifyStateChange()
  }

  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange()
    }
  }

  setStateChangeCallback(callback: () => void): void {
    this.onStateChange = callback
  }

  getPlayerUnits(): Unit[] {
    return [...this.playerUnits]
  }

  getAiUnits(): Unit[] {
    return [...this.aiUnits]
  }

  getPlayerHand(): CardConfig[] {
    return this.cardSystem.getPlayerHand()
  }

  getAiHand(): CardConfig[] {
    return this.cardSystem.getAiHand()
  }

  getBattlePhase(): BattlePhase {
    return this.battlePhase
  }

  getGameState(): GameState {
    return this.gameState
  }

  getCurrentTurn(): number {
    return this.currentTurn
  }

  getIsPlayerTurn(): boolean {
    return this.isPlayerTurn
  }

  getPhaseProgress(): number {
    let duration: number
    switch (this.battlePhase) {
      case 'prepare': duration = this.prepareDuration; break
      case 'action': duration = this.actionDuration; break
      case 'settle': duration = this.settleDuration; break
    }
    return Math.min(1, this.phaseTimer / duration)
  }

  getPhaseTimeRemaining(): number {
    let duration: number
    switch (this.battlePhase) {
      case 'prepare': duration = this.prepareDuration; break
      case 'action': duration = this.actionDuration; break
      case 'settle': duration = this.settleDuration; break
    }
    return Math.max(0, duration - this.phaseTimer)
  }

  getBattleLogs() {
    return this.battleSystem.getBattleLogs()
  }

  getParticles(): Particle[] {
    return this.particles
  }

  getDamageNumbers(): DamageNumber[] {
    return this.damageNumbers
  }

  getFps(): number {
    return this.fps
  }

  getScreenShake(): { x: number; y: number } {
    if (this.screenShake <= 0) return { x: 0, y: 0 }
    const intensity = this.screenShakeIntensity * this.screenShake
    return {
      x: (Math.random() - 0.5) * intensity * 2,
      y: (Math.random() - 0.5) * intensity * 2
    }
  }

  isAiThinking(): boolean {
    return this.aiThinking
  }

  getCardSystem(): CardSystem {
    return this.cardSystem
  }

  getBattleSystem(): BattleSystem {
    return this.battleSystem
  }
}
