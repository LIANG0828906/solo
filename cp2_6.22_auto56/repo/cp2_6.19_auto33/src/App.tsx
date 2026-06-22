import KanbanBoard from './components/KanbanBoard';
import PomodoroTimer from './components/PomodoroTimer';
import EfficiencyReport from './components/EfficiencyReport';

function App() {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#1a2332',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      >
        <header
          style={{
            marginBottom: '24px',
            textAlign: 'center',
          }}
        >
          <h1
            style={{
              fontSize: '32px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            🚀 个人效率看板
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '8px', fontSize: '14px' }}>
            专注当下，高效完成每一件事
          </p>
        </header>

        <div
          style={{
            display: 'flex',
            gap: '24px',
            marginBottom: '24px',
          }}
          className="main-content"
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <KanbanBoard />
          </div>
          <div style={{ width: '280px', flexShrink: 0 }} className="timer-sidebar">
            <PomodoroTimer />
          </div>
        </div>

        <EfficiencyReport />
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .main-content {
            flex-direction: column !important;
          }
          .timer-sidebar {
            width: 100% !important;
          }
        }
        @media (max-width: 768px) {
          .app-container {
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
