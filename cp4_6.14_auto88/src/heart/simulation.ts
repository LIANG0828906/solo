import { useHeartStore } from '../store/useHeartStore'

interface SimulationData {
  activationArray: Float32Array
  cycleNumber: number
  avDelay: number
  cardiacOutput: number
  simulationTime: number
}

export interface HeartSimulation {
  start: () => void
  stop: () => void
  setHeartRate: (rate: number) => void
  setPaused: (paused: boolean) => void
}

export function createHeartSimulation(): HeartSimulation {
  let worker: Worker | null = null
  let isRunning = false

  function initWorker(): void {
    worker = new Worker(
      new URL('../../workers/heartSimulation.worker.ts', import.meta.url),
      { type: 'module' }
    )

    worker.onmessage = (e: MessageEvent<SimulationData>) => {
      const { activationArray, cycleNumber, avDelay, cardiacOutput, simulationTime } = e.data
      
      useHeartStore.getState().setSimulationData({
        activationArray: new Float32Array(activationArray),
        cycleNumber,
        avDelay,
        cardiacOutput,
        simulationTime,
      })
    }

    worker.onerror = (error) => {
      console.error('Simulation worker error:', error)
    }
  }

  function start(): void {
    if (isRunning) return
    
    if (!worker) {
      initWorker()
    }
    
    worker?.postMessage({
      type: 'START',
      payload: {},
    })
    
    isRunning = true
  }

  function stop(): void {
    if (worker) {
      worker.terminate()
      worker = null
    }
    isRunning = false
  }

  function setHeartRate(rate: number): void {
    if (!worker) return
    
    worker.postMessage({
      type: 'SET_HEART_RATE',
      payload: { rate },
    })
  }

  function setPaused(paused: boolean): void {
    if (!worker) return
    
    worker.postMessage({
      type: 'SET_PAUSED',
      payload: { paused },
    })
  }

  return {
    start,
    stop,
    setHeartRate,
    setPaused,
  }
}
