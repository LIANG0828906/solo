/*
 * ============================================================
 * 模块调用关系与数据流向
 * ============================================================
 *
 * 职责：
 *   - 管理电信号模拟 Web Worker 的生命周期
 *   - 在主线程与 Worker 之间转发控制命令和状态数据
 *   - 将 Worker 返回的激活数组存入 Zustand store
 *
 * 数据流入：
 *   - controls.tsx 通过 Zustand store 触发心率/暂停/传导开关变更
 *   - useHeartStore.subscribe 监听到变化后调用 setHeartRate / setPaused
 *
 * 内部处理：
 *   1. 创建 Web Worker (workers/heartSimulation.worker.ts)
 *   2. 将控制命令通过 postMessage 发送给 Worker
 *   3. 接收 Worker 每 16ms 推送的 Float32Array 激活数组
 *   4. 将状态数据写入 Zustand store
 *
 * 数据流出：
 *   - 通过 useHeartStore.setSimulationData() 更新全局状态
 *   - activationArray (Float32Array, 长度40, 值范围0-1)
 *   - cycleNumber, avDelay, cardiacOutput, simulationTime
 *
 * 调用方：
 *   - main.ts 在应用启动时调用 createHeartSimulation() 并 start()
 *   - main.ts 通过 store 订阅间接调用 setHeartRate / setPaused
 * ============================================================
 */

import { useHeartStore } from '../store/useHeartStore'

export interface SimulationData {
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
