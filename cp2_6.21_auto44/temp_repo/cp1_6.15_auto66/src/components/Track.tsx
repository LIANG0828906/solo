import '../styles.css';
import React from 'react';
import { Track } from '../AudioEngine';
import { Waveform } from './Waveform';

export interface TrackProps {
  track: Track;
  peaks: number[];
  pixelsPerSecond: number;
  isSoloMode: boolean;
  readOnly: boolean;
  onMute: (id: string) => void;
  onSolo: (id: string) => void;
  onDragStart: (id: string) => void;
  onDragMove: (id: string, deltaSeconds: number) => void;
  onDragEnd: (id: string) => void;
  currentTime?: number;
}

export const TrackComponent: React.FC<TrackProps> = ({
  track,
  peaks,
  pixelsPerSecond,
  isSoloMode,
  readOnly,
  onMute,
  onSolo,
  onDragStart,
  onDragMove,
  onDragEnd,
  currentTime = 0,
}) => {
  const waveformWidth = track.duration * pixelsPerSecond;
  const waveformLeft = track.startTime * pixelsPerSecond;

  const isDimmed = isSoloMode && !track.soloed;
  const isMuted = track.muted;

  const containerClasses = [
    'track-row',
    isMuted ? 'track-muted' : '',
    isDimmed ? 'track-solo-bg' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={containerClasses}
      style={{
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 12px',
          gap: '4px',
          width: '136px',
          flexShrink: 0,
        }}
      >
        <button
          className={`track-btn track-btn-mute ${isMuted ? 'active' : ''}`}
          onClick={() => onMute(track.id)}
          disabled={readOnly}
          style={{
            cursor: readOnly ? 'not-allowed' : 'pointer',
            opacity: readOnly ? 0.5 : 1,
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          M
        </button>
        <button
          className={`track-btn track-btn-solo ${track.soloed ? 'active' : ''}`}
          onClick={() => onSolo(track.id)}
          disabled={readOnly}
          style={{
            cursor: readOnly ? 'not-allowed' : 'pointer',
            opacity: readOnly ? 0.5 : 1,
            color: '#ffffff',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          S
        </button>
        <span
          style={{
            color: '#e0e0e0',
            fontSize: '13px',
            fontWeight: 500,
            marginLeft: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: '120px',
          }}
          title={track.name}
        >
          {track.name}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          position: 'relative',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: waveformLeft,
            top: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Waveform
            peaks={peaks}
            width={waveformWidth}
            height={60}
            muted={isMuted}
            dimmed={isDimmed}
            onDragStart={() => !readOnly && onDragStart(track.id)}
            onDragMove={(delta) => !readOnly && onDragMove(track.id, delta)}
            onDragEnd={() => !readOnly && onDragEnd(track.id)}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: currentTime * pixelsPerSecond,
            width: '2px',
            background: '#ef4444',
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
};

export default TrackComponent;
