import Scene3D from './Scene3D'
import ControlPanel from './ControlPanel'

function App() {
  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      backgroundColor: '#0a0a1a',
      gap: '20px',
      padding: '20px'
    }}>
      <div style={{
        flex: 1,
        minWidth: 0,
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative'
      }}>
        <Scene3D />
      </div>
      <ControlPanel />
    </div>
  )
}

export default App
