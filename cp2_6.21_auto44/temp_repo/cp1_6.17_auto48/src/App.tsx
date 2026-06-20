import { GalaxyScene } from './components/GalaxyScene'
import { ControlPanel } from './components/ControlPanel'

function App() {
  return (
    <div style={appStyle}>
      <GalaxyScene />
      <ControlPanel />
    </div>
  )
}

const appStyle: React.CSSProperties = {
  width: '100%',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  background: '#0a0a1a'
}

export default App
