import React, { useState, useCallback, useRef, useEffect } from 'react';
import PixelCanvas from './PixelCanvas';
import ToolBar from './ToolBar';
import ColorPalette from './ColorPalette';
import {
  CANVAS_SIZE,
  createEmptyGrid,
  HistoryManager,
  cloneGrid,
  type Tool,
  type Pixel,
  type HistoryEntry
} from './utils';

const App: React.FC = () => {
  const [grid, setGrid] = useState<string[][]>(() => createEmptyGrid(CANVAS_SIZE));
  const [currentTool, setCurrentTool] = useState<Tool>('pencil');
  const [currentColor, setCurrentColor] = useState<string>('#000000');
  const [brushSize, setBrushSize] = useState<number>(1);
  const [connected] = useState<boolean>(false);
  const [animatingPixels, setAnimatingPixels] = useState<Map<string, string>>(new Map());
  const [eraserPreview, setEraserPreview] = useState<{ x: number; y: number; size: number } | null>(null);
  const [, forceUpdate] = useState(0);

  const historyRef = useRef<HistoryManager>(new HistoryManager());
  const isHistoryAnimatingRef = useRef(false);

  const refreshHistoryState = useCallback(() => {
    forceUpdate(n => n + 1);
  }, []);

  const animatePixels = useCallback((pixels: Pixel[], direction: 'forward' | 'backward' = 'forward') => {
    return new Promise<void>((resolve) => {
      if (pixels.length === 0) {
        resolve();
        return;
      }

      const total = pixels.length;
      const duration = Math.min(300, total * 50);
      const interval = duration / total;
      let index = 0;

      const step = () => {
        if (index >= total) {
          setAnimatingPixels(new Map());
          resolve();
          return;
        }

        const batchSize = Math.max(1, Math.ceil(total / 20));
        const newAnimating = new Map<string, string>();

        for (let i = 0; i < batchSize && index < total; i++, index++) {
          const p = direction === 'forward' ? pixels[index] : pixels[total - 1 - index];
          newAnimating.set(`${p.x},${p.y}`, p.color);
        }

        setAnimatingPixels(newAnimating);
        setTimeout(step, interval);
      };

      step();
    });
  }, []);

  const handlePixelsChanged = useCallback((pixels: Pixel[], newGrid: string[][]) => {
    if (pixels.length === 0) return;

    if (!isHistoryAnimatingRef.current) {
      const previousColors = pixels.map(p => grid[p.y][p.x]);
      const entry: HistoryEntry = { pixels, previousColors };
      historyRef.current.push(entry);
      refreshHistoryState();
    }

    setGrid(newGrid);
  }, [grid, refreshHistoryState]);

  const handleUndo = useCallback(() => {
    if (isHistoryAnimatingRef.current) return;
    const entry = historyRef.current.undo();
    if (!entry) return;

    isHistoryAnimatingRef.current = true;
    refreshHistoryState();

    const undoPixels: Pixel[] = entry.pixels.map((p, i) => ({
      ...p,
      color: entry.previousColors[i]
    }));

    animatePixels(undoPixels, 'backward').then(() => {
      const newGrid = cloneGrid(grid);
      undoPixels.forEach(p => {
        newGrid[p.y][p.x] = p.color;
      });
      setGrid(newGrid);
      isHistoryAnimatingRef.current = false;
      refreshHistoryState();
    });

    const newGrid = cloneGrid(grid);
    undoPixels.forEach(p => {
      newGrid[p.y][p.x] = p.color;
    });
    setTimeout(() => setGrid(newGrid), 10);
  }, [grid, animatePixels, refreshHistoryState]);

  const handleRedo = useCallback(() => {
    if (isHistoryAnimatingRef.current) return;
    const entry = historyRef.current.redo();
    if (!entry) return;

    isHistoryAnimatingRef.current = true;
    refreshHistoryState();

    animatePixels(entry.pixels, 'forward').then(() => {
      const newGrid = cloneGrid(grid);
      entry.pixels.forEach(p => {
        newGrid[p.y][p.x] = p.color;
      });
      setGrid(newGrid);
      isHistoryAnimatingRef.current = false;
      refreshHistoryState();
    });

    const newGrid = cloneGrid(grid);
    entry.pixels.forEach(p => {
      newGrid[p.y][p.x] = p.color;
    });
    setTimeout(() => setGrid(newGrid), 10);
  }, [grid, animatePixels, refreshHistoryState]);

  const handleColorPicked = useCallback((color: string) => {
    setCurrentColor(color);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      backgroundColor: '#2d2d2d',
      padding: '16px',
      gap: '16px',
      overflow: 'hidden'
    }}>
      <ToolBar
        currentTool={currentTool}
        currentColor={currentColor}
        brushSize={brushSize}
        onToolChange={setCurrentTool}
        onColorChange={setCurrentColor}
        onBrushSizeChange={setBrushSize}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={historyRef.current.canUndo() && !isHistoryAnimatingRef.current}
        canRedo={historyRef.current.canRedo() && !isHistoryAnimatingRef.current}
        connected={connected}
      />

      <div style={{
        display: 'flex',
        flex: 1,
        gap: '16px',
        minHeight: 0
      }}>
        <PixelCanvas
          grid={grid}
          currentTool={currentTool}
          currentColor={currentColor}
          brushSize={brushSize}
          onPixelsChanged={handlePixelsChanged}
          onColorPicked={handleColorPicked}
          animatingPixels={animatingPixels}
          eraserPreview={eraserPreview}
          setEraserPreview={setEraserPreview}
        />

        <ColorPalette
          currentColor={currentColor}
          onColorSelect={setCurrentColor}
        />
      </div>
    </div>
  );
};

export default App;
