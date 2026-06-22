import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import type { Pet } from '../types'

export interface PetCanvasHandle {
  start: () => void
  stop: () => void
  triggerAction: (action: 'feed' | 'play' | 'sleep') => void
}

interface PetCanvasProps {
  pet: Pet | null
  width?: number
  height?: number
}

type Anim = 'idle' | 'walk' | 'jump' | 'happy' | 'sleeping' | 'sick'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface PetState {
  x: number
  y: number
  targetX: number
  targetY: number
  anim: Anim
  animStartTime: number
  frame: number
  facing: 1 | -1
  bobOffset: number
}

export const PetCanvas = forwardRef<PetCanvasHandle, PetCanvasProps>(function PetCanvas(
  { pet, width = 800, height = 420 },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number | null>(null)
  const runningRef = useRef(false)
  const petRef = useRef<PetState>({
    x: width / 2,
    y: height * 0.72,
    targetX: width / 2,
    targetY: height * 0.72,
    anim: 'idle',
    animStartTime: 0,
    frame: 0,
    facing: 1,
    bobOffset: 0,
  })
  const particlesRef = useRef<Particle[]>([])
  const bgRef = useRef({ r: 232, g: 244, b: 253 })
  const forcedAnimRef = useRef<{ anim: Anim; until: number } | null>(null)
  const lastTickRef = useRef(0)
  const petDataRef = useRef<Pet | null>(null)

  useImperativeHandle(ref, () => ({
    start: () => startAnim(),
    stop: () => stopAnim(),
    triggerAction: (action) => {
      const now = performance.now()
      if (action === 'feed') {
        forcedAnimRef.current = { anim: 'happy', until: now + 1800 }
        spawnParticles('happy', 8)
      } else if (action === 'play') {
        forcedAnimRef.current = { anim: 'jump', until: now + 2000 }
        spawnParticles('happy', 10)
      } else if (action === 'sleep') {
        forcedAnimRef.current = { anim: 'sleeping', until: now + 3000 }
        spawnParticles('sleep', 6)
      }
    },
  }))

  useEffect(() => {
    petDataRef.current = pet
  }, [pet])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'
    const ctx = canvas.getContext('2d')
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }, [width, height])

  function startAnim() {
    if (runningRef.current) return
    runningRef.current = true
    lastTickRef.current = performance.now()
    tick()
  }
  function stopAnim() {
    runningRef.current = false
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
  }

  function spawnParticles(kind: 'hungry' | 'sick' | 'happy' | 'sleep', count: number) {
    const ps = petRef.current
    for (let i = 0; i < count; i++) {
      let color = '#888'
      let size = 4 + Math.random() * 4
      if (kind === 'hungry') color = Math.random() > 0.5 ? '#9e9e9e' : '#bdbdbd'
      else if (kind === 'sick') { color = Math.random() > 0.5 ? '#ef5350' : '#ff8a80'; size = 3 + Math.random() * 5 }
      else if (kind === 'happy') { color = Math.random() > 0.5 ? '#FFD93D' : '#FF8C69'; size = 3 + Math.random() * 4 }
      else if (kind === 'sleep') { color = '#64b5f6'; size = 4 + Math.random() * 5 }
      particlesRef.current.push({
        x: ps.x + (Math.random() - 0.5) * 40,
        y: ps.y - 40 - Math.random() * 20,
        vx: (Math.random() - 0.5) * 0.8,
        vy: kind === 'sleep' ? 0 : -(0.3 + Math.random() * 0.8),
        life: 1,
        maxLife: 60 + Math.random() * 40,
        color,
        size,
      })
    }
  }

  function easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3) }
  function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

  function decideMoodAnim(): Anim {
    const pet = petDataRef.current
    if (!pet) return 'idle'
    if (pet.lost) return 'sick'
    if (pet.health < 30) return 'sick'
    if (pet.hunger < 30 || pet.happiness < 30) return 'idle'
    return 'idle'
  }

  function updateBackground(dt: number) {
    const pet = petDataRef.current
    let target = { r: 232, g: 244, b: 253 }
    if (pet) {
      const worst = Math.min(pet.hunger, pet.happiness, pet.health)
      if (worst < 30) {
        const k = 1 - worst / 30
        target = {
          r: Math.round(lerp(232, 130, k)),
          g: Math.round(lerp(244, 150, k)),
          b: Math.round(lerp(253, 180, k)),
        }
      }
    }
    const k = Math.min(1, dt / 1000)
    bgRef.current.r = Math.round(lerp(bgRef.current.r, target.r, k))
    bgRef.current.g = Math.round(lerp(bgRef.current.g, target.g, k))
    bgRef.current.b = Math.round(lerp(bgRef.current.b, target.b, k))
  }

  function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
    const { r, g, b } = bgRef.current
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, `rgb(${r},${g},${b})`)
    grad.addColorStop(1, `rgb(${Math.max(0, r - 20)},${Math.max(0, g - 20)},${Math.max(0, b - 20)})`)
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    ctx.fillStyle = 'rgba(255,255,255,0.55)'
    drawCloud(ctx, 120, 70, 1)
    drawCloud(ctx, w - 180, 50, 0.8)
    drawCloud(ctx, w * 0.55, 100, 0.65)

    const floorY = h * 0.8
    ctx.fillStyle = `rgba(${Math.max(0, r - 40)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 40)}, 0.85)`
    ctx.fillRect(0, floorY, w, h - floorY)

    const rugs = [
      { x: w * 0.18, y: floorY + 20, w: 120, h: 36, c: '#FFD93D' },
      { x: w * 0.72, y: floorY + 30, w: 140, h: 36, c: '#FF8C69' },
      { x: w * 0.45, y: floorY + 10, w: 100, h: 32, c: '#A5D6A7' },
    ]
    rugs.forEach(r => {
      ctx.save()
      roundRect(ctx, r.x, r.y, r.w, r.h, 10)
      ctx.fillStyle = r.c
      ctx.globalAlpha = 0.75
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
    })

    ctx.fillStyle = '#FFF1D6'
    ctx.fillRect(w * 0.05, h * 0.22, 8, h * 0.5)
    ctx.fillRect(w * 0.95 - 8, h * 0.22, 8, h * 0.5)
  }

  function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
    ctx.beginPath()
    ctx.arc(x, y, 20 * s, 0, Math.PI * 2)
    ctx.arc(x + 22 * s, y - 10 * s, 24 * s, 0, Math.PI * 2)
    ctx.arc(x + 48 * s, y, 20 * s, 0, Math.PI * 2)
    ctx.arc(x + 25 * s, y + 10 * s, 22 * s, 0, Math.PI * 2)
    ctx.fill()
  }

  function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.arcTo(x + w, y, x + w, y + h, r)
    ctx.arcTo(x + w, y + h, x, y + h, r)
    ctx.arcTo(x, y + h, x, y, r)
    ctx.arcTo(x, y, x + w, y, r)
    ctx.closePath()
  }

  function drawPet(ctx: CanvasRenderingContext2D) {
    const ps = petRef.current
    const pet = petDataRef.current
    if (!pet) return
    const now = performance.now()
    const elapsed = (now - ps.animStartTime) / 1000

    let anim: Anim = ps.anim
    if (forcedAnimRef.current && now < forcedAnimRef.current.until) {
      anim = forcedAnimRef.current.anim
    } else if (forcedAnimRef.current && now >= forcedAnimRef.current.until) {
      forcedAnimRef.current = null
    }
    if (anim === 'idle' || anim === 'walk') anim = decideMoodAnim() || anim

    let drawX = ps.x
    let drawY = ps.y
    let scale = 1

    if (anim === 'jump' || (forcedAnimRef.current?.anim === 'jump')) {
      const t = Math.min(1, (now - (forcedAnimRef.current?.until ? forcedAnimRef.current.until - 2000 : ps.animStartTime)) / 2000)
      const jump = Math.sin(t * Math.PI * 2) * 50
      drawY -= jump
      scale = 1 + Math.sin(t * Math.PI * 2) * 0.08
    } else if (anim === 'happy' || forcedAnimRef.current?.anim === 'happy') {
      ps.bobOffset = Math.sin(elapsed * 12) * 6
      drawY += ps.bobOffset
      scale = 1 + Math.sin(elapsed * 8) * 0.05
    } else if (anim === 'sleeping' || forcedAnimRef.current?.anim === 'sleeping') {
      ps.bobOffset = Math.sin(elapsed * 3) * 2
      drawY += ps.bobOffset + 10
    } else if (anim === 'sick') {
      drawY += 5
      scale = 0.95
    } else if (anim === 'walk') {
      ps.bobOffset = Math.sin(elapsed * 10) * 3
      drawY += ps.bobOffset
    } else {
      ps.bobOffset = Math.sin(elapsed * 2.5) * 2
      drawY += ps.bobOffset
    }

    ctx.save()
    ctx.translate(drawX, drawY)
    ctx.scale(ps.facing * scale, scale)

    const lost = pet.lost
    const sick = pet.health < 30
    const hungry = pet.hunger < 30
    const sad = pet.happiness < 30
    const grayscale = lost

    drawPixelPet(ctx, pet.avatar, pet.type, { anim, lost, sick, hungry, sad, forcedHappy: !!(forcedAnimRef.current && (forcedAnimRef.current.anim === 'happy' || forcedAnimRef.current.anim === 'jump')), forcedSleep: !!(forcedAnimRef.current?.anim === 'sleeping'), grayscale })

    ctx.restore()

    if (anim === 'sleeping' || forcedAnimRef.current?.anim === 'sleeping') {
      ctx.save()
      ctx.translate(ps.x + 25, ps.y - 55)
      ctx.fillStyle = 'rgba(100, 181, 246, 0.9)'
      ctx.font = 'bold 18px Nunito, sans-serif'
      const bob = Math.sin(performance.now() / 400) * 2
      ctx.fillText('Z', 0, bob)
      ctx.font = 'bold 14px Nunito, sans-serif'
      ctx.fillStyle = 'rgba(100, 181, 246, 0.7)'
      ctx.fillText('z', 12, bob - 10)
      ctx.fillStyle = 'rgba(100, 181, 246, 0.5)'
      ctx.font = 'bold 11px Nunito, sans-serif'
      ctx.fillText('z', 22, bob - 18)
      ctx.restore()
    }
  }

  function drawPixelPet(
    ctx: CanvasRenderingContext2D,
    avatar: string,
    type: string,
    opts: { anim: Anim; lost: boolean; sick: boolean; hungry: boolean; sad: boolean; forcedHappy: boolean; forcedSleep: boolean; grayscale: boolean }
  ) {
    const px = 4
    const bodyColor = getPetColor(type)
    const earColor = shadeColor(bodyColor, -18)
    const bellyColor = shadeColor(bodyColor, 25)
    const cheekColor = 'rgba(255,150,150,0.65)'

    if (opts.grayscale) ctx.globalAlpha = 0.45

    ctx.save()

    ctx.fillStyle = bodyColor
    // body
    for (let ry = 0; ry < 14; ry++) {
      for (let rx = 0; rx < 16; rx++) {
        const cx = (rx - 8) * px
        const cy = (ry - 4) * px
        const dist = Math.sqrt(((rx - 8) / 6) ** 2 + ((ry - 7) / 6) ** 2)
        if (dist < 1) ctx.fillRect(cx, cy, px, px)
      }
    }
    // head
    for (let ry = 0; ry < 10; ry++) {
      for (let rx = 0; rx < 14; rx++) {
        const cx = (rx - 7) * px
        const cy = (ry - 14) * px
        const dist = Math.sqrt(((rx - 7) / 5.5) ** 2 + ((ry - 5) / 5) ** 2)
        if (dist < 1) ctx.fillRect(cx, cy, px, px)
      }
    }
    // ears
    ctx.fillStyle = earColor
    if (type === 'cat' || type === 'other') {
      // triangle ears
      ctx.fillRect(-24, -54, px * 2, px * 3)
      ctx.fillRect(-22, -58, px * 2, px * 2)
      ctx.fillRect(16, -54, px * 2, px * 3)
      ctx.fillRect(14, -58, px * 2, px * 2)
    } else if (type === 'dog') {
      ctx.fillRect(-24, -54, px * 2, px * 4)
      ctx.fillRect(-22, -50, px, px * 4)
      ctx.fillRect(16, -54, px * 2, px * 4)
      ctx.fillRect(22, -50, px, px * 4)
    } else if (type === 'rabbit') {
      ctx.fillRect(-14, -72, px * 2, px * 6)
      ctx.fillRect(6, -72, px * 2, px * 6)
      ctx.fillStyle = '#ffcccb'
      ctx.fillRect(-13, -68, px, px * 4)
      ctx.fillRect(7, -68, px, px * 4)
      ctx.fillStyle = earColor
    }
    // belly
    ctx.fillStyle = bellyColor
    for (let ry = 6; ry < 13; ry++) {
      for (let rx = 4; rx < 12; rx++) {
        const cx = (rx - 8) * px
        const cy = (ry - 4) * px
        const dist = Math.sqrt(((rx - 8) / 3) ** 2 + ((ry - 9) / 3.5) ** 2)
        if (dist < 1) ctx.fillRect(cx, cy, px, px)
      }
    }

    // eyes
    ctx.fillStyle = '#2a2a2a'
    const eyeY = -44
    let happy = opts.forcedHappy
    let sleep = opts.forcedSleep
    if (opts.anim === 'happy') happy = true
    if (opts.anim === 'sleeping') sleep = true
    if (opts.sick) { ctx.fillStyle = '#4a4a4a' }

    if (sleep) {
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-18, eyeY + 3); ctx.quadraticCurveTo(-14, eyeY - 1, -10, eyeY + 3)
      ctx.moveTo(10, eyeY + 3); ctx.quadraticCurveTo(14, eyeY - 1, 18, eyeY + 3)
      ctx.stroke()
    } else if (happy) {
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(-14, eyeY + 4, 6, Math.PI, 0)
      ctx.arc(14, eyeY + 4, 6, Math.PI, 0)
      ctx.stroke()
    } else if (opts.sad) {
      ctx.fillRect(-17, eyeY, 6, 3)
      ctx.fillRect(11, eyeY, 6, 3)
      ctx.strokeStyle = '#2a2a2a'
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.moveTo(-20, eyeY - 6); ctx.lineTo(-10, eyeY - 2)
      ctx.moveTo(20, eyeY - 6); ctx.lineTo(10, eyeY - 2)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.arc(-14, eyeY, 5, 0, Math.PI * 2)
      ctx.arc(14, eyeY, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(-12, eyeY - 2, 1.6, 0, Math.PI * 2)
      ctx.arc(16, eyeY - 2, 1.6, 0, Math.PI * 2)
      ctx.fill()
    }

    // nose
    ctx.fillStyle = opts.sick ? '#c66' : '#e57373'
    ctx.beginPath()
    ctx.arc(0, -34, 3.5, 0, Math.PI * 2)
    ctx.fill()

    // mouth
    ctx.strokeStyle = '#2a2a2a'
    ctx.lineWidth = 1.8
    if (happy || opts.forcedHappy) {
      ctx.beginPath()
      ctx.arc(0, -28, 8, 0.15 * Math.PI, 0.85 * Math.PI)
      ctx.stroke()
      ctx.fillStyle = '#ef9a9a'
      ctx.beginPath()
      ctx.arc(0, -25, 4, 0, Math.PI)
      ctx.fill()
    } else if (opts.sad) {
      ctx.beginPath()
      ctx.arc(0, -22, 6, 1.1 * Math.PI, 1.9 * Math.PI)
      ctx.stroke()
    } else if (opts.hungry) {
      ctx.beginPath()
      ctx.ellipse(0, -25, 4, 6, 0, 0, Math.PI * 2)
      ctx.stroke()
    } else {
      ctx.beginPath()
      ctx.moveTo(0, -30); ctx.quadraticCurveTo(-4, -26, -7, -28)
      ctx.moveTo(0, -30); ctx.quadraticCurveTo(4, -26, 7, -28)
      ctx.stroke()
    }

    // cheeks
    ctx.fillStyle = cheekColor
    ctx.beginPath()
    ctx.arc(-20, -34, 4, 0, Math.PI * 2)
    ctx.arc(20, -34, 4, 0, Math.PI * 2)
    ctx.fill()

    // sick effect - thermometer / bandage
    if (opts.sick) {
      ctx.strokeStyle = '#e53935'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(-28, -50)
      ctx.lineTo(-10, -38)
      ctx.stroke()
      ctx.fillStyle = '#fff'
      ctx.fillRect(-32, -54, 8, 8)
      ctx.strokeStyle = '#e53935'
      ctx.strokeRect(-32, -54, 8, 8)
    }

    ctx.restore()

    // avatar emoji on head (subtle)
    ctx.save()
    ctx.globalAlpha = opts.grayscale ? 0.35 : 0.9
    ctx.font = '32px serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(avatar, 0, -5)
    ctx.restore()
  }

  function getPetColor(type: string): string {
    switch (type) {
      case 'cat': return '#F5C06E'
      case 'dog': return '#D4A373'
      case 'rabbit': return '#F5E6D3'
      default: return '#C9B8E3'
    }
  }
  function shadeColor(hex: string, pct: number): string {
    const n = parseInt(hex.slice(1), 16)
    let r = (n >> 16) + pct
    let g = ((n >> 8) & 0xff) + pct
    let b = (n & 0xff) + pct
    r = Math.max(0, Math.min(255, r))
    g = Math.max(0, Math.min(255, g))
    b = Math.max(0, Math.min(255, b))
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
  }

  function updateParticles() {
    const pet = petDataRef.current
    if (pet) {
      if (pet.hunger < 35 && Math.random() < 0.1) spawnParticles('hungry', 1)
      if (pet.health < 35 && Math.random() < 0.12) spawnParticles('sick', 1)
    }
    particlesRef.current = particlesRef.current.filter(p => {
      p.x += p.vx
      p.y += p.vy
      p.vy -= 0.008
      p.life -= 1 / p.maxLife
      return p.life > 0
    })
  }

  function drawParticles(ctx: CanvasRenderingContext2D) {
    particlesRef.current.forEach(p => {
      ctx.save()
      ctx.globalAlpha = Math.max(0, p.life)
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    })
  }

  function updatePet(dt: number) {
    const ps = petRef.current
    const now = performance.now()
    const pet = petDataRef.current
    if (!pet) return

    const sleepOrHappy = forcedAnimRef.current && now < forcedAnimRef.current.until
    if (sleepOrHappy) return

    // AI: occasionally change target
    if (Math.abs(ps.x - ps.targetX) < 3 && Math.abs(ps.y - ps.targetY) < 3) {
      if (Math.random() < 0.015) {
        ps.targetX = 100 + Math.random() * (width - 200)
        ps.targetY = height * 0.65 + Math.random() * 60
        ps.anim = Math.random() < 0.2 ? 'jump' : 'walk'
        ps.animStartTime = now
      } else if (ps.anim !== 'idle') {
        ps.anim = 'idle'
        ps.animStartTime = now
      }
    }

    const dx = ps.targetX - ps.x
    const dy = ps.targetY - ps.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    if (dist > 1) {
      const spd = ps.anim === 'jump' ? 2.2 : 1.4
      const step = Math.min(dist, spd * (dt / 16))
      ps.x += (dx / dist) * step
      ps.y += (dy / dist) * step
      ps.facing = dx > 0 ? 1 : -1
      if (ps.anim === 'idle' && !sleepOrHappy) {
        ps.anim = 'walk'
        ps.animStartTime = now
      }
    }
  }

  function tick() {
    if (!runningRef.current) return
    const now = performance.now()
    const dt = Math.min(64, now - lastTickRef.current)
    lastTickRef.current = now

    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      if (ctx) {
        updateBackground(dt)
        updatePet(dt)
        updateParticles()
        drawBackground(ctx, width, height)
        drawParticles(ctx)
        drawPet(ctx)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    startAnim()
    return () => stopAnim()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        display: 'block',
        width: '100%',
        height: 'auto',
        maxHeight: height,
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(255,140,105,0.18), inset 0 0 0 2px rgba(255,217,61,0.3)',
        imageRendering: 'pixelated',
      }}
    />
  )
})
