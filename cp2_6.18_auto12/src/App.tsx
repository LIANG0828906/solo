import React, { useCallback, useEffect, useRef, useState } from 'react';
import ControlPanel from './components/ControlPanel';
import PreviewPanel from './components/PreviewPanel';
import { useStore } from './store';

const MIN_LEFT_WIDTH = 280;
const MIN_RIGHT_WIDTH = 600;

const App: React.FC = () => {
  const { ui, setLeftPanelWidth } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
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
      const totalWidth = rect.width;
      let newLeftWidth = e.clientX - rect.left;

      newLeftWidth = Math.max(MIN_LEFT_WIDTH, newLeftWidth);
      newLeftWidth = Math.min(totalWidth - MIN_RIGHT_WIDTH, newLeftWidth);

      requestAnimationFrame(() => {
        setLeftPanelWidth(newLeftWidth);
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, setLeftPanelWidth]);

  useEffect(() => {
    if (isDragging) {
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
    return () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${ui.leftPanelWidth}px`,
          minWidth: `${MIN_LEFT_WIDTH}px`,
          height: '100%',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <ControlPanel />
      </div>

      <div
        onMouseDown={handleMouseDown}
        style={{
          width: '1px',
          backgroundColor: '#3A3A50',
          cursor: 'col-resize',
          flexShrink: 0,
          position: 'relative',
          zIndex: 10,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '3px',
            height: '40px',
            backgroundColor: isDragging ? '#7C6FFF' : 'transparent',
            borderRadius: '2px',
            transition: 'background-color 0.15s ease',
          }}
        />
      </div>

      <div
        style={{
          flex: 1,
          minWidth: `${MIN_RIGHT_WIDTH}px`,
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <PreviewPanel />
      </div>
    </div>
  );
};

export default App;
