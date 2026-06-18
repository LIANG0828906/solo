export const ARENA_SIZE = 1000
export const ARENA_PADDING = 20

export interface Player {
  x: number
  y: number
  radius: number
  targetX: number
  targetY: number
  invincibleTimer: number
  blinkTimer: number
  hitFlashTimer: number
}

export interface Obstacle {
  x: number
  y: number
  radius: number
  speed: number
  dx: number
  dy: number
}

export interface Energy {
  x: number
  y: number
  radius: number
  pulsePhase: number
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  radius: number
}

export function createPlayer(): Player {
  const center = ARENA_PADDING + ARENA_SIZE / 2
  return {
    x: center,
    y: center,
    radius: 10,
    targetX: center,
    targetY: center,
    invincibleTimer: 0,
    blinkTimer: 0,
    hitFlashTimer: 0,
  }
}

export function createObstacle(maxRadius: number = 25): Obstacle {
  const side = Math.floor(Math.random() * 4)
  const minRadius = 15
  const radius = minRadius + Math.random() * (maxRadius - minRadius)
  const speed = 0.5 + Math.random() * 1.0
  const margin = ARENA_PADDING
  const arenaEnd = margin + ARENA_SIZE

  let x: number, y: number, dx: number, dy: number

  switch (side) {
    case 0:
      x = margin + radius + Math.random() * (ARENA_SIZE - 2 * radius)
      y = margin - radius
      dx = 0
      dy = speed
      break
    case 1:
      x = arenaEnd + radius
      y = margin + radius + Math.random() * (ARENA_SIZE - 2 * radius)
      dx = -speed
      dy = 0
      break
    case 2:
      x = margin + radius + Math.random() * (ARENA_SIZE - 2 * radius)
      y = arenaEnd + radius
      dx = 0
      dy = -speed
      break
    default:
      x = margin - radius
      y = margin + radius + Math.random() * (ARENA_SIZE - 2 * radius)
      dx = speed
      dy = 0
  }

  return { x, y, radius, speed, dx, dy }
}

export function createEnergy(): Energy {
  const margin = ARENA_PADDING + 10
  const inner = ARENA_SIZE - 20
  return {
    x: margin + Math.random() * inner,
    y: margin + Math.random() * inner,
    radius: 6,
    pulsePhase: Math.random() * Math.PI * 2,
  }
}

export function createCollectParticles(x: number, y: number): Particle[] {
  const count = 3 + Math.floor(Math.random() * 3)
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const speed = 1.5 + Math.random() * 2
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.6,
      maxLife: 0.6,
      color: '#ffffff',
      radius: 2 + Math.random() * 1.5,
    })
  }
  return particles
}

export function createHitParticles(x: number, y: number): Particle[] {
  const count = 8
  const particles: Particle[] = []
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count
    const speed = 2 + Math.random() * 2
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0.5,
      maxLife: 0.5,
      color: '#ff4444',
      radius: 2.5,
    })
  }
  return particles
}

export function updatePlayer(player: Player, deltaTime: number): void {
  const followSpeed = 12
  player.x += (player.targetX - player.x) * Math.min(1, followSpeed * deltaTime)
  player.y += (player.targetY - player.y) * Math.min(1, followSpeed * deltaTime)

  const margin = ARENA_PADDING + player.radius
  const arenaEnd = ARENA_PADDING + ARENA_SIZE - player.radius
  player.x = Math.max(margin, Math.min(arenaEnd, player.x))
  player.y = Math.max(margin, Math.min(arenaEnd, player.y))

  if (player.invincibleTimer > 0) {
    player.invincibleTimer -= deltaTime
    player.blinkTimer += deltaTime
  }
  if (player.hitFlashTimer > 0) {
    player.hitFlashTimer -= deltaTime
  }
}

export function updateObstacle(obstacle: Obstacle, deltaTime: number): boolean {
  obstacle.x += obstacle.dx * deltaTime * 60
  obstacle.y += obstacle.dy * deltaTime * 60

  const margin = ARENA_PADDING
  const arenaEnd = margin + ARENA_SIZE
  const buffer = 60

  return (
    obstacle.x < margin - obstacle.radius - buffer ||
    obstacle.x > arenaEnd + obstacle.radius + buffer ||
    obstacle.y < margin - obstacle.radius - buffer ||
    obstacle.y > arenaEnd + obstacle.radius + buffer
  )
}

export function updateEnergy(energy: Energy, deltaTime: number): void {
  energy.pulsePhase += deltaTime * (Math.PI * 2 / 1.5)
}

export function updateParticle(particle: Particle, deltaTime: number): boolean {
  particle.x += particle.vx * deltaTime * 60
  particle.y += particle.vy * deltaTime * 60
  particle.life -= deltaTime
  return particle.life <= 0
}

export function checkCircleCollision(
  ax: number, ay: number, ar: number,
  bx: number, by: number, br: number
): boolean {
  const dx = ax - bx
  const dy = ay - by
  const distSq = dx * dx + dy * dy
  const r = ar + br
  return distSq < r * r
}

export function renderPlayer(ctx: CanvasRenderingContext2D, player: Player): void {
  const { x, y, radius, invincibleTimer, blinkTimer } = player

  let alpha = 1
  if (invincibleTimer > 0) {
    alpha = 0.3 + 0.3 * Math.sin(blinkTimer * 25)
  }

  ctx.save()
  ctx.globalAlpha = alpha

  const glowRadius = radius * 4
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.45)')
  gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#ffffff'
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

export function renderObstacle(ctx: CanvasRenderingContext2D, obstacle: Obstacle): void {
  const { x, y, radius } = obstacle

  ctx.save()
  ctx.shadowColor = 'rgba(255, 0, 0, 0.6)'
  ctx.shadowBlur = 8

  const gradient = ctx.createRadialGradient(
    x - radius * 0.3, y - radius * 0.3, radius * 0.1,
    x, y, radius
  )
  gradient.addColorStop(0, '#ff6666')
  gradient.addColorStop(0.6, '#ff2222')
  gradient.addColorStop(1, '#cc0000')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, radius, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

export function renderEnergy(ctx: CanvasRenderingContext2D, energy: Energy): void {
  const { x, y, radius, pulsePhase } = energy
  const scale = 1 + 0.1 * Math.sin(pulsePhase)
  const r = radius * scale

  ctx.save()

  const glowR = r * 3
  const glow = ctx.createRadialGradient(x, y, 0, x, y, glowR)
  glow.addColorStop(0, 'rgba(100, 180, 255, 0.4)')
  glow.addColorStop(1, 'rgba(100, 180, 255, 0)')
  ctx.fillStyle = glow
  ctx.beginPath()
  ctx.arc(x, y, glowR, 0, Math.PI * 2)
  ctx.fill()

  const gradient = ctx.createRadialGradient(
    x - r * 0.3, y - r * 0.3, r * 0.1,
    x, y, r
  )
  gradient.addColorStop(0, '#7dd3fc')
  gradient.addColorStop(0.6, '#3b82f6')
  gradient.addColorStop(1, '#1d4ed8')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

export function renderParticle(ctx: CanvasRenderingContext2D, particle: Particle): void {
  const alpha = particle.life / particle.maxLife
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = particle.color
  ctx.beginPath()
  ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}
