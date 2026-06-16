import React, { useEffect, useRef, useState } from 'react'
import { Renderer } from './modules/renderer'
import { GameEngine, GameEngineState } from './modules/simulation/gameEngine'
import { SidebarManager } from './modules/ui/sidebarManager'
import { ControlPanel } from './modules/ui/controlPanel'
import { DataDashboard } from './modules/ui/dataDashboard'
import { useCrossroadSignalStore } from './store/crossroadSignalStore'
import { useUIStore } from './store/uiStore'
import { useSimulationStore } from './store/simulationStore'

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rendererRef = useRef<Renderer | null>(null)
  const gameEngineRef = useRef<GameEngine | null>(null)
  const [fps, setFps] = useState(60)

  const { initCrossroads, crossroads, updateSignalStates } = useCrossroadSignalStore()
  const { selectCrossroad, selectedCrossroadId } = useUIStore()
  const { updateStats, updateDisplayStats } = useSimulationStore()

  useEffect(() => {
    initCrossroads()
  }, [initCrossroads])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const wrapper = canvas.parentElement
      if (wrapper && rendererRef.current) {
        rendererRef.current.resize(wrapper.clientWidth, wrapper.clientHeight)
      }
    }

    const renderer = new Renderer(canvas)
    rendererRef.current = renderer
    resizeCanvas()

    renderer.setOnCrossroadClick((crossroadId) => {
      selectCrossroad(crossroadId)
    })

    const gameEngine = new GameEngine()
    gameEngineRef.current = gameEngine
    gameEngine.setCrossroads(crossroads)

    const engineState = { vehicles: [] as any[], pedestrians: [] as any[], crossroads: new Map() }

    gameEngine.setOnUpdate((state: GameEngineState) => {
      engineState.vehicles = state.vehicles
      engineState.pedestrians = state.pedestrians
      engineState.crossroads = state.crossroads
      updateSignalStates(1 / 60)
    })

    gameEngine.setOnStatsUpdate((stats) => {
      setFps(stats.fps)
      updateStats({
        avgVehicleWaitTime: stats.avgWait,
        avgPedestrianCrossTime: stats.avgCross,
        efficiencyScore: stats.score,
        fps: stats.fps,
        vehicleCount: engineState.vehicles.filter((v) => v.active).length,
        pedestrianCount: engineState.pedestrians.filter((p) => p.active).length,
      })
      updateDisplayStats()
    })

    gameEngine.start()

    let animFrameId: number
    const renderLoop = () => {
      if (rendererRef.current && gameEngineRef.current) {
        gameEngineRef.current.setCrossroads(useCrossroadSignalStore.getState().crossroads)
        rendererRef.current.render(
          engineState.vehicles,
          engineState.pedestrians,
          useCrossroadSignalStore.getState().crossroads,
          useUIStore.getState().selectedCrossroadId
        )
      }
      animFrameId = requestAnimationFrame(renderLoop)
    }
    renderLoop()

    window.addEventListener('resize', resizeCanvas)

    return () => {
      cancelAnimationFrame(animFrameId)
      window.removeEventListener('resize', resizeCanvas)
      gameEngine.stop()
      renderer.destroy()
    }
  }, [])

  return (
    <div className="app-container">
      <div className="top-bar">
        <div className="app-title">TrafficPulse</div>
        <div className={`fps-display ${fps < 30 ? 'low' : ''}`}>FPS: {fps}</div>
      </div>

      <div className="main-content">
        <SidebarManager />
        <div className="canvas-wrapper">
          <canvas ref={canvasRef} className="game-canvas" />
        </div>
      </div>

      <DataDashboard />
      <ControlPanel />
    </div>
  )
}

export default App
