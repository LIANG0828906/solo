import React from 'react';
import { ControlPanel } from './ControlPanel';
import { RadarChart } from './RadarChart';
import { Legend } from './Legend';
import { RecommendPanel } from './RecommendPanel';
import { useFlavorStore } from '@/store/useFlavorStore';

const App: React.FC = () => {
  const profiles = useFlavorStore((s) => s.profiles);
  const recommendedPreset = useFlavorStore((s) => s.getRecommendedPreset());

  return (
    <div
      className="app-container"
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '100vh',
        display: 'flex',
        padding: '16px',
        gap: '16px',
        boxSizing: 'border-box',
        backgroundColor: '#0A0A1A',
        overflow: 'hidden',
      }}
    >
      <ControlPanel />

      <main
        className="radar-area"
        style={{
          flex: 1,
          borderRadius: '16px',
          background: 'radial-gradient(ellipse at center, #1A1A2E 0%, #0F0F23 100%)',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
            <RadarChart profiles={profiles} title="风味雷达对比" />
          </div>

          <div style={{ flexShrink: 0 }}>
            <Legend profiles={profiles} />
          </div>
        </div>

        <div style={{ position: 'absolute', bottom: '16px', left: 0, right: 0 }}>
          <RecommendPanel recommended={recommendedPreset} />
        </div>
      </main>
    </div>
  );
};

export default App;
