import React from 'react';
import ReactDOM from 'react-dom/client';
import BattleCanvas from './components/BattleCanvas';
import ControlPanel from './components/ControlPanel';

const App: React.FC = () => {
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#1E1E2E',
      display: 'flex',
      overflow: 'hidden',
    }}>
      {}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}>
        <BattleCanvas />
      </div>

      {}
      <div style={{
        width: '260px',
        background: '#2A2A3E',
        borderLeft: '1px solid #3A3A5E',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <ControlPanel />
      </div>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
