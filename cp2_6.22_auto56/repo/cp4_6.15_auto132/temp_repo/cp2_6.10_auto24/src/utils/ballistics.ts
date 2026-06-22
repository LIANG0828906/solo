import type { TrajectoryPoint, WindParams } from '../types/army'

const GRAVITY = 9.8
const SCALE_FACTOR = 0.8
const TIME_STEP = 0.05

export function calculateTrajectory(
  counterweight: number,
  launchAngle: number,
  wind: WindParams,
  startX: number = 150,
  startY: number = 300
): TrajectoryPoint[] {
  const angleRad = (launchAngle * Math.PI) / 180
  const velocity = (counterweight / 100) * 42
  const initialVelocityX = Math.cos(angleRad) * velocity
  const initialVelocityY = Math.sin(angleRad) * velocity

  const windEffect = wind.direction === 'right' ? wind.speed * 0.15 : -wind.speed * 0.15

  const points: TrajectoryPoint[] = []
  let x = startX
  let y = startY
  let vx = initialVelocityX
  let vy = initialVelocityY

  const maxInitialVelocity = Math.sqrt(vx * vx + vy * vy)
  let slowdownApplied = false

  while (y >= 150 && x < 1200) {
    const currentSpeed = Math.sqrt(vx * vx + vy * vy)

    if (!slowdownApplied && currentSpeed < maxInitialVelocity * 0.7) {
      vy -= 1.5
      slowdownApplied = true
    }

    points.push({
      x: x * SCALE_FACTOR + startX * (1 - SCALE_FACTOR),
      y: startY - y * SCALE_FACTOR,
      velocity: currentSpeed
    })

    vx += windEffect * TIME_STEP
    vy -= GRAVITY * TIME_STEP

    x += vx * TIME_STEP
    y += vy * TIME_STEP
  }

  points.push({
    x: x * SCALE_FACTOR + startX * (1 - SCALE_FACTOR),
    y: startY - Math.max(150, y * SCALE_FACTOR),
    velocity: 0
  })

  return points
}

export function getLandingPoint(trajectory: TrajectoryPoint[]): { x: number; y: number } {
  if (trajectory.length === 0) return { x: 0, y: 0 }
  const lastPoint = trajectory[trajectory.length - 1]
  return { x: lastPoint.x, y: lastPoint.y }
}

export function checkHit(
  landingX: number,
  landingY: number,
  targetX: number,
  targetY: number,
  targetWidth: number,
  targetHeight: number,
  tolerance: number = 20
): boolean {
  return (
    landingX >= targetX - tolerance &&
    landingX <= targetX + targetWidth + tolerance &&
    landingY >= targetY - tolerance &&
    landingY <= targetY + targetHeight + tolerance
  )
}
