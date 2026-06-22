import Screen from '@/components/Screen';
import KnobPanel from '@/components/KnobPanel';
import PresetPanel from '@/components/PresetPanel';

const App: React.FC = () => {

  return (
    <div className="app-root">
      <div className="app-layout">
        <PresetPanel />
        <div className="main-area">
          <Screen />
          <KnobPanel />
        </div>
      </div>
      <style>{`
        .app-root {
          min-height: 100vh;
          background: #1E1E1E;
          color: #E0E0E0;
          font-family: 'Courier New', monospace;
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: hidden;
        }
        .app-layout {
          display: flex;
          align-items: center;
          gap: 40px;
          max-width: 1200px;
          width: 100%;
          padding: 20px;
        }
        .main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        @keyframes blink-red {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @media (max-width: 768px) {
          .app-layout {
            flex-direction: column;
            gap: 12px;
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
