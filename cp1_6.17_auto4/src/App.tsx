import FightStage from './FightStage';
import ControlPanel from './ControlPanel';
import CombatLog from './CombatLog';

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0A0A0A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: "'Noto Sans SC', 'JetBrains Mono', monospace",
      }}
    >
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          <FightStage />
          <ControlPanel />
        </div>
        <CombatLog />
      </div>
    </div>
  );
}

export default App;
