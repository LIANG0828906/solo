import React, { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
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

const Knob = memo<KnobProps>(({ value, min, max, onChange, label, color, size = 60 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  const displayValueRef = useRef(value);
  const animationFrameRef = useRef<number | null>(null);
  const [, forceUpdate] = useState(0);

  const circumference = useMemo(() => 2 * Math.PI * 24, []);

  useEffect(() => {
    if (isDragging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      displayValueRef.current = value;
      forceUpdate((n) => n + 1);
    } else {
      const animate = () => {
        const diff = value - displayValueRef.current;
        if (Math.abs(diff) > 0.001) {
          displayValueRef.current += diff * 0.2;
          forceUpdate((n) => n + 1);
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          displayValueRef.current = value;
          forceUpdate((n) => n + 1);
          animationFrameRef.current = null;
        }
      };
      animationFrameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [value, isDragging]);

  const displayPercentage = useMemo(() => {
    const displayVal = ((displayValueRef.current - min) / (max - min)) * 100;
    return Math.max(0, Math.min(100, displayVal));
  }, [min, max]);

  const displayRotation = useMemo(() => -135 + (displayPercentage / 100) * 270, [displayPercentage]);
  const displayDashOffset = useMemo(
    () => circumference * (1 - displayPercentage / 100),
    [circumference, displayPercentage]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);
      startYRef.current = e.clientY;
      startValueRef.current = value;
    },
    [value]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = startYRef.current - e.clientY;
      const range = max - min;
      const sensitivity = range / 150;
      const newValue = Math.max(min, Math.min(max, startValueRef.current + delta * sensitivity));
      displayValueRef.current = Math.round(newValue * 100) / 100;
      onChange(Math.round(newValue * 100) / 100);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging, min, max, onChange]);

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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: size,
          height: size,
          position: 'relative',
          cursor: isDragging ? 'ns-resize' : 'grab',
          transition: 'transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isDragging ? 'scale(1.08)' : isHovered ? 'scale(1.04)' : 'scale(1)',
        }}
      >
        <svg width={size} height={size} viewBox="0 0 60 60">
          <defs>
            <linearGradient id={`knob-grad-${color.replace('#', '')}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={color} stopOpacity="1" />
              <stop offset="100%" stopColor={color} stopOpacity="0.7" />
            </linearGradient>
            <filter id={`glow-${color.replace('#', '')}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle
            cx="30"
            cy="30"
            r="24"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          <circle
            cx="30"
            cy="30"
            r="24"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={displayDashOffset}
            strokeLinecap="round"
            transform="rotate(-135 30 30)"
            style={{
              filter: isHovered || isDragging ? `url(#glow-${color.replace('#', '')})` : 'none',
            }}
          />
          <circle
            cx="30"
            cy="30"
            r="18"
            fill="url(#knob-grad-1a1a2e)"
            style={{
              filter: 'inset 0 2px 8px rgba(0,0,0,0.5)',
            }}
          />
          <circle
            cx="30"
            cy="30"
            r="16"
            fill="#1a1a2e"
          />
          <circle
            cx="30"
            cy="30"
            r="14"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />
          <line
            x1="30"
            y1="30"
            x2="30"
            y2="18"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            transform={`rotate(${displayRotation} 30 30)`}
            style={{
              filter: isHovered || isDragging ? `url(#glow-${color.replace('#', '')})` : 'none',
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
            fontWeight: 700,
            color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
            letterSpacing: 0.5,
          }}
        >
          {Math.round(displayPercentage)}%
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          color: 'rgba(255,255,255,0.5)',
          fontWeight: 500,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
    </div>
  );
});

Knob.displayName = 'Knob';

interface FaderProps {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  label: string;
  color: string;
  isMain?: boolean;
}

