import EcoSystem from '@/components/EcoSystem'
import DepthIndicator from '@/components/DepthIndicator'
import InfoPanel from '@/components/InfoPanel/InfoPanel'
import ControlsHint from '@/components/ControlsHint'
import { useStore } from '@/store/useStore'

export default function Home() {
  const loading = useStore((s) => s.loading)

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: '#0A1628',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '20px',
          zIndex: 1000
        }}>
          <div style={{
            width: '60px', height: '60px',
            border: '3px solid rgba(77, 208, 225, 0.2)',
            borderTopColor: '#4DD0E1',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <div style={{
            fontFamily: 'Orbitron, sans-serif',
            color: '#4DD0E1',
            fontSize: '18px',
            letterSpacing: '3px'
          }}>
            正在初始化海底观察站...
          </div>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <EcoSystem />
      <DepthIndicator />
      <InfoPanel />
      <ControlsHint />
    </div>
  )
}
