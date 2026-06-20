import FightStage from './FightStage'
import ControlPanel from './ControlPanel'
import CombatLog from './CombatLog'

const App: React.FC = () => {
  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        background: '#121212',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        boxSizing: 'border-box',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#FFFFFF',
      }}
    >
      <h1
        style={{
          fontSize: '24px',
          margin: '0 0 16px 0',
          background: 'linear-gradient(90deg, #00BFFF, #FF4080)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          letterSpacing: '2px',
        }}
      >
        2D 决斗场模拟器
      </h1>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <FightStage />
          <ControlPanel />
        </div>
        <CombatLog />
      </div>
    </div>
  )
}

export default App
