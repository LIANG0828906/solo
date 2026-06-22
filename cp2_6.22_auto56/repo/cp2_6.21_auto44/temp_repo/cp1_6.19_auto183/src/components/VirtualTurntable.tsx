import { useState } from 'react';

interface VirtualTurntableProps {
  onPlay?: () => void;
  onPause?: () => void;
}

export default function VirtualTurntable({ onPlay, onPause }: VirtualTurntableProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(60);

  const handleTogglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      onPause?.();
    } else {
      setIsPlaying(true);
      onPlay?.();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setVolume(val);
  };

  return (
    <div className="turntable-section">
      <div className={`vinyl-disc ${isPlaying ? 'spinning' : ''}`} />
      <div className="turntable-controls">
        <button
          type="button"
          className="play-btn"
          onClick={handleTogglePlay}
          aria-label={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        <div className="volume-wrapper">
          <span className="volume-icon">🔊</span>
          <input
            type="range"
            className="volume-slider"
            min={0}
            max={100}
            value={volume}
            onChange={handleVolumeChange}
            style={{ ['--volume' as string]: `${volume}%` }}
            aria-label="音量"
          />
        </div>
      </div>
    </div>
  );
}
