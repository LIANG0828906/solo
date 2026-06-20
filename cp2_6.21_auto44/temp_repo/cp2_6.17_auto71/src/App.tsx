import GameCanvas from './components/GameCanvas'
import HUD from './components/HUD'
import ControlPanel from './components/ControlPanel'

function App() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#1A1A2E',
        minWidth: '800px',
        minHeight: '600px',
        overflow: 'hidden',
      }}
    >
      <HUD />
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
        <GameCanvas />
      </div>
      <ControlPanel />
    </div>
  )
}

export default App
