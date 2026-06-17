import React from 'react'
import Gallery from './Gallery'
import Toolbar from './Toolbar'

const App: React.FC = () => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: '#1E1E24',
        overflow: 'hidden'
      }}
    >
      <Gallery />
      <Toolbar />
    </div>
  )
}

export default App
