import { create } from 'zustand'

export interface CalibrationRecord {
  id: number
  timestamp: string
  equatorialAngle: number
  horizonAngle: number
  meridianAngle: number
  averageDeviation: number
  status: 'pass' | 'fail'
}

export interface PlanetData {
  name: string
  color: string
  radius: number
  orbitRadius: number
  speed: number
  initialAngle: number
}

export const PLANETS: PlanetData[] = [
  { name: '太阳', color: '#ffd700', radius: 0.5, orbitRadius: 4.5, speed: 0.005, initialAngle: 0 },
  { name: '太阴', color: '#c0c0c0', radius: 0.45, orbitRadius: 4.0, speed: 0.007, initialAngle: 60 },
  { name: '水星', color: '#90ee90', radius: 0.3, orbitRadius: 3.5, speed: 0.009, initialAngle: 120 },
  { name: '金星', color: '#87ceeb', radius: 0.35, orbitRadius: 5.0, speed: 0.006, initialAngle: 180 },
  { name: '火星', color: '#ff4500', radius: 0.4, orbitRadius: 5.5, speed: 0.004, initialAngle: 240 },
  { name: '木星', color: '#ffa500', radius: 0.6, orbitRadius: 6.0, speed: 0.003, initialAngle: 300 },
  { name: '土星', color: '#daa520', radius: 0.55, orbitRadius: 6.5, speed: 0.002, initialAngle: 330 },
]

export const CONSTELLATIONS = [
  '角宿一', '亢宿二', '氐宿三', '房宿四', '心宿五', '尾宿六', '箕宿七',
  '斗宿一', '牛宿二', '女宿三', '虚宿四', '危宿五', '室宿六', '壁宿七',
  '奎宿一', '娄宿二', '胃宿三', '昴宿四', '毕宿五', '觜宿六', '参宿七',
  '井宿一', '鬼宿二', '柳宿三', '星宿四', '张宿五', '翼宿六', '轸宿七',
]

export const SHICHEN = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

interface HunyuanState {
  equatorialAngle: number
  horizonAngle: number
  meridianAngle: number
  rotationSpeed: number
  isCalibrated: boolean
  averageDeviation: number
  currentSkyRegion: string
  currentPlanetPosition: string
  calibrationHistory: CalibrationRecord[]
  showWarning: boolean
  warningMessage: string
  flashRed: boolean
  showSuccessBeam: boolean
  skyRotation: number

  setEquatorialAngle: (angle: number) => void
  setHorizonAngle: (angle: number) => void
  setMeridianAngle: (angle: number) => void
  setRotationSpeed: (speed: number) => void
  setAverageDeviation: (deviation: number) => void
  setCurrentSkyRegion: (region: string) => void
  setCurrentPlanetPosition: (pos: string) => void
  addCalibrationRecord: () => void
  resetAll: () => void
  setShowWarning: (show: boolean, message: string) => void
  setFlashRed: (flash: boolean) => void
  setShowSuccessBeam: (show: boolean) => void
  setSkyRotation: (rotation: number) => void
  checkCalibration: () => void
}

const IDEAL_EQUATORIAL = 23.4
const IDEAL_HORIZON = 45
const CALIBRATION_TOLERANCE = 2

export const useHunyuanStore = create<HunyuanState>((set, get) => ({
  equatorialAngle: 45,
  horizonAngle: 0,
  meridianAngle: 90,
  rotationSpeed: 0,
  isCalibrated: false,
  averageDeviation: 0,
  currentSkyRegion: '角宿一',
  currentPlanetPosition: '土星在井宿',
  calibrationHistory: [],
  showWarning: false,
  warningMessage: '',
  flashRed: false,
  showSuccessBeam: false,
  skyRotation: 0,

  setEquatorialAngle: (angle: number) => {
    if (angle < 15 || angle > 45) {
      set({ flashRed: true, showWarning: true, warningMessage: '角度超出浑天仪机械限位，禁止调整' })
      setTimeout(() => set({ flashRed: false }), 500)
      setTimeout(() => set({ showWarning: false, warningMessage: '' }), 3000)
      return
    }
    set({ equatorialAngle: angle })
    get().checkCalibration()
  },

  setHorizonAngle: (angle: number) => {
    const normalized = ((angle % 360) + 360) % 360
    set({ horizonAngle: normalized })
    get().checkCalibration()
  },

  setMeridianAngle: (angle: number) => {
    set({ meridianAngle: angle })
    get().checkCalibration()
  },

  setRotationSpeed: (speed: number) => {
    set({ rotationSpeed: Math.max(0, Math.min(1, speed)) })
  },

  setAverageDeviation: (deviation: number) => {
    set({ averageDeviation: deviation })
  },

  setCurrentSkyRegion: (region: string) => {
    set({ currentSkyRegion: region })
  },

  setCurrentPlanetPosition: (pos: string) => {
    set({ currentPlanetPosition: pos })
  },

  addCalibrationRecord: () => {
    const state = get()
    const now = new Date()
    const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`
    
    const newRecord: CalibrationRecord = {
      id: Date.now(),
      timestamp,
      equatorialAngle: state.equatorialAngle,
      horizonAngle: state.horizonAngle,
      meridianAngle: state.meridianAngle,
      averageDeviation: state.averageDeviation,
      status: state.isCalibrated ? 'pass' : 'fail',
    }

    set((state) => ({
      calibrationHistory: [newRecord, ...state.calibrationHistory].slice(0, 20),
    }))
  },

  resetAll: () => {
    set({
      equatorialAngle: 45,
      horizonAngle: 0,
      meridianAngle: 90,
      rotationSpeed: 0,
      isCalibrated: false,
      averageDeviation: 0,
      calibrationHistory: [],
      skyRotation: 0,
    })
  },

  setShowWarning: (show: boolean, message: string) => {
    set({ showWarning: show, warningMessage: message })
  },

  setFlashRed: (flash: boolean) => {
    set({ flashRed: flash })
  },

  setShowSuccessBeam: (show: boolean) => {
    set({ showSuccessBeam: show })
  },

  setSkyRotation: (rotation: number) => {
    set({ skyRotation: rotation })
  },

  checkCalibration: () => {
    const state = get()
    const equatorialDeviation = Math.abs(state.equatorialAngle - IDEAL_EQUATORIAL)
    const horizonDeviation = Math.abs(state.horizonAngle - IDEAL_HORIZON)
    const calibrated = equatorialDeviation <= CALIBRATION_TOLERANCE && horizonDeviation <= CALIBRATION_TOLERANCE

    if (calibrated && !state.isCalibrated) {
      set({ isCalibrated: true, showSuccessBeam: true })
      setTimeout(() => set({ showSuccessBeam: false }), 2000)
    } else if (!calibrated && state.isCalibrated) {
      set({ isCalibrated: false })
    }
  },
}))
