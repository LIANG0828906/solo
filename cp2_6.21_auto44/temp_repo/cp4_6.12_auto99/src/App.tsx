import { useEffect, useRef, useState } from 'react'
import SpringScene from './SpringScene'
import ControlPanel from './ControlPanel'
import EnergyChart from './EnergyChart'
import { useSimulationStore } from './store'
import { stepPhysics } from './physicsEngine'
import './App.css'

const SAMPLE_INTERVAL = 100

function App() {
  const {
    damping,
    stiffness,
    forceAmplitude,
    forceFrequency,
    isRunning,
    elapsedTime,
    position,
    velocity,
    history,
    setPhysicsOutput,
    addHistoryPoint,
    incrementElapsedTime
  } = useSimulationStore()

  const lastFrameTimeRef = useRef<number>(performance.now())
  const lastSampleTimeRef = useRef<number>(0)
  const rafIdRef = useRef<number | null>(null)
  const [isTablet, setIsTablet] = useState(false)
  const [chartExpanded, setChartExpanded] = useState(false)

  useEffect(() => {
    const checkWidth = () => {
      setIsTablet(window.innerWidth < 1024)
    }
    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  useEffect(() => {
    const loop = (now: number) => {
      const lastTime = lastFrameTimeRef.current
      let dt = (now - lastTime) / 1000
      lastFrameTimeRef.current = now

      if (dt > 0.05) dt = 0.05

      if (isRunning) {
        const output = stepPhysics(
          { damping, stiffness, forceAmplitude, forceFrequency },
          { position, velocity },
          elapsedTime,
          dt
        )
        setPhysicsOutput(output)
        incrementElapsedTime(dt)

        const timeSinceLastSample = now - lastSampleTimeRef.current
        if (timeSinceLastSample >= SAMPLE_INTERVAL) {
          lastSampleTimeRef.current = now
          const totalEnergy = output.kineticEnergy + output.potentialEnergy
          addHistoryPoint({
            time: elapsedTime + dt,
            position: output.position,
            kineticEnergy: output.kineticEnergy,
            potentialEnergy: output.potentialEnergy,
            totalEnergy
          })
        }
      }

      rafIdRef.current = requestAnimationFrame(loop)
    }

    rafIdRef.current = requestAnimationFrame(loop)

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current)
      }
    }
  }, [
    isRunning,
    damping,
    stiffness,
    forceAmplitude,
    forceFrequency,
    elapsedTime,
    position,
    velocity,
    setPhysicsOutput,
    addHistoryPoint,
    incrementElapsedTime
  ])

  return (
    <div className="app-container">
      <div className="scene-container">
        <SpringScene position={position} />
        <div className="status-bar">
          <span>状态: {isRunning ? '运行中' : '已暂停'}</span>
          <span>时间: {elapsedTime.toFixed(2)}s</span>
          <span>位移: {position.toFixed(3)}m</span>
        </div>
      </div>

      {!isTablet ? (
        <div className="right-panel">
          <ControlPanel />
          <EnergyChart history={history} />
        </div>
      ) : (
        <div className="bottom-panel">
          <ControlPanel />
          <div className="chart-drawer">
            <button
              className="drawer-toggle"
              onClick={() => setChartExpanded(!chartExpanded)}
            >
              {chartExpanded ? '收起图表 ▲' : '展开图表 ▼'}
            </button>
            {chartExpanded && (
              <div className="drawer-content">
                <EnergyChart history={history} />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
