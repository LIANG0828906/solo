import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Panel } from './ui/Panel';
import { Scene } from './ui/Scene';
import { ControlButtons } from './ui/ControlButtons';
import { ParticleSystem } from './particleSystem';

const App: React.FC = () => {
  const particleSystemRef = useRef<ParticleSystem | null>(null);
  const controlsRef = useRef<any>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [fps, setFps] = useState(60);
  const lastTimeRef = useRef(performance.now());
  const frameCountRef = useRef(0);

  useEffect(() => {
    let animationId: number;

    const updateFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / delta);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationId = requestAnimationFrame(updateFps);
    };

    animationId = requestAnimationFrame(updateFps);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  useEffect(() => {
    const fpsElement = document.querySelector('.fps-display');
    if (fpsElement) {
      fpsElement.textContent = String(fps);
    }
  }, [fps]);

  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  const handleScreenshot = useCallback(() => {
    if (canvasRef.current) {
      try {
        const dataURL = canvasRef.current.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `particle-system-${Date.now()}.png`;
        link.href = dataURL;
        link.click();
      } catch (error) {
        console.error('截图失败:', error);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      if (particleSystemRef.current) {
        particleSystemRef.current.dispose();
      }
    };
  }, []);

  return (
    <div className="w-full h-full flex overflow-hidden">
      <Panel />
      <div className="flex-1 relative">
        <Scene
          particleSystemRef={particleSystemRef}
          controlsRef={controlsRef}
          canvasRef={canvasRef}
        />
        <ControlButtons
          onResetCamera={handleResetCamera}
          onScreenshot={handleScreenshot}
        />
        <div className="absolute bottom-6 left-6 glass-control rounded-xl px-4 py-2 text-xs text-slate-400 z-10">
          <div className="flex items-center gap-4">
            <span>拖拽旋转视角</span>
            <span>滚轮缩放</span>
            <span>右键平移</span>
          </div>
        </div>
        <div className="absolute bottom-6 right-6 glass-control rounded-xl px-4 py-2 text-xs text-slate-400 z-10">
          <span>FPS: </span>
          <span className="fps-display text-cyan-400 font-mono">{fps}</span>
        </div>
      </div>
    </div>
  );
};

export default App;
