import React from 'react';
import { CameraModule } from './modules/camera/CameraModule';
import { TextureModule } from './modules/texture/TextureModule';
import { useAppStore } from './store';

const App: React.FC = () => {
  const { isLoading } = useAppStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="header-bar">
        <div>
          <div className="header-title">纸张褶皱检测系统</div>
          <div className="header-subtitle">Paper Wrinkle Detector & Texture Analyzer</div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.7, textAlign: 'right' }}>
          <div>摄像头 640×480 @ 30fps</div>
          <div>输出分辨率 1024×768 PNG</div>
        </div>
      </header>

      <div className="app-container">
        <CameraModule />
        <TextureModule />
      </div>

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}
    </div>
  );
};

export default App;
