import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSequencerStore } from '../../store/useSequencerStore';
import { sequencerEngine } from '../sequencer/SequencerEngine';
import { Track } from '../../types';

interface KnobProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  color: string;
  size?: number;
}

const Knob: React.FC<KnobProps> = ({ value, min, max, onChange, label, color, size = 60 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startValue, setStartValue] = useState(0);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      setStartY(e.clientY);
      setStartValue(value);
    },
    [value]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = startY - e.clientY;
      const range = max - min;
      const sensitivity = range / 150;
      const newValue = Math.max(min, Math.min(max, startValue + delta * sensitivity));
      onChange(Math.round(newValue * 100) / 100);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, startY, startValue, min, max, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;
  const rotation = -135 + (percentage / 100) * 270;
  const dashOffset = 2 * Math.PI * 24 * (1 - percentage / 100);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}
    >
      <div
        onMouseDown={handleMouseDown}
        style={{
          width: size,
          height: size,
          position: 'relative',
          cursor: isDragging ? 'ns-resize' : 'grab',
          transition: 'transform 0.1s ease',
          transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 60 60">
          <circle
            cx="30"
            cy="30"
            r="24"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
          />
          <circle
            cx="30"
            cy="30"
            r="24"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={2 * Math.PI * 24}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
            transform="rotate(-135 30 30)"
            style={{
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
          <circle
            cx="30"
            cy="30"
            r="18"
            fill="#1a1a2e"
            style={{
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
            }}
          />
          <line
            x1="30"
            y1="30"
            x2="30"
            y2="16"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${rotation} 30 30)`}
            style={{
              transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 10,
            fontWeight: 600,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            pointerEvents: 'none',
          }}
        >
          {Math.round(percentage)}%
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 500,
        }}
      >
        {label}
      </span>
    </div>
  );
};

interface FaderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  color: string;
  isMain?: boolean;
}

const Fader: React.FC<FaderProps> = ({ value, min, max, onChange, label, color, isMain = false }) => {
  const faderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      const rect = faderRef.current?.getBoundingClientRect();
      if (rect) {
        const faderHeight = rect.height - 20;
        const relativeY = rect.bottom - e.clientY - 10;
        const percentage = Math.max(0, Math.min(1, relativeY / faderHeight));
        const newValue = min + percentage * (max - min);
        onChange(Math.round(newValue * 100) / 100);
      }
    },
    [min, max, onChange]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const rect = faderRef.current?.getBoundingClientRect();
      if (rect) {
        const faderHeight = rect.height - 20;
        const relativeY = rect.bottom - e.clientY - 10;
        const percentage = Math.max(0, Math.min(1, relativeY / faderHeight));
        const newValue = min + percentage * (max - min);
        onChange(Math.round(newValue * 100) / 100);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, min, max, onChange]);

  const percentage = ((value - min) / (max - min)) * 100;
  const dbValue = Math.round(20 * Math.log10(Math.max(0.001, value)));
  const isClipping = value > 1;
  const faderHeight = isMain ? 200 : 150;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 500,
        }}
      >
        {dbValue}dB
      </span>
      <div
        ref={faderRef}
        onMouseDown={handleMouseDown}
        style={{
          width: 28,
          height: faderHeight,
          position: 'relative',
          cursor: 'ns-resize',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            bottom: 0,
            width: 6,
            transform: 'translateX(-50%)',
            backgroundColor: '#0a0a1a',
            borderRadius: 3,
            overflow: 'hidden',
            border: isClipping ? '2px solid #ff4444' : '1px solid rgba(255,255,255,0.1)',
            transition: 'border-color 0.3s ease',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: `${percentage}%`,
              background: isClipping
                ? 'linear-gradient(180deg, #ff6666 0%, #ff4444 100%)'
                : `linear-gradient(180deg, ${color} 0%, ${color}aa 100%)`,
              transition: isDragging ? 'none' : 'height 0.1s ease',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: `${percentage}%`,
            transform: 'translateX(-50%) translateY(50%)',
            width: 24,
            height: 18,
            background: isDragging
              ? 'linear-gradient(180deg, #5a5a7a 0%, #3a3a5a 100%)'
              : 'linear-gradient(180deg, #4a4a6a 0%, #2a2a4a 100%)',
            borderRadius: 4,
            boxShadow: isDragging
              ? `0 8px 16px rgba(0,0,0,0.5), 0 0 0 2px ${color}`
              : '0 4px 8px rgba(0,0,0,0.3)',
            transition: 'all 0.1s ease',
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 14,
              height: 2,
              backgroundColor: color,
              borderRadius: 1,
            }}
          />
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          color: '#fff',
          fontWeight: 600,
        }}
      >
        {label}
      </span>
    </div>
  );
};

export const MixerPanel: React.FC = () => {
  const {
    tracks,
    mainVolume,
    setTrackSend,
    setMainVolume,
  } = useSequencerStore();

  const handleTrackVolumeChange = useCallback(
    (trackId: string, value: number) => {
      sequencerEngine.setTrackVolume(trackId, value);
    },
    []
  );

  const handleTrackSendChange = useCallback(
    (trackId: string, value: number) => {
      setTrackSend(trackId, value);
    },
    [setTrackSend]
  );

  const handleTrackMuteToggle = useCallback(
    (trackId: string, currentMuted: boolean) => {
      sequencerEngine.setTrackMuted(trackId, !currentMuted);
    },
    []
  );

  const handleTrackSoloToggle = useCallback(
    (trackId: string, currentSolo: boolean) => {
      sequencerEngine.setTrackSolo(trackId, !currentSolo);
    },
    []
  );

  return (
    <div
      style={{
        width: 200,
        backgroundColor: '#16213e',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          padding: 12,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h3
          style={{
            color: '#fff',
            fontSize: 12,
            fontWeight: 600,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          混音器
        </h3>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {tracks.map((track: Track) => (
          <div
            key={track.id}
            style={{
              backgroundColor: '#1a1a2e',
              borderRadius: 8,
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              border: `1px solid ${track.muted ? 'rgba(255,255,255,0.1)' : track.color + '40'}`,
              opacity: track.muted ? 0.5 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <div
                style={{
                  width: 4,
                  height: 20,
                  backgroundColor: track.color,
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 600,
                  flex: 1,
                }}
              >
                {track.name}
              </span>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'center',
              }}
            >
              <button
                onClick={() => handleTrackMuteToggle(track.id, track.muted)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  border: 'none',
                  backgroundColor: track.muted ? '#ff6b6b' : 'rgba(255,255,255,0.1)',
                  color: track.muted ? '#fff' : 'rgba(255,255,255,0.5)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!track.muted) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,107,107,0.3)';
                    e.currentTarget.style.color = '#ff6b6b';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!track.muted) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  }
                }}
              >
                M
              </button>
              <button
                onClick={() => handleTrackSoloToggle(track.id, track.solo)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 4,
                  border: 'none',
                  backgroundColor: track.solo ? '#ffe66d' : 'rgba(255,255,255,0.1)',
                  color: track.solo ? '#1a1a2e' : 'rgba(255,255,255,0.5)',
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  if (!track.solo) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,230,109,0.3)';
                    e.currentTarget.style.color = '#ffe66d';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!track.solo) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)';
                  }
                }}
              >
                S
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'flex-start',
              }}
            >
              <Fader
                value={track.volume}
                min={0}
                max={1.2}
                onChange={(v) => handleTrackVolumeChange(track.id, v)}
                label="音量"
                color={track.color}
              />
              <Knob
                value={track.send}
                min={0}
                max={1}
                onChange={(v) => handleTrackSendChange(track.id, v)}
                label="发送"
                color={track.color}
                size={50}
              />
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 12,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#0f3460',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span
            style={{
              color: '#fff',
              fontSize: 10,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            主输出
          </span>
          <Fader
            value={mainVolume}
            min={0}
            max={1.2}
            onChange={setMainVolume}
            label="MASTER"
            color="#4ecdc4"
            isMain
          />
        </div>
      </div>
    </div>
  );
};
