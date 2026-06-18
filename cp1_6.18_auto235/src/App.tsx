import React, { useRef, useState, useCallback, useEffect } from 'react';
import { CanvasPanel } from '@/components/CanvasPanel';
import { Scene } from '@/components/Scene';
import { ControlPanel } from '@/components/ControlPanel';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftRatio, setLeftRatio] = useState(0.45);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = x / rect.width;
      const clamped = Math.min(0.7, Math.max(0.25, ratio));
      setLeftRatio(clamped);
    };

    const handleMouseUp = () => setIsDragging(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="app-container" ref={containerRef}>
      <div className="app-header">
        <h1 className="app-title">
          <span className="logo-icon">💎</span>
          Lattice Sculptor
          <span className="subtitle">3D 晶格雕塑生成器</span>
        </h1>
      </div>

      <div className="main-layout">
        <div className="left-panel" style={{ width: `${leftRatio * 100}%` }}>
          <CanvasPanel />
        </div>

        <div
          className={`divider ${isDragging ? 'dragging' : ''}`}
          onMouseDown={handleMouseDown}
          title="拖拽调整布局"
        >
          <div className="divider-handle" />
        </div>

        <div className="right-panel" style={{ width: `${(1 - leftRatio) * 100}%` }}>
          <Scene />
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}
