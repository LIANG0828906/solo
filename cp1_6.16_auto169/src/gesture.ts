import { Hands, Results, NormalizedLandmark } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'

export interface HandPosition {
  normalizedX: number
  normalizedY: number
  pinchDistance: number
  isPinching: boolean
}

export interface GestureCallbacks {
  onPinchStart: (handIndex: number, pos: HandPosition) => void
  onPinchMove: (handIndex: number, pos: HandPosition) => void
  onPinchEnd: (handIndex: number) => void
  onTwoHandScale: (scaleFactor: number, center: { x: number; y: number }) => void
}

const PINCH_THRESHOLD = 0.05
const PINCH_RELEASE_THRESHOLD = 0.08
const MIN_HAND_DISTANCE = 0.02
const MAX_HAND_DISTANCE = 0.6

export class GestureDetector {
  private hands: Hands | null = null
  private camera: Camera | null = null
  private videoElement: HTMLVideoElement | null = null
  private callbacks: GestureCallbacks | null = null
  private isInitialized: boolean = false
  private prevPinchState: Map<number, boolean> = new Map()
  private twoHandStartDistance: number | null = null
  private lastTwoHandScale: number = 1

  constructor() {}

  async init(videoElement: HTMLVideoElement, callbacks: GestureCallbacks): Promise<void> {
    this.videoElement = videoElement
    this.callbacks = callbacks

    this.hands = new Hands({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      }
    })

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.5
    })

    this.hands.onResults(this.handleResults)

    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.hands && this.videoElement) {
          await this.hands.send({ image: this.videoElement })
        }
      },
      width: 640,
      height: 480
    })

    try {
      await this.camera.start()
      this.isInitialized = true
    } catch (error) {
      console.error('Camera start failed:', error)
      throw error
    }
  }

  private handleResults = (results: Results) => {
    if (!this.callbacks) return

    const handsData: Array<{
      index: number
      thumbTip: NormalizedLandmark
      indexTip: NormalizedLandmark
      midpoint: { x: number; y: number }
      pinchDistance: number
      isPinching: boolean
    }> = []

    if (results.multiHandLandmarks) {
      results.multiHandLandmarks.forEach((landmarks, handIdx) => {
        const thumbTip = landmarks[4]
        const indexTip = landmarks[8]
        const dx = thumbTip.x - indexTip.x
        const dy = thumbTip.y - indexTip.y
        const dz = thumbTip.z - indexTip.z
        const pinchDistance = Math.sqrt(dx * dx + dy * dy + dz * dz)

        const wasPinching = this.prevPinchState.get(handIdx) || false
        let isPinching: boolean
        if (wasPinching) {
          isPinching = pinchDistance < PINCH_RELEASE_THRESHOLD
        } else {
          isPinching = pinchDistance < PINCH_THRESHOLD
        }

        const midpoint = {
          x: 1 - (thumbTip.x + indexTip.x) / 2,
          y: (thumbTip.y + indexTip.y) / 2
        }

        handsData.push({
          index: handIdx,
          thumbTip,
          indexTip,
          midpoint,
          pinchDistance,
          isPinching
        })

        const handPos: HandPosition = {
          normalizedX: midpoint.x,
          normalizedY: midpoint.y,
          pinchDistance,
          isPinching
        }

        if (isPinching && !wasPinching) {
          this.callbacks!.onPinchStart(handIdx, handPos)
        } else if (isPinching && wasPinching) {
          this.callbacks!.onPinchMove(handIdx, handPos)
        } else if (!isPinching && wasPinching) {
          this.callbacks!.onPinchEnd(handIdx)
        }

        this.prevPinchState.set(handIdx, isPinching)
      })
    }

    for (const [handIdx, wasPinching] of Array.from(this.prevPinchState.entries())) {
      const stillExists = handsData.some(h => h.index === handIdx)
      if (!stillExists && wasPinching) {
        this.callbacks!.onPinchEnd(handIdx)
        this.prevPinchState.set(handIdx, false)
      }
    }

    const pinchingHands = handsData.filter(h => h.isPinching)
    if (pinchingHands.length === 2) {
      const [h1, h2] = pinchingHands
      const hdx = h1.midpoint.x - h2.midpoint.x
      const hdy = h1.midpoint.y - h2.midpoint.y
      const currentDistance = Math.sqrt(hdx * hdx + hdy * hdy)

      const center = {
        x: (h1.midpoint.x + h2.midpoint.x) / 2,
        y: (h1.midpoint.y + h2.midpoint.y) / 2
      }

      if (this.twoHandStartDistance === null) {
        this.twoHandStartDistance = currentDistance
        this.lastTwoHandScale = 1
      } else {
        const clampedStart = Math.max(this.twoHandStartDistance, MIN_HAND_DISTANCE)
        let ratio = currentDistance / clampedStart
        ratio = Math.max(0.3, Math.min(3.0, ratio))
        const scaleDelta = ratio / this.lastTwoHandScale
        this.lastTwoHandScale = ratio
        this.callbacks.onTwoHandScale(scaleDelta, center)
      }
    } else {
      this.twoHandStartDistance = null
      this.lastTwoHandScale = 1
    }
  }

  getIsInitialized(): boolean {
    return this.isInitialized
  }

  dispose() {
    if (this.camera) {
      this.camera.stop()
      this.camera = null
    }
    if (this.hands) {
      this.hands.close()
      this.hands = null
    }
    this.prevPinchState.clear()
    this.twoHandStartDistance = null
    this.isInitialized = false
  }
}
