/*
 * ============================================================
 * 模块调用关系与数据流向
 *
 * 入口与配置模块
 * ============================================================
 *
 * 职责：
 *   - 应用程序入口点
 *   - 初始化 Three.js 3D 场景 (heart/scene.ts)
 *   - 初始化电信号模拟 (heart/simulation.ts)
 *   - 初始化 React UI (App.tsx)
 *   - 协调各模块之间的状态同步
 *   - 管理应用生命周期 (启动、卸载)
 *
 * 数据流向：
 *
 *   Web Worker (后台线程)
 *        │
 *        │ 每16ms postMessage:
 *        │   - activationArray (Float32Array[40])
 *        │   - cycleNumber, avDelay, cardiacOutput
 *        ▼
 *   simulation.ts (主线程)
 *        │
 *        │ 调用 useHeartStore.setSimulationData()
 *        ▼
 *   Zustand Store (useHeartStore)
 *        │
 *        ├──→ controls.tsx (UI读取状态)
 *        │       │
 *        │       └──→ 用户交互 → setHeartRate / togglePause / toggleConduction
 *        │
 *        ├──→ infoPanel.tsx (UI读取显示)
 *        │
 *        └──→ scene.ts (动画循环)
 *                │
 *                └──→ heart/model.ts (update顶点/材质)
 *                       │
 *                       └──→ Three.js Renderer → Canvas
 *
 * 调用链：
 *   main.ts
 *   ├── createHeartScene() → scene.start()
 *   ├── createHeartSimulation() → simulation.start()
 *   ├── ReactDOM.createRoot().render(<App />)
 *   └── useHeartStore.subscribe() → 联动 simulation / scene
 * ============================================================
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { createHeartScene } from './heart/scene'
import { createHeartSimulation } from './heart/simulation'
import { useHeartStore } from './store/useHeartStore'

function main(): void {
  const canvasContainer = document.getElementById('canvas-container')
  if (!canvasContainer) {
    console.error('Canvas container not found')
    return
  }

  const scene = createHeartScene(canvasContainer)
  scene.start()

  const simulation = createHeartSimulation()
  simulation.start()

  const initialHeartRate = useHeartStore.getState().heartRate
  simulation.setHeartRate(initialHeartRate)

  const initialConductionVisible = useHeartStore.getState().conductionVisible
  scene.setConductionVisible(initialConductionVisible)

  const initialIsPaused = useHeartStore.getState().isPaused
  simulation.setPaused(initialIsPaused)
  scene.setPaused(initialIsPaused)

  let prevHeartRate = initialHeartRate
  let prevIsPaused = initialIsPaused
  let prevConductionVisible = initialConductionVisible

  const unsubscribe = useHeartStore.subscribe((state) => {
    if (state.heartRate !== prevHeartRate) {
      simulation.setHeartRate(state.heartRate)
      prevHeartRate = state.heartRate
    }
    if (state.isPaused !== prevIsPaused) {
      simulation.setPaused(state.isPaused)
      scene.setPaused(state.isPaused)
      prevIsPaused = state.isPaused
    }
    if (state.conductionVisible !== prevConductionVisible) {
      scene.setConductionVisible(state.conductionVisible)
      prevConductionVisible = state.conductionVisible
    }
  })

  const rootElement = document.getElementById('root')
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      React.createElement(React.StrictMode, null, React.createElement(App))
    )
  }

  window.addEventListener('beforeunload', () => {
    unsubscribe()
    simulation.stop()
    scene.dispose()
  })
}

main()
