import { useRef, useCallback } from 'react';
import { ThreeCanvas } from './components/ThreeCanvas';
import { ControlPanel } from './components/ControlPanel';
import { InfoPopup } from './components/InfoPopup';
import { useAppStore } from './store/useAppStore';
import { ThreeRenderer, SelectedPathInfo } from './modules/ThreeRenderer';

function App() {
  const { paths, originalImage, currentTheme, isLoading, selectedPath, error, setSelectedPath } = useAppStore();
  const rendererRef = useRef<ThreeRenderer | null>(null);
  
  const handlePathClick = useCallback((info: SelectedPathInfo) => {
    setSelectedPath(info);
  }, [setSelectedPath]);
  
  const handleResetCamera = useCallback(() => {
    rendererRef.current?.resetCamera();
  }, []);
  
  const handleClosePopup = useCallback(() => {
    setSelectedPath(null);
  }, [setSelectedPath]);
  
  return (
    <div className="canvas-container">
      <ThreeCanvas
        paths={paths}
        originalImage={originalImage}
        theme={currentTheme}
        onPathClick={handlePathClick}
        rendererRef={rendererRef}
      />
      
      <ControlPanel onResetCamera={handleResetCamera} />
      
      {selectedPath && originalImage && (
        <InfoPopup
          info={selectedPath}
          originalImage={originalImage}
          onClose={handleClosePopup}
        />
      )}
      
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner" />
        </div>
      )}
      
      {error && (
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(239, 68, 68, 0.9)',
          color: '#fff',
          padding: '12px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          zIndex: 400
        }}>
          {error}
        </div>
      )}
      
      {paths.length === 0 && !isLoading && (
        <div className="hint-text">
          上传一张黑白手绘线条草图，或选择左侧预设样例开始体验
        </div>
      )}
    </div>
  );
}

export default App;
