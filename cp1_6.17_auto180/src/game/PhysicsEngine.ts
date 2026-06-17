import type { Point, Mirror, Target, LightSegment } from '../store/useGameStore'

const MAX_REFLECTIONS = 8
const LIGHT_WIDTH = 3
const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 600

interface RayResult {
  point: Point
  mirror: Mirror | null
  distance: number
  normal: Point
}

export class PhysicsEngine {
  private lightAngle: number
  private lightIntensity: number
  private sourcePosition: Point
  private mirrors: Mirror[]
  private targets: Target[]

  constructor(state: {
    lightAngle: number
    lightIntensity: number
    sourcePosition: Point
    mirrors: Mirror[]
    targets: Target[]
  }) {
    this.lightAngle = state.lightAngle
    this.lightIntensity = state.lightIntensity
    this.sourcePosition = state.sourcePosition
    this.mirrors = state.mirrors
    this.targets = JSON.parse(JSON.stringify(state.targets))
  }

  public compute(): {
    path: LightSegment[]
    updatedTargets: Target[]
    victory: boolean
  } {
    const startTime = performance.now()
    const path: LightSegment[] = []
    const hitTargetIds = new Set<string>()

    const radians = (this.lightAngle * Math.PI) / 180
    let currentPos: Point = { ...this.sourcePosition }
    let direction: Point = {
      x: Math.cos(radians),
      y: -Math.sin(radians),
    }
    let intensity = this.lightIntensity / 100

    for (let i = 0; i < MAX_REFLECTIONS; i++) {
      if (intensity <= 0.01) break

      const hitTarget = this.findClosestTargetHit(currentPos, direction)
      const hitMirror = this.findClosestMirrorHit(currentPos, direction)

      let endPoint: Point
      let hitTargetId: string | null = null

      if (hitTarget && (!hitMirror || hitTarget.distance < hitMirror.distance)) {
        endPoint = hitTarget.point
        hitTargetId = hitTarget.targetId
        hitTargetIds.add(hitTarget.targetId)
        path.push({
          start: { ...currentPos },
          end: { ...endPoint },
          intensity,
          hitTargetId,
        })
        break
      } else if (hitMirror) {
        endPoint = hitMirror.point
        path.push({
          start: { ...currentPos },
          end: { ...endPoint },
          intensity,
          hitTargetId: null,
        })

        direction = this.reflect(direction, hitMirror.normal)
        const epsilon = 0.5
        currentPos = {
          x: endPoint.x + direction.x * epsilon,
          y: endPoint.y + direction.y * epsilon,
        }
        intensity *= 0.9
      } else {
        endPoint = this.raycastBoundary(currentPos, direction)
        path.push({
          start: { ...currentPos },
          end: endPoint,
          intensity,
          hitTargetId: null,
        })
        break
      }
    }

    const updatedTargets = this.targets.map((t) => {
      if (hitTargetIds.has(t.id) && !t.activated) {
        return { ...t, activated: true, activatedAt: performance.now() }
      }
      return t
    })

    const victory = updatedTargets.length > 0 && updatedTargets.every((t) => t.activated)

    const elapsed = performance.now() - startTime
    if (elapsed > 2) {
      console.warn(`Physics computation took ${elapsed.toFixed(2)}ms, exceeding 2ms budget`)
    }

    return { path, updatedTargets, victory }
  }

  private findClosestTargetHit(origin: Point, dir: Point): {
    point: Point
    targetId: string
    distance: number
  } | null {
    let closest: { point: Point; targetId: string; distance: number } | null = null

    for (const target of this.targets) {
      const hit = this.rayCircleIntersect(origin, dir, { x: target.x, y: target.y }, target.radius + LIGHT_WIDTH / 2)
      if (hit && hit.distance > 0.1 && (!closest || hit.distance < closest.distance)) {
        closest = { point: hit.point, targetId: target.id, distance: hit.distance }
      }
    }

    return closest
  }

