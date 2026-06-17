import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import {
  CipherType,
  CipherOption,
  EncryptionResult,
  Particle,
  ParticleColor,
  ParticleState,
  AnimationDirection
} from './types'
import {
  caesarEncrypt,
  caesarDecrypt,
  vigenereEncrypt,
  vigenereDecrypt,
  affineEncrypt,
  affineDecrypt
} from './ciphers'

const COLORS: string[] = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4']

function hexToRgb(hex: string): ParticleColor {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 255, g: 255, b: 255 }
}

function randomColor(): ParticleColor {
  return hexToRgb(COLORS[Math.floor(Math.random() * COLORS.length)])
}

interface AppState extends ParticleState {
  plaintext: string
  ciphertext: string
  cipherType: CipherType
  cipherOptions: CipherOption[]
  caesarShift: number
  vigenereKey: string
  affineA: number
  affineB: number
  particlesStarted: boolean
  setPlaintext: (text: string) => void
  setCipherType: (type: CipherType) => void
  setCaesarShift: (shift: number) => void
  setVigenereKey: (key: string) => void
  setAffineA: (a: number) => void
  setAffineB: (b: number) => void
  encrypt: (canvasWidth: number, canvasHeight: number) => void
  decrypt: (canvasWidth: number, canvasHeight: number) => void
  updateParticles: (timestamp: number) => void
  setPaused: (paused: boolean) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  plaintext: 'Hello World',
  ciphertext: '',
  cipherType: CipherType.CAESAR,
  cipherOptions: [
    {
      type: CipherType.CAESAR,
      name: '凯撒密码',
      description: '通过字母位移实现的简单替换密码'
    },
    {
      type: CipherType.VIGENERE,
      name: '维吉尼亚密码',
      description: '使用关键词进行多表替换的加密算法'
    },
    {
      type: CipherType.AFFINE,
      name: '仿射密码',
      description: '结合乘法和加法的线性替换密码'
    }
  ],
  caesarShift: 3,
  vigenereKey: 'SECRET',
  affineA: 5,
  affineB: 8,
  particles: [],
  isAnimating: false,
  direction: 'encrypt',
  isPaused: false,
  particlesStarted: false,

  setPlaintext: (text: string) => set({ plaintext: text }),
  setCipherType: (type: CipherType) => set({ cipherType: type }),
  setCaesarShift: (shift: number) => set({ caesarShift: shift }),
  setVigenereKey: (key: string) => set({ vigenereKey: key }),
  setAffineA: (a: number) => set({ affineA: a }),
  setAffineB: (b: number) => set({ affineB: b }),

  encrypt: (canvasWidth: number, canvasHeight: number) => {
    const { plaintext, cipherType, caesarShift, vigenereKey, affineA, affineB } = get()
    let result: EncryptionResult

    switch (cipherType) {
      case CipherType.CAESAR:
        result = caesarEncrypt(plaintext, caesarShift)
        break
      case CipherType.VIGENERE:
        result = vigenereEncrypt(plaintext, vigenereKey)
        break
      case CipherType.AFFINE:
        result = affineEncrypt(plaintext, affineA, affineB)
        break
      default:
        result = caesarEncrypt(plaintext, caesarShift)
    }

    const particles = createParticles(
      plaintext,
      result.ciphertext,
      canvasWidth,
      canvasHeight,
      'encrypt'
    )

    set({
      ciphertext: result.ciphertext,
      particles,
      isAnimating: true,
      direction: 'encrypt',
      particlesStarted: false
    })
  },

  decrypt: (canvasWidth: number, canvasHeight: number) => {
    const { ciphertext, cipherType, caesarShift, vigenereKey, affineA, affineB } = get()
    let result: EncryptionResult

    switch (cipherType) {
      case CipherType.CAESAR:
        result = caesarDecrypt(ciphertext, caesarShift)
        break
      case CipherType.VIGENERE:
        result = vigenereDecrypt(ciphertext, vigenereKey)
        break
      case CipherType.AFFINE:
        result = affineDecrypt(ciphertext, affineA, affineB)
        break
      default:
        result = caesarDecrypt(ciphertext, caesarShift)
    }

    const particles = createParticles(
      result.plaintext,
      ciphertext,
      canvasWidth,
      canvasHeight,
      'decrypt'
    )

    set({
      plaintext: result.plaintext,
      particles,
      isAnimating: true,
      direction: 'decrypt',
      particlesStarted: false
    })
  },

