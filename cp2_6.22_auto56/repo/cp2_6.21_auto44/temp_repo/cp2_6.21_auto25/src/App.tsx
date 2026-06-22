import MoleculeViewer from '@/view/MoleculeViewer'
import ControlPanel from '@/view/ControlPanel'

export default function App() {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      background: '#0a0e1a',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute',
        top: '24px',
        left: '28px',
        zIndex: 10,
        pointerEvents: 'none',
      }}>
        <h1 style={{
          fontFamily: "'Noto Sans SC', sans-serif",
          fontWeight: 300,
          fontSize: '24px',
          color: '#e0e0e0',
          textShadow: '0 0 10px #00bfff, 0 0 20px #00bfff40, 0 0 40px #00bfff20',
          letterSpacing: '4px',
        }}>
          分子振子
        </h1>
        <div style={{
          fontSize: '11px',
          color: '#00bfff80',
          marginTop: '4px',
          letterSpacing: '2px',
        }}>
          MOLECULE VIBRATOR
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <MoleculeViewer />
        <ControlPanel />
      </div>
    </div>
  )
}
