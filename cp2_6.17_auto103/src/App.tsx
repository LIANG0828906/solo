import React, { useEffect, useRef, useState, useCallback } from 'react'
import { ParticleScene } from './components/ParticleScene'
import { ControlPanel } from './ui/ControlPanel'
import { Toolbar } from './ui/Toolbar'
import { useParticleStore } from './store'

declare global {
  interface Window {
    __particleWorker: Worker
  }
}

const App: React.FC = () => {
  const [fps, setFps] = useState(0)
  const rafRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const workerInitedRef = useRef(false)

  const {
    particleCount,
    maxParticles,
    gravity,
    windX,
    windY,
    windZ,
    drag,
    sizeMin,
    sizeMax,
    lifetime,
    togglePanel,
    isPanelOpen,
  } = useParticleStore()

  const initWorker = useCallback(() => {
    if (workerInitedRef.current) return
    try {
      const worker = new Worker(
        new URL('./physics.worker.ts', import.meta.url),
        { type: 'module' }
      )
      window.__particleWorker = worker
      workerInitedRef.current = true

      worker.addEventListener('message', (e: MessageEvent) => {
        if (e.data.type === 'count') {
          useParticleStore.getState().setParticleCount(e.data.payload.count)
        }
      })

      const state = useParticleStore.getState()
      worker.postMessage({
        type: 'setParams',
        payload: {
          gravity: state.gravity,
          windX: state.windX,
          windY: state.windY,
          windZ: state.windZ,
          drag: state.drag,
        },
      })
    } catch (err) {
      console.error('Failed to initialize worker:', err)
    }
  }, [])

  useEffect(() => {
    initWorker()
    return () => {
      if (window.__particleWorker) {
        window.__particleWorker.terminate()
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [initWorker])

  useEffect(() => {
    const worker = window.__particleWorker
    if (!worker) return
    worker.postMessage({
      type: 'setParams',
      payload: {
        gravity,
        windX,
        windY,
        windZ,
        drag,
      },
    })
  }, [gravity, windX, windY, windZ, drag])

  const animate = useCallback((time: number) => {
    const worker = window.__particleWorker
    if (!worker) {
      rafRef.current = requestAnimationFrame(animate)
      return
    }
    const dt = lastTimeRef.current ? Math.min((time - lastTimeRef.current) / 1000, 0.05) : 0.016
    lastTimeRef.current = time
    worker.postMessage({ type: 'update', payload: { dt } })
    rafRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [animate])

  const handleLaunch = () => {
    const worker = window.__particleWorker
    if (!worker) return
    worker.postMessage({
      type: 'emit',
      payload: {
        count: 300,
        sizeMin,
        sizeMax,
        lifetime,
        originX: 0,
        originY: 2,
        originZ: 0,
      },
    })
  }

  return (
    <div className="app">
      <div className="canvas-container">
        <ParticleScene onFpsUpdate={setFps} />
      </div>

      <div className="top-left-panel">
        <div className="fps-counter">FPS: {fps}</div>
        <div className="particle-count">粒子: {particleCount}/{maxParticles}</div>
      </div>

      <div className="bottom-right-panel">
        <div className="phys-summary-title">物理参数</div>
        <div className="phys-summary-row">
          <span className="phys-summary-label">重力:</span>
          {gravity.toFixed(1)} m/s²
        </div>
        <div className="phys-summary-row">
          <span className="phys-summary-label">风力:</span>
          ({windX.toFixed(1)}, {windY.toFixed(1)}, {windZ.toFixed(1)}) N
        </div>
        <div className="phys-summary-row">
          <span className="phys-summary-label">阻力:</span>
          {drag.toFixed(3)}
        </div>
      </div>

      <div className="launch-btn-container">
        <button className="launch-btn" onClick={handleLaunch}>
          发射
        </button>
      </div>

      <ControlPanel />
      <Toolbar />

      <button className="mobile-toggle" onClick={togglePanel}>
        {isPanelOpen ? '✕' : '⚙'}
      </button>
    </div>
  )
}

export default App
