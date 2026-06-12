import { create } from 'zustand'

export type EventType = 'plasma_rupture' | 'coil_quench' | 'impurity_injection'

export interface FusionParams {
  temperature: number
  density: number
  magneticField: number
}

export interface HistoryRecord {
  timestamp: number
  temperature: number
  density: number
  magneticField: number
  event?: EventType
}

export interface EventState {
  type: EventType
  name: string
  startTime: number
  responseTime: number
  remainingTime: number
  correctActions: string[]
  options: {
    category: string
    choices: string[]
  }[]
  isResolved: boolean
  isFailed: boolean
}

export interface ReactorStore {
  params: FusionParams
  history: HistoryRecord[]
  currentEvent: EventState | null
  eventQueue: EventType[]
  isReplayMode: boolean
  replayTime: number
  replaySpeed: number
  isShutdown: boolean
  shutdownReason: string | null

  updateParams: (params: Partial<FusionParams>) => void
  addHistoryRecord: (record: HistoryRecord) => void
  triggerEvent: (type: EventType) => void
  resolveEvent: (success: boolean) => void
  applyEmergencyAction: (action: string) => void
  updateEventRemainingTime: (time: number) => void
  toggleReplay: () => void
  setReplayTime: (time: number) => void
  triggerShutdown: (reason: string) => void
  resetReactor: () => void
}

const EVENT_CONFIGS: Record<EventType, {
  name: string
  correctActions: string[]
  options: { category: string; choices: string[] }[]
  description: string
}> = {
  plasma_rupture: {
    name: '等离子体破裂',
    correctActions: ['降低功率', '启动辅助加热', '调整偏滤器'],
    options: [
      {
        category: '功率控制',
        choices: ['降低功率', '提升功率', '保持功率']
      },
      {
        category: '加热系统',
        choices: ['启动辅助加热', '关闭辅助加热', '切换冷却模式']
      },
      {
        category: '偏滤器',
        choices: ['调整偏滤器', '关闭偏滤器', '增强偏滤器磁场']
      }
    ],
    description: '等离子体温度骤降，约束失效风险'
  },
  coil_quench: {
    name: '磁场线圈失超',
    correctActions: ['紧急切断电流', '启动备用电源', '降低等离子体密度'],
    options: [
      {
        category: '电流控制',
        choices: ['紧急切断电流', '提升电流', '保持电流稳定']
      },
      {
        category: '电源系统',
        choices: ['启动备用电源', '切换主电源', '关闭所有电源']
      },
      {
        category: '等离子体',
        choices: ['降低等离子体密度', '提升等离子体密度', '注入杂质气体']
      }
    ],
    description: '超导线圈失超，磁场强度急剧下降'
  },
  impurity_injection: {
    name: '杂质注入',
    correctActions: ['启动排气系统', '增强约束磁场', '提高等离子体温度'],
    options: [
      {
        category: '排气系统',
        choices: ['启动排气系统', '关闭排气系统', '切换循环模式']
      },
      {
        category: '磁场控制',
        choices: ['增强约束磁场', '减弱约束磁场', '保持磁场稳定']
      },
      {
        category: '温度控制',
        choices: ['提高等离子体温度', '降低等离子体温度', '保持温度稳定']
      }
    ],
    description: '杂质浓度飙升，等离子体纯度下降'
  }
}

const INITIAL_PARAMS: FusionParams = {
  temperature: 50,
  density: 1.5,
  magneticField: 5
}

const MAX_HISTORY = 360

