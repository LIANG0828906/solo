import { clamp, mapRange } from './utils'
import { HandState } from './handTracker'
import { GeometryParams } from './sceneManager'

export interface ControlState {
  selectedId: string | null
  selectedTimestamp: number
  pointingAtId: string | null
  pointingStartTime: number
  params: Record<string, GeometryParams>
  isPinching: boolean
  pinchReference: number
  scaleReference: number
}

const SELECT_HOLD_MS = 1500
const PINCH_START_THRESHOLD = 30
const PINCH_LOCK_THRESHOLD = 40
const PINCH_MIN_PX = 6
const PINCH_MAX_PX = 140
const SCALE_MIN = 0.5
const SCALE_MAX = 2.0
const ROT_MIN = 0
const ROT_MAX = 2.0

const DEFAULT_COLORS: Record<string, string> = {
  cube: '#64b5f6',
  sphere: '#f06292',
  torusknot: '#ffb74d'
}

export class GestureController {
  private state: ControlState

  constructor() {
    this.state = {
      selectedId: null,
      selectedTimestamp: 0,
      pointingAtId: null,
      pointingStartTime: 0,
      params: {
        cube: { scale: 1, rotationSpeed: 1, color: DEFAULT_COLORS.cube },
        sphere: { scale: 1, rotationSpeed: 1, color: DEFAULT_COLORS.sphere },
        torusknot: { scale: 1, rotationSpeed: 1, color: DEFAULT_COLORS.torusknot }
      },
      isPinching: false,
      pinchReference: 0,
      scaleReference: 1
    }
  }

  getState(): ControlState {
    return JSON.parse(JSON.stringify(this.state))
  }

  reset(): void {
    this.state.selectedId = null
    this.state.pointingAtId = null
    this.state.pointingStartTime = 0
  }

  update(
    handState: HandState,
    hitGeometryId: string | null,
    timestamp: number
  ): { state: ControlState; changed: boolean } {
    const prev = JSON.stringify(this.state)
    this.handleSelection(handState, hitGeometryId, timestamp)
    this.handlePinchScale(handState)
    this.handleFistRotation(handState)
    const changed = JSON.stringify(this.state) !== prev
    return { state: this.getState(), changed }
  }

  private handleSelection(
    handState: HandState,
    hitGeometryId: string | null,
    timestamp: number
  ): void {
    if (!handState.detected) {
      this.state.pointingAtId = null
      this.state.pointingStartTime = 0
      return
    }

    const isPointing =
      handState.gesture === 'pointing' ||
      (handState.pointingScreen !== null && handState.fistStrength < 0.6)

    if (!isPointing) {
      this.state.pointingAtId = null
      this.state.pointingStartTime = 0
      return
    }

    if (hitGeometryId === null) {
      this.state.pointingAtId = null
      this.state.pointingStartTime = 0
      return
    }

    if (this.state.pointingAtId !== hitGeometryId) {
      this.state.pointingAtId = hitGeometryId
      this.state.pointingStartTime = timestamp
      return
    }

    const held = timestamp - this.state.pointingStartTime
    if (held >= SELECT_HOLD_MS && this.state.selectedId !== hitGeometryId) {
      this.state.selectedId = hitGeometryId
      this.state.selectedTimestamp = timestamp
    }
  }

  private handlePinchScale(handState: HandState): void {
    if (!this.state.selectedId) return
    const params = this.state.params[this.state.selectedId]
    if (!handState.detected) {
      this.state.isPinching = false
      return
    }

    const d = handState.pinchDistance

    if (!this.state.isPinching) {
      if (d < PINCH_START_THRESHOLD && handState.gesture === 'pinch') {
        this.state.isPinching = true
        this.state.pinchReference = d
        this.state.scaleReference = params.scale
      }
      return
    }

    if (d > PINCH_LOCK_THRESHOLD) {
      this.state.isPinching = false
      return
    }

    const delta = d - this.state.pinchReference
    const target = clamp(
      mapRange(d, PINCH_MIN_PX, PINCH_MAX_PX, SCALE_MIN, SCALE_MAX),
      SCALE_MIN,
      SCALE_MAX
    )
    const blendTarget = clamp(this.state.scaleReference + delta * 0.018, SCALE_MIN, SCALE_MAX)
    const finalScale = (target + blendTarget) / 2
    params.scale = clamp(finalScale, SCALE_MIN, SCALE_MAX)
  }

  private handleFistRotation(handState: HandState): void {
    if (!this.state.selectedId) return
    const params = this.state.params[this.state.selectedId]
    if (!handState.detected) {
      params.rotationSpeed = 1
      return
    }
    const s = handState.fistStrength
    const rotSpeed = clamp(mapRange(s, 0, 1, ROT_MAX, ROT_MIN), ROT_MIN, ROT_MAX)
    params.rotationSpeed = rotSpeed
  }

  getPointingProgress(): number {
    if (!this.state.pointingAtId || this.state.pointingStartTime === 0) return 0
    const elapsed = performance.now() - this.state.pointingStartTime
    return clamp(elapsed / SELECT_HOLD_MS, 0, 1)
  }
}
