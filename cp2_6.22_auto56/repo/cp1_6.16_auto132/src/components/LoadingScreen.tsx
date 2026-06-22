import { useEffect, useState } from 'react';

interface LoadingScreenProps {
  duration?: number;
  onFinish: () => void;
}

export function LoadingScreen({ duration = 2000, onFinish }: LoadingScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), duration - 600);
    const finishTimer = setTimeout(() => onFinish(), duration);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [duration, onFinish]);

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="planets-container">
        <div className="planet planet-1" />
        <div className="planet planet-2" />
        <div className="planet planet-3" />
      </div>
    </div>
  );
}
