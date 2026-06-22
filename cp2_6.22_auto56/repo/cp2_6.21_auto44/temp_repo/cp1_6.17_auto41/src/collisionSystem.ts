import { GameEntity, CollisionEvent, EnemyEntity, BulletEntity, PlayerEntity } from './types'

function getAxes(vertices: { x: number; y: number }[]): { x: number; y: number }[] {
  const axes: { x: number; y: number }[] = []
  for (let i = 0; i < vertices.length; i++) {
    const p1 = vertices[i]
    const p2 = vertices[(i + 1) % vertices.length]
    const edge = { x: p2.x - p1.x, y: p2.y - p1.y }
    const len = Math.sqrt(edge.x * edge.x + edge.y * edge.y)
    if (len > 0) {
      axes.push({ x: -edge.y / len, y: edge.x / len })
    }
  }
  return axes
}

function projectOntoAxis(vertices: { x: number; y: number }[], axis: { x: number; y: number }): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const v of vertices) {
    const proj = v.x * axis.x + v.y * axis.y
    if (proj < min) min = proj
    if (proj > max) max = proj
  }
  return { min, max }
}

function getPlayerVertices(entity: PlayerEntity): { x: number; y: number }[] {
  const { position, width, height, rotation } = entity
  const cx = position.x
  const cy = position.y
  const w = width / 2
  const h = height / 2
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  const raw = [
    { x: 0, y: -h },
    { x: -w, y: h },
    { x: 0, y: h * 0.5 },
    { x: w, y: h }
  ]
  return raw.map(p => ({
    x: cx + (p.x * cos - p.y * sin),
    y: cy + (p.x * sin + p.y * cos)
  }))
}

function getEnemyVertices(entity: EnemyEntity): { x: number; y: number }[] {
  const { position, width, height, rotation, enemyType } = entity
  const cx = position.x
  const cy = position.y
  const r = Math.max(width, height) / 2
  const cos = Math.cos(rotation)
  const sin = Math.sin(rotation)
  
  let sides: number
  switch (enemyType) {
    case 'normal':
      sides = 3
      break
    case 'elite':
      sides = 6
      break
    case 'boss':
      sides = 8
      break
    default:
      sides = 4
  }
  
  const vertices: { x: number; y: number }[] = []
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
    const px = Math.cos(angle) * r
    const py = Math.sin(angle) * r
    vertices.push({
      x: cx + (px * cos - py * sin),
      y: cy + (px * sin + py * cos)
    })
  }
  return vertices
}

function getCircleVertices(entity: BulletEntity): { x: number; y: number }[] {
  const { position, radius } = entity
  const sides = 12
  const vertices: { x: number; y: number }[] = []
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2
    vertices.push({
      x: position.x + Math.cos(angle) * radius,
      y: position.y + Math.sin(angle) * radius
    })
  }
  return vertices
}

function satCollision(
  verticesA: { x: number; y: number }[],
  verticesB: { x: number; y: number }[]
): boolean {
  const axesA = getAxes(verticesA)
  const axesB = getAxes(verticesB)
  const allAxes = [...axesA, ...axesB]

  for (const axis of allAxes) {
    const projA = projectOntoAxis(verticesA, axis)
    const projB = projectOntoAxis(verticesB, axis)
    if (projA.max < projB.min || projB.max < projA.min) {
      return false
    }
  }
  return true
}

function isInView(entity: GameEntity, viewW: number, viewH: number, margin: number = 100): boolean {
  return (
    entity.position.x > -margin &&
    entity.position.x < viewW + margin &&
    entity.position.y > -margin &&
    entity.position.y < viewH + margin
  )
}

export function checkCollisions(
  entities: GameEntity[],
  canvasWidth: number,
  canvasHeight: number
): CollisionEvent[] {
  const events: CollisionEvent[] = []
  const playerBullets: BulletEntity[] = []
  const enemyBullets: BulletEntity[] = []
  const enemies: EnemyEntity[] = []
  let player: PlayerEntity | null = null

  for (const e of entities) {
    if (!e.active) continue
    if (!isInView(e, canvasWidth, canvasHeight)) continue

    if (e.type === 'player') player = e as PlayerEntity
    else if (e.type === 'enemy') enemies.push(e as EnemyEntity)
    else if (e.type === 'playerBullet') playerBullets.push(e as BulletEntity)
    else if (e.type === 'enemyBullet') enemyBullets.push(e as BulletEntity)
  }

  for (const bullet of playerBullets) {
    const bulletVerts = getCircleVertices(bullet)
    for (const enemy of enemies) {
      if (!enemy.active) continue
      const enemyVerts = getEnemyVertices(enemy)
      if (satCollision(bulletVerts, enemyVerts)) {
        events.push({ entityA: bullet, entityB: enemy })
      }
    }
  }

  if (player && !player.invincible) {
    const playerVerts = getPlayerVertices(player)
    for (const enemy of enemies) {
      if (!enemy.active) continue
      const enemyVerts = getEnemyVertices(enemy)
      if (satCollision(playerVerts, enemyVerts)) {
        events.push({ entityA: player, entityB: enemy })
      }
    }
    for (const bullet of enemyBullets) {
      const bulletVerts = getCircleVertices(bullet)
      if (satCollision(playerVerts, bulletVerts)) {
        events.push({ entityA: player, entityB: bullet })
      }
    }
  }

  return events
}
