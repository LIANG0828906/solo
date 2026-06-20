import { useEffect } from 'react';
import ToolBar from './components/ToolBar';
import CanvasArea from './components/CanvasArea';
import Gallery from './components/Gallery';
import { useCanvasStore } from './store/canvasStore';

function App() {
  const { undo, redo, clearCanvas, toggleGallery } = useCanvasStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }

      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        toggleGallery();
      }

      if (e.key === 'Escape') {
        const { setGalleryOpen, isGalleryOpen } = useCanvasStore.getState();
        if (isGalleryOpen) setGalleryOpen(false);
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        clearCanvas();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, toggleGallery, clearCanvas]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ToolBar />
      <CanvasArea />
      <Gallery />
    </div>
  );
}

export default App;
