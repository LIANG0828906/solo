import { useEffect, useCallback, useState } from 'react';
import ToolBar from '@/components/ToolBar';
import CanvasArea from '@/components/CanvasArea';
import Gallery from '@/components/Gallery';
import { useCanvasStore } from '@/store/canvasStore';

export default function App() {
  const { initApp } = useCanvasStore();
  const [saveFn, setSaveFn] = useState<(() => void) | null>(null);

  useEffect(() => {
    void initApp();
  }, [initApp]);

  const handleRequestSave = useCallback(() => {
    saveFn?.();
  }, [saveFn]);

  const registerSaveFn = useCallback((fn: () => void) => {
    setSaveFn(() => fn);
  }, []);

  return (
    <div className="app-root">
      <ToolBar onRequestSave={handleRequestSave} />
      <CanvasArea onSaveRequest={registerSaveFn} />
      <Gallery />

      <style>{`
        .app-root {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #1A1A2E;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #fff;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        *, *::before, *::after {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          background: #1A1A2E;
        }
      `}</style>
    </div>
  );
}
