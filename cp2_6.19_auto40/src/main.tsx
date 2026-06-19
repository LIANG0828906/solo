import React, { useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { MixerPanel } from './modules/mixer/MixerPanel';
import { SequencerPanel } from './modules/sequencer/SequencerPanel';
import { TopToolbar } from './components/TopToolbar';
import { CollaborationProvider } from './modules/collaboration/CollaborationProvider';
import { CollaboratorsOverlay } from './modules/collaboration/CollaboratorCursor';

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <CollaborationProvider>
      <div
        ref={containerRef}
        style={{
          width: '100vw',
          height: '100vh',
          minWidth: 1024,
          minHeight: 600,
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1a1a2e',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <TopToolbar />

        <div
          style={{
            flex: 1,
            display: 'flex',
            minHeight: 0,
            position: 'relative',
          }}
        >
          <div style={{ width: 200, flexShrink: 0, position: 'relative', zIndex: 5 }}>
            <MixerPanel />
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
              position: 'relative',
            }}
          >
            <SequencerPanel />
          </div>
        </div>

        <CollaboratorsOverlay containerRef={containerRef} />

        <style>{`
          * {
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            background-color: #1a1a2e;
          }
          
          ::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          
          ::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 5px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
          }
          
          button {
            font-family: inherit;
          }
        `}</style>
      </div>
    </CollaborationProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
