import { create } from 'zustand'
import {
  CastingPhase,
  QuenchMedium,
  type CastingStore,
  type MetalMixture,
  type SwordState,
  type QuenchParams,
  type ScratchLine,
  type CastingLog
} from './types'

const getInitialMixture = (): MetalMixture => ({
  copperRatio: 85,
  tinRatio: 15,
  temperature: 800,
  roomTemperature: 20 + Math.random() * 10
})

const getInitialSword = (): SwordState => ({
  ingotRough: false,
  polished: false,
  quenched: false,
  hardness: 50,
  toughness: 50,
  sharpness: 0,
  initialHardness: 50,
  initialToughness: 50,
  initialSharpness: 0
})

const getInitialQuenchParams = (): QuenchParams => ({
  medium: QuenchMedium.Water,
  duration: 5,
  crackRisk: 0
})

const calculateCrackRisk = (duration: number): number => {
  return Math.max(0, Math.min(100, (8 - duration) * 12.5))
}

const calculateBaseProperties = (mixture: MetalMixture, roomTemp: number): { hardness: number; toughness: number } => {
  const tinEffect = (mixture.tinRatio - 10) * 1.5
  const tempEffect = (mixture.temperature - 950) * 0.1
  const coolRateEffect = (roomTemp - 25) * 0.8

  const baseHardness = 60 + tinEffect - tempEffect
  const baseToughness = 55 - tinEffect + coolRateEffect

  return {
    hardness: Math.max(30, Math.min(80, baseHardness)),
    toughness: Math.max(30, Math.min(80, baseToughness))
  }
}

export const useCastingStore = create<CastingStore>((set, get) => ({
  phase: CastingPhase.Smelting,
  unlockedPhases: [CastingPhase.Smelting],
  mixture: getInitialMixture(),
  sword: getInitialSword(),
  quenchParams: getInitialQuenchParams(),
  polishCount: 0,
  scratchLines: [],
  pourFlag: false,
  coolingProgress: 0,
  logs: [],

  updateMixture: (updates: Partial<MetalMixture>) => {
    const current = get().mixture
    const newMixture = { ...current, ...updates }

    if ('copperRatio' in updates && updates.copperRatio !== undefined) {
      newMixture.tinRatio = 100 - updates.copperRatio
    }

    set({ mixture: newMixture })
  },

  pourMold: () => {
    const { mixture } = get()
    const isReady = mixture.copperRatio >= 85 &&
      mixture.temperature >= 900 &&
      mixture.temperature <= 1000

    if (!isReady) {
      get().addLog('铜液未达标，无法浇铸！')
      return
    }

    const baseProps = calculateBaseProperties(mixture, mixture.roomTemperature)
    set({
      pourFlag: true,
      coolingProgress: 0,
      sword: {
        ...get().sword,
        hardness: baseProps.hardness,
        toughness: baseProps.toughness,
        initialHardness: baseProps.hardness,
        initialToughness: baseProps.toughness
      }
    })
    get().addLog(`开始浇铸，室温${mixture.roomTemperature.toFixed(1)}°C`)
  },

  updateCoolingProgress: (progress: number) => {
    set({ coolingProgress: progress })
  },

  finishCasting: () => {
    set({
      pourFlag: false,
      coolingProgress: 0,
      sword: { ...get().sword, ingotRough: true },
      phase: CastingPhase.Polishing,
      unlockedPhases: [...get().unlockedPhases, CastingPhase.Polishing]
    })
    get().addLog('剑坯冷却完成，取出待打磨')
  },

  addPolishStroke: (line: ScratchLine) => {
    const currentLines = get().scratchLines
    const newLines = [...currentLines, line]

    if (newLines.length > 200) {
      newLines.shift()
    }

    const newCount = get().polishCount + 1
    const newSharpness = Math.min(70, newCount * 3.5)

    set({
      scratchLines: newLines,
      polishCount: newCount,
      sword: {
        ...get().sword,
        sharpness: newSharpness,
        initialSharpness: newSharpness
      }
    })
  },

  finishPolishing: () => {
    set({
      sword: { ...get().sword, polished: true },
      phase: CastingPhase.Quenching,
      unlockedPhases: [...get().unlockedPhases, CastingPhase.Quenching]
    })
    get().addLog(`开刃完成，共打磨${get().polishCount}次`)
  },

  setQuenchParams: (params: Partial<QuenchParams>) => {
    const current = get().quenchParams
    const newParams = { ...current, ...params }

    if (params.duration !== undefined) {
      newParams.crackRisk = calculateCrackRisk(params.duration)
    }

    set({ quenchParams: newParams })
  },

  performQuench: () => {
    const { sword, quenchParams } = get()
    let hardnessMod = 0
    let toughnessMod = 0

    if (quenchParams.medium === QuenchMedium.Water) {
      hardnessMod = 20
      toughnessMod = -15
    } else {
      hardnessMod = 10
      toughnessMod = 10
    }

    const durationFactor = (8 - quenchParams.duration) / 6
    hardnessMod += durationFactor * 10
    toughnessMod -= durationFactor * 5

    const crackChance = quenchParams.crackRisk
    const hasCrack = Math.random() * 100 < crackChance

    if (hasCrack) {
      toughnessMod -= 20
      get().addLog('警告：淬火过快，剑身出现裂纹！')
    }

    set({
      sword: {
        ...sword,
        quenched: true,
        hardness: Math.max(0, Math.min(100, sword.hardness + hardnessMod)),
        toughness: Math.max(0, Math.min(100, sword.toughness + toughnessMod))
      }
    })

    const medium = quenchParams.medium === QuenchMedium.Water ? '水淬' : '油淬'
    get().addLog(`${medium}完成，冷却${quenchParams.duration}秒`)
  },

  addLog: (message: string) => {
    const newLog: CastingLog = {
      id: Date.now(),
      timestamp: Date.now(),
      message
    }

    const logs = [newLog, ...get().logs].slice(0, 5)
    set({ logs })
  },

  reset: () => {
    set({
      phase: CastingPhase.Smelting,
      unlockedPhases: [CastingPhase.Smelting],
      mixture: getInitialMixture(),
      sword: getInitialSword(),
      quenchParams: getInitialQuenchParams(),
      polishCount: 0,
      scratchLines: [],
      pourFlag: false,
      coolingProgress: 0,
      logs: []
    })
    get().addLog('铸造流程已重置')
  }
}))
