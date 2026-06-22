import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import Stage from './Stage'
import ControlPanel from './ControlPanel'
import './styles.css'

function App() {
  const [config] = useState({
    lightCount: 12,
    ringRadiusRatio: 0.3,
  })

  return (
    <div className="app-container">
      <Stage lightCount={config.lightCount} ringRadiusRatio={config.ringRadiusRatio} />
      <ControlPanel />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
