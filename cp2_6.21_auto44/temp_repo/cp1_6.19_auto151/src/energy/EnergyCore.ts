import { eventBus } from '../eventBus'

interface EnergyState {
  engine: number
  shield: number
  engineRatio: number
  shieldRatio: number
  totalConsumed: number
  mininingThisTick: boolean
}

export class EnergyCore {
  private state: EnergyState = {
    engine: 100,
    shield: 100,
    engineRatio: 50,
    shieldRatio: 50,
    totalConsumed: 0,
    mininingThisTick: false,
  }

  private unsubscribers: (() => void)[] = []

  start() {
    this.unsubscribers.push(
      eventBus.on('ENERGY_ALLOCATED', (data) => {
        this.state.engineRatio = data.engineRatio
        this.state.shieldRatio = data.shieldRatio
      })
    )

    this.unsubscribers.push(
      eventBus.on('MINING_SUCCESS', (data) => {
        if (data.who === 'player') {
          this.state.mininingThisTick = true
        }
      })
    )

    this.unsubscribers.push(
      eventBus.on('GAME_TICK', (data) => this.tick(data.deltaTime))
    )

    this.unsubscribers.push(
      eventBus.on('GAME_RESET', () => this.reset())
    )

    this.unsubscribers.push(
      eventBus.on('GAME_START', () => this.reset())
    )
  }

  private tick(deltaTime: number) {
    const baseConsumption = 1 * deltaTime
    const miningConsumption = this.state.mininingThisTick ? 2 * deltaTime : 0
    const total = baseConsumption + miningConsumption

    const engineConsume = total * (this.state.engineRatio / 100)
    const shieldConsume = total * (this.state.shieldRatio / 100)

    this.state.engine = Math.max(0, this.state.engine - engineConsume)
    this.state.shield = Math.max(0, this.state.shield - shieldConsume)
    this.state.totalConsumed += total

    this.state.mininingThisTick = false

    const speedMultiplier = this.state.shield < 20 ? 0.7 : 1.0

    eventBus.emit('ENERGY_UPDATED', {
      engine: this.state.engine,
      shield: this.state.shield,
      totalConsumed: this.state.totalConsumed,
    })

    eventBus.emit('ENERGY_WARNING', {
      engineLow: this.state.engine < 10,
      shieldLow: this.state.shield < 10,
    })
    void speedMultiplier
  }

  getSpeedMultiplier(): number {
    return this.state.shield < 20 ? 0.7 : 1.0
  }

  getTotalConsumed(): number {
    return this.state.totalConsumed
  }

  private reset() {
    this.state = {
      engine: 100,
      shield: 100,
      engineRatio: 50,
      shieldRatio: 50,
      totalConsumed: 0,
      mininingThisTick: false,
    }
  }

  destroy() {
    this.unsubscribers.forEach((fn) => fn())
    this.unsubscribers = []
  }
}

export const energyCore = new EnergyCore()