  updateParticles: (timestamp: number) => {
    const state = get()
    if (state.isPaused || state.particles.length === 0) return

    let particles = state.particles

    if (!state.particlesStarted) {
      particles = particles.map((p) => ({ ...p, startTime: timestamp }))
      set({ particlesStarted: true })
    }

    const updatedParticles: Particle[] = []
    let allFlyingDone = true

    for (const p of particles) {
      const particle = { ...p, trail: [...p.trail] }

      if (particle.isFlying) {
        allFlyingDone = false

        const elapsed = timestamp - particle.startTime
        const t = Math.min(elapsed / particle.duration, 1)
        const eased = easeOutCubic(t)

        particle.progress = t
        particle.x = bezierX(particle.startX, particle.curveOffsetX, particle.targetX, eased)
        particle.y = bezierY(particle.startY, particle.curveOffsetY, particle.targetY, eased)

        particle.currentColor = {
          r: Math.round(particle.colorStart.r + (particle.colorEnd.r - particle.colorStart.r) * eased),
          g: Math.round(particle.colorStart.g + (particle.colorEnd.g - particle.colorStart.g) * eased),
          b: Math.round(particle.colorStart.b + (particle.colorEnd.b - particle.colorStart.b) * eased)
        }

        particle.rotation += particle.rotationSpeed

        const trailPoint = {
          x: particle.x,
          y: particle.y,
          alpha: 0.3,
          size: 2 + Math.random() * 2,
          createdAt: timestamp
        }
        particle.trail.push(trailPoint)
        particle.trail = particle.trail.filter(
          (tp) => timestamp - tp.createdAt < particle.trailDuration
        )
        particle.trail.forEach((tp) => {
          const age = (timestamp - tp.createdAt) / particle.trailDuration
          tp.alpha = 0.3 * (1 - age)
        })

        if (t >= 1) {
          particle.isFlying = false
          particle.isReached = true
          particle.bounceStartTime = timestamp
          particle.x = particle.targetX
          particle.y = particle.targetY
        }
      }

      updatedParticles.push(particle)
    }

    for (let i = 0; i < updatedParticles.length; i++) {
      const p = updatedParticles[i]
      if (!p.isReached || p.bounceStartTime === 0) continue

      const bounceElapsed = timestamp - p.bounceStartTime
      if (bounceElapsed <= p.bounceDuration) {
        const bt = bounceElapsed / p.bounceDuration
        const bounceOffset = elasticOut(bt) * p.bounceAmplitude
        const angle = (i * 137.5) * (Math.PI / 180)
        p.x = p.targetX + Math.cos(angle) * bounceOffset
        p.y = p.targetY + Math.sin(angle) * bounceOffset
      } else {
        p.x = p.targetX
        p.y = p.targetY
      }
    }

    const flyingParticles = updatedParticles.filter((p) => p.isFlying)
    const flashCooldown = 200

    for (let i = 0; i < flyingParticles.length; i++) {
      for (let j = i + 1; j < flyingParticles.length; j++) {
        const p1 = flyingParticles[i]
        const p2 = flyingParticles[j]
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const distSq = dx * dx + dy * dy
        const minDist = p1.size + p2.size + 10
        const minDistSq = minDist * minDist

        if (distSq < minDistSq && distSq > 0) {
          const dist = Math.sqrt(distSq)
          const overlap = minDist - dist
          const nx = dx / dist
          const ny = dy / dist
          p1.x -= (nx * overlap) / 2
          p1.y -= (ny * overlap) / 2
          p2.x += (nx * overlap) / 2
          p2.y += (ny * overlap) / 2

          const flashDist = p1.size + p2.size + 8
          if (dist < flashDist) {
            const p1CanFlash = !p1.isFlashing || timestamp - p1.flashStartTime > flashCooldown
            const p2CanFlash = !p2.isFlashing || timestamp - p2.flashStartTime > flashCooldown
            if (p1CanFlash && p2CanFlash) {
              p1.isFlashing = true
              p1.flashStartTime = timestamp
              p2.isFlashing = true
              p2.flashStartTime = timestamp
            }
          }
        }
      }
    }

    for (const p of updatedParticles) {
      if (p.isFlashing) {
        const flashElapsed = timestamp - p.flashStartTime
        if (flashElapsed >= p.flashDuration) {
          p.isFlashing = false
        }
      }
    }

    const allReached = updatedParticles.every((p) => p.isReached)
    if (allReached) {
      const maxBounceEnd = Math.max(
        ...updatedParticles.map((p) => p.bounceStartTime + p.bounceDuration)
      )
      if (timestamp >= maxBounceEnd) {
        set({ particles: updatedParticles, isAnimating: false })
        return
      }
    }

    set({ particles: updatedParticles })
  },

