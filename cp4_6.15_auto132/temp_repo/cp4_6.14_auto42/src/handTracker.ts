import { Hands, Results } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import { clamp, distance, mapRange, normalizeToPixel } from './utils'

export interface HandLandmarks {
  landmarks: Array<{ x: number; y: number; z: number }>
}

export type GestureType = 'pinch' | 'fist' | 'open' | 'pointing' | 'none'

export interface HandState {
  detected: boolean
  landmarks: HandLandmarks | null
  gesture: GestureType
  pointingDirection: { x: number; y: number } | null
  pointingScreen: { x: number; y: number } | null
  pinchDistance: number
  fistStrength: number
  lastDetectedTime: number
  fps: number
}

const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17]
]

const CANVAS_WIDTH = 320
const CANVAS_HEIGHT = 240
const PINCH_THRESHOLD = 30
const FIST_CLOSED_DIST = 0.12
const FIST_OPEN_DIST = 0.28

type UpdateCallback = (state: HandState) => void

export class HandTracker {
  private video: HTMLVideoElement
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D | null
  private hands: Hands | null = null
  private camera: Camera | null = null
  private running = false
  private callbacks: UpdateCallback[] = []

  private state: HandState = {
    detected: false,
    landmarks: null,
    gesture: 'none',
    pointingDirection: null,
    pointingScreen: null,
    pinchDistance: 0,
    fistStrength: 0,
    lastDetectedTime: 0,
    fps: 0
  }

  private lastFrameTime = 0
  private frameCount = 0
  private fpsUpdateTime = 0
  private smoothedLandmarks: Array<{ x: number; y: number; z: number }> | null = null

  constructor(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.video = videoElement
    this.canvas = canvasElement
    this.canvas.width = CANVAS_WIDTH
    this.canvas.height = CANVAS_HEIGHT
    this.ctx = canvasElement.getContext('2d')
  }

  onUpdate(callback: UpdateCallback): void {
    this.callbacks.push(callback)
  }

  private emitUpdate(): void {
    for (const cb of this.callbacks) {
      cb({ ...this.state })
    }
  }

