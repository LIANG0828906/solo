import { useState, useRef, useCallback } from 'react';
import Canvas from './Canvas';
import UIPanel from './UIPanel';
import { ParticlesEngine } from './ParticlesEngine';

export default function App() {
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');
  const [brushSize, setBrushSize] = useState(12);
  const [canUndo, setCanUndo] = useState(false);
  const engineRef = useRef<ParticlesEngine | null>(null);

  const handleClear = useCallback(() => {
    window.dispatchEvent(new CustomEvent('clear-canvas'));
    setTimeout(() => {
      setCanUndo(engineRef.current?.canUndo() || false);
    }, 100);
  }, []);

  const handleUndo = useCallback(() => {
    window.dispatchEvent(new CustomEvent('undo-stroke'));
    setTimeout(() => {
      setCanUndo(engineRef.current?.canUndo() || false);
    }, 100);
  }, []);

  const handleExport = useCallback(() => {
    window.dispatchEvent(new CustomEvent('export-canvas'));
  }, []);

  const handleColorChange = useCallback((color: string) => {
    setSelectedColor(color);
  }, []);

  const handleBrushSizeChange = useCallback((size: number) => {
    setBrushSize(size);
  }, []);

  const checkUndoState = useCallback(() => {
    setCanUndo(engineRef.current?.canUndo() || false);
  }, []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        color={selectedColor}
        brushSize={brushSize}
        onClear={checkUndoState}
        onUndo={checkUndoState}
        onExport={checkUndoState}
        engineRef={engineRef}
      />
      <UIPanel
        selectedColor={selectedColor}
        onColorChange={handleColorChange}
        brushSize={brushSize}
        onBrushSizeChange={handleBrushSizeChange}
        onClear={handleClear}
        onUndo={handleUndo}
        onExport={handleExport}
        canUndo={canUndo}
      />
    </div>
  );
}
