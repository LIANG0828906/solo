import { v4 as uuid } from 'uuid'
import type {
  GameState,
  Platform,
  Coin,
  Spike,
  Particle,
  PlayerState,
} from '@/types'
import { LevelGenerator } from './LevelGenerator'
import type { PlayerController } from './PlayerController'
import { useGameStore } from './store/gameStore'

const CANVAS_H = 400
const FIXED_DT = 1 / 60
const BASE_SPEED = 240
const DASH_SPEED = 480
const JUMP_VY = 360
const GRAVITY = 900
const DASH_DURATION = 0.5
const DASH_COOLDOWN = 2
const DASH_INDICATOR_SHOW = 2
const PLAYER_W = 20
const PLAYER_H = 20
const MAX_PARTICLES = 200
const PARTICLE_LIFE = 0.3
const PARTICLES_PER_SEC_NORMAL = 5
const PARTICLES_PER_SEC_DASH = 15
const DEATH_FLASH = 0.3
const COIN_ANIM = 0.2

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

export class GameEngine {
  state: GameState
  private gen: LevelGenerator
  private controller: PlayerController
  private platforms: Platform[] = []
  private coins: Coin[] = []
  private spikes: Spike[] = []
  private particles: Particle[] = []
  private particleTimer: number = 0
  private running: boolean = false
  private rafId: number = 0
  private lastTime: number = 0
  private accumulator: number = 0
  private enableInterpolation: boolean = false
  private renderCallback: (s: GameState, alpha: number) => void

  constructor(controller: PlayerController, renderCb: (s: GameState, alpha: number) => void) {
    this.controller = controller
    this.renderCallback = renderCb
    this.gen = new LevelGenerator()

    const init = this.gen.generateInitial()
    this.platforms = init.platforms
    this.coins = init.coins
    this.spikes = init.spikes

    const player = this.makeInitialPlayer()

    this.state = {
      player,
      platforms: this.platforms,
      coins: this.coins,
      spikes: this.spikes,
      particles: this.particles,
      dashIndicator: { cooldown: 0, maxCooldown: DASH_COOLDOWN, showT: 0 },
      cameraX: 0,
      score: 0,
      deathFlash: 0,
      time: 0,
      status: 'START',
      lastFrameMs: 0,
    }
  }

  private makeInitialPlayer(): PlayerState {
    return {
      x: 100,
      y: 280 - PLAYER_H,
      vx: BASE_SPEED,
      vy: 0,
      w: PLAYER_W,
      h: PLAYER_H,
      onGround: true,
      dashT: 0,
      dashCooldown: 0,
      trail: [],
      speedLines: [],
    }
  }

  reset() {
    this.gen.reset()
    const init = this.gen.generateInitial()
    this.platforms = init.platforms
    this.coins = init.coins
    this.spikes = init.spikes
    this.particles = []
    this.particleTimer = 0
    const player = this.makeInitialPlayer()
    this.state = {
      player,
      platforms: this.platforms,
      coins: this.coins,
      spikes: this.spikes,
      particles: this.particles,
      dashIndicator: { cooldown: 0, maxCooldown: DASH_COOLDOWN, showT: 0 },
      cameraX: 0,
      score: 0,
      deathFlash: 0,
      time: 0,
      status: 'START',
      lastFrameMs: 0,
    }
    useGameStore.getState().resetGame()
  }

  start() {
    this.running = true
    this.lastTime = performance.now()
    useGameStore.getState().startGame()
    this.state.status = 'PLAYING'
    this.loop()
  }

  stop() {
    this.running = false
    if (this.rafId) cancelAnimationFrame(this.rafId)
  }

  setStatusExternal(status: 'START' | 'PLAYING' | 'GAMEOVER') {
    this.state.status = status
    if (status === 'START') {
      this.reset()
    }
  }

