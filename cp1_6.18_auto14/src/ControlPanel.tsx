import React, { useRef } from 'react';
import type { ScaleType } from './AudioAnalyzer';

interface ControlPanelProps {
  onFileUpload: (file: File) => void;
  onScaleSelect: (scale: ScaleType | null) => void;
  onVolumeChange: (volume: number) => void;
  onSpeedChange: (speed: number) => void;
  onResetView: () => void;
  selectedScale: ScaleType | null;
  volume: number;
  speed: number;
}

const scales: { key: ScaleType; label: string; symbol: string }[] = [
  { key: 'major', label: '大调', symbol: 'M' },
  { key: 'minor', label: '小调', symbol: 'm' },
  { key: 'pentatonic', label: '五声', symbol: '5' },
  { key: 'wholeTone', label: '全音', symbol: 'W' },
  { key: 'chromatic', label: '半音', symbol: 'C' }
];

const ControlPanel: React.FC<ControlPanelProps> = ({
  onFileUpload,
  onScaleSelect,
  onVolumeChange,
  onSpeedChange,
  onResetView,
  selectedScale,
  volume,
  speed
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.title}>旋律地貌</div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>音频源</div>
        <div style={styles.row}>
          <button
            style={styles.uploadButton}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#5A5A7C';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#3A3A5C';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <span style={{ marginLeft: '6px' }}>上传音频</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".mp3,.wav"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>预设音阶</div>
        <div style={styles.scaleRow}>
          {scales.map(({ key, label, symbol }) => {
            const isSelected = selectedScale === key;
            return (
              <button
                key={key}
                title={label}
                onClick={() => onScaleSelect(isSelected ? null : key)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
                style={{
                  ...styles.scaleButton,
                  background: isSelected ? '#00E676' : '#3A3A5C',
                  boxShadow: isSelected ? '0 0 12px rgba(0, 230, 118, 0.8)' : 'none',
                  color: isSelected ? '#0A1128' : '#FFFFFF'
                }}
              >
                {symbol}
              </button>
            );
          })}
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>
          <span>音量</span>
          <span style={styles.valueLabel}>{Math.round(volume * 100)}%</span>
        </div>
        <div style={styles.sliderContainer}>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            style={{
              ...styles.slider,
              background: `linear-gradient(to right, #00E676 0%, #00E676 ${volume * 100}%, #444466 ${volume * 100}%, #444466 100%)`
            }}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>
          <span>速度</span>
          <span style={styles.valueLabel}>{speed.toFixed(2)}x</span>
        </div>
        <div style={styles.sliderContainer}>
          <input
            type="range"
            min="0.25"
            max="2"
            step="0.05"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            style={{
              ...styles.slider,
              background: `linear-gradient(to right, #00E676 0%, #00E676 ${((speed - 0.25) / 1.75) * 100}%, #444466 ${((speed - 0.25) / 1.75) * 100}%, #444466 100%)`
            }}
          />
        </div>
      </div>

      <div style={styles.section}>
        <div style={styles.sectionLabel}>视角</div>
        <button
          onClick={onResetView}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5A5A7C';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#3A3A5C';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
          style={styles.resetButton}
          title="重置视角"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="1" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="7.05" y2="7.05" />
            <line x1="16.95" y1="16.95" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="7.05" y2="16.95" />
            <line x1="16.95" y1="7.05" x2="19.78" y2="4.22" />
          </svg>
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'absolute',
    bottom: '20px',
    right: '20px',
    background: 'rgba(26, 26, 46, 0.85)',
    backdropFilter: 'blur(10px)',
    borderRadius: '8px',
    padding: '16px',
    color: '#FFFFFF',
    width: '260px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    zIndex: 100,
    animation: 'fadeIn 0.3s ease-out',
    userSelect: 'none'
  },
  title: {
    fontSize: '16px',
    fontWeight: 600,
    marginBottom: '16px',
    background: 'linear-gradient(90deg, #00E676, #FFD54F)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },
  section: {
    marginBottom: '14px'
  },
  sectionLabel: {
    fontSize: '11px',
    color: '#8888AA',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  valueLabel: {
    color: '#00E676',
    fontWeight: 500
  },
  row: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  uploadButton: {
    display: 'flex',
    alignItems: 'center',
    background: '#3A3A5C',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 12px',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 150ms ease'
  },
  scaleRow: {
    display: 'flex',
    gap: '8px'
  },
  scaleButton: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 600,
    transition: 'all 150ms ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  sliderContainer: {
    display: 'flex',
    alignItems: 'center'
  },
  slider: {
    width: '120px',
    height: '4px',
    WebkitAppearance: 'none',
    appearance: 'none',
    borderRadius: '2px',
    outline: 'none',
    cursor: 'pointer'
  },
  resetButton: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: '#3A3A5C',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 150ms ease'
  }
};

export default ControlPanel;
