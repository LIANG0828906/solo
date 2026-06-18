import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useSequencerStore } from '../../store/useSequencerStore';

interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label: string;
  color?: string;
}

const Knob: React.FC<KnobProps> = ({ value, min = 0, max = 1, onChange, label, color = '#00b4d8' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  const [animatedValue, setAnimatedValue] = useState(value);

  useEffect(() => {
    if (!isDragging) {
      setAnimatedValue(value);
    }
  }, [value, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = animatedValue;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = (startYRef.current - e.clientY) / 150;
      const newValue = Math.max(min, Math.min(max, startValueRef.current + delta));
      setAnimatedValue(newValue);
      onChange(newValue);
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
      document.body.style.cursor = '';
    };
  }, [isDragging, min, max, onChange]);

  const percentage = ((animatedValue - min) / (max - min)) * 100;
  const rotation = -135 + (percentage / 100) * 270;
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (percentage / 100) * circumference * 0.75;

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
        style={{
          position: 'relative',
          width: 56,
          height: 56,
          cursor: isDragging ? 'ns-resize' : 'grab',
          userSelect: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
          />
          <circle
            cx="28"
            cy="28"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${circumference * 0.75} ${circumference}`}
            strokeDashoffset={dashOffset}
            style={{
              transition: isDragging ? 'none' : 'stroke-dashoffset 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: isHovered || isDragging ? `drop-shadow(0 0 6px ${color}80)` : 'none',
            }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            style={{
              width: 3,
              height: 16,
              backgroundColor: color,
              borderRadius: 2,
              marginTop: -16,
              boxShadow: `0 0 4px ${color}80`,
            }}
          />
        </div>
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #2a3a5a, #16213e)',
            boxShadow: isDragging
              ? 'inset 2px 2px 6px rgba(0,0,0,0.6), inset -1px -1px 3px rgba(255,255,255,0.05)'
              : isHovered
                ? 'inset 1px 1px 4px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)'
                : 'inset 1px 1px 3px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.2)',
            transition: 'box-shadow 0.15s ease',
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: '#8892b0', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 11, color: '#ccd6f6', fontWeight: 700 }}>
        {Math.round(percentage)}%
      </span>
    </div>
  );
};

interface FaderProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label: string;
  color?: string;
  height?: number;
}

const Fader: React.FC<FaderProps> = ({ value, min = 0, max = 1.2, onChange, label, color = '#00b4d8', height = 180 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);
  const [animatedValue, setAnimatedValue] = useState(value);

  useEffect(() => {
    if (!isDragging) {
      setAnimatedValue(value);
    }
  }, [value, isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = animatedValue;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const delta = (startYRef.current - e.clientY) / (height - 30);
      const newValue = Math.max(min, Math.min(max, startValueRef.current + delta));
      setAnimatedValue(newValue);
      onChange(newValue);
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
      document.body.style.cursor = '';
    };
  }, [isDragging, min, max, onChange, height]);

  const percentage = ((animatedValue - min) / (max - min)) * 100;
  const handlePosition = height - 30 - (percentage / 100) * (height - 30);
  const isClipping = animatedValue > 1;
  const dbValue = animatedValue === 0 ? -Infinity : 20 * Math.log10(animatedValue);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <span style={{ fontSize: 11, color: isClipping ? '#e94560' : '#ccd6f6', fontWeight: 700 }}>
        {isFinite(dbValue) ? `${dbValue >= 0 ? '+' : ''}${dbValue.toFixed(1)}dB` : '-∞'}
      </span>
      <div
        style={{
          position: 'relative',
          width: 36,
          height,
          background: 'linear-gradient(180deg, #0a0e1a, #16213e)',
          borderRadius: 8,
          border: isClipping ? '2px solid #e94560' : '2px solid rgba(255,255,255,0.08)',
          boxShadow: isClipping
            ? '0 0 12px rgba(233,69,96,0.4), inset 0 2px 8px rgba(0,0,0,0.5)'
            : 'inset 0 2px 8px rgba(0,0,0,0.5)',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
          cursor: 'pointer',
        }}
        onMouseDown={handleMouseDown}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 15,
            top: 15,
            width: 6,
            backgroundColor: 'rgba(255,255,255,0.08)',
            borderRadius: 3,
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 15,
            width: 6,
            height: percentage / 100 * (height - 30),
            background: isClipping
              ? 'linear-gradient(180deg, #e94560, #ff6b6b)'
              : `linear-gradient(180deg, ${color}, ${color}80)`,
            borderRadius: 3,
            transition: isDragging ? 'none' : 'height 0.1s ease, background 0.3s ease',
            boxShadow: isClipping ? `0 0 8px rgba(233,69,96,0.6)` : `0 0 6px ${color}40`,
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: `translate(-50%, ${handlePosition}px)`,
            width: 32,
            height: 28,
            borderRadius: 6,
            background: isDragging
              ? 'linear-gradient(180deg, #4a5a7a, #2a3a5a)'
              : 'linear-gradient(180deg, #3a4a6a, #1a2a4a)',
            boxShadow: isDragging
              ? 'inset -2px -2px 4px rgba(0,0,0,0.6), inset 2px 2px 4px rgba(255,255,255,0.1), 0 8px 20px rgba(0,0,0,0.5)'
              : isHovered
                ? 'inset -1px -1px 3px rgba(0,0,0,0.5), inset 1px 1px 2px rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.4)'
                : 'inset -1px -1px 2px rgba(0,0,0,0.4), inset 1px 1px 2px rgba(255,255,255,0.05), 0 2px 8px rgba(0,0,0,0.3)',
            transition: 'transform 0.05s linear, box-shadow 0.15s ease, background 0.15s ease',
            cursor: isDragging ? 'ns-resize' : 'grab',
            border: isClipping ? '1px solid #e94560' : '1px solid rgba(255,255,255,0.1)',
            zIndex: 2,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 20,
              height: 3,
              backgroundColor: isClipping ? '#e94560' : color,
              borderRadius: 2,
              boxShadow: `0 0 4px ${isClipping ? '#e94560' : color}80`,
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            left: '100%',
            top: height - 30 - (1 / (max - min)) * 100 / 100 * (height - 30),
            width: 6,
            height: 2,
            backgroundColor: 'rgba(233,69,96,0.5)',
          }}
        />
      </div>
      <span style={{ fontSize: 10, color: '#8892b0', fontWeight: 600 }}>{label}</span>
    </div>
  );
};

export const MixerPanel: React.FC = () => {
  const { tracks, masterVolume, updateTrack, setMasterVolume } = useSequencerStore();

  const handleVolumeChange = useCallback((trackId: string, value: number) => {
    updateTrack(trackId, { volume: value });
  }, [updateTrack]);

  const handleAuxChange = useCallback((trackId: string, value: number) => {
    updateTrack(trackId, { auxSend: value });
  }, [updateTrack]);

  return (
    <div
      style={{
        width: 280,
        backgroundColor: '#16213e',
        borderRight: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'linear-gradient(180deg, #0f3460, #16213e)',
        }}
      >
        <h3 style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#ccd6f6',
          textTransform: 'uppercase',
          letterSpacing: 1,
        }}>
          MIXER
        </h3>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 8px',
          scrollbarWidth: 'thin',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            marginBottom: 16,
            paddingBottom: 16,
            borderBottom: '2px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#e94560',
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}>
              MASTER
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <Fader
              value={masterVolume}
              onChange={setMasterVolume}
              label="VOL"
              color="#e94560"
              height={180}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {tracks.map((track) => (
            <div
              key={track.id}
              style={{
                padding: '12px 8px',
                backgroundColor: track.muted ? 'rgba(233,69,96,0.05)' : 'rgba(255,255,255,0.02)',
                borderRadius: 8,
                border: `1px solid ${track.muted ? 'rgba(233,69,96,0.2)' : 'rgba(255,255,255,0.05)'}`,
                opacity: track.muted ? 0.5 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                  paddingBottom: 8,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: track.color,
                    boxShadow: `0 0 6px ${track.color}60`,
                  }}
                />
                <span style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#e6f1ff',
                  flex: 1,
                }}>
                  {track.name}
                </span>
                {track.solo && (
                  <span style={{
                    fontSize: 9,
                    padding: '2px 5px',
                    backgroundColor: '#f77f00',
                    color: '#fff',
                    borderRadius: 3,
                    fontWeight: 700,
                  }}>
                    SOLO
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end' }}>
                <Fader
                  value={track.volume}
                  onChange={(v) => handleVolumeChange(track.id, v)}
                  label="VOL"
                  color={track.color}
                  height={140}
                />
                <Knob
                  value={track.auxSend}
                  onChange={(v) => handleAuxChange(track.id, v)}
                  label="AUX"
                  color={track.color}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
