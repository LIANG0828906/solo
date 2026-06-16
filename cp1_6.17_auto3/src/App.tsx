import MoleculeViewer from '@/components/MoleculeViewer'
import ControlPanel from '@/components/ControlPanel'

export default function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      background: '#000'
    }}>
      <div style={{
        flex: '0 0 65%',
        minWidth: 'calc(100% - 320px)',
        height: '100%'
      }}>
        <MoleculeViewer />
      </div>
      <div style={{
        width: '320px',
        minWidth: '320px',
        background: '#2d2d44',
        boxShadow: '0 -2px 0 #00d4ff',
        overflowY: 'auto',
        padding: '16px',
        height: '100%',
        boxSizing: 'border-box'
      }}>
        <ControlPanel />
      </div>
    </div>
  )
}
