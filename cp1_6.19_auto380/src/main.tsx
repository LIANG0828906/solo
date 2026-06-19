import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { ControlPanel } from './ui/panel'
import { EnergyChart } from './ui/EnergyChart'
import { sceneManager, initSceneEvents } from './core/scene'
import { initChartEvents } from './core/chart'
import './index.css'

function App() {
  const sceneContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initSceneEvents()
    initChartEvents()

    if (sceneContainerRef.current) {
      sceneManager.mount(sceneContainerRef.current)
    }

    return () => {
      sceneManager.unmount()
    }
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        minWidth: 1024,
        backgroundColor: '#0F172A',
        overflow: 'hidden'
      }}
    >
      <ControlPanel />
      <div
        ref={sceneContainerRef}
        style={{
          flex: 1,
          position: 'relative',
          minWidth: 0
        }}
      >
        <EnergyChart />
      </div>
    </div>
  )
}

const rootElement = document.getElementById('root')
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
}
