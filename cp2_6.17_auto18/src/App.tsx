import React from 'react';
import Keyboard from './components/Keyboard';
import Staff from './components/Staff';
import ControlPanel from './components/ControlPanel';
import MelodyList from './components/MelodyList';
import { useStore } from './store';

const App: React.FC = () => {
  const isEditMode = useStore(state => state.isEditMode);
  const editingMelodyId = useStore(state => state.editingMelodyId);
  const melodies = useStore(state => state.melodies);

  const editingMelody = melodies.find(m => m.id === editingMelodyId);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#2C3E50',
      }}
    >
      <header
        style={{
          height: 56,
          background: '#2C3E50',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 1,
          }}
        >
          🎵 MelodySpring
        </h1>
        {isEditMode && editingMelody && (
          <span
            style={{
              marginLeft: 16,
              fontSize: 13,
              color: '#3498DB',
              background: 'rgba(52, 152, 219, 0.15)',
              padding: '4px 10px',
              borderRadius: 4,
            }}
          >
            编辑模式：{editingMelody.name}
          </span>
        )}
      </header>

      <div
        className="main-content"
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <div
          className="left-panel"
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#ECF0F1',
            padding: '24px',
            overflow: 'auto',
            minWidth: 0,
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 20,
            }}
          >
            <Staff />
            <Keyboard />
          </div>

          <div
            style={{
              textAlign: 'center',
              paddingTop: 16,
              fontSize: 12,
              color: '#888',
            }}
          >
            键盘快捷键：A S D F G H J 对应白键 C4-B4 · W E T Y U 对应黑键
          </div>
        </div>

        <div
          className="right-panel"
          style={{
            width: 380,
            display: 'flex',
            flexDirection: 'column',
            background: '#F8F9FA',
            padding: '20px 24px',
            flexShrink: 0,
            borderLeft: '1px solid #E0E0E0',
            overflow: 'hidden',
          }}
        >
          <ControlPanel />
          <MelodyList />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .left-panel {
            width: 55% !important;
            flex: none !important;
          }
          .right-panel {
            width: 45% !important;
            flex: 1 !important;
          }
        }

        @media (max-width: 768px) {
          .main-content {
            flex-direction: column !important;
          }
          .left-panel {
            width: 100% !important;
            flex: none !important;
            min-height: 400px;
          }
          .right-panel {
            width: 100% !important;
            height: auto !important;
            max-height: 50% !important;
            border-left: none !important;
            border-top: 1px solid #E0E0E0;
          }
        }

        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #CCC;
          border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #AAA;
        }
      `}</style>
    </div>
  );
};

export default App;
