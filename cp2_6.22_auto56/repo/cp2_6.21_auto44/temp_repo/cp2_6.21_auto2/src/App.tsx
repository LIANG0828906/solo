import PlantPanel from './PlantPanel'
import PlantScene from './PlantScene'
import ControlPanel from './ControlPanel'

const App = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      background: 'linear-gradient(135deg, #0d2818 0%, #123a28 40%, #1b4d3e 100%)',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        background: `
          radial-gradient(ellipse at 20% 80%, rgba(100,200,150,0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 20%, rgba(150,255,200,0.06) 0%, transparent 50%),
          radial-gradient(ellipse at 50% 50%, rgba(80,180,120,0.04) 0%, transparent 70%)
        `,
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        top: 0,
        left: 280,
        right: 320,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(184,245,184,0.2), transparent)',
        zIndex: 5,
      }} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%' }}>
        <PlantPanel />
        <PlantScene />
        <ControlPanel />
      </div>
    </div>
  )
}

export default App
