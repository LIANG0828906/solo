import Scene3D from './components/Scene3D'
import ControlPanel from './components/ControlPanel'

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Scene3D />
      </div>
      <ControlPanel />
    </div>
  )
}
