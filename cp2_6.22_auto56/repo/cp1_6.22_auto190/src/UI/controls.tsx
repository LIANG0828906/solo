import React from 'react';

type DisplayMode = 'particles' | 'waveform' | 'mixed';

interface ControlsProps {
  onFileSelect: (file: File) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  displayMode: DisplayMode;
  onModeChange: (mode: DisplayMode) => void;
  currentTime: number;
  duration: number;
  fileName: string;
}

const formatTime = (seconds: number): string => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

export default function Controls({
  onFileSelect,
  isPlaying,
  onTogglePlay,
  displayMode,
  onModeChange,
  currentTime,
  duration,
  fileName,
}: ControlsProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
  };

  const modes: DisplayMode[] = ['particles', 'waveform', 'mixed'];
  const modeLabels: Record<DisplayMode, string> = {
    particles: 'Particles',
    waveform: 'Waveform',
    mixed: 'Mixed',
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <>
      <div style={panelStyle}>
        <label style={uploadBtnStyle}>
          ▲ Upload Audio
          <input
            type="file"
            accept=".mp3,.wav,audio/mpeg,audio/wav"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </label>

        {fileName && (
          <div style={fileNameStyle}>{fileName}</div>
        )}

        <div style={btnGroupStyle}>
          {modes.map((mode) => (
            <button
              key={mode}
              onClick={() => onModeChange(mode)}
              style={{
                ...modeBtnStyle,
                ...(displayMode === mode ? modeBtnActiveStyle : {}),
              }}
            >
              {modeLabels[mode]}
            </button>
          ))}
        </div>

        {fileName && (
          <button onClick={onTogglePlay} style={playBtnStyle}>
            {isPlaying ? '⏸ Pause' : '▶ Play'}
          </button>
        )}
      </div>

      {duration > 0 && (
        <div style={progressContainerStyle}>
          <div style={progressTrackStyle}>
            <div
              style={{
                ...progressFillStyle,
                width: `${progress}%`,
              }}
            />
          </div>
          <span style={timeLabelStyle}>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
      )}
    </>
  );
}

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  left: 20,
  zIndex: 100,
  background: 'rgba(0, 0, 0, 0.6)',
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  minWidth: 200,
  backdropFilter: 'blur(10px)',
};

const glassBtnBase: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  borderRadius: 8,
  color: '#fff',
  cursor: 'pointer',
  fontFamily: 'system-ui, sans-serif',
  transition: 'all 0.3s ease',
};

const uploadBtnStyle: React.CSSProperties = {
  ...glassBtnBase,
  padding: '10px 16px',
  fontSize: 14,
  textAlign: 'center' as const,
  display: 'block',
};

const fileNameStyle: React.CSSProperties = {
  color: '#aaa',
  fontSize: 12,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  maxWidth: 180,
};

const btnGroupStyle: React.CSSProperties = {
  display: 'flex',
  gap: 4,
};

const modeBtnStyle: React.CSSProperties = {
  ...glassBtnBase,
  padding: '6px 10px',
  fontSize: 12,
  flex: 1,
};

const modeBtnActiveStyle: React.CSSProperties = {
  background: 'rgba(255, 255, 255, 0.25)',
  border: '1px solid rgba(255, 255, 255, 0.4)',
};

const playBtnStyle: React.CSSProperties = {
  ...glassBtnBase,
  padding: '8px 16px',
  fontSize: 14,
  width: '100%',
};

const progressContainerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 20,
  right: 20,
  zIndex: 100,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: 6,
};

const progressTrackStyle: React.CSSProperties = {
  width: 300,
  height: 6,
  background: '#333',
  borderRadius: 3,
  overflow: 'hidden',
};

const progressFillStyle: React.CSSProperties = {
  height: '100%',
  background: '#FF6B35',
  borderRadius: 3,
  transition: 'width 0.1s linear',
};

const timeLabelStyle: React.CSSProperties = {
  color: '#AAA',
  fontSize: 14,
  fontFamily: 'monospace',
};
