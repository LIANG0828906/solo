import { useState, useEffect, useRef } from 'react';

export const useFPS = (): number => {
  const [fps, setFps] = useState<number>(60);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const smoothedFPSRef = useRef<number>(60);
  const smoothingFactor = 0.1;

  useEffect(() => {
    let animationFrameId: number;

    const updateFPS = (currentTime: number): void => {
      frameCountRef.current++;

      const deltaTime = currentTime - lastTimeRef.current;

      if (deltaTime >= 1000) {
        const currentFPS = (frameCountRef.current * 1000) / deltaTime;
        
        smoothedFPSRef.current = 
          smoothedFPSRef.current * (1 - smoothingFactor) + 
          currentFPS * smoothingFactor;

        setFps(Math.round(smoothedFPSRef.current));
        
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;
      }

      animationFrameId = requestAnimationFrame(updateFPS);
    };

    animationFrameId = requestAnimationFrame(updateFPS);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return fps;
};
