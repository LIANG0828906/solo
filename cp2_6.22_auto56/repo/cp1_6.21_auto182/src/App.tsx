import { useContext } from 'react';
import { TimeContext, TimeProvider } from './context/TimeContext';
import { TimeControlPanel } from './components/TimeControlPanel';
import { CityScene } from './components/CityScene';

function AppContent() {
  const ctx = useContext(TimeContext);
  const isLoading = ctx?.isLoading ?? true;
  const loadProgress = ctx?.loadProgress ?? 0;

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        backgroundColor: '#000000',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      <TimeControlPanel />

      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          opacity: isLoading ? 0 : 1,
          transition: 'opacity 0.6s ease-in-out'
        }}
      >
        <CityScene />
      </div>

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 340,
            backgroundColor: '#000000',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            transition: 'opacity 0.3s ease'
          }}
        >
          <div
            style={{
              color: '#E2E8F0',
              fontSize: 18,
              marginBottom: 24,
              letterSpacing: 1
            }}
          >
            正在加载城市场景...
          </div>
          <div
            style={{
              width: 240,
              height: 4,
              backgroundColor: '#1F2937',
              borderRadius: 2,
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                width: `${loadProgress}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #3B82F6 0%, #8B5CF6 100%)',
                borderRadius: 2,
                transition: 'width 0.08s ease-out'
              }}
            />
          </div>
          <div
            style={{
              color: '#64748B',
              fontSize: 12,
              marginTop: 12,
              fontFamily: 'monospace',
              letterSpacing: 0.5
            }}
          >
            {Math.round(loadProgress)}%
          </div>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <TimeProvider>
      <AppContent />
    </TimeProvider>
  );
}
