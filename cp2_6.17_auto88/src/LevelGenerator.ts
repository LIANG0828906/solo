import { v4 as uuid } from 'uuid'
import type { Platform, Coin, Spike } from '@/types'

const PLATFORM_H = 20
const COIN_R = 10
const SPIKE_W = 30
const SPIKE_H = 20
const CANVAS_W = 800
const CANVAS_H = 400
const INITIAL_GROUND_Y = 300

export class LevelGenerator {
  private totalPlatforms: number = 0
  private lastPlatform: Platform | null = null
  private sameHeightCount: number = 0

  reset() {
    this.totalPlatforms = 0
    this.lastPlatform = null
    this.sameHeightCount = 0
  }

  generateInitial(): { platforms: Platform[]; coins: Coin[]; spikes: Spike[] } {
    this.reset()
    const platforms: Platform[] = []
    const coins: Coin[] = []
    const spikes: Spike[] = []

    const first: Platform = {
      id: uuid(),
      x: 0,
      y: INITIAL_GROUND_Y,
      w: 400,
      h: PLATFORM_H,
    }
    platforms.push(first)
    this.lastPlatform = first
    this.totalPlatforms = 1
    this.sameHeightCount = 1

    while (this.lastPlatform.x + this.lastPlatform.w < CANVAS_W + 800) {
      const next = this.generateNext()
      platforms.push(next.platform)
      if (next.coin) coins.push(next.coin)
      if (next.spike) spikes.push(next.spike)
    }

    return { platforms, coins, spikes }
  }

  ensureAhead(cameraX: number): {
    platforms: Platform[]
    coins: Coin[]
    spikes: Spike[]
    removedPlats: string[]
    removedCoins: string[]
    removedSpikes: string[]
  } {
    const addedPlats: Platform[] = []
    const addedCoins: Coin[] = []
    const addedSpikes: Spike[] = []

    const horizon = cameraX + CANVAS_W + 600

    while (this.lastPlatform && this.lastPlatform.x + this.lastPlatform.w < horizon) {
      const next = this.generateNext()
      addedPlats.push(next.platform)
      if (next.coin) addedCoins.push(next.coin)
      if (next.spike) addedSpikes.push(next.spike)
    }

    return {
      platforms: addedPlats,
      coins: addedCoins,
      spikes: addedSpikes,
      removedPlats: [],
      removedCoins: [],
      removedSpikes: [],
    }
  }

  cleanup<T extends { id: string; x: number; w?: number }>(
    arr: T[],
    cameraX: number,
    cutoff = 200,
  ): { kept: T[]; removed: string[] } {
    const kept: T[] = []
    const removed: string[] = []
    const cx = cameraX - cutoff
    for (const item of arr) {
      const right = item.x + (item.w ?? 0)
      if (right < cx) {
        removed.push(item.id)
      } else {
        kept.push(item)
      }
    }
    return { kept, removed }
  }

  private rng(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  private generateNext(): { platform: Platform; coin: Coin | null; spike: Spike | null } {
    const prev = this.lastPlatform
    if (!prev) throw new Error('lastPlatform is null')

    const gap = this.rng(30, 80)
    const w = this.rng(80, 200)

    let y = prev.y
    let needsHeightChange = false
    if (this.totalPlatforms > 0 && this.totalPlatforms % 10 === 0) {
      needsHeightChange = true
    }

    if (needsHeightChange) {
      const delta = (Math.random() < 0.5 ? -1 : 1) * this.rng(30, 60)
      let candidate = prev.y + delta
      candidate = Math.max(120, Math.min(CANVAS_H - 40, candidate))
      y = candidate
      this.sameHeightCount = 1
    } else if (this.sameHeightCount >= 3) {
      const delta = (Math.random() < 0.5 ? -1 : 1) * this.rng(10, 25)
      let candidate = prev.y + delta
      candidate = Math.max(140, Math.min(CANVAS_H - 40, candidate))
      y = candidate
      this.sameHeightCount = 1
    } else {
      if (y === prev.y) this.sameHeightCount++
      else this.sameHeightCount = 1
    }

    const platform: Platform = {
      id: uuid(),
      x: prev.x + prev.w + gap,
      y,
      w,
      h: PLATFORM_H,
    }

    let coin: Coin | null = null
    if (Math.random() < 0.75) {
      const cx = platform.x + platform.w / 2
      const cy = platform.y - 40
      coin = { id: uuid(), x: cx, y: cy, r: COIN_R }
    }

    let spike: Spike | null = null
    if (this.totalPlatforms >= 3 && Math.random() < 0.4) {
      const sx = platform.x + this.rng(20, Math.max(30, platform.w - SPIKE_W - 10))
      spike = {
        id: uuid(),
        x: sx,
        y: platform.y - SPIKE_H,
        w: SPIKE_W,
        h: SPIKE_H,
        warnT: 0.5,
      }
    }

    this.lastPlatform = platform
    this.totalPlatforms++
    return { platform, coin, spike }
  }
}
