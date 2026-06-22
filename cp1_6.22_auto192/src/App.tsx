import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import SceneCanvas, { SceneCanvasHandle } from './components/SceneCanvas';
import ControlPanel from './components/ControlPanel';
import { SceneController, type SceneState, type LightType } from './modules/SceneController';
import { ScreenshotTool } from './modules/ScreenshotTool';

export default function App() {
  const controller = useMemo(() => new SceneController(), []);
  const canvasRef = useRef<SceneCanvasHandle>(null);
  const [sceneState, setSceneState] = useState<SceneState>(controller.getState());
  const [panelOpen, setPanelOpen] = useState(false);
  const [isSmallScreen, setIsSmallScreen] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 900 : false,
  );

  useEffect(() => {
    const unsubscribe = controller.subscribe((state) => {
      setSceneState({ ...state });
    });
    return unsubscribe;
  }, [controller]);

  useEffect(() => {
    const handleResize = () => {
      const small = window.innerWidth < 900;
      setIsSmallScreen(small);
      if (!small) setPanelOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddLight = useCallback(
    (type: LightType) => {
      controller.addLight(type);
    },
    [controller],
  );

  const handleUpdateLight = useCallback(
    (id: string, patch: any) => {
      controller.updateLight(id, patch);
    },
    [controller],
  );

  const handleRemoveLight = useCallback(
    (id: string) => {
      controller.removeLight(id);
    },
    [controller],
  );

  const handleUpdateEnv = useCallback(
    (patch: any) => {
      controller.updateEnv(patch);
    },
    [controller],
  );

  const handleCapture = useCallback(async () => {
    if (!canvasRef.current) return;
    const renderer = canvasRef.current.getRenderer();
    const scene = canvasRef.current.getScene();
    const camera = canvasRef.current.getCamera();
    if (renderer && scene && camera) {
      await ScreenshotTool.capture(renderer, scene, camera, {
        width: 1500,
        height: 1500,
      });
    }
  }, []);

  const sceneAreaStyle: React.CSSProperties = {
    position: 'relative',
    background: '#1F2937',
    overflow: 'hidden',
  };

  if (isSmallScreen) {
    sceneAreaStyle.width = '100%';
    sceneAreaStyle.height = '100vh';
  } else {
    sceneAreaStyle.width = '75%';
    sceneAreaStyle.height = '100vh';
  }

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <div style={sceneAreaStyle}>
        {isSmallScreen && (
          <button
            onClick={() => setPanelOpen(true)}
            style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 10,
              width: 40,
              height: 40,
              background: 'rgba(31, 41, 55, 0.8)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        )}
        <SceneCanvas lights={sceneState.lights} env={sceneState.env} canvasRef={canvasRef} />
      </div>

      {!isSmallScreen && (
        <div style={{ width: '25%', height: '100vh' }}>
          <ControlPanel
            lights={sceneState.lights}
            env={sceneState.env}
            onAddLight={handleAddLight}
            onUpdateLight={handleUpdateLight}
            onRemoveLight={handleRemoveLight}
            onUpdateEnv={handleUpdateEnv}
            onCapture={handleCapture}
          />
        </div>
      )}

      {isSmallScreen && (
        <>
          {panelOpen && (
            <div
              onClick={() => setPanelOpen(false)}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(0,0,0,0.5)',
                zIndex: 50,
              }}
            />
          )}
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '85%',
              maxWidth: 360,
              zIndex: 60,
              transform: panelOpen ? 'translateX(0)' : 'translateX(100%)',
              transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: panelOpen ? '-8px 0 24px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <ControlPanel
              lights={sceneState.lights}
              env={sceneState.env}
              onAddLight={handleAddLight}
              onUpdateLight={handleUpdateLight}
              onRemoveLight={handleRemoveLight}
              onUpdateEnv={handleUpdateEnv}
              onCapture={handleCapture}
              onClose={() => setPanelOpen(false)}
            />
          </div>
        </>
      )}
    </div>
  );
}
