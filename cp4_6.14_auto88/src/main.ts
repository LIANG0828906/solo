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

  let prevHeartRate = initialHeartRate
  let prevIsPaused = useHeartStore.getState().isPaused
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
