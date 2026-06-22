import React from 'react'
import Scene from './Scene'
import ControlPanel from './ControlPanel'

const App: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      width: '100vw',
      height: '100vh',
      background: '#0B0E11',
      overflow: 'hidden',
    }}>
      <ControlPanel />
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Scene />
      </div>
    </div>
  )
}

export default App