const Fader = memo<FaderProps>(({ value, min, max, onChange, label, color, isMain = false }) => {
  const faderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const percentage = useMemo(() => ((value - min) / (max - min)) * 100, [value, min, max]);
  const dbValue = useMemo(() => Math.round(20 * Math.log10(Math.max(0.001, value))), [value]);
  const isClipping = useMemo(() => value > 1, [value]);
  const faderHeight = isMain ? 200 : 150;
  const knobHeight = isMain ? 22 : 18;

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(true);

      const rect = faderRef.current?.getBoundingClientRect();
      if (rect) {
        const faderInnerHeight = faderHeight - knobHeight;
        const relativeY = rect.bottom - e.clientY - knobHeight / 2;
        const pct = Math.max(0, Math.min(1, relativeY / faderInnerHeight));
        const newValue = min + pct * (max - min);
        onChange(Math.round(newValue * 100) / 100);
      }
    },
    [min, max, onChange, faderHeight, knobHeight]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const rect = faderRef.current?.getBoundingClientRect();
      if (rect) {
        const faderInnerHeight = faderHeight - knobHeight;
        const relativeY = rect.bottom - e.clientY - knobHeight / 2;
        const pct = Math.max(0, Math.min(1, relativeY / faderInnerHeight));
        const newValue = min + pct * (max - min);
        onChange(Math.round(newValue * 100) / 100);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };
  }, [isDragging, min, max, onChange, faderHeight, knobHeight]);

  const faderInnerHeight = faderHeight - knobHeight;
  const knobBottom = (percentage / 100) * faderInnerHeight + knobHeight / 2;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 6,
      }}
    >
      <span
        style={{
          fontSize: 10,
          color: isClipping ? '#ff6666' : 'rgba(255,255,255,0.6)',
          fontWeight: 600,
          fontFamily: 'monospace',
          minWidth: 40,
          textAlign: 'center',
          transition: 'color 0.3s ease',
        }}
      >
        {dbValue}dB
      </span>
      <div
        ref={faderRef}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: isMain ? 32 : 28,
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
            width: isMain ? 10 : 8,
            transform: 'translateX(-50%)',
            backgroundColor: '#0a0a1a',
            borderRadius: 5,
            overflow: 'hidden',
            border: isClipping
              ? '2px solid #ff4444'
              : isMain
              ? '2px solid rgba(255,255,255,0.15)'
              : '1px solid rgba(255,255,255,0.1)',
            transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
            boxShadow: isClipping
              ? '0 0 12px rgba(255,68,68,0.5), inset 0 2px 8px rgba(0,0,0,0.6)'
              : 'inset 0 2px 8px rgba(0,0,0,0.6)',
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
                ? 'linear-gradient(180deg, #ff6666 0%, #ff3333 50%, #cc0000 100%)'
                : `linear-gradient(180deg, ${color} 0%, ${color}cc 50%, ${color}88 100%)`,
              transition: isDragging ? 'none' : 'height 0.05s linear, background 0.3s ease',
              boxShadow: isClipping ? '0 0 10px rgba(255,68,68,0.6)' : 'none',
            }}
          />
          {[0, 25, 50, 75, 100].map((mark) => (
            <div
              key={mark}
              style={{
                position: 'absolute',
                left: -3,
                right: -3,
                bottom: `${mark}%`,
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.15)',
                pointerEvents: 'none',
              }}
            />
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: knobBottom,
            transform: 'translateX(-50%) translateY(50%)',
            width: isMain ? 28 : 24,
            height: knobHeight,
            background: isDragging
              ? 'linear-gradient(180deg, #6a6a8a 0%, #4a4a6a 50%, #3a3a5a 100%)'
              : isHovered
              ? 'linear-gradient(180deg, #5a5a7a 0%, #3a3a5a 50%, #2a2a4a 100%)'
              : 'linear-gradient(180deg, #4a4a6a 0%, #2a2a4a 50%, #1a1a3a 100%)',
            borderRadius: 4,
            boxShadow: isDragging
              ? `0 10px 24px rgba(0,0,0,0.6), 0 0 0 2px ${color}, 0 2px 4px rgba(0,0,0,0.3) inset`
              : isHovered
              ? `0 6px 16px rgba(0,0,0,0.45), 0 0 0 1px ${color}80, 0 1px 2px rgba(255,255,255,0.1) inset`
              : '0 4px 10px rgba(0,0,0,0.35), 0 1px 2px rgba(255,255,255,0.08) inset',
            transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 10,
            cursor: 'ns-resize',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <div
              style={{
                width: isMain ? 18 : 14,
                height: 2,
                backgroundColor: color,
                borderRadius: 1,
                boxShadow: `0 0 4px ${color}80`,
              }}
            />
            <div
              style={{
                width: isMain ? 18 : 14,
                height: 1,
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: 1,
              }}
            />
          </div>
        </div>
      </div>
      <span
        style={{
          fontSize: 11,
          color: '#fff',
          fontWeight: 600,
          letterSpacing: 0.5,
        }}
      >
        {label}
      </span>
    </div>
  );
});

