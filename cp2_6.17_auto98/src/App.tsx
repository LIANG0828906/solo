import React, { useState, useEffect, useCallback } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { SceneViewer } from './components/SceneViewer';
import { useScene } from './hooks/useScene';
import { useStore, TreeParams } from './store/useStore';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState('复制参数链接');
  const { exportScreenshot, copyParamLink, setCanvas } = useScene();
  const params = useStore((state) => state.params);
  const highlightInfo = useStore((state) => state.highlightInfo);
  const loadPresets = useStore((state) => state.loadPresets);
  const setParams = useStore((state) => state.setParams);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  useEffect(() => {
    const handleLoadParams = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<TreeParams>>;
      const loaded = customEvent.detail;
      const newParams: TreeParams = { ...useStore.getState().params };
      Object.assign(newParams, loaded);
      setParams(newParams);
    };
    window.addEventListener('ltree-load-params', handleLoadParams);
    return () => window.removeEventListener('ltree-load-params', handleLoadParams);
  }, [setParams]);

  const handleCopyLink = useCallback(async () => {
    const success = await copyParamLink(params);
    if (success) {
      setCopyButtonText('已复制!');
      setTimeout(() => setCopyButtonText('复制参数链接'), 800);
    }
  }, [copyParamLink, params]);

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        backgroundColor: '#0B0B1E',
        overflow: 'hidden',
      }}
    >
      {isMobile && (
        <button
          onClick={() => setPanelOpen(true)}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 200,
            width: 40,
            height: 40,
            backgroundColor: '#12122A',
            border: '1px solid #2A2A3E',
            borderRadius: 8,
            color: '#FFFFFF',
            fontSize: 20,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          ☰
        </button>
      )}

      {isMobile && panelOpen && (
        <div
          onClick={() => setPanelOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
          }}
        />
      )}

      <ControlPanel isMobile={isMobile} isOpen={panelOpen} />

      {isMobile && panelOpen && (
        <button
          onClick={() => setPanelOpen(false)}
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 201,
            width: 36,
            height: 36,
            backgroundColor: '#FF6B6B',
            border: 'none',
            borderRadius: '50%',
            color: '#FFFFFF',
            fontSize: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          ×
        </button>
      )}

      <div
        style={{
          flex: 1,
          position: 'relative',
          border: '1px solid #2A2A3E',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            gap: 12,
            zIndex: 10,
          }}
        >
          <button
            onClick={exportScreenshot}
            style={{
              width: 100,
              height: 40,
              backgroundColor: '#4A4A6E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6C63FF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4A4A6E';
            }}
          >
            导出截图
          </button>
          <button
            onClick={handleCopyLink}
            style={{
              height: 40,
              padding: '0 16px',
              backgroundColor: '#4A4A6E',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 6,
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background-color 0.2s ease',
              minWidth: 120,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#6C63FF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#4A4A6E';
            }}
          >
            {copyButtonText}
          </button>
        </div>

        {highlightInfo && (
          <div
            className="fade-in"
            style={{
              position: 'absolute',
              top: 72,
              right: 16,
              width: 200,
              backgroundColor: '#1E1E2ECC',
              borderRadius: 8,
              border: '1px solid #FFD700',
              padding: 16,
              zIndex: 10,
            }}
          >
            <div
              style={{
                color: '#FFD700',
                fontSize: 14,
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              分支信息
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: '#8888AA' }}>层级：</span>
              {highlightInfo.level}
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: '#8888AA' }}>角度：</span>
              {highlightInfo.angle}°
            </div>
            <div style={{ color: '#FFFFFF', fontSize: 13 }}>
              <span style={{ color: '#8888AA' }}>长度：</span>
              {highlightInfo.length}
            </div>
          </div>
        )}

        <SceneViewer onCanvasReady={setCanvas} />
      </div>
    </div>
  );
};

export default App;
