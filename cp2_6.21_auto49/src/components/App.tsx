import React, { useState, useEffect } from 'react';
import { ConfigProvider, theme } from 'antd';
import SceneCanvas from './SceneCanvas';
import ControlPanel from './ControlPanel';
import ExportImport from './ExportImport';

export default function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#e94560',
          colorBgContainer: '#1a1a2e',
          colorBgElevated: '#16213e',
          colorBorder: '#0f3460',
          colorText: '#ffffff',
          colorTextSecondary: '#aaaacc',
          borderRadius: 8,
        },
        components: {
          Slider: {
            trackBg: '#0f3460',
            trackHoverBg: '#0f3460',
            railSize: 4,
            handleSize: 14,
            handleSizeHover: 16,
            dotBorderColor: '#e94560',
            handleColor: '#e94560',
            handleColorDisabled: '#555',
            dotActiveBorderColor: '#e94560',
          },
          Collapse: {
            headerBg: '#0f3460',
            contentBg: '#1a1a2e',
            borderlessContentBg: '#1a1a2e',
          },
          Button: {
            primaryShadow: '0 4px 12px rgba(233,69,96,0.35)',
          },
        },
      }}
    >
      {loading && (
        <div className="loading-overlay">
          <div className="loading-cube" />
        </div>
      )}
      <div className="app-layout">
        <div className="scene-area">
          <SceneCanvas />
        </div>
        <div className="panel-area">
          <ControlPanel />
          <ExportImport />
        </div>
      </div>
    </ConfigProvider>
  );
}
