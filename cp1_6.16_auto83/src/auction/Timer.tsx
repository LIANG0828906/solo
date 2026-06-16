import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import './Timer.css';

interface TimerProps {
  artworkId: string;
}

export const Timer = ({ artworkId }: TimerProps) => {
  const { artworks, setArtworkEnded } = useStore();
  const artwork = artworks.find(a => a.id === artworkId);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    if (!artwork) return;

    const updateTimeLeft = () => {
      const remaining = Math.max(0, artwork.endTime - Date.now());
      setTimeLeft(remaining);

      if (remaining <= 0 && !artwork.isEnded) {
        setArtworkEnded(artworkId);
      }
    };

    updateTimeLeft();

    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [artwork?.endTime, artwork?.isEnded, artworkId, setArtworkEnded]);

  if (!artwork || artwork.isEnded) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);

  const isUrgent = timeLeft < 60000;

  return (
    <div className={`timer-container ${isUrgent ? 'urgent' : ''}`}>
      <div className="timer-label">剩余时间</div>
      <div className="timer-display">
        <span className="timer-value">{String(minutes).padStart(2, '0')}</span>
        <span className="timer-separator">分</span>
        <span className="timer-value">{String(seconds).padStart(2, '0')}</span>
        <span className="timer-separator">秒</span>
      </div>
      {isUrgent && (
        <div className="timer-urgent-text">
          竞拍即将结束！
        </div>
      )}
    </div>
  );
};