  setPaused: (paused: boolean) => set({ isPaused: paused })
}))

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function elasticOut(t: number): number {
  if (t === 0 || t === 1) return 0
  return Math.sin(t * Math.PI * 2) * Math.pow(1 - t, 1.5)
}

function bezierX(x0: number, x1: number, x2: number, t: number): number {
  return (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * x1 + t * t * x2
}

function bezierY(y0: number, y1: number, y2: number, t: number): number {
  return (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * y1 + t * t * y2
}

function createParticles(
  leftText: string,
  rightText: string,
  canvasWidth: number,
  canvasHeight: number,
  direction: AnimationDirection
): Particle[] {
  const particles: Particle[] = []
  const chars = direction === 'encrypt' ? leftText : rightText
  const targetChars = direction === 'encrypt' ? rightText : leftText
  const leftX = 80
  const rightX = canvasWidth - 80
  const centerY = canvasHeight / 2
  const charSpacing = 22
  const charCount = chars.length
  const totalHeight = (charCount - 1) * charSpacing
  const startY = centerY - totalHeight / 2

  for (let i = 0; i < charCount; i++) {
    const char = chars[i]
    const targetChar = targetChars[i] || char
    const size = 6 + Math.random() * 8
    const startX = direction === 'encrypt' ? leftX : rightX
    const endX = direction === 'encrypt' ? rightX : leftX
    const yPos = startY + i * charSpacing
    const curveOffsetX = (startX + endX) / 2 + (Math.random() - 0.5) * 120
    const curveOffsetY = yPos + (Math.random() - 0.5) * 100

    const colorStart = randomColor()
    const colorEnd = randomColor()
    const rotationSpeed = (Math.random() * 0.04 + 0.02) * (10 / size)

    particles.push({
      id: uuidv4(),
      char: direction === 'encrypt' ? targetChar : char,
      x: startX,
      y: yPos,
      startX,
      startY: yPos,
      targetX: endX,
      targetY: yPos,
      size,
      colorStart: direction === 'encrypt' ? colorStart : colorEnd,
      colorEnd: direction === 'encrypt' ? colorEnd : colorStart,
      currentColor: direction === 'encrypt' ? { ...colorStart } : { ...colorEnd },
      progress: 0,
      duration: 1200 + Math.random() * 300,
      startTime: 0,
      isFlying: true,
      isReached: false,
      trail: [],
      trailDuration: 800,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed,
      bounceStartTime: 0,
      bounceDuration: 200,
      bounceAmplitude: 2 + Math.random() * 2,
      isFlashing: false,
      flashStartTime: 0,
      flashDuration: 150,
      curveOffsetX,
      curveOffsetY,
      velocityX: 0,
      velocityY: 0
    })
  }

  return particles
}
