import { eventBus } from '../eventBus'
import type { Crystal, VisualEffect } from '../store'

interface MiningState {
  playerXPercent: number
  npcXPercent: number
  npcSpeedFactor: number
  crystals: Crystal[]
  playerScore: number
  npcScore: number
  npcSpeedTimer: number
  effects: VisualEffect[]
  respawnQueue: { delay: number; createdAt: number }[]
  speedMultiplier: number
  engineRatio: number
}

export class MiningEngine {
  private state: MiningState = {
    playerXPercent: 10,
    npcXPercent: 10,
    npcSpeedFactor: 1,
    crystals: [],
    playerScore: 0,
    npcScore: 0,
    npcSpeedTimer: 0,
    effects: [],
    respawnQueue: [],
    speedMultiplier: 1,
    engineRatio: 50,
  }

  private unsubscribers: (() => void)[] = []
  private audioContext: AudioContext | null = null

  start() {
    this.state.crystals = this.generateInitialCrystals()

    this.unsubscribers.push(
      eventBus.on('MINING_TRIGGERED', (data) => {
        this.tryPlayerMining(data.playerXPercent)
      })
    )

    this.unsubscribers.push(
      eventBus.on('ENERGY_UPDATED', () => {})
    )

    this.unsubscribers.push(
      eventBus.on('ENERGY_ALLOCATED', (data) => {
        this.state.engineRatio = data.engineRatio
      })
    )

    this.unsubscribers.push(
      eventBus.on('GAME_TICK', (data) => this.tick(data.deltaTime))
    )

    this.unsubscribers.push(
      eventBus.on('GAME_START', () => this.reset())
    )

    this.unsubscribers.push(
      eventBus.on('GAME_RESET', () => this.reset())
    )
  }

  setSpeedMultiplier(m: number) {
    this.state.speedMultiplier = m
  }

  private generateInitialCrystals(): Crystal[] {
    const count = 10 + Math.floor(Math.random() * 6)
    const crystals: Crystal[] = []
    for (let i = 0; i < count; i++) {
      crystals.push(this.makeCrystal())
    }
    return crystals
  }

  private makeCrystal(): Crystal {
    return {
      id: `crystal-${Date.now()}-${Math.random()}`,
      xPercent: 5 + Math.random() * 90,
      yOffset: 40 + Math.random() * 40,
      size: 12 + Math.random() * 6,
    }
  }

  private tick(deltaTime: number) {
    this.state.npcSpeedTimer += deltaTime
    if (this.state.npcSpeedTimer > 1 + Math.random()) {
      this.state.npcSpeedFactor = 0.8 + Math.random() * 0.4
      this.state.npcSpeedTimer = 0
    }

    const baseSpeed = 15
    const playerSpeed = baseSpeed * this.state.speedMultiplier * (this.state.engineRatio / 50)
    const npcSpeed = baseSpeed * this.state.npcSpeedFactor

    this.state.playerXPercent += playerSpeed * deltaTime
    this.state.npcXPercent += npcSpeed * deltaTime

    if (this.state.playerXPercent > 100) this.state.playerXPercent = 0
    if (this.state.npcXPercent > 100) this.state.npcXPercent = 0

    this.tryNpcMining()

    const now = Date.now()
    const remain: typeof this.state.respawnQueue = []
    for (const item of this.state.respawnQueue) {
      if (now - item.createdAt >= item.delay) {
        this.state.crystals.push(this.makeCrystal())
      } else {
        remain.push(item)
      }
    }
    this.state.respawnQueue = remain
  }

  private tryPlayerMining(playerXPercent: number) {
    for (let i = 0; i < this.state.crystals.length; i++) {
      const c = this.state.crystals[i]
      const dist = Math.abs(c.xPercent - playerXPercent)
      if (dist < 4) {
        this.state.crystals.splice(i, 1)
        this.state.playerScore += 10
        this.scheduleRespawn()
        eventBus.emit('MINING_SUCCESS', {
          who: 'player',
          x: c.xPercent,
          y: c.yOffset,
          score: 10,
          energyCost: 2,
        })
        this.playCollectSound()
        return
      }
    }
  }

  private tryNpcMining() {
    for (let i = 0; i < this.state.crystals.length; i++) {
      const c = this.state.crystals[i]
      const dist = Math.abs(c.xPercent - this.state.npcXPercent)
      if (dist < 3) {
        this.state.crystals.splice(i, 1)
        this.state.npcScore += 10
        this.scheduleRespawn()
        eventBus.emit('MINING_SUCCESS', {
          who: 'npc',
          x: c.xPercent,
          y: c.yOffset,
          score: 10,
          energyCost: 0,
        })
        return
      }
    }
  }

  private scheduleRespawn() {
    this.state.respawnQueue.push({
      delay: 1000 + Math.random() * 1000,
      createdAt: Date.now(),
    })
  }

  private playCollectSound() {
    try {
      if (!this.audioContext) {
        const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
        this.audioContext = new Ctx()
      }
      const ctx = this.audioContext
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.2)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.2)
    } catch {
      // ignore audio errors
    }
  }

  getCrystals(): Crystal[] {
    return this.state.crystals
  }

  getPositions(): { playerXPercent: number; npcXPercent: number; npcSpeedFactor: number } {
    return {
      playerXPercent: this.state.playerXPercent,
      npcXPercent: this.state.npcXPercent,
      npcSpeedFactor: this.state.npcSpeedFactor,
    }
  }

  getScores(): { playerScore: number; npcScore: number } {
    return {
      playerScore: this.state.playerScore,
      npcScore: this.state.npcScore,
    }
  }

  private reset() {
    this.state = {
      playerXPercent: 10,
      npcXPercent: 10,
      npcSpeedFactor: 1,
      crystals: this.generateInitialCrystals(),
      playerScore: 0,
      npcScore: 0,
      npcSpeedTimer: 0,
      effects: [],
      respawnQueue: [],
      speedMultiplier: 1,
      engineRatio: 50,
    }
  }

  destroy() {
    this.unsubscribers.forEach((fn) => fn())
    this.unsubscribers = []
  }
}

export const miningEngine = new MiningEngine()
