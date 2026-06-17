import MoleculeViewer from './components/MoleculeViewer'
import ControlPanel from './components/ControlPanel'

export default function App() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#000'
      }}
    >
      <div style={{ flex: 1, minWidth: 0, height: '100%' }}>
        <MoleculeViewer />
      </div>
      <ControlPanel />
    </div>
  )
}
