import { MoleculeProvider } from './utils/context'
import MoleculeScene from './components/MoleculeScene'
import ControlPanel from './components/ControlPanel'
import InfoPanel from './components/InfoPanel'
import MiniMap from './components/MiniMap'

export default function App() {
  return (
    <MoleculeProvider>
      <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
        <MoleculeScene />
        <ControlPanel />
        <InfoPanel />
        <MiniMap />
      </div>
    </MoleculeProvider>
  )
}