  private loop = () => {
    if (!this.running) return
    const now = performance.now()
    let dt = (now - this.lastTime) / 1000
    this.lastTime = now
    if (dt > 0.25) dt = 0.25
    const frameMs = dt * 1000

    if (frameMs < 100 / 6 - 2 || frameMs > 100 / 6 + 2) {
      this.enableInterpolation = true
    } else {
      this.enableInterpolation = false
    }

    const status = useGameStore.getState().status
    this.state.status = status
    this.state.lastFrameMs = frameMs

    if (status === 'PLAYING') {
      this.accumulator += dt
      while (this.accumulator >= FIXED_DT) {
        this.step(FIXED_DT)
        this.accumulator -= FIXED_DT
      }
    } else {
      this.accumulator = 0
    }

    const alpha = this.enableInterpolation ? Math.min(1, this.accumulator / FIXED_DT) : 1
    this.renderCallback(this.snapshot(), alpha)

    this.rafId = requestAnimationFrame(this.loop)
  }

  private snapshot(): GameState {
    return {
      ...this.state,
      player: { ...this.state.player, trail: [...this.state.player.trail], speedLines: [...this.state.player.speedLines] },
      platforms: this.platforms.slice(),
      coins: this.coins.slice(),
      spikes: this.spikes.slice(),
      particles: this.particles.slice(),
      dashIndicator: { ...this.state.dashIndicator },
    }
  }

  private step(dt: number) {
    const input = this.controller.getInput()
    const jumpEdge = this.controller.consumeJumpEdge()
    this.state.time += dt

    const p = this.state.player

    if (p.dashT > 0) p.dashT -= dt
    if (p.dashCooldown > 0) {
      p.dashCooldown = Math.max(0, p.dashCooldown - dt)
      if (p.dashCooldown === 0) {
        this.state.dashIndicator.showT = DASH_INDICATOR_SHOW
      }
    }
    if (this.state.dashIndicator.showT > 0) this.state.dashIndicator.showT = Math.max(0, this.state.dashIndicator.showT - dt)
    this.state.dashIndicator.cooldown = p.dashCooldown

    if (input.dashHeld && p.dashT <= 0 && p.dashCooldown <= 0) {
      p.dashT = DASH_DURATION
      p.dashCooldown = DASH_COOLDOWN
      this.state.dashIndicator.showT = 0
    }

    const isDashing = p.dashT > 0
    const speedX = isDashing ? DASH_SPEED : BASE_SPEED
    p.vx = speedX

    if (jumpEdge && p.onGround) {
      p.vy = -JUMP_VY
      p.onGround = false
    }

    p.vy += GRAVITY * dt
    if (p.vy > 1200) p.vy = 1200

    p.x += p.vx * dt

    for (const plat of this.platforms) {
      if (aabb(p.x, p.y, p.w, p.h, plat.x, plat.y, plat.w, plat.h)) {
        if (p.vx > 0) {
          p.x = plat.x - p.w
        }
      }
    }

    p.y += p.vy * dt
    p.onGround = false
    for (const plat of this.platforms) {
      if (aabb(p.x, p.y, p.w, p.h, plat.x, plat.y, plat.w, plat.h)) {
        if (p.vy > 0) {
          p.y = plat.y - p.h
          p.vy = 0
          p.onGround = true
        } else if (p.vy < 0) {
          p.y = plat.y + plat.h
          p.vy = 0
        }
      }
    }

    const targetCam = p.x - 220
    this.state.cameraX = Math.max(0, targetCam)

    p.trail.unshift({ x: p.x, y: p.y, alpha: 0.6 })
    if (p.trail.length > 3) p.trail.pop()
    for (let i = 0; i < p.trail.length; i++) {
      p.trail[i]!.alpha = Math.max(0, 0.6 - i * 0.2)
    }
    if (p.trail.length && !p.onGround) {
      // keep
    } else if (p.trail.length) {
      // decay
      const last = p.trail[p.trail.length - 1]!
      last.alpha -= dt * 6
      if (last.alpha <= 0) p.trail.pop()
    }

    p.speedLines = []
    if (isDashing) {
      const n = 3
      for (let i = 0; i < n; i++) {
        p.speedLines.push({
          x: this.state.cameraX + 800 + Math.random() * 80,
          y: 100 + Math.random() * 250,
          len: 15 + Math.random() * 10,
        })
      }
    }

    for (let i = this.spikes.length - 1; i >= 0; i--) {
      const s = this.spikes[i]!
      if (s.warnT && s.warnT > 0) {
        s.warnT = Math.max(0, s.warnT - dt)
      }
      const margin = 2
      if (
        s.warnT === 0 &&
        aabb(p.x + margin, p.y + margin, p.w - margin * 2, p.h - margin * 2, s.x, s.y, s.w, s.h)
      ) {
        this.die()
        return
      }
    }

    for (const c of this.coins) {
      if (c.collected) continue
      const dx = p.x + p.w / 2 - c.x
      const dy = p.y + p.h / 2 - c.y
      if (dx * dx + dy * dy <= (c.r + 10) * (c.r + 10)) {
        c.collected = true
        c.collectT = COIN_ANIM
        this.state.score += 10
        useGameStore.getState().setScore(this.state.score)
      }
    }

    this.coins = this.coins.filter((c) => {
      if (c.collected && c.collectT !== undefined) {
        c.collectT -= dt
        return c.collectT > 0
      }
      return true
    })

    this.state.coins = this.coins

    if (p.y > CANVAS_H + 100) {
      this.die()
      return
    }

    if (this.state.deathFlash > 0) this.state.deathFlash = Math.max(0, this.state.deathFlash - dt)

    this.updateParticles(dt, p, isDashing)
    this.ensureTerrain()
  }

