export enum QuenchMedium {
  Water = 'water',
  Oil = 'oil'
}

export enum CastingPhase {
  Smelting = 'smelting',
  Casting = 'casting',
  Polishing = 'polishing',
  Quenching = 'quenching'
}

export interface MetalMixture {
  copperRatio: number
  tinRatio: number
  temperature: number
  roomTemperature: number
}

export interface SwordState {
  ingotRough: boolean
  polished: boolean
  quenched: boolean
  hardness: number
  toughness: number
  sharpness: number
  initialHardness: number
  initialToughness: number
  initialSharpness: number
}

export interface QuenchParams {
  medium: QuenchMedium
  duration: number
  crackRisk: number
}

export interface CastingLog {
  id: number
  timestamp: number
  message: string
}

export interface ScratchLine {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface CastingStore {
  phase: CastingPhase
  unlockedPhases: CastingPhase[]
  mixture: MetalMixture
  sword: SwordState
  quenchParams: QuenchParams
  polishCount: number
  scratchLines: ScratchLine[]
  pourFlag: boolean
  coolingProgress: number
  logs: CastingLog[]

  updateMixture: (updates: Partial<MetalMixture>) => void
  pourMold: () => void
  updateCoolingProgress: (progress: number) => void
  finishCasting: () => void
  addPolishStroke: (line: ScratchLine) => void
  finishPolishing: () => void
  setQuenchParams: (params: Partial<QuenchParams>) => void
  performQuench: () => void
  addLog: (message: string) => void
  reset: () => void
}
