import React, { useState } from 'react';
import type { InstrumentType, RecordedPulse } from '../types';
import { INSTRUMENT_CONFIGS } from '../types';

interface ControlPanelProps {
  instrument: InstrumentType;
  bpm: number;
  isRecording: boolean;
  recordedCount: number;
  onInstrumentChange: (instrument: InstrumentType) => void;
  onBpmChange: (bpm: number) => void;
  onReset: () => void;
  onToggleRecording: () => void;
  onPlayback: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({
  instrument,
  bpm,
  isRecording,
  recordedCount,
  onInstrumentChange,
  onBpmChange,
  onReset,
  onToggleRecording,
  onPlayback
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' && window.innerWidth < 768);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const config = INSTRUMENT_CONFIGS[instrument];

  const glassStyle: React.CSSProperties = {
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(16px)',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '10px 18px',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s ease',
    fontFamily: 'inherit'
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`,
    color: 'white',
    boxShadow: `0 0 20px ${config.gradient[0]}60`
  };

  const normalButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.8)',
    border: '1px solid rgba(255, 255, 255, 0.2)'
  };

  const PanelContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px', minWidth: '260px' }}>
      <div>
        <label style={{
          display: 'block',
          color: 'rgba(255,255,255,0.6)',
          fontSize: '12px',
          marginBottom: '8px',
          fontWeight: 500
        }}>
          乐器选择
        </label>
        <select
          value={instrument}
          onChange={(e) => onInstrumentChange(e.target.value as InstrumentType)}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          <option value="piano">🎹 钢琴</option>
          <option value="guitar">🎸 吉他</option>
          <option value="drum">🥁 鼓</option>
        </select>
      </div>

      <div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px'
        }}>
          <label style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: '12px',
            fontWeight: 500
          }}>
            BPM
          </label>
          <span style={{
            color: 'white',
            fontSize: '18px',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
            background: `linear-gradient(135deg, ${config.gradient[0]}, ${config.gradient[1]})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {bpm}
          </span>
        </div>
        <input
          type="range"
          min="60"
          max="240"
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: 'rgba(255, 255, 255, 0.1)',
            outline: 'none',
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
        />
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: 'rgba(255,255,255,0.3)',
          fontSize: '10px',
          marginTop: '4px'
        }}>
          <span>60</span>
          <span>240</span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={onReset}
          style={normalButtonStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        >
          🔄 重置
        </button>

        <button
          onClick={onToggleRecording}
          style={isRecording ? activeButtonStyle : normalButtonStyle}
          onMouseEnter={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isRecording) {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }
          }}
        >
          {isRecording ? '⏹ 停止录制' : '⏺ 录制'}
        </button>
      </div>

      {recordedCount > 0 && (
        <button
          onClick={onPlayback}
          style={{
            ...normalButtonStyle,
            width: '100%',
            background: `linear-gradient(135deg, ${config.gradient[0]}40, ${config.gradient[1]}40)`,
            border: `1px solid ${config.gradient[0]}60`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${config.gradient[0]}60, ${config.gradient[1]}60)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, ${config.gradient[0]}40, ${config.gradient[1]}40)`;
          }}
        >
          ▶ 回放 ({recordedCount}/10)
        </button>
      )}

      {isRecording && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px',
          background: 'rgba(239, 68, 68, 0.2)',
          borderRadius: '8px',
          border: '1px solid rgba(239, 68, 68, 0.4)'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#ef4444',
            animation: 'pulse 1s ease-in-out infinite'
          }} />
          <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 500 }}>
            正在录制... {recordedCount}/10
          </span>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          style={{
            position: 'fixed',
            top: '16px',
            right: '16px',
            zIndex: 100,
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            ...glassStyle,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            border: 'none'
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: '20px',
                height: '2px',
                background: 'white',
                borderRadius: '1px',
                transition: 'transform 0.3s ease',
                transform: isMobileMenuOpen
                  ? i === 1 ? 'rotate(45deg) translate(4px, 4px)'
                    : i === 3 ? 'rotate(-45deg) translate(4px, -4px)'
                    : 'scaleX(0)'
                  : 'none'
              }}
            />
          ))}
        </button>

        {isMobileMenuOpen && (
          <div style={{
            position: 'fixed',
            top: '72px',
            right: '16px',
            zIndex: 99,
            ...glassStyle
          }}>
            <PanelContent />
          </div>
        )}

        {isMobileMenuOpen && (
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 98
            }}
          />
        )}
      </>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 10,
      ...glassStyle
    }}>
      <PanelContent />
    </div>
  );
};

export default ControlPanel;