  private updateParticles(dt: number, p: PlayerState, isDashing: boolean) {
    const rate = isDashing ? PARTICLES_PER_SEC_DASH : PARTICLES_PER_SEC_NORMAL
    this.particleTimer += dt
    const interval = 1 / rate
    while (this.particleTimer >= interval) {
      this.particleTimer -= interval
      this.spawnParticle(p, isDashing)
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pa = this.particles[i]!
      pa.life -= dt
      if (pa.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }
      pa.x += pa.vx * dt
      pa.y += pa.vy * dt
      pa.alpha = Math.max(0, pa.life / pa.maxLife)
    }

    while (this.particles.length > MAX_PARTICLES) {
      this.particles.shift()
    }
    this.state.particles = this.particles
  }

  private spawnParticle(p: PlayerState, isDashing: boolean) {
    const t = Math.random()
    const r1 = Math.round(0xe7)
    const g1 = Math.round(0x4c)
    const b1 = Math.round(0x3c)
    const r2 = Math.round(0xf3)
    const g2 = Math.round(0x9c)
    const b2 = Math.round(0x12)
    const r = Math.round(r1 + (r2 - r1) * t)
    const g = Math.round(g1 + (g2 - g1) * t)
    const b = Math.round(b1 + (b2 - b1) * t)
    const color = `rgb(${r}, ${g}, ${b})`
    const pa: Particle = {
      id: uuid(),
      x: p.x + p.w / 2 - 2 - Math.random() * 8,
      y: p.y + p.h / 2 + (Math.random() - 0.5) * p.h * 0.8,
      vx: -(isDashing ? 120 : 60) - Math.random() * 40,
      vy: (Math.random() - 0.5) * 40,
      size: 2 + Math.random() * 2,
      alpha: 1,
      life: PARTICLE_LIFE,
      maxLife: PARTICLE_LIFE,
      color,
    }
    this.particles.push(pa)
  }

  private ensureTerrain() {
    const res = this.gen.ensureAhead(this.state.cameraX)
    if (res.platforms.length) {
      this.platforms.push(...res.platforms)
    }
    if (res.coins.length) {
      this.coins.push(...res.coins)
    }
    if (res.spikes.length) {
      this.spikes.push(...res.spikes)
    }

    const cleanP = this.gen.cleanup(this.platforms, this.state.cameraX)
    this.platforms = cleanP.kept
    const cleanC = this.gen.cleanup(this.coins, this.state.cameraX)
    this.coins = cleanC.kept
    const cleanS = this.gen.cleanup(this.spikes, this.state.cameraX)
    this.spikes = cleanS.kept

    this.state.platforms = this.platforms
    this.state.coins = this.coins
    this.state.spikes = this.spikes
  }

  private die() {
    this.state.deathFlash = DEATH_FLASH
    this.state.status = 'GAMEOVER'
    useGameStore.getState().endGame()
  }
}
