import { generateSegment, getTerrainHeightAt, TerrainSegment, WindZone, Firefly, WindType, TERRAIN_CONFIG } from '@/utils/terrainGenerator'
import { useGameStore } from '@/store/gameStore'

interface Plane {
  x: number
  y: number
  vx: number
  vy: number
  angle: number
  tilt: number
  energy: number
  isBoost: boolean
  boostTimer: number
  boostFireflyCount: number
  isFalling: boolean
  fallTimer: number
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  size: number
  color: string
  active: boolean
}

const GRAVITY = 180
const BASE_SPEED = 180
const GLIDE_FACTOR = 0.96
const LIFT_FACTOR = 0.7
const ENERGY_DRAIN_PER_SEC = 2
const MAX_PARTICLES = 200
const SEGMENT_WIDTH = 1200
const FIREFLY_MAGNET_DISTANCE = 120
const BOOST_DURATION = 2
const BOOST_MULTIPLIER = 1.5
const FIREFLIES_FOR_BOOST = 20

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private animationId: number | null = null
  private lastTime = 0
  private accumulator = 0
  private fixedDt = 1 / 60
  private running = false

  private plane!: Plane
  private segments: TerrainSegment[] = []
  private particles: Particle[] = []
  private particlePool: Particle[] = []
  private cameraX = 0
  private seed = 12345

  private pointerDown = false
  private pointerY = 0

  private worldWidth = 0
  private worldHeight = 0
  private scale = 1

  private screenShake = 0
  private collectFlash = 0
  private energyAlert = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.initParticlePool()
    this.resize()
    this.reset()
  }

  private initParticlePool() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particlePool.push({
        x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, size: 2, color: '#fff', active: false,
      })
    }
  }

  private spawnParticle(x: number, y: number, vx: number, vy: number, life: number, size: number, color: string) {
    const p = this.particlePool.find(p => !p.active)
    if (p) {
      p.x = x; p.y = y; p.vx = vx; p.vy = vy
      p.life = life; p.maxLife = life; p.size = size; p.color = color
      p.active = true
    }
  }

  resize() {
    const parent = this.canvas.parentElement
    if (parent) {
      const rect = parent.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      this.canvas.width = rect.width * dpr
      this.canvas.height = rect.height * dpr
      this.canvas.style.width = rect.width + 'px'
      this.canvas.style.height = rect.height + 'px'
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      
      this.worldWidth = rect.width
      this.worldHeight = rect.height
      this.scale = this.worldHeight / 600
    }
  }

  reset() {
    this.plane = {
      x: 200,
      y: this.worldHeight * 0.4,
      vx: BASE_SPEED,
      vy: 0,
      angle: -0.05,
      tilt: 0,
      energy: 100,
      isBoost: false,
      boostTimer: 0,
      boostFireflyCount: 0,
      isFalling: false,
      fallTimer: 0,
    }
    this.segments = []
    this.cameraX = 0
    this.seed = Math.floor(Math.random() * 100000)
    this.screenShake = 0
    this.collectFlash = 0
    this.energyAlert = 0

    for (let i = 0; i < 5; i++) {
      this.segments.push(generateSegment(i * SEGMENT_WIDTH, this.seed + i))
    }

    for (const p of this.particlePool) {
      p.active = false
    }
  }

  setPointer(down: boolean, y: number) {
    this.pointerDown = down
    this.pointerY = y
  }

  start() {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop()
  }

  stop() {
    this.running = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private loop = () => {
    if (!this.running) return
    const now = performance.now()
    let dt = (now - this.lastTime) / 1000
    this.lastTime = now

    if (dt > 0.1) dt = 0.1

    const status = useGameStore.getState().status
    if (status === 'playing') {
      this.accumulator += dt
      while (this.accumulator >= this.fixedDt) {
        this.update(this.fixedDt)
        this.accumulator -= this.fixedDt
      }
    }

    this.render(dt)
    this.animationId = requestAnimationFrame(this.loop)
  }

  private update(dt: number) {
    const plane = this.plane

    if (plane.isFalling) {
      plane.fallTimer += dt
      plane.angle += dt * 4
      plane.vy += GRAVITY * dt * 1.5
      plane.x += plane.vx * dt * 0.5
      plane.y += plane.vy * dt

      if (Math.random() < 0.6) {
        this.spawnParticle(
          plane.x + (Math.random() - 0.5) * 20,
          plane.y + (Math.random() - 0.5) * 20,
          -20 + (Math.random() - 0.5) * 30,
          -30 + Math.random() * 20,
          0.8 + Math.random() * 0.5,
          3 + Math.random() * 4,
          Math.random() < 0.5 ? '#555' : '#888'
        )
      }

      if (plane.y > this.worldHeight + 100 || plane.fallTimer > 3) {
        useGameStore.getState().endGame()
      }
      return
    }

    if (this.pointerDown) {
      const targetAngle = -((this.pointerY / this.worldHeight) - 0.5) * 1.2
      plane.angle += (targetAngle - plane.angle) * 0.15
      plane.tilt = -targetAngle * 0.5
    } else {
      plane.angle += dt * 0.3
      if (plane.angle > 0.3) plane.angle = 0.3
      plane.tilt *= 0.92
    }

    const speedMult = plane.isBoost ? BOOST_MULTIPLIER : 1
    plane.vx = BASE_SPEED * Math.cos(plane.angle) * speedMult
    plane.vy = BASE_SPEED * Math.sin(plane.angle) * speedMult + GRAVITY * dt * 0.3
    plane.vy *= GLIDE_FACTOR

    let activeWind: WindType = null
    let inDowndraft = false
    for (const seg of this.segments) {
      for (const wz of seg.windZones) {
        if (plane.x > wz.x && plane.x < wz.x + wz.width &&
            plane.y > wz.y && plane.y < wz.y + wz.height) {
          activeWind = wz.type
          const s = wz.strength
          if (wz.type === 'updraft') {
            plane.vy -= 150 * s * dt
            plane.energy = Math.min(100, plane.energy + 3 * dt)
          } else if (wz.type === 'downdraft') {
            plane.vy += 180 * s * dt
            inDowndraft = true
          } else if (wz.type === 'tailwind') {
            plane.vx *= 1 + 0.3 * s
            plane.energy = Math.min(100, plane.energy + 1 * dt)
          }
        }
      }
    }

    plane.x += plane.vx * dt
    plane.y += plane.vy * dt
    plane.energy -= ENERGY_DRAIN_PER_SEC * dt
    if (inDowndraft) plane.energy -= 3 * dt

    if (plane.isBoost) {
      plane.boostTimer -= dt
      if (plane.boostTimer <= 0) {
        plane.isBoost = false
        plane.boostTimer = 0
      }
    }

    this.cameraX = plane.x - this.worldWidth * 0.3

    const topHeight = getTerrainHeightAt(this.segments, plane.x, true)
    const bottomHeight = getTerrainHeightAt(this.segments, plane.x, false)
    if (plane.y < topHeight + 20 || plane.y > bottomHeight - 20) {
      this.crash()
      return
    }

    if (plane.energy <= 0) {
      plane.energy = 0
      this.crash()
      return
    }

    this.energyAlert = plane.energy < 20 ? 1 : 0

    for (const seg of this.segments) {
      for (const f of seg.fireflies) {
        if (f.collected) continue
        f.phase += dt * f.frequency * Math.PI * 2
        f.y = f.baseY + Math.sin(f.phase) * 6

        const dx = plane.x - f.x
        const dy = plane.y - f.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < FIREFLY_MAGNET_DISTANCE) {
          f.attracting = true
          const t = Math.min(1, dt * 6)
          f.x += (dx / dist) * 300 * t
          f.y += (dy / dist) * 300 * t
        }

        if (dist < 25) {
          f.collected = true
          plane.energy = Math.min(100, plane.energy + 10)
          plane.boostFireflyCount++
          this.collectFlash = 1
          this.screenShake = 3

          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2
            this.spawnParticle(f.x, f.y, Math.cos(a) * 80, Math.sin(a) * 80, 0.5, 3, '#FEF08A')
          }

          if (plane.boostFireflyCount >= FIREFLIES_FOR_BOOST) {
            plane.boostFireflyCount = 0
            plane.isBoost = true
            plane.boostTimer = BOOST_DURATION
          }
        }
      }
    }

    if (Math.random() < 0.8) {
      const tailX = plane.x - Math.cos(plane.angle) * 20
      const tailY = plane.y - Math.sin(plane.angle) * 20
      const color = plane.isBoost ? '#FCD34D' : (activeWind === 'updraft' ? '#93C5FD' : '#FDE68A')
      this.spawnParticle(
        tailX, tailY,
        -plane.vx * 0.3 + (Math.random() - 0.5) * 20,
        -plane.vy * 0.3 + (Math.random() - 0.5) * 20,
        0.5 + Math.random() * 0.3,
        2 + Math.random() * 2,
        color,
      )
    }

    for (const p of this.particlePool) {
      if (!p.active) continue
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.life -= dt
      if (p.life <= 0) p.active = false
    }

    if (this.screenShake > 0) this.screenShake = Math.max(0, this.screenShake - dt * 10)
    if (this.collectFlash > 0) this.collectFlash = Math.max(0, this.collectFlash - dt * 3)

    const dist = Math.floor(plane.x / 10)
    const fireflyCount = this.segments.reduce((sum, s) => sum + s.fireflies.filter(f => f.collected).length, 0)
    const boostReady = plane.boostFireflyCount >= 0 && !plane.isBoost

    useGameStore.getState().updateState({
      distance: dist,
      fireflyCount,
      energy: Math.round(plane.energy),
      planeTilt: plane.tilt,
      activeWind,
      boostReady: plane.boostFireflyCount >= FIREFLIES_FOR_BOOST || plane.isBoost,
    })

    const lastSeg = this.segments[this.segments.length - 1]
    if (plane.x > lastSeg.startX + SEGMENT_WIDTH) {
      this.segments.push(generateSegment(lastSeg.endX, this.seed + this.segments.length))
      if (this.segments.length > 8) this.segments.shift()
    }
  }

  private crash() {
    this.plane.isFalling = true
    this.plane.fallTimer = 0
    this.screenShake = 10
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2
      this.spawnParticle(
        this.plane.x, this.plane.y,
        Math.cos(a) * (50 + Math.random() * 100),
        Math.sin(a) * (50 + Math.random() * 100),
        0.8 + Math.random() * 0.6,
        3 + Math.random() * 5,
        ['#FDE68A', '#F59E0B', '#92400E', '#555'][Math.floor(Math.random() * 4)],
      )
    }
  }

  private render(dt: number) {
    const ctx = this.ctx
    const w = this.worldWidth
    const h = this.worldHeight
    const cam = this.cameraX

    ctx.save()

    if (this.screenShake > 0) {
      ctx.translate((Math.random() - 0.5) * this.screenShake, (Math.random() - 0.5) * this.screenShake)
    }

    this.drawSky(ctx, w, h, cam)
    this.drawClouds(ctx, w, h, cam)
    this.drawMountains(ctx, w, h, cam)

    ctx.save()
    ctx.translate(-cam, 0)

    this.drawWindZones(ctx)
    this.drawFireflies(ctx, dt)
    this.drawTerrain(ctx)
    this.drawPlane(ctx)
    this.drawParticles(ctx)

    ctx.restore()

    if (this.collectFlash > 0) {
      ctx.fillStyle = `rgba(254, 240, 138, ${this.collectFlash * 0.15})`
      ctx.fillRect(0, 0, w, h)
    }
    if (this.energyAlert > 0) {
      ctx.fillStyle = `rgba(239, 68, 68, ${0.1 + Math.sin(Date.now() / 100) * 0.05})`
      ctx.fillRect(0, 0, w, h)
    }

    ctx.restore()
  }

  private drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, cam: number) {
    const t = Math.min(1, cam / 8000)
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const lerpColor = (c1: number[], c2: number[], t: number) => [
      Math.round(lerp(c1[0], c2[0], t)),
      Math.round(lerp(c1[1], c2[1], t)),
      Math.round(lerp(c1[2], c2[2], t)),
    ]
    
    const sunrise = [[255, 140, 80], [255, 200, 150], [135, 206, 235]]
    const night = [[30, 27, 75], [58, 50, 120], [88, 80, 150]]
    
    const top = lerpColor(sunrise[0], night[0], t)
    const mid = lerpColor(sunrise[1], night[1], t)
    const bot = lerpColor(sunrise[2], night[2], t)
    
    grad.addColorStop(0, `rgb(${top[0]},${top[1]},${top[2]})`)
    grad.addColorStop(0.5, `rgb(${mid[0]},${mid[1]},${mid[2]})`)
    grad.addColorStop(1, `rgb(${bot[0]},${bot[1]},${bot[2]})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    if (t > 0.5) {
      ctx.fillStyle = `rgba(255,255,255,${(t - 0.5) * 0.8})`
      for (let i = 0; i < 50; i++) {
        const sx = (i * 137.5 + cam * 0.05) % w
        const sy = (i * 89.3) % (h * 0.6)
        const size = (i % 3) + 1
        ctx.fillRect(sx, sy, size, size)
      }
    }
  }

  private drawClouds(ctx: CanvasRenderingContext2D, w: number, h: number, cam: number) {
    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 400 - cam * 0.15) % (w + 400) + w + 400) % (w + 400) - 200
      const cy = 60 + (i % 3) * 50
      this.drawCloud(ctx, cx, cy, 80 + (i % 2) * 30)
    }
  }

  private drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.beginPath()
    ctx.arc(x, y, size * 0.4, 0, Math.PI * 2)
    ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.35, 0, Math.PI * 2)
    ctx.arc(x + size * 0.6, y, size * 0.3, 0, Math.PI * 2)
    ctx.arc(x + size * 0.2, y + size * 0.15, size * 0.25, 0, Math.PI * 2)
    ctx.fill()
  }

  private drawMountains(ctx: CanvasRenderingContext2D, w: number, h: number, cam: number) {
    ctx.fillStyle = 'rgba(100, 120, 150, 0.4)'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.6)
    for (let x = 0; x <= w; x += 20) {
      const wx = x + cam * 0.3
      const y = h * 0.55 + Math.sin(wx * 0.003) * 40 + Math.sin(wx * 0.007) * 20
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.fill()

    ctx.fillStyle = 'rgba(70, 90, 120, 0.5)'
    ctx.beginPath()
    ctx.moveTo(0, h * 0.75)
    for (let x = 0; x <= w; x += 15) {
      const wx = x + cam * 0.5
      const y = h * 0.7 + Math.sin(wx * 0.004) * 30 + Math.sin(wx * 0.01) * 15
      ctx.lineTo(x, y)
    }
    ctx.lineTo(w, h)
    ctx.lineTo(0, h)
    ctx.fill()
  }

  private drawTerrain(ctx: CanvasRenderingContext2D) {
    for (const seg of this.segments) {
      const config = TERRAIN_CONFIG[seg.type]

      ctx.fillStyle = config.fore
      ctx.beginPath()
      const topPts: [number, number][] = []
      for (let i = 0; i < seg.topHeights.length; i++) {
        const x = seg.startX + (i / seg.topHeights.length) * SEGMENT_WIDTH
        const y = seg.topHeights[i]
        topPts.push([x, y])
      }
      ctx.moveTo(topPts[0][0], 0)
      for (const [x, y] of topPts) ctx.lineTo(x, y)
      ctx.lineTo(topPts[topPts.length - 1][0], 0)
      ctx.closePath()
      ctx.fill()

      ctx.beginPath()
      const botPts: [number, number][] = []
      for (let i = 0; i < seg.bottomHeights.length; i++) {
        const x = seg.startX + (i / seg.bottomHeights.length) * SEGMENT_WIDTH
        const y = seg.bottomHeights[i]
        botPts.push([x, y])
      }
      ctx.moveTo(botPts[0][0], this.worldHeight)
      for (const [x, y] of botPts) ctx.lineTo(x, y)
      ctx.lineTo(botPts[botPts.length - 1][0], this.worldHeight)
      ctx.closePath()
      ctx.fill()

      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 2
      ctx.beginPath()
      for (let i = 0; i < topPts.length; i++) {
        if (i === 0) ctx.moveTo(topPts[i][0], topPts[i][1])
        else ctx.lineTo(topPts[i][0], topPts[i][1])
      }
      ctx.stroke()
      ctx.beginPath()
      for (let i = 0; i < botPts.length; i++) {
        if (i === 0) ctx.moveTo(botPts[i][0], botPts[i][1])
        else ctx.lineTo(botPts[i][0], botPts[i][1])
      }
      ctx.stroke()
    }
  }

  private drawWindZones(ctx: CanvasRenderingContext2D) {
    const time = Date.now() / 1000
    for (const seg of this.segments) {
      for (const wz of seg.windZones) {
        ctx.save()
        if (wz.type === 'updraft') {
          ctx.fillStyle = 'rgba(147, 197, 253, 0.15)'
          ctx.fillRect(wz.x, wz.y, wz.width, wz.height)
          const cx = wz.x + wz.width / 2
          const cy = wz.y + wz.height / 2
          ctx.strokeStyle = 'rgba(147, 197, 253, 0.7)'
          ctx.lineWidth = 3
          for (let i = 0; i < 3; i++) {
            ctx.beginPath()
            const rot = time * 2 + i * (Math.PI * 2 / 3)
            ctx.arc(cx, cy, 20 + i * 10, rot, rot + Math.PI * 1.2)
            ctx.stroke()
          }
          for (let i = 0; i < 5; i++) {
            const px = wz.x + (i + 0.5) * (wz.width / 5)
            const py = wz.y + wz.height - ((time * 80 + i * 60) % wz.height)
            ctx.fillStyle = 'rgba(147, 197, 253, 0.6)'
            ctx.beginPath()
            ctx.arc(px, py, 4, 0, Math.PI * 2)
            ctx.fill()
          }
        } else if (wz.type === 'downdraft') {
          ctx.fillStyle = 'rgba(251, 146, 60, 0.15)'
          ctx.fillRect(wz.x, wz.y, wz.width, wz.height)
          ctx.fillStyle = 'rgba(251, 146, 60, 0.8)'
          for (let i = 0; i < 4; i++) {
            const ax = wz.x + wz.width * (0.2 + i * 0.2)
            const ay = wz.y + wz.height / 2 + Math.sin(time * 3 + i) * 10
            ctx.beginPath()
            ctx.moveTo(ax, ay - 15)
            ctx.lineTo(ax + 10, ay + 5)
            ctx.lineTo(ax - 10, ay + 5)
            ctx.closePath()
            ctx.fill()
            ctx.fillRect(ax - 3, ay + 5, 6, 15)
          }
        } else {
          const grad = ctx.createLinearGradient(wz.x, 0, wz.x + wz.width, 0)
          grad.addColorStop(0, 'rgba(74, 222, 128, 0)')
          grad.addColorStop(0.5, 'rgba(74, 222, 128, 0.25)')
          grad.addColorStop(1, 'rgba(74, 222, 128, 0)')
          ctx.fillStyle = grad
          ctx.fillRect(wz.x, wz.y, wz.width, wz.height)
          ctx.strokeStyle = 'rgba(74, 222, 128, 0.7)'
          ctx.lineWidth = 2
          for (let i = 0; i < 3; i++) {
            const ly = wz.y + wz.height * (0.25 + i * 0.25)
            const offset = (time * 100) % 40
            ctx.beginPath()
            for (let x = wz.x + offset; x < wz.x + wz.width; x += 40) {
              ctx.moveTo(x, ly)
              ctx.lineTo(x + 20, ly)
              ctx.moveTo(x + 15, ly - 5)
              ctx.lineTo(x + 20, ly)
              ctx.lineTo(x + 15, ly + 5)
            }
            ctx.stroke()
          }
        }
        ctx.restore()
      }
    }
  }

  private drawFireflies(ctx: CanvasRenderingContext2D, dt: number) {
    for (const seg of this.segments) {
      for (const f of seg.fireflies) {
        if (f.collected) continue
        const glow = 0.5 + 0.5 * Math.sin(f.phase)
        const size = 4 + glow * 3

        ctx.save()
        ctx.shadowColor = '#FEF08A'
        ctx.shadowBlur = 15 + glow * 10
        ctx.fillStyle = `rgba(254, 240, 138, ${0.7 + glow * 0.3})`
        ctx.beginPath()
        ctx.arc(f.x, f.y, size, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(f.x, f.y, size * 0.4, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }
  }

  private drawPlane(ctx: CanvasRenderingContext2D) {
    const p = this.plane
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.angle)

    if (p.isBoost) {
      const t = Date.now() / 100
      ctx.save()
      ctx.shadowColor = '#FCD34D'
      ctx.shadowBlur = 30
      ctx.strokeStyle = `rgba(252, 211, 77, ${0.6 + Math.sin(t) * 0.3})`
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.arc(0, 0, 30, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }

    if (p.isFalling) {
      ctx.rotate(p.fallTimer * 3)
    }

    const s = this.scale
    ctx.fillStyle = '#FDE68A'
    ctx.strokeStyle = '#D97706'
    ctx.lineWidth = 2

    ctx.beginPath()
    ctx.moveTo(25 * s, 0)
    ctx.lineTo(-15 * s, -18 * s)
    ctx.lineTo(-5 * s, 0)
    ctx.lineTo(-15 * s, 18 * s)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = 'rgba(253, 230, 138, 0.5)'
    ctx.beginPath()
    ctx.moveTo(-5 * s, 0)
    ctx.lineTo(-20 * s, -14 * s)
    ctx.lineTo(-20 * s, 14 * s)
    ctx.closePath()
    ctx.fill()

    ctx.strokeStyle = '#92400E'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(25 * s, 0)
    ctx.lineTo(-5 * s, 0)
    ctx.stroke()

    ctx.fillStyle = 'rgba(255,255,255,0.4)'
    ctx.beginPath()
    ctx.moveTo(20 * s, -2 * s)
    ctx.lineTo(-10 * s, -14 * s)
    ctx.lineTo(-5 * s, -1 * s)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  private drawParticles(ctx: CanvasRenderingContext2D) {
    for (const p of this.particlePool) {
      if (!p.active) continue
      const alpha = p.life / p.maxLife
      const size = p.size * alpha
      ctx.save()
      ctx.globalAlpha = alpha
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    }
  }
}
