export type IncenseType = 'chenxiang' | 'tanxiang' | 'longnao'

export type FanLevel = 0 | 1 | 2 | 3

export interface DoorWindowState {
  leftDoor: boolean
  backWindow: boolean
}

export interface FanState {
  level: FanLevel
  angle: number
}

export interface ParticleData {
  position: Float32Array
  velocity: Float32Array
  life: Float32Array
  size: Float32Array
  alpha: Float32Array
  active: Float32Array
}

export interface FanLevelConfig {
  speed: number
  amplitude: number
  acceleration: number
}

export interface IncenseStore {
  incenseType: IncenseType
  fan: FanState
  doorWindow: DoorWindowState
  particleCount: number
  fps: number

  setIncenseType: (type: IncenseType) => void
  setFanLevel: (level: FanLevel) => void
  setFanAngle: (angle: number) => void
  toggleLeftDoor: () => void
  toggleBackWindow: () => void
  setParticleCount: (count: number) => void
  setFPS: (fps: number) => void
}
