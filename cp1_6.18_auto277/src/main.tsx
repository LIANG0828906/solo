import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import { Toolbar } from './toolbar';
import { initScene, renderFrame, handleMouseDown, handleMouseMove, handleMouseUp } from './scene';
import { usePotteryStore } from './store';

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [_count, forceUpdate] = useState<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    initScene(container);

    let animationId: number;
    let lastTime = 0;

    const loop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      renderFrame(time);

      const state = usePotteryStore.getState();
      if (state.isFiring) {
        usePotteryStore.getState().updateFiringProgress(delta);
      }

      forceUpdate((prev) => (prev + 1) % 1000000);
      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    const onMouseDown = (e: MouseEvent) => handleMouseDown(e);
    const onMouseMove = (e: MouseEvent) => handleMouseMove(e);
    const onMouseUp = () => handleMouseUp();

    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);

    return () => {
      cancelAnimationFrame(animationId);
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
    };
  }, []);

  return (
    <div
      className="app-container"
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative',
        background: 'linear-gradient(135deg, #2B1B17 0%, #3E2723 100%)',
      }}
    >
      <div
        ref={containerRef}
        className="scene-container"
        style={{
          width: '100%',
          height: '100%',
        }}
      />
      <Toolbar />
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

const style = document.createElement('style');
style.textContent = `
  body {
    margin: 0;
    padding: 0;
    overflow: hidden;
  }
  * {
    box-sizing: border-box;
  }
`;
document.head.appendChild(style);
