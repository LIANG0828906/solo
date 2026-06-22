import React from 'react';
import { TopToolbar } from './components/TopToolbar';
import { MixerPanel } from './modules/mixer/MixerPanel';
import { SequencerPanel } from './modules/sequencer/SequencerPanel';
import { CollaboratorsPanel } from './components/CollaboratorsPanel';
import { CollaborationProvider } from './modules/collaboration/CollaborationProvider';

const App: React.FC = () => {
  return (
    <CollaborationProvider>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#1a1a2e',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <TopToolbar />
        <div
          style={{
            flex: 1,
            display: 'flex',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <MixerPanel />
          <SequencerPanel />
          <CollaboratorsPanel />
        </div>

        <style>
          {`
            @keyframes pulse {
              0% { transform: scale(0.5); opacity: 0.8; }
              100% { transform: scale(2); opacity: 0; }
            }
            @keyframes pulse-ring {
              0% { transform: scale(1); opacity: 0.8; }
              100% { transform: scale(1.6); opacity: 0; }
            }
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            ::-webkit-scrollbar-track {
              background: rgba(0,0,0,0.2);
            }
            ::-webkit-scrollbar-thumb {
              background: rgba(255,255,255,0.15);
              border-radius: 4px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: rgba(255,255,255,0.25);
            }
          `}
        </style>
      </div>
    </CollaborationProvider>
  );
};

export default App;
