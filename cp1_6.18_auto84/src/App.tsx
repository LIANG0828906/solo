import { useEffect, useState } from 'react';
import { InputPanel } from './components/InputPanel';
import { ClusterListPanel } from './components/ClusterListPanel';
import { StarCanvas } from './components/StarCanvas';
import { Toolbar } from './components/Toolbar';
import { useAppStore } from './store/appStore';

export default function App() {
  const leftPanelCollapsed = useAppStore(state => state.leftPanelCollapsed);
  const rightPanelCollapsed = useAppStore(state => state.rightPanelCollapsed);
  const toggleLeftPanel = useAppStore(state => state.toggleLeftPanel);
  const toggleRightPanel = useAppStore(state => state.toggleRightPanel);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#0A0A2E',
        overflow: 'hidden',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
      }}
    >
      <header
        style={{
          height: 48,
          background: 'linear-gradient(180deg, #1A1A4E 0%, #0A0A2E 100%)',
          borderBottom: '1px solid #2A2A44',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 24px',
          position: 'relative',
          zIndex: 10
        }}
      >
        <h1
          style={{
            color: '#FFFFFF',
            fontSize: 18,
            fontWeight: 600,
            margin: 0,
            letterSpacing: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <span style={{ fontSize: 22 }}>✦</span>
          灵感星群
          <span style={{ fontSize: 22 }}>✦</span>
        </h1>
        <div
          style={{
            position: 'absolute',
            right: 24,
            color: '#666688',
            fontSize: 12
          }}
        >
          Inspiration Galaxy
        </div>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          gap: 12,
          padding: 12,
          overflow: 'hidden',
          minHeight: 0
        }}
      >
        {isMobile && leftPanelCollapsed ? null : (
          <InputPanel
            collapsed={isMobile ? leftPanelCollapsed : false}
            onToggle={toggleLeftPanel}
          />
        )}

        <StarCanvas />

        {isMobile && rightPanelCollapsed ? null : (
          <ClusterListPanel
            collapsed={isMobile ? rightPanelCollapsed : false}
            onToggle={toggleRightPanel}
          />
        )}
      </div>

      <Toolbar />
    </div>
  );
}
