import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Track } from './store';

interface TrackStripProps {
  track: Track;
  trackIndex: number;
  onVolumeChange: (value: number) => void;
  onPanChange: (value: number) => void;
  onToggleMute: () => void;
  onToggleSolo: () => void;
}

export const TrackStrip: React.FC<TrackStripProps> = ({
  track,
  onVolumeChange,
  onPanChange,
  onToggleMute,
  onToggleSolo,
}) => {
  const [showVolumeTooltip, setShowVolumeTooltip] = useState(false);
  const [showPanTooltip, setShowPanTooltip] = useState(false);
  const faderRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const isDraggingFader = useRef(false);
  const isDraggingKnob = useRef(false);
  const dragStartY = useRef(0);
  const dragStartValue = useRef(0);

  const volumePercent = ((track.volume + 60) / 60) * 100;
  const knobRotation = (track.pan / 100) * 135;

  const handleFaderMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingFader.current = true;
    dragStartY.current = e.clientY;
    dragStartValue.current = track.volume;
    setShowVolumeTooltip(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingFader.current) return;
      const deltaY = dragStartY.current - e.clientY;
      const deltaDb = (deltaY / 150) * 60;
      let newValue = dragStartValue.current + deltaDb;
      newValue = Math.max(-60, Math.min(0, newValue));
      onVolumeChange(Math.round(newValue));
    };

    const handleMouseUp = () => {
      isDraggingFader.current = false;
      setShowVolumeTooltip(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [track.volume, onVolumeChange]);

  const handleKnobMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingKnob.current = true;
    dragStartY.current = e.clientY;
    dragStartValue.current = track.pan;
    setShowPanTooltip(true);

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingKnob.current) return;
      const deltaY = dragStartY.current - e.clientY;
      const deltaPan = (deltaY / 100) * 100;
      let newValue = dragStartValue.current + deltaPan;
      newValue = Math.max(-100, Math.min(100, newValue));
      onPanChange(Math.round(newValue));
    };

    const handleMouseUp = () => {
      isDraggingKnob.current = false;
      setShowPanTooltip(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [track.pan, onPanChange]);

  const handleFaderClick = useCallback((e: React.MouseEvent) => {
    if (!faderRef.current) return;
    const rect = faderRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percent = 1 - (y / rect.height);
    let db = percent * 60 - 60;
    db = Math.max(-60, Math.min(0, db));
    onVolumeChange(Math.round(db));
  }, [onVolumeChange]);

  const isMuted = track.muted;
  const isSolo = track.solo;

  return (
    <div className={`track-strip ${isMuted ? 'muted' : ''}`}>
      {isMuted && <div className="mute-overlay" />}

      <div className="track-header">
        <span
          className="track-name-badge"
          style={{ backgroundColor: track.color + '20', color: track.color }}
        >
          {track.name}
        </span>
      </div>

      <div className="volume-section">
        <div className="volume-label">VOL</div>
        <div
          ref={faderRef}
          className="fader-track"
          onClick={handleFaderClick}
          onMouseDown={handleFaderMouseDown}
        >
          <div
            className="fader-fill"
            style={{
              height: `${volumePercent}%`,
              background: `linear-gradient(to top, #0d47a1, #00b894, #00ff88)`,
              boxShadow: volumePercent > 70 ? '0 0 10px #00ff88' : 'none',
            }}
          />
          <div
            className="fader-thumb"
            style={{ bottom: `calc(${volumePercent}% - 8px)` }}
          />
          {showVolumeTooltip && (
            <div className="fader-tooltip">
              {track.volume > -60 ? `${track.volume} dB` : '-∞'}
            </div>
          )}
        </div>
        <div className="volume-value">
          {track.volume > -60 ? `${track.volume} dB` : '-∞'}
        </div>
      </div>

      <div className="pan-section">
        <div className="pan-label">PAN</div>
        <div
          ref={knobRef}
          className="pan-knob-container"
          onMouseDown={handleKnobMouseDown}
        >
          <div className="pan-knob-track-ring" />
          <div
            className="pan-knob-glow"
            style={{ transform: `rotate(${knobRotation}deg)` }}
          />
          <div
            className="pan-knob"
            style={{ transform: `rotate(${knobRotation}deg)` }}
          >
            <div className="knob-indicator" />
          </div>
          {showPanTooltip && (
            <div className="pan-tooltip">
              {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.abs(track.pan)}` : `R${track.pan}`}
            </div>
          )}
        </div>
        <div className="pan-value">
          {track.pan === 0 ? 'CENTER' : track.pan < 0 ? `L ${Math.abs(track.pan)}` : `R ${track.pan}`}
        </div>
      </div>

      <div className="buttons-section">
        <button
          className={`mute-btn ${isMuted ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleMute(); }}
        >
          <span>M</span>
        </button>
        <button
          className={`solo-btn ${isSolo ? 'active' : ''}`}
          onClick={(e) => { e.stopPropagation(); onToggleSolo(); }}
        >
          <span>S</span>
        </button>
      </div>
    </div>
  );
};

export default TrackStrip;