export const useReactorStore = create<ReactorStore>((set, get) => ({
  params: { ...INITIAL_PARAMS },
  history: [],
  currentEvent: null,
  eventQueue: [],
  isReplayMode: false,
  replayTime: 0,
  replaySpeed: 2,
  isShutdown: false,
  shutdownReason: null,

  updateParams: (newParams) => set((state) => ({
    params: { ...state.params, ...newParams }
  })),

  addHistoryRecord: (record) => set((state) => {
    const newHistory = [...state.history, record]
    if (newHistory.length > MAX_HISTORY) {
      newHistory.shift()
    }
    return { history: newHistory }
  }),

  triggerEvent: (type) => {
    const config = EVENT_CONFIGS[type]
    const event: EventState = {
      type,
      name: config.name,
      startTime: Date.now(),
      responseTime: 5000,
      remainingTime: 5000,
      correctActions: config.correctActions,
      options: config.options,
      isResolved: false,
      isFailed: false
    }

    switch (type) {
      case 'plasma_rupture':
        set((state) => ({
          params: { ...state.params, temperature: state.params.temperature * 0.5 }
        }))
        break
      case 'coil_quench':
        set((state) => ({
          params: { ...state.params, magneticField: 0 }
        }))
        break
      case 'impurity_injection':
        set((state) => ({
          params: { ...state.params, density: state.params.density * 2 }
        }))
        break
    }

    set({ currentEvent: event })
  },

  resolveEvent: (success) => set((state) => {
    if (!state.currentEvent) return state

    if (!success) {
      const { params } = state
      const tempDeviation = Math.abs(params.temperature - 50) / 50
      const densDeviation = Math.abs(params.density - 1.5) / 1.5
      const fieldDeviation = Math.abs(params.magneticField - 5) / 5

      if (tempDeviation > 0.2 || densDeviation > 0.2 || fieldDeviation > 0.2) {
        return {
          currentEvent: { ...state.currentEvent, isFailed: true, isResolved: true },
          isShutdown: true,
          shutdownReason: '参数偏离正常范围超过20%，触发聚变停堆警告'
        }
      }
    }

    return {
      currentEvent: { ...state.currentEvent, isResolved: true }
    }
  }),

  applyEmergencyAction: (action) => set((state) => {
    const { params } = state

    let newParams = { ...params }

    switch (action) {
      case '降低功率':
        newParams.temperature = Math.max(1, newParams.temperature * 0.9)
        break
      case '提升功率':
        newParams.temperature = Math.min(150, newParams.temperature * 1.1)
        break
      case '启动辅助加热':
        newParams.temperature = Math.min(150, newParams.temperature * 1.3)
        break
      case '关闭辅助加热':
        newParams.temperature = Math.max(1, newParams.temperature * 0.85)
        break
      case '调整偏滤器':
        newParams.density = Math.max(0.1, newParams.density * 0.9)
        break
      case '关闭偏滤器':
        newParams.density = Math.min(5, newParams.density * 1.2)
        break
      case '增强偏滤器磁场':
        newParams.magneticField = Math.min(10, newParams.magneticField * 1.1)
        break
      case '紧急切断电流':
        newParams.magneticField = Math.max(1, newParams.magneticField * 0.7)
        break
      case '提升电流':
        newParams.magneticField = Math.min(10, newParams.magneticField * 1.2)
        break
      case '启动备用电源':
        newParams.magneticField = Math.min(10, newParams.magneticField * 1.4)
        break
      case '切换主电源':
        newParams.magneticField = Math.max(1, newParams.magneticField * 0.9)
        break
      case '关闭所有电源':
        newParams.magneticField = Math.max(1, newParams.magneticField * 0.5)
        break
      case '降低等离子体密度':
        newParams.density = Math.max(0.1, newParams.density * 0.7)
        break
      case '提升等离子体密度':
        newParams.density = Math.min(5, newParams.density * 1.3)
        break
      case '注入杂质气体':
        newParams.density = Math.min(5, newParams.density * 1.5)
        break
      case '启动排气系统':
        newParams.density = Math.max(0.1, newParams.density * 0.6)
        break
      case '关闭排气系统':
        newParams.density = Math.min(5, newParams.density * 1.1)
        break
      case '切换循环模式':
        newParams.density = newParams.density * 1.05
        break
      case '增强约束磁场':
        newParams.magneticField = Math.min(10, newParams.magneticField * 1.25)
        break
      case '减弱约束磁场':
        newParams.magneticField = Math.max(1, newParams.magneticField * 0.8)
        break
      case '提高等离子体温度':
        newParams.temperature = Math.min(150, newParams.temperature * 1.2)
        break
      case '降低等离子体温度':
        newParams.temperature = Math.max(1, newParams.temperature * 0.85)
        break
      default:
        break
    }

    return { params: newParams }
  }),

  updateEventRemainingTime: (time) => set((state) => {
    if (!state.currentEvent) return state
    return {
      currentEvent: { ...state.currentEvent, remainingTime: time }
    }
  }),

  toggleReplay: () => set((state) => ({
    isReplayMode: !state.isReplayMode,
    replayTime: state.isReplayMode ? 0 : 0
  })),

  setReplayTime: (time) => set({ replayTime: time }),

  triggerShutdown: (reason) => set({
    isShutdown: true,
    shutdownReason: reason
  }),

  resetReactor: () => set({
    params: { ...INITIAL_PARAMS },
    currentEvent: null,
    isShutdown: false,
    shutdownReason: null,
    history: []
  })
}))
