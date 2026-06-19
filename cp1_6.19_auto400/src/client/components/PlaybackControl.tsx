import React from 'react';
import { useSongStore } from '../store/useSongStore';

interface PlaybackControlProps {
  isPlaying: boolean;
  currentMeasure: number;
  totalMeasures: number;
  bpm: number;
  onTogglePlay: () => void;
  onBpmChange: (bpm: number) => void;
  onSeek: (measure: number) => void;
}

export const PlaybackControl: React.FC<PlaybackControlProps> = ({
  isPlaying,
  currentMeasure,
  totalMeasures,
  bpm,
  onTogglePlay,
  onBpmChange,
  onSeek
}) => {
  const { currentSong } = useSongStore();
  
  const progress = totalMeasures > 0
    ? ((currentMeasure + 1) / totalMeasures) * 100
    : 0;

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const measure = Math.floor(percentage * totalMeasures);
    onSeek(Math.max(0, Math.min(measure, totalMeasures - 1)));
  };

  return (
    <div className="playback-bar">
      <button
        className={`play-btn ripple ${isPlaying ? 'playing' : ''}`}
        onClick={onTogglePlay}
        title={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? '⏸' : '▶'}
      </button>

      <div className="progress-container">
        <div
          className="progress-bar"
          onClick={handleProgressClick}
        >
          <div
            className="progress-bar-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="progress-text">
          {currentMeasure >= 0
            ? `小节 ${currentMeasure + 1} / ${totalMeasures}`
            : `共 ${totalMeasures} 小节`
          }
          {currentSong && (
            <span style={{ marginLeft: '16px', color: 'var(--text-secondary)' }}>
              {currentSong.name} • {currentSong.timeSignature} • {currentSong.key}调
            </span>
          )}
        </div>
      </div>

      <div className="bpm-slider">
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>BPM</span>
        <input
          type="range"
          min="60"
          max="200"
          value={bpm}
          onChange={(e) => onBpmChange(parseInt(e.target.value))}
        />
        <span className="bpm-value">{bpm}</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button
          className="btn btn-ghost ripple"
          style={{ padding: '8px 12px', fontSize: '12px' }}
          onClick={() => useSongStore.getState().undo()}
          title="撤销 (Ctrl+Z)"
        >
          ↩
        </button>
        <button
          className="btn btn-ghost ripple"
          style={{ padding: '8px 12px', fontSize: '12px' }}
          onClick={() => useSongStore.getState().redo()}
          title="重做 (Ctrl+Shift+Z)"
        >
          ↪
        </button>
      </div>
    </div>
  );
};

export default PlaybackControl;
