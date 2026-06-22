import React, { useEffect, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import PreviewArea from './components/PreviewArea';
import { preloadAllWebFonts } from './utils/fontLoader';

const appStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'row',
  backgroundColor: '#FAF5EB',
  color: '#2C2C2C',
  fontFamily:
    "'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
  overflow: 'hidden',
};

const responsiveStyle: React.CSSProperties = {
  ...appStyle,
  flexDirection: 'column',
};

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth < 900);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    preloadAllWebFonts().finally(() => {
      setMounted(true);
    });

    const initialTimer = setTimeout(() => setMounted(true), 300);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(initialTimer);
    };
  }, []);

  const layoutStyle = isCollapsed ? responsiveStyle : appStyle;

  return (
    <div style={layoutStyle}>
      <ControlPanel collapsed={isCollapsed} />
      <PreviewArea />
      {!mounted && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#FAF5EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            transition: 'opacity 0.3s ease',
            opacity: 1,
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontSize: '24px',
                fontWeight: 600,
                color: '#2C2C2C',
                marginBottom: '12px',
              }}
            >
              字体对比模拟器
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>正在加载字体资源...</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
