import { v4 as uuidv4 } from 'uuid'
import type { FeatherColor, PowerLevel, HitResult, Particle } from '@/store/gameStore'

export interface TrajectoryPoint {
  x: number
  y: number
  t: number
}

export interface ThrowParams {
  angle: number
  power: PowerLevel
  startX: number
  startY: number
}

export interface HitZone {
  x: number
  y: number
  width: number
  height: number
}

export interface HitZones {
  inner: HitZone
  leftEar: HitZone
  rightEar: HitZone
}

const FEATHER_COLORS: FeatherColor[] = ['red', 'blue', 'green']

const POWER_VELOCITY: Record<PowerLevel, number> = {
  light: 2.5,
  medium: 3.5,
  heavy: 4.5,
}

const GRAVITY = 0.015
const TIME_STEP = 0.02
const MAX_TRAJECTORY_POINTS = 100

export class GameEngine {
  static drawArrow(): FeatherColor {
    return FEATHER_COLORS[Math.floor(Math.random() * FEATHER_COLORS.length)]
  }

  static calculateTrajectory(params: ThrowParams): TrajectoryPoint[] {
    const { angle, power, startX, startY } = params
    const velocity = POWER_VELOCITY[power]
    const angleRad = (angle * Math.PI) / 180

    const vx = velocity * Math.cos(angleRad)
    const vy = -velocity * Math.sin(angleRad)

    const points: TrajectoryPoint[] = []
    let x = startX
    let y = startY
    let currentVy = vy
    let t = 0

    for (let i = 0; i < MAX_TRAJECTORY_POINTS; i++) {
      points.push({ x, y, t })

      x += vx
      y += currentVy
      currentVy += GRAVITY
      t += TIME_STEP

      if (y > startY + 300 || x > startX + 800) {
        break
      }
    }

    points.push({ x, y, t })
    return points
  }

  static getLandingPosition(trajectory: TrajectoryPoint[], groundY: number): { x: number; y: number } {
    for (let i = 1; i < trajectory.length; i++) {
      const prev = trajectory[i - 1]
      const curr = trajectory[i]

      if (curr.y >= groundY) {
        const t = (groundY - prev.y) / (curr.y - prev.y)
        return {
          x: prev.x + t * (curr.x - prev.x),
          y: groundY,
        }
      }
    }

    const last = trajectory[trajectory.length - 1]
    return { x: last.x, y: Math.min(last.y, groundY) }
  }

  static hitTest(landingX: number, landingY: number, hitZones: HitZones): HitResult {
    const { inner, leftEar, rightEar } = hitZones

    if (this.isInZone(landingX, landingY, inner)) {
      return 'inner'
    }

    if (this.isInZone(landingX, landingY, leftEar) || this.isInZone(landingX, landingY, rightEar)) {
      return 'ear'
    }

    return 'miss'
  }

  private static isInZone(x: number, y: number, zone: HitZone): boolean {
    return (
      x >= zone.x - zone.width / 2 &&
      x <= zone.x + zone.width / 2 &&
      y >= zone.y - zone.height / 2 &&
      y <= zone.y + zone.height / 2
    )
  }

  static calculateScore(hitResult: HitResult): number {
    switch (hitResult) {
      case 'inner':
        return 2
      case 'ear':
        return 1
      case 'miss':
        return -1
      default:
        return 0
    }
  }

  static getScoreMessage(hitResult: HitResult): string {
    switch (hitResult) {
      case 'inner':
        return '中！内壶得2筹！'
      case 'ear':
        return '耳投！得1筹！'
      case 'miss':
        return '失误！罚酒1筹！'
      default:
        return ''
    }
  }

  static createDustParticles(x: number, y: number): Particle[] {
    const particles: Particle[] = []
    const colors = ['#8b7355', '#a08050', '#6b4e2e', '#d2b48c']

    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 1 + Math.random() * 3
      particles.push({
        id: uuidv4(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 3 + Math.random() * 4,
      })
    }

    return particles
  }

  static createFeatherParticles(x: number, y: number, color: string): Particle[] {
    const particles: Particle[] = []
    const featherColors = {
      red: ['#dc143c', '#ff6b6b', '#ff8c8c'],
      blue: ['#4169e1', '#6495ed', '#87ceeb'],
      green: ['#228b22', '#32cd32', '#90ee90'],
    }

    const colors = featherColors[color as keyof typeof featherColors] || featherColors.red

    for (let i = 0; i < 8; i++) {
      particles.push({
        id: uuidv4(),
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 2,
        vy: 0.5 + Math.random() * 2,
        life: 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 4 + Math.random() * 6,
      })
    }

    return particles
  }

  static getBezierPath(startX: number, startY: number, endX: number, endY: number, angle: number): string {
    const peakHeight = Math.abs(endY - startY) * 0.6 + 50
    const controlY = Math.min(startY, endY) - peakHeight

    const angleRad = (angle * Math.PI) / 180
    const controlOffset = Math.cos(angleRad) * 100

    const cp1x = startX + controlOffset
    const cp1y = controlY
    const cp2x = endX - controlOffset
    const cp2y = controlY

    return `M ${startX} ${startY} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endX} ${endY}`
  }
}
