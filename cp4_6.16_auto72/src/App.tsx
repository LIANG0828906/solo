import React, { useEffect, useState, useRef } from 'react';
import { Toolbar } from './toolbar';
import { Canvas } from './canvas';
import { syncManager } from './sync';
import './index.css';

const WS_URL = 'ws://localhost:8080';

function App() {
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setCanvasSize({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    syncManager.init(WS_URL).catch((e) => {
      console.log('WebSocket连接失败，运行在离线模式:', e);
    });

    return () => {
      syncManager.destroy();
    };
  }, []);

  return (
    <div className="app-container">
      <Toolbar />
      <div className="canvas-container" ref={containerRef}>
        <Canvas width={canvasSize.width} height={canvasSize.height} />
      </div>
    </div>
  );
}

export default App;
