import { useEffect } from 'react';
import Canvas from './Canvas';
import { BrushPanel, TilePanel } from './Sidebar';
import { useMapStore } from './store';
import { PRESET_COLORS, CANVAS_BG_COLOR } from './types';

function App() {
  const {
    setBrushColor,
    setTool,
    setSelectedTile,
    clearCanvas,
    undo,
    currentTool,
  } = useMapStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < PRESET_COLORS.length) {
          if (currentTool !== 'brush') {
            setTool('brush');
            setSelectedTile(null);
          }
          setBrushColor(PRESET_COLORS[index]);
        }
      }

      if (e.key.toLowerCase() === 'c') {
        clearCanvas();
      }

      if (e.ctrlKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }

      if (e.key.toLowerCase() === 'b') {
        setTool('brush');
        setSelectedTile(null);
      }

      if (e.key.toLowerCase() === 's') {
        setTool('select');
        setSelectedTile(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setBrushColor, setTool, setSelectedTile, clearCanvas, undo, currentTool]);

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        overflow: 'hidden',
        backgroundColor: CANVAS_BG_COLOR,
        fontFamily: 'monospace',
      }}
    >
      <BrushPanel />
      <Canvas />
      <TilePanel />
    </div>
  );
}

export default App;
