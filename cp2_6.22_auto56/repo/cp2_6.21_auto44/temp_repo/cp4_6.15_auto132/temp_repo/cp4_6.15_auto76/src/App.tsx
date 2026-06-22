import React, { useState, useEffect } from 'react';
import { GraphProvider } from '@/context/GraphContext';
import Sidebar from '@/components/Sidebar';
import GraphCanvas from '@/components/GraphCanvas';

export default function App() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 800);
    };
    checkWidth();
    window.addEventListener('resize', checkWidth);
    return () => window.removeEventListener('resize', checkWidth);
  }, []);

  const appStyle: React.CSSProperties = {
    fontFamily: "'Inter', sans-serif",
    backgroundColor: '#0d1117',
    width: '100vw',
    height: '100vh',
    display: 'flex',
    overflow: 'hidden',
  };

  const canvasContainerStyle: React.CSSProperties = {
    flex: 1,
    height: '100%',
    marginLeft: isMobile ? 0 : 300,
    marginTop: isMobile ? 60 : 0,
    overflow: 'hidden',
  };

  return (
    <GraphProvider>
      <div style={appStyle}>
        <Sidebar />
        <div style={canvasContainerStyle}>
          <GraphCanvas />
        </div>
      </div>
    </GraphProvider>
  );
}
