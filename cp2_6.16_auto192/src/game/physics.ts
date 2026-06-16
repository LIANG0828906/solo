import { useStore, type Debris } from './store'

interface QuadTreePoint {
  x: number
  y: number
  data: Debris
}

interface Bounds {
  x: number
  y: number
  w: number
  h: number
}

class QuadTree {
  private bounds: Bounds
  private capacity: number
  private points: QuadTreePoint[]
  private divided: boolean
  private ne: QuadTree | null
  private nw: QuadTree | null
  private se: QuadTree | null
  private sw: QuadTree | null

  constructor(bounds: Bounds, capacity: number = 4) {
    this.bounds = bounds
    this.capacity = capacity
    this.points = []
    this.divided = false
    this.ne = null
    this.nw = null
    this.se = null
    this.sw = null
  }

  private contains(bounds: Bounds, point: { x: number; y: number }): boolean {
    return (
      point.x >= bounds.x &&
      point.x <= bounds.x + bounds.w &&
      point.y >= bounds.y &&
      point.y <= bounds.y + bounds.h
    )
  }

  private intersects(a: Bounds, b: Bounds): boolean {
    return !(
      a.x > b.x + b.w ||
      a.x + a.w < b.x ||
      a.y > b.y + b.h ||
      a.y + a.h < b.y
    )
  }

  private subdivide(): void {
    const { x, y, w, h } = this.bounds
    const hw = w / 2
    const hh = h / 2
    this.nw = new QuadTree({ x, y, w: hw, h: hh }, this.capacity)
    this.ne = new QuadTree({ x: x + hw, y, w: hw, h: hh }, this.capacity)
    this.sw = new QuadTree({ x, y: y + hh, w: hw, h: hh }, this.capacity)
    this.se = new QuadTree({ x: x + hw, y: y + hh, w: hw, h: hh }, this.capacity)
    this.divided = true
  }

  insert(point: QuadTreePoint): boolean {
    if (!this.contains(this.bounds, point)) return false
    if (this.points.length < this.capacity) {
      this.points.push(point)
      return true
    }
    if (!this.divided) this.subdivide()
    return (
      (this.ne?.insert(point) ?? false) ||
      (this.nw?.insert(point) ?? false) ||
      (this.se?.insert(point) ?? false) ||
      (this.sw?.insert(point) ?? false)
    )
  }

  query(range: Bounds, found: QuadTreePoint[] = []): QuadTreePoint[] {
    if (!this.intersects(this.bounds, range)) return found
    for (const p of this.points) {
      if (this.contains(range, p)) found.push(p)
    }
    if (this.divided) {
      this.ne?.query(range, found)
      this.nw?.query(range, found)
      this.se?.query(range, found)
      this.sw?.query(range, found)
    }
    return found
  }
}

function buildDebrisQuadTree(
  debris: Debris[],
  canvasWidth: number,
  canvasHeight: number
): QuadTree {
  const qt = new QuadTree({ x: 0, y: 0, w: canvasWidth, h: canvasHeight }, 4)
  for (const d of debris) {
    qt.insert({ x: d.x, y: d.y, data: d })
  }
  return qt
}

export function update(dt: number): void {
  const store = useStore.getState()
  store.updatePositions(dt)

  const updatedState = useStore.getState()

  const updatedDebris: Debris[] = []
  const toRemove: string[] = []
  const now = Date.now()

  for (const d of updatedState.debris) {
    let { x, y, vx, vy, opacity, age, radius, rotation, isCleaning, cleanStartTime } = d

    if (isCleaning) {
      const elapsed = (now - cleanStartTime) / 1000
      if (elapsed >= 0.5) {
        toRemove.push(d.id)
        continue
      }
      radius = d.radius * (1 - elapsed / 0.5)
      rotation += d.rotationSpeed * dt * 5
      opacity = d.opacity * (1 - elapsed / 0.5)
    } else {
      const gravStr = updatedState.params.gravityStrength
      const centerX = updatedState.canvasWidth / 2
      const centerY = updatedState.canvasHeight / 2
      const dx = centerX - x
      const dy = centerY - y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > 1) {
        vx += (dx / dist) * gravStr * 20 * dt
        vy += (dy / dist) * gravStr * 20 * dt
      }

      vx *= (1 - 0.01 * dt)
      vy *= (1 - 0.01 * dt)
      x += vx * dt
      y += vy * dt
      age += dt * 1000

      if (age < 2000) {
        opacity = 1 - 0.7 * (age / 2000)
      } else {
        opacity = 0.3 * Math.max(0, 1 - (age - 2000) / 15000)
      }

      rotation += d.rotationSpeed * dt

      if (opacity <= 0.01 || age > 20000) {
        toRemove.push(d.id)
        continue
      }
    }

    updatedDebris.push({
      ...d,
      x,
      y,
      vx,
      vy,
      radius,
      opacity,
      age,
      rotation,
      isCleaning,
      cleanStartTime,
    })
  }

  useStore.setState({ debris: updatedDebris })
  if (toRemove.length > 0) {
    useStore.getState().removeDebris(toRemove)
  }
}

export function detectCollisions(): void {
  const store = useStore.getState()
  const { objects, projectile, debris, params } = store
  const collisionRadius = params.collisionRadius

  if (projectile && projectile.active) {
    for (const obj of objects) {
      if (obj.isDestroyed) continue
      const dx = projectile.x - obj.x
      const dy = projectile.y - obj.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < obj.radius + projectile.radius + collisionRadius) {
        store.handleCollision(obj.id, false)
        useStore.setState({
          projectile: { ...projectile, active: false },
        })
        break
      }
    }
  }

  const currentState = useStore.getState()
  const qt = buildDebrisQuadTree(
    currentState.debris.filter(d => !d.isCleaning),
    currentState.canvasWidth,
    currentState.canvasHeight
  )

  const cascadeHit = new Set<string>()
  for (const obj of currentState.objects) {
    if (obj.isDestroyed) continue
    const searchBounds = {
      x: obj.x - collisionRadius,
      y: obj.y - collisionRadius,
      w: collisionRadius * 2,
      h: collisionRadius * 2,
    }
    const nearby = qt.query(searchBounds)
    for (const point of nearby) {
      const dx = point.data.x - obj.x
      const dy = point.data.y - obj.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < collisionRadius) {
        cascadeHit.add(obj.id)
        break
      }
    }
  }

  for (const objId of cascadeHit) {
    const latestState = useStore.getState()
    const obj = latestState.objects.find(o => o.id === objId)
    if (obj && !obj.isDestroyed) {
      latestState.handleCollision(objId, true)
    }
  }
}
