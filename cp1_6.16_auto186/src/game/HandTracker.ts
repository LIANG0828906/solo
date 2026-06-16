import { Hands, Results as HandsResults } from '@mediapipe/hands'

export interface GestureResult {
  spellId: string | null
  confidence: number
  speed: number
}

interface Point {
  x: number
  y: number
  z: number
}

interface TrackedPath {
  points: { x: number; y: number; timestamp: number }[]
}

const GESTURE_SPELL_MAP: Record<string, string> = {
  circle: 'fireball',
  zigzag: 'lightning',
  triangle: 'frost',
  swipe: 'wind',
  push: 'shadow'
}

export class HandTracker {
  private hands: Hands | null = null
  private videoElement: HTMLVideoElement | null = null
  private onGestureDetected: ((result: GestureResult) => void) | null = null
  private isRunning: boolean = false
  private trackedPath: TrackedPath = { points: [] }
  private lastGestureTime: number = 0
  private readonly cooldownMs: number = 2500
  private readonly maxPathPoints: number = 60
  private readonly pathTimeoutMs: number = 1500
  private lastPointTime: number = 0

  constructor() {
    this.hands = null
  }

  async init(videoElement: HTMLVideoElement): Promise<void> {
    this.videoElement = videoElement

    this.hands = new Hands({
      locateFile: (file: string) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    })

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    })

    this.hands.onResults((results: HandsResults) => this.handleResults(results))
  }

  setOnGestureDetected(callback: (result: GestureResult) => void): void {
    this.onGestureDetected = callback
  }

  async start(): Promise<void> {
    if (!this.videoElement || !this.hands) return
    this.isRunning = true
    await this.processFrame()
  }

  stop(): void {
    this.isRunning = false
  }

  private async processFrame(): Promise<void> {
    if (!this.isRunning || !this.videoElement || !this.hands) return

    if (this.videoElement.readyState >= 2) {
      await this.hands.send({ image: this.videoElement })
    }

    requestAnimationFrame(() => this.processFrame())
  }

  private handleResults(results: HandsResults): void {
    const now = Date.now()

    if (now - this.lastGestureTime < this.cooldownMs) {
      return
    }

    if (now - this.lastPointTime > this.pathTimeoutMs) {
      this.trackedPath.points = []
    }

    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      return
    }

    const landmarks = results.multiHandLandmarks[0] as Point[]
    const indexTip = landmarks[8]
    const middleTip = landmarks[12]

    const centerX = (indexTip.x + middleTip.x) / 2
    const centerY = (indexTip.y + middleTip.y) / 2

    this.trackedPath.points.push({
      x: centerX,
      y: centerY,
      timestamp: now
    })

    this.lastPointTime = now

    if (this.trackedPath.points.length > this.maxPathPoints) {
      this.trackedPath.points.shift()
    }

    if (this.trackedPath.points.length >= 20) {
      const gesture = this.recognizeGesture()
      if (gesture.spellId && gesture.confidence > 0.5) {
        this.lastGestureTime = now
        this.trackedPath.points = []
        if (this.onGestureDetected) {
          this.onGestureDetected(gesture)
        }
      }
    }
  }

  private recognizeGesture(): GestureResult {
    const points = this.trackedPath.points
    if (points.length < 10) {
      return { spellId: null, confidence: 0, speed: 0 }
    }

    const { minX, maxX, minY, maxY } = this.getBounds(points)
    const width = maxX - minX
    const height = maxY - minY

    const startPoint = points[0]
    const endPoint = points[points.length - 1]
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    )

    const totalPathLength = this.calculatePathLength(points)
    const duration = points[points.length - 1].timestamp - points[0].timestamp
    const speed = totalPathLength / (duration / 1000)

    const circleScore = this.detectCircle(points, minX, maxX, minY, maxY)
    const zigzagScore = this.detectZigzag(points)
    const triangleScore = this.detectTriangle(points)
    const swipeScore = this.detectSwipe(width, height, distance)
    const pushScore = this.detectPush(points, height)

    const scores: { gesture: string; score: number }[] = [
      { gesture: 'circle', score: circleScore },
      { gesture: 'zigzag', score: zigzagScore },
      { gesture: 'triangle', score: triangleScore },
      { gesture: 'swipe', score: swipeScore },
      { gesture: 'push', score: pushScore }
    ]

    scores.sort((a, b) => b.score - a.score)
    const best = scores[0]

    const normalizedSpeed = Math.min(speed / 3, 1)
    const finalConfidence = Math.min(best.score * (0.7 + normalizedSpeed * 0.3), 1)

    return {
      spellId: finalConfidence > 0.5 ? GESTURE_SPELL_MAP[best.gesture] : null,
      confidence: finalConfidence,
      speed: normalizedSpeed
    }
  }

  private getBounds(points: { x: number; y: number }[]) {
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    for (const p of points) {
      minX = Math.min(minX, p.x)
      maxX = Math.max(maxX, p.x)
      minY = Math.min(minY, p.y)
      maxY = Math.max(maxY, p.y)
    }
    return { minX, maxX, minY, maxY }
  }

  private calculatePathLength(points: { x: number; y: number }[]): number {
    let length = 0
    for (let i = 1; i < points.length; i++) {
      length += Math.sqrt(
        Math.pow(points[i].x - points[i - 1].x, 2) +
        Math.pow(points[i].y - points[i - 1].y, 2)
      )
    }
    return length
  }

  private detectCircle(
    points: { x: number; y: number }[],
    minX: number, maxX: number,
    minY: number, maxY: number
  ): number {
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    const avgRadius = ((maxX - minX) + (maxY - minY)) / 4

    if (avgRadius < 0.08) return 0

    const startPoint = points[0]
    const endPoint = points[points.length - 1]
    const startEndDist = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
      Math.pow(endPoint.y - startPoint.y, 2)
    )

    const startEndRatio = startEndDist / (avgRadius * 2)

    let radiusVariance = 0
    for (const p of points) {
      const dist = Math.sqrt(
        Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2)
      )
      radiusVariance += Math.abs(dist - avgRadius) / avgRadius
    }
    radiusVariance /= points.length

    const width = maxX - minX
    const height = maxY - minY
    const aspectRatio = Math.min(width, height) / Math.max(width, height)

    const score = (1 - radiusVariance) * 0.4 + aspectRatio * 0.3 + (1 - startEndRatio) * 0.3
    return Math.max(0, Math.min(1, score))
  }

  private detectZigzag(points: { x: number; y: number }[]): number {
    if (points.length < 10) return 0

    let directionChanges = 0
    let prevDirection: 'up' | 'down' | null = null

    for (let i = 2; i < points.length; i++) {
      const dy = points[i].y - points[i - 2].y
      if (Math.abs(dy) < 0.01) continue

      const direction: 'up' | 'down' = dy > 0 ? 'down' : 'up'
      if (prevDirection && direction !== prevDirection) {
        directionChanges++
      }
      prevDirection = direction
    }

    const { minX, maxX, minY, maxY } = this.getBounds(points)
    const aspectRatio = (maxY - minY) / (maxX - minX)

    const changesScore = Math.min(directionChanges / 4, 1)
    const aspectScore = aspectRatio > 0.8 ? 0.7 : 0.3

    return changesScore * 0.6 + aspectScore * 0.4
  }

  private detectTriangle(points: { x: number; y: number }[]): number {
    const { minX, maxX, minY, maxY } = this.getBounds(points)
    const width = maxX - minX
    const height = maxY - minY

    if (width < 0.08 || height < 0.08) return 0

    const topPoint = points.reduce((min, p) => p.y < min.y ? p : min, points[0])
    const bottomLeft = points.reduce((min, p) =>
      (p.x < min.x && p.y > (minY + maxY) / 2) ? p : min, points[0]
    )
    const bottomRight = points.reduce((max, p) =>
      (p.x > max.x && p.y > (minY + maxY) / 2) ? p : max, points[0]
    )

    const topToLeft = Math.sqrt(
      Math.pow(topPoint.x - bottomLeft.x, 2) + Math.pow(topPoint.y - bottomLeft.y, 2)
    )
    const topToRight = Math.sqrt(
      Math.pow(topPoint.x - bottomRight.x, 2) + Math.pow(topPoint.y - bottomRight.y, 2)
    )
    const leftToRight = Math.sqrt(
      Math.pow(bottomLeft.x - bottomRight.x, 2) + Math.pow(bottomLeft.y - bottomRight.y, 2)
    )

    const avgSide = (topToLeft + topToRight + leftToRight) / 3
    const sideVariance = (Math.abs(topToLeft - topToRight) + Math.abs(topToLeft - leftToRight) + Math.abs(topToRight - leftToRight)) / (3 * avgSide)

    const aspectRatio = height / width
    const aspectScore = aspectRatio > 0.7 && aspectRatio < 1.5 ? 0.8 : 0.3

    const startPoint = points[0]
    const endPoint = points[points.length - 1]
    const closure = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)
    ) / avgSide

    const score = (1 - sideVariance) * 0.4 + aspectScore * 0.35 + (1 - closure) * 0.25
    return Math.max(0, Math.min(1, score))
  }

  private detectSwipe(width: number, height: number, distance: number): number {
    if (width < 0.15) return 0
    if (height > width * 0.6) return 0

    const aspectScore = Math.min(width / (height + 0.001) / 3, 1)
    const distanceScore = Math.min(distance / 0.3, 1)

    return aspectScore * 0.5 + distanceScore * 0.5
  }

  private detectPush(points: { x: number; y: number }[], height: number): number {
    if (height < 0.1) return 0

    const startY = points[0].y
    const endY = points[points.length - 1].y
    const downwardMovement = endY - startY

    if (downwardMovement < 0.08) return 0

    let lateralMovement = 0
    for (let i = 1; i < points.length; i++) {
      lateralMovement += Math.abs(points[i].x - points[i - 1].x)
    }

    const straightness = 1 - Math.min(lateralMovement / height, 1)

    const speedScore = Math.min(downwardMovement / 0.3, 1)

    return straightness * 0.5 + speedScore * 0.5
  }

  getTrackedPath(): { x: number; y: number }[] {
    return this.trackedPath.points.map(p => ({ x: p.x, y: p.y }))
  }

  destroy(): void {
    this.stop()
    this.hands = null
    this.videoElement = null
    this.onGestureDetected = null
  }
}