  async start(): Promise<void> {
    if (this.running) return
    this.running = true

    this.hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      }
    })

    this.hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.6,
      minTrackingConfidence: 0.5
    })

    this.hands.onResults((results: Results) => {
      this.updateFPS()
      this.processResults(results)
      this.emitUpdate()
    })

    this.camera = new Camera(this.video, {
      onFrame: async () => {
        if (this.hands && this.running) {
          await this.hands.send({ image: this.video })
        }
      },
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT
    })

    await this.camera.start()
  }

  stop(): void {
    this.running = false
    if (this.camera) {
      this.camera.stop()
      this.camera = null
    }
    if (this.hands) {
      this.hands.close()
      this.hands = null
    }
  }

  getState(): HandState {
    return { ...this.state }
  }

  private updateFPS(): void {
    const now = performance.now()
    this.frameCount++
    if (now - this.fpsUpdateTime >= 1000) {
      this.state.fps = Math.round((this.frameCount * 1000) / (now - this.fpsUpdateTime))
      this.frameCount = 0
      this.fpsUpdateTime = now
    }
  }

  private smoothLandmarks(raw: Array<{ x: number; y: number; z: number }>): Array<{ x: number; y: number; z: number }> {
    const alpha = 0.5
    if (!this.smoothedLandmarks) {
      this.smoothedLandmarks = raw.map(p => ({ ...p }))
      return this.smoothedLandmarks
    }
    for (let i = 0; i < raw.length; i++) {
      this.smoothedLandmarks[i].x = this.smoothedLandmarks[i].x * (1 - alpha) + raw[i].x * alpha
      this.smoothedLandmarks[i].y = this.smoothedLandmarks[i].y * (1 - alpha) + raw[i].y * alpha
      this.smoothedLandmarks[i].z = this.smoothedLandmarks[i].z * (1 - alpha) + raw[i].z * alpha
    }
    return this.smoothedLandmarks
  }

  private processResults(results: Results): void {
    const hasHand = results.multiHandLandmarks && results.multiHandLandmarks.length > 0
    const now = performance.now()

    if (!hasHand) {
      this.state.detected = false
      this.state.landmarks = null
      this.state.gesture = 'none'
      this.state.pointingDirection = null
      this.state.pointingScreen = null
      this.state.pinchDistance = 0
      this.state.fistStrength = 0
      return
    }

    this.state.detected = true
    this.state.lastDetectedTime = now
    const raw = results.multiHandLandmarks![0]
    const lm = this.smoothLandmarks(raw.map(p => ({ x: p.x, y: p.y, z: p.z })))
    this.state.landmarks = { landmarks: lm }

    const wrist = lm[0]
    const thumbTip = lm[4]
    const indexTip = lm[8]
    const indexMcp = lm[5]
    const middleTip = lm[12]
    const ringTip = lm[16]
    const pinkyTip = lm[20]

    const pinchPx = distance(
      normalizeToPixel(thumbTip, CANVAS_WIDTH, CANVAS_HEIGHT),
      normalizeToPixel(indexTip, CANVAS_WIDTH, CANVAS_HEIGHT)
    )
    this.state.pinchDistance = pinchPx

    const fingertipDistances = [indexTip, middleTip, ringTip, pinkyTip, thumbTip].map(
      tip => distance(tip, wrist)
    )
    const avgDist = fingertipDistances.reduce((a, b) => a + b, 0) / fingertipDistances.length
    this.state.fistStrength = clamp(
      mapRange(avgDist, FIST_OPEN_DIST, FIST_CLOSED_DIST, 0, 1),
      0,
      1
    )

    const direction = {
      x: indexTip.x - indexMcp.x,
      y: indexTip.y - indexMcp.y
    }
    const dirLen = Math.sqrt(direction.x * direction.x + direction.y * direction.y)
    if (dirLen > 0.01) {
      this.state.pointingDirection = {
        x: direction.x / dirLen,
        y: direction.y / dirLen
      }
      this.state.pointingScreen = {
        x: clamp(indexTip.x + direction.x * 0.3, 0, 1),
        y: clamp(indexTip.y + direction.y * 0.3, 0, 1)
      }
    } else {
      this.state.pointingDirection = null
      this.state.pointingScreen = null
    }

    let gesture: GestureType = 'none'
    const middleDist = distance(middleTip, wrist)
    const openThreshold = (FIST_CLOSED_DIST + FIST_OPEN_DIST) / 2

    if (pinchPx < PINCH_THRESHOLD) {
      gesture = 'pinch'
    } else if (avgDist < FIST_CLOSED_DIST + 0.02) {
      gesture = 'fist'
    } else if (middleDist > openThreshold) {
      gesture = 'open'
    } else if (this.state.pointingDirection && distance(indexTip, wrist) > 0.18) {
      gesture = 'pointing'
    }

    this.state.gesture = gesture
  }

  drawSkeleton(): void {
    const ctx = this.ctx
    if (!ctx) return

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

    if (this.video.readyState >= 2) {
      ctx.save()
      ctx.translate(CANVAS_WIDTH, 0)
      ctx.scale(-1, 1)
      ctx.drawImage(this.video, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
      ctx.restore()
    }

    if (!this.state.landmarks) return

    const lm = this.state.landmarks.landmarks.map(p =>
      normalizeToPixel({ x: 1 - p.x, y: p.y }, CANVAS_WIDTH, CANVAS_HEIGHT)
    )

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (const [a, b] of HAND_CONNECTIONS) {
      const pa = lm[a]
      const pb = lm[b]
      ctx.moveTo(pa.x, pa.y)
      ctx.lineTo(pb.x, pb.y)
    }
    ctx.stroke()

    ctx.fillStyle = '#64b5f6'
    for (const p of lm) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

export const CANVAS_SIZE = { width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
