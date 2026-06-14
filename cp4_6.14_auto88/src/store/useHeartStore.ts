/*
 * ============================================================
 * 模块调用关系与数据流向
 *
 * 状态管理模块 (Zustand)
 * ============================================================
 *
 * 职责：
 *   - 全局状态管理（单一数据源）
 *   - 提供状态读取和更新的接口
 *   - 支持订阅机制，状态变化时通知订阅者
 *
 * 数据流入：
 *   - simulation.ts 调用 setSimulationData() 更新模拟数据
 *   - controls.tsx 调用 setHeartRate() / togglePause() / toggleConduction()
 *     更新控制参数
 *
 * 数据流出：
 *   - 通过 useHeartStore() Hook 供 React 组件读取
 *   - 通过 useHeartStore.getState() 供非 React 代码读取
 *   - 通过 useHeartStore.subscribe() 订阅状态变化
 *
 * 状态字段：
 *   - heartRate: 心率倍率 (0.5 - 3.0)
 *   - isPaused: 是否暂停
 *   - conductionVisible: 电传导可视化开关
 *   - activationArray: 40段激活值数组 (Float32Array, 0-1)
 *   - cycleNumber: 心跳周期计数
 *   - avDelay: 房室延迟 (ms)
 *   - cardiacOutput: 心输出量 (L/min)
 *   - simulationTime: 模拟累计时间 (ms)
 *
 * 调用方：
 *   - controls.tsx: 读写控制状态
 *   - infoPanel.tsx: 读取显示状态
 *   - simulation.ts: 写入模拟数据
 *   - scene.ts: 读取激活数组用于渲染
 *   - main.ts: 订阅状态变化联动各模块
 * ============================================================
 */

import { create } from 'zustand'

interface HeartState {
  heartRate: number
  isPaused: boolean
  conductionVisible: boolean
  activationArray: Float32Array
  cycleNumber: number
  avDelay: number
  cardiacOutput: number
  simulationTime: number

  setHeartRate: (rate: number) => void
  togglePause: () => void
  toggleConduction: () => void
  setActivationArray: (arr: Float32Array) => void
  setSimulationData: (data: {
    activationArray: Float32Array
    cycleNumber: number
    avDelay: number
    cardiacOutput: number
    simulationTime: number
  }) => void
}

export const useHeartStore = create<HeartState>((set) => ({
  heartRate: 1.0,
  isPaused: false,
  conductionVisible: true,
  activationArray: new Float32Array(40),
  cycleNumber: 0,
  avDelay: 120,
  cardiacOutput: 5.0,
  simulationTime: 0,

  setHeartRate: (rate) => set({ heartRate: rate }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  toggleConduction: () => set((state) => ({ conductionVisible: !state.conductionVisible })),
  setActivationArray: (arr) => set({ activationArray: arr }),
  setSimulationData: (data) => set(data),
}))
