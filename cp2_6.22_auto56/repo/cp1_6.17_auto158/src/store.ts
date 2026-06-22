import { create } from 'zustand'
import { FlowEngine } from './FlowEngine'

interface RealtimeData {
  velocity: number
  pressure: number
}

interface AppState {
  selectedControlId: string | null
  selectedControlType: 'valve' | 'pump' | null
  selectedControlName: string
  selectedPipeId: string | null
  controlValues: Record<string, number>
  flowEngine: FlowEngine | null
  realtimeData: RealtimeData
  setSelectedControl: (id: string | null, type: 'valve' | 'pump' | null, name: string, pipeId: string | null) => void
  setControlValue: (id: string, value: number) => void
  setFlowEngine: (engine: FlowEngine) => void
  updateRealtimeData: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  selectedControlId: null,
  selectedControlType: null,
  selectedControlName: '',
  selectedPipeId: null,
  controlValues: {},
  flowEngine: null,
  realtimeData: { velocity: 0, pressure: 0 },

  setSelectedControl: (id, type, name, pipeId) => {
    set({
      selectedControlId: id,
      selectedControlType: type,
      selectedControlName: name,
      selectedPipeId: pipeId
    })
  },

  setControlValue: (id, value) => {
    const { flowEngine, selectedControlType } = get()
    if (!flowEngine) return

    if (selectedControlType === 'valve') {
      flowEngine.setValveOpening(id, value)
    } else if (selectedControlType === 'pump') {
      flowEngine.setPumpPower(id, value)
    }

    set(state => ({
      controlValues: {
        ...state.controlValues,
        [id]: value
      }
    }))
  },

  setFlowEngine: (engine) => {
    set({ flowEngine: engine })
  },

  updateRealtimeData: () => {
    const { flowEngine, selectedPipeId } = get()
    if (!flowEngine || !selectedPipeId) {
      set({ realtimeData: { velocity: 0, pressure: 0 } })
      return
    }

    const velocity = flowEngine.getPipeVelocity(selectedPipeId)
    const pipes = (flowEngine as any).pipes
    const pipe = pipes?.find((p: any) => p.id === selectedPipeId)
    const pressure = pipe ? flowEngine.getNodePressure(pipe.nodeEnd) : 0

    set({ realtimeData: { velocity, pressure } })
  }
}))
