import React from 'react';
import { Canvas } from '@react-three/fiber';
import { ConfigProvider, theme } from 'antd';
import MoleculeViewer from '@/components/MoleculeViewer';
import ControlPanel from '@/components/ControlPanel';

const darkTheme = {
  token: {
    colorPrimary: '#00d4ff',
    colorBgContainer: '#3a3a54',
    colorBgElevated: '#3a3a54',
    colorText: '#ccccdd',
    colorTextSecondary: '#8888aa',
    colorBorder: '#4a4a6a',
    borderRadius: 8,
    controlItemBgActive: '#00d4ff',
    controlItemBgHover: '#2a2a4a',
  },
  components: {
    Select: {
      optionSelectedBg: '#00d4ff22',
      colorBgContainer: '#2d2d44',
      colorBgElevated: '#2d2d44',
      optionActiveBg: '#4a4a6a',
    },
    Slider: {
      trackBg: '#4a4a6a',
      trackHoverBg: '#6a6a8a',
      dotBorderColor: '#00d4ff',
      handleActiveColor: '#00d4ff',
      handleColor: '#00d4ff',
    },
    Switch: {
      colorPrimary: '#00d4ff',
      colorPrimaryHover: '#33ddff',
    },
    Card: {
      colorBgContainer: '#3a3a54',
    },
  },
};

export default function App() {
  return (
    <ConfigProvider theme={{ algorithm: theme.darkAlgorithm, ...darkTheme }}>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          display: 'flex',
          background: '#1a1a2e',
          overflow: 'hidden',
        }}
      >
        <div style={{ flex: '0 0 65%', height: '100%', position: 'relative' }}>
          <Canvas
            camera={{ position: [0, 0, 10], fov: 50, near: 0.1, far: 100 }}
            gl={{ antialias: true, alpha: false }}
            dpr={[1, 2]}
            style={{ background: '#1a1a2e' }}
          >
            <MoleculeViewer />
          </Canvas>
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '16px',
              color: '#4a4a6a',
              fontSize: '12px',
              pointerEvents: 'none',
            }}
          >
            拖拽旋转 · 滚轮缩放 · 右键平移
          </div>
        </div>
        <div style={{ flex: '0 0 35%', height: '100%' }}>
          <ControlPanel />
        </div>
      </div>
    </ConfigProvider>
  );
}