Fader.displayName = 'Fader';

interface TrackStripProps {
  track: Track;
  onVolumeChange: (trackId: string, value: number) => void;
  onSendChange: (trackId: string, value: number) => void;
  onMuteToggle: (trackId: string, muted: boolean) => void;
  onSoloToggle: (trackId: string, solo: boolean) => void;
}

const TrackStrip = memo<TrackStripProps>(
  ({ track, onVolumeChange, onSendChange, onMuteToggle, onSoloToggle }) => {
    const [muteHovered, setMuteHovered] = useState(false);
    const [soloHovered, setSoloHovered] = useState(false);

    return (
      <div
        style={{
          backgroundColor: '#1a1a2e',
          borderRadius: 8,
          padding: 12,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          border: `1px solid ${track.muted ? 'rgba(255,255,255,0.08)' : track.color + '30'}`,
          opacity: track.muted ? 0.55 : 1,
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
              boxShadow: `0 0 8px ${track.color}40`,
            }}
          />
          <span
            style={{
              color: '#fff',
              fontSize: 11,
              fontWeight: 600,
              flex: 1,
              textOverflow: 'ellipsis',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
            }}
          >
            {track.name}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'center',
          }}
        >
          <button
            onClick={() => onMuteToggle(track.id, track.muted)}
            onMouseEnter={() => setMuteHovered(true)}
            onMouseLeave={() => setMuteHovered(false)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              border: 'none',
              backgroundColor: track.muted
                ? '#ff6b6b'
                : muteHovered
                ? 'rgba(255,107,107,0.25)'
                : 'rgba(255,255,255,0.08)',
              color: track.muted ? '#fff' : muteHovered ? '#ff6b6b' : 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: track.muted ? '0 2px 8px rgba(255,107,107,0.4)' : 'none',
            }}
          >
            M
          </button>
          <button
            onClick={() => onSoloToggle(track.id, track.solo)}
            onMouseEnter={() => setSoloHovered(true)}
            onMouseLeave={() => setSoloHovered(false)}
            style={{
              width: 26,
              height: 26,
              borderRadius: 5,
              border: 'none',
              backgroundColor: track.solo
                ? '#ffe66d'
                : soloHovered
                ? 'rgba(255,230,109,0.25)'
                : 'rgba(255,255,255,0.08)',
              color: track.solo ? '#1a1a2e' : soloHovered ? '#ffe66d' : 'rgba(255,255,255,0.5)',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: track.solo ? '0 2px 8px rgba(255,230,109,0.4)' : 'none',
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
            paddingTop: 4,
          }}
        >
          <Fader
            value={track.volume}
            min={0}
            max={1.2}
            onChange={(v) => onVolumeChange(track.id, v)}
            label="音量"
            color={track.color}
          />
          <Knob
            value={track.send}
            min={0}
            max={1}
            onChange={(v) => onSendChange(track.id, v)}
            label="发送"
            color={track.color}
            size={48}
          />
        </div>
      </div>
    );
  }
);

TrackStrip.displayName = 'TrackStrip';

export const MixerPanel: React.FC = () => {
  const { tracks, mainVolume, setTrackSend, setMainVolume } = useSequencerStore();

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
        borderRight: '1px solid rgba(255,255,255,0.08)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        height: '100%',
      }}
    >
      <div
        style={{
          padding: '14px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        <h3
          style={{
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            margin: 0,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
          }}
        >
          混音器
        </h3>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {tracks.map((track: Track) => (
          <TrackStrip
            key={track.id}
            track={track}
            onVolumeChange={handleTrackVolumeChange}
            onSendChange={handleTrackSendChange}
            onMuteToggle={handleTrackMuteToggle}
            onSoloToggle={handleTrackSoloToggle}
          />
        ))}
      </div>

      <div
        style={{
          padding: '14px 10px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          backgroundColor: '#0f3460',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: 9,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
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
