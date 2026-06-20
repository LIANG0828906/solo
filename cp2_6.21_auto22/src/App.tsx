import React from 'react'
import SceneCanvas from './components/SceneCanvas'
import ControlPanel from './components/ControlPanel'
import './App.css'

const App: React.FC = () => {
  return (
    <div className="app-container">
      <div className="control-panel-wrapper">
        <ControlPanel />
      </div>
      <div className="scene-viewport">
        <SceneCanvas />
      </div>
    </div>
  )
}

export default App
