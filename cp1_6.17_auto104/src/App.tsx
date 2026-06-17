import { useEffect, useRef, useState } from 'react';
import LightControlPanel from './UI/LightControlPanel';
import PerformanceMonitor from './UI/PerformanceMonitor';
import { useLightStore } from './store/useLightStore';

export default function App() {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const particleCount = useLightStore((state) => state.particleCount);

  useEffect(() => {
    let animationId: number;

    const updateFps = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const currentFps = (frameCountRef.current * 1000) / delta;
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

  return (
    <div className="relative w-full h-full">
      <LightControlPanel />
      <PerformanceMonitor fps={fps} particleCount={particleCount} drawCalls={4} />
    </div>
  );
}
