import React, { useEffect, useState } from 'react';
import CapsuleCreate from './components/CapsuleCreate';
import CapsuleTimeline from './components/CapsuleTimeline';
import CapsulePlayer from './components/CapsulePlayer';
import { useCapsuleStore } from './stores/capsuleStore';

const App: React.FC = () => {
  const loadCapsules = useCapsuleStore((s) => s.loadCapsules);
  const startPolling = useCapsuleStore((s) => s.startPolling);
  const playingCapsule = useCapsuleStore((s) => s.playingCapsule);
  const setPlayingCapsule = useCapsuleStore((s) => s.setPlayingCapsule);
  const capsules = useCapsuleStore((s) => s.capsules);

  const [isMobile, setIsMobile] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(true);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadCapsules();
    const stopPolling = startPolling();
    return stopPolling;
  }, [loadCapsules, startPolling]);

  useEffect(() => {
    const openedCapsules = capsules.filter(
      (c) => c.status === 'opened' && c.openAt <= Date.now() + 1000
    );
    if (openedCapsules.length > 0 && !playingCapsule) {
      setPlayingCapsule(openedCapsules[0]);
    }
  }, [capsules, playingCapsule, setPlayingCapsule]);

  if (isMobile) {
    return (
      <div style={mobileAppStyle}>
        <CapsuleCreate
          isCollapsed={isFormCollapsed}
          onToggle={() => setIsFormCollapsed(!isFormCollapsed)}
        />
        <div style={mobileTimelineStyle}>
          <CapsuleTimeline />
        </div>
        <CapsulePlayer />
        <style>{globalStyles}</style>
      </div>
    );
  }

  return (
    <div style={appStyle}>
      <CapsuleCreate />
      <div style={timelineWrapperStyle}>
        <CapsuleTimeline />
      </div>
      <CapsulePlayer />
      <style>{globalStyles}</style>
    </div>
  );
};

const appStyle: React.CSSProperties = {
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#0F0F23',
};

const timelineWrapperStyle: React.CSSProperties = {
  marginLeft: '380px',
  flex: 1,
  minWidth: 0,
};

const mobileAppStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  backgroundColor: '#0F0F23',
};

const mobileTimelineStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
};

const globalStyles = `
  * {
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background-color: #0F0F23;
    color: #E0E0E0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    min-height: 100vh;
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  button:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  button:active {
    transform: translateY(0);
  }

  input:focus, textarea:focus {
    border-color: #4ECDC4 !important;
  }

  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  ::-webkit-scrollbar-track {
    background: #0F0F23;
  }

  ::-webkit-scrollbar-thumb {
    background: #2D2D5C;
    border-radius: 4px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #3D3D6C;
  }
`;

export default App;
