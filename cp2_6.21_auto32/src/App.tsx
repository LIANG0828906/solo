import { useEffect } from 'react';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import ColorPalette from './components/ColorPalette';
import { useStore } from './store/useStore';

export default function App() {
  const undo = useStore((s) => s.undo);
  const redo = useStore((s) => s.redo);
  const canUndo = useStore((s) => s.canUndo());
  const canRedo = useStore((s) => s.canRedo());
  const historyIndex = useStore((s) => s.historyIndex);
  const statusRotation = useStore((s) => s.statusRotation);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (canUndo) undo();
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.shiftKey || e.key.toLowerCase() === 'y') &&
        (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')
      ) {
        e.preventDefault();
        if (canRedo) redo();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, canUndo, canRedo]);

  return (
    <div className="app-root">
      <div className="app-layout">
        <Toolbar />
        <div className="main-area">
          <Canvas />
        </div>
        <ColorPalette />
      </div>
      <div className="status-bar">
        <span className="status-item">
          旋转角度：{statusRotation}°
        </span>
        <span className="status-divider" />
        <span className="status-item">
          历史：{Math.max(0, historyIndex + 1)} / 20
        </span>
      </div>
    </div>
  );
}