  private findClosestMirrorHit(origin: Point, dir: Point): RayResult | null {
    let closest: RayResult | null = null

    for (const mirror of this.mirrors) {
      const corners = this.getMirrorCorners(mirror)
      const edges: [Point, Point][] = [
        [corners[0], corners[1]],
        [corners[1], corners[2]],
        [corners[2], corners[3]],
        [corners[3], corners[0]],
      ]

      for (let i = 0; i < edges.length; i++) {
        const [a, b] = edges[i]
        const hit = this.raySegmentIntersect(origin, dir, a, b)
        if (hit && hit.distance > 0.1 && (!closest || hit.distance < closest.distance)) {
          const edgeDir = this.normalize({ x: b.x - a.x, y: b.y - a.y })
          let normal = { x: -edgeDir.y, y: edgeDir.x }
          if (this.dot(normal, dir) > 0) {
            normal = { x: -normal.x, y: -normal.y }
          }
          closest = {
            point: hit.point,
            mirror,
            distance: hit.distance,
            normal,
          }
        }
      }
    }

    return closest
  }

  private getMirrorCorners(mirror: Mirror): Point[] {
    const cx = mirror.x
    const cy = mirror.y
    const w = mirror.width / 2
    const h = mirror.height / 2
    const rad = (mirror.rotation * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)

    const local: Point[] = [
      { x: -w, y: -h },
      { x: w, y: -h },
      { x: w, y: h },
      { x: -w, y: h },
    ]

    return local.map((p) => ({
      x: cx + p.x * cos - p.y * sin,
      y: cy + p.x * sin + p.y * cos,
    }))
  }

  private raySegmentIntersect(
    origin: Point,
    dir: Point,
    a: Point,
    b: Point
  ): { point: Point; distance: number } | null {
    const r = dir
    const s = { x: b.x - a.x, y: b.y - a.y }
    const rxs = r.x * s.y - r.y * s.x
    if (Math.abs(rxs) < 1e-9) return null

    const qp = { x: a.x - origin.x, y: a.y - origin.y }
    const t = (qp.x * s.y - qp.y * s.x) / rxs
    const u = (qp.x * r.y - qp.y * r.x) / rxs

    if (t >= 0 && u >= 0 && u <= 1) {
      return {
        point: { x: origin.x + t * r.x, y: origin.y + t * r.y },
        distance: t,
      }
    }
    return null
  }

  private rayCircleIntersect(
    origin: Point,
    dir: Point,
    center: Point,
    radius: number
  ): { point: Point; distance: number } | null {
    const oc = { x: origin.x - center.x, y: origin.y - center.y }
    const a = this.dot(dir, dir)
    const b = 2 * this.dot(oc, dir)
    const c = this.dot(oc, oc) - radius * radius
    const discriminant = b * b - 4 * a * c

    if (discriminant < 0) return null

    const sqrtDisc = Math.sqrt(discriminant)
    const t1 = (-b - sqrtDisc) / (2 * a)
    const t2 = (-b + sqrtDisc) / (2 * a)

    let t = t1 >= 0 ? t1 : t2
    if (t < 0) return null

    return {
      point: { x: origin.x + t * dir.x, y: origin.y + t * dir.y },
      distance: t,
    }
  }

  private raycastBoundary(origin: Point, dir: Point): Point {
    const boundaries: [Point, Point][] = [
      [{ x: 0, y: 0 }, { x: CANVAS_WIDTH, y: 0 }],
      [{ x: CANVAS_WIDTH, y: 0 }, { x: CANVAS_WIDTH, y: CANVAS_HEIGHT }],
      [{ x: CANVAS_WIDTH, y: CANVAS_HEIGHT }, { x: 0, y: CANVAS_HEIGHT }],
      [{ x: 0, y: CANVAS_HEIGHT }, { x: 0, y: 0 }],
    ]

    let closest: { point: Point; distance: number } | null = null
    for (const [a, b] of boundaries) {
      const hit = this.raySegmentIntersect(origin, dir, a, b)
      if (hit && hit.distance > 0 && (!closest || hit.distance < closest.distance)) {
        closest = hit
      }
    }

    return closest ? closest.point : origin
  }

  private reflect(dir: Point, normal: Point): Point {
    const d = this.dot(dir, normal)
    return this.normalize({
      x: dir.x - 2 * d * normal.x,
      y: dir.y - 2 * d * normal.y,
    })
  }

  private dot(a: Point, b: Point): number {
    return a.x * b.x + a.y * b.y
  }

  private normalize(v: Point): Point {
    const len = Math.sqrt(v.x * v.x + v.y * v.y)
    if (len < 1e-9) return { x: 0, y: 0 }
    return { x: v.x / len, y: v.y / len }
  }
}
