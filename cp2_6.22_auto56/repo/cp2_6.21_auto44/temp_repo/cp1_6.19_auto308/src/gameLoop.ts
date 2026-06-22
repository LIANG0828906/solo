import type { GameState, Bullet, Minion, ShieldState, BossPhase } from './store'
import { getNextState } from './BossAI'

let bulletIdCounter = 0
let minionIdCounter = 0

export interface TickResult {
  playerX: number
  playerY: number
  playerLives: number
  score: number
  shield: ShieldState
  bossX: number
  bossY: number
  bossHp: number
  bossPhase: BossPhase
  phaseStartTime: number
  phaseDuration: number
  chargeStartTime: number
  lastSummonTime: number
  bullets: Bullet[]
  minions: Minion[]
  fps: number
  fpsFrames: number
  fpsLastUpdate: number
  gameOver: boolean
  gameOverStartTime: number
  screenFlash: number
  pulseState: Record<BossPhase, number>
  stateBarProgress: number
}

export function gameTick(state: GameState, dt: number, now: number): Partial<GameState> {
  const {
    gameWidth,
    gameHeight,
    playerSpeed,
    keys,
    maxBullets,
    maxMinions,
  } = state

  let playerX = state.playerX
  let playerY = state.playerY
  let playerLives = state.playerLives
  let score = state.score
  let shield = { ...state.shield }
  let bossX = state.bossX
  let bossY = state.bossY
  let bossHp = state.bossHp
  let bullets = [...state.bullets]
  let minions = [...state.minions]
  let bossPhase = state.bossPhase
  let phaseStartTime = state.phaseStartTime
  let phaseDuration = state.phaseDuration
  let chargeStartTime = state.chargeStartTime
  let lastSummonTime = state.lastSummonTime
  let screenFlash = state.screenFlash
  let pulseState = { ...state.pulseState }
  let stateBarProgress = 1
  let lastFireTime = state.lastFireTime

  let moveX = 0
  let moveY = 0
  if (keys.has('w') || keys.has('arrowup')) moveY -= 1
  if (keys.has('s') || keys.has('arrowdown')) moveY += 1
  if (keys.has('a') || keys.has('arrowleft')) moveX -= 1
  if (keys.has('d') || keys.has('arrowright')) moveX += 1

  if (moveX !== 0 || moveY !== 0) {
    const len = Math.sqrt(moveX * moveX + moveY * moveY)
    playerX += (moveX / len) * playerSpeed * dt
    playerY += (moveY / len) * playerSpeed * dt
  }

  playerX = Math.max(20, Math.min(gameWidth - 20, playerX))
  playerY = Math.max(20, Math.min(gameHeight - 20, playerY))

  if (shield.active && now - shield.startTime >= shield.duration) {
    shield.active = false
  }

  const elapsed = now - phaseStartTime
  stateBarProgress = Math.max(0, 1 - elapsed / phaseDuration)

  switch (bossPhase) {
    case 'chase': {
      const targetX = playerX
      const dx = targetX - bossX
      const speed = 150
      if (Math.abs(dx) > 2) {
        bossX += Math.sign(dx) * speed * dt
      }
      bossX = Math.max(50, Math.min(gameWidth - 50, bossX))
      break
    }
  }

  const nextState = getNextState(state, now)
  if (nextState) {
    bossPhase = nextState.phase
    phaseDuration = nextState.duration
    phaseStartTime = now
    pulseState[nextState.phase] = now

    if (nextState.phase === 'charge') {
      chargeStartTime = now
    }

    if (state.bossPhase === 'charge' && nextState.phase !== 'charge') {
      lastFireTime = now
      const angleToPlayer = Math.atan2(playerY - bossY, playerX - bossX)
      const spreadAngle = Math.PI / 3
      const bulletCount = 8
      const newBullets: Bullet[] = []

      for (let i = 0; i < bulletCount; i++) {
        const t = i / (bulletCount - 1)
        const angle = angleToPlayer - spreadAngle / 2 + spreadAngle * t
        const speed = 250
        newBullets.push({
          id: ++bulletIdCounter,
          x: bossX,
          y: bossY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          createdAt: now,
        })
      }

      bullets = [...bullets, ...newBullets]
      if (bullets.length > maxBullets) {
        bullets = bullets.slice(bullets.length - maxBullets)
      }
    }

    if (state.bossPhase === 'summon' && nextState.phase !== 'summon') {
      const newMinions: Minion[] = []
      const count = 3
      for (let i = 0; i < count; i++) {
        const startX = bossX + (i - 1) * 60
        const startY = bossY + 30
        const targetX = playerX + (i - 1) * 80 + (Math.random() - 0.5) * 50
        const targetY = playerY
        const dx = targetX - startX
        const dy = targetY - startY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const speed = 120
        newMinions.push({
          id: ++minionIdCounter,
          x: startX,
          y: startY,
          vx: (dx / dist) * speed,
          vy: (dy / dist) * speed,
          createdAt: now,
        })
      }

      minions = [...minions, ...newMinions]
      if (minions.length > maxMinions) {
        minions = minions.slice(minions.length - maxMinions)
      }

      lastSummonTime = now
    }
  }

  bullets = bullets
    .map((b) => ({
      ...b,
      x: b.x + b.vx * dt,
      y: b.y + b.vy * dt,
    }))
    .filter(
      (b) =>
        b.x > -20 &&
        b.x < gameWidth + 20 && b.y > -20 && b.y < gameHeight + 20
    )

  minions = minions
    .map((m) => {
      const dx = playerX - m.x
      const dy = playerY - m.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 0) {
        const speed = 80
        return {
          ...m,
          x: m.x + (dx / dist) * speed * dt,
          y: m.y + (dy / dist) * speed * dt,
        }
      }
      return m
    })
    .filter(
      (m) =>
        m.x > -30 &&
        m.x < gameWidth + 30 && m.y > -30 && m.y < gameHeight + 30
    )

  const playerRadius = 15
  const bulletRadius = 6
  const minionSize = 20
  const shieldRadius = 60

  const remainingBullets: Bullet[] = []
  for (const bullet of bullets) {
    const dx = bullet.x - playerX
    const dy = bullet.y - playerY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (shield.active && dist < shieldRadius + bulletRadius) {
      score += 10
      continue
    }

    if (dist < playerRadius + bulletRadius) {
      playerLives -= 1
      screenFlash = now
      continue
    }
    remainingBullets.push(bullet)
  }
  bullets = remainingBullets

  const remainingMinions: Minion[] = []
  for (const minion of minions) {
    const dx = minion.x - playerX
    const dy = minion.y - playerY
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (shield.active && dist < shieldRadius + minionSize / 2) {
      score += 10
      continue
    }

    if (dist < playerRadius + minionSize / 2) {
      playerLives -= 1
      screenFlash = now
      continue
    }
    remainingMinions.push(minion)
  }
  minions = remainingMinions

  let gameOver = false
  let gameOverStartTime = 0
  if (playerLives <= 0) {
    gameOver = true
    gameOverStartTime = now
    screenFlash = now
  }

  let fps = state.fps
  let fpsFrames = state.fpsFrames + 1
  let fpsLastUpdate = state.fpsLastUpdate
  if (now - fpsLastUpdate >= 1000) {
    fps = fpsFrames
    fpsFrames = 0
    fpsLastUpdate = now
  }

  return {
    playerX,
    playerY,
    playerLives,
    score,
    shield,
    bossX,
    bossY,
    bossHp,
    bossPhase,
    phaseStartTime,
    phaseDuration,
    chargeStartTime,
    lastSummonTime,
    bullets,
    minions,
    fps,
    fpsFrames,
    fpsLastUpdate,
    gameOver,
    gameOverStartTime,
    screenFlash,
    pulseState,
    stateBarProgress,
    lastFireTime,
  }
}

export function generateStars(count: number, width: number, height: number) {
  const stars = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 1 + Math.random() * 1,
      twinkleOffset: Math.random() * 3,
      twinkleDuration: 2 + Math.random() * 1,
    })
  }
  return stars
}
