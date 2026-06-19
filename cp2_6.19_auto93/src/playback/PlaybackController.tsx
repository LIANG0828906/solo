import React, { useRef } from 'react';

export type DrawPoint = {
  x: number;
  y: number;
  color: string;
  size: number;
  timestamp: number;
};

export type RecordingData = {
  strokes: { strokeId: string; userId: string; points: DrawPoint[] }[];
  startTime: number;
  endTime: number;
};

interface PlaybackControllerProps {
  isRecording: boolean;
  onToggleRecording: () => void;
  recordedData: RecordingData | null;
  onExport: () => void;
  onImport: (data: RecordingData) => void;
  isPlaying: boolean;
  onTogglePlayback: () => void;
  playbackProgress: number;
  onClearRecording: () => void;
}

const buttonBaseStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '8px',
  border: 'none',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'background-color 150ms ease-out',
  color: '#374151',
  backgroundColor: '#f3f4f6',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
};

const buttonHoverStyle = {
  backgroundColor: '#e5e7eb',
};

export default function PlaybackController({
  isRecording,
  onToggleRecording,
  recordedData,
  onExport,
  onImport,
  isPlaying,
  onTogglePlayback,
  playbackProgress,
  onClearRecording,
}: PlaybackControllerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as RecordingData;
        onImport(data);
      } catch (err) {
        console.error('Failed to import recording:', err);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      style={{
        backgroundColor: '#ffffff',
        color: '#374151',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: '#e5e7eb',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, playbackProgress * 100))}%`,
            backgroundColor: isRecording ? '#ef4444' : '#3b82f6',
            transition: 'width 100ms linear',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          onClick={onToggleRecording}
          style={{
            ...buttonBaseStyle,
            backgroundColor: isRecording ? '#fee2e2' : '#f3f4f6',
            color: isRecording ? '#dc2626' : '#374151',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = isRecording ? '#fecaca' : buttonHoverStyle.backgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = isRecording ? '#fee2e2' : buttonBaseStyle.backgroundColor;
          }}
        >
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isRecording ? '#ef4444' : '#9ca3af',
              display: 'inline-block',
              animation: isRecording ? 'pulse 1s infinite' : 'none',
            }}
          />
          {isRecording ? '停止录制' : '开始录制'}
        </button>

        <button
          onClick={onTogglePlayback}
          disabled={!recordedData || recordedData.strokes.length === 0}
          style={{
            ...buttonBaseStyle,
            opacity: !recordedData || recordedData.strokes.length === 0 ? 0.5 : 1,
            cursor: !recordedData || recordedData.strokes.length === 0 ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (recordedData && recordedData.strokes.length > 0) {
              e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = buttonBaseStyle.backgroundColor;
          }}
        >
          {isPlaying ? '⏸ 暂停' : '▶ 回放 (5x)'}
        </button>

        <button
          onClick={onExport}
          disabled={!recordedData || recordedData.strokes.length === 0}
          style={{
            ...buttonBaseStyle,
            opacity: !recordedData || recordedData.strokes.length === 0 ? 0.5 : 1,
            cursor: !recordedData || recordedData.strokes.length === 0 ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (recordedData && recordedData.strokes.length > 0) {
              e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = buttonBaseStyle.backgroundColor;
          }}
        >
          ⬇ 导出
        </button>

        <button
          onClick={handleImportClick}
          style={buttonBaseStyle}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = buttonBaseStyle.backgroundColor;
          }}
        >
          ⬆ 导入
        </button>

        <button
          onClick={onClearRecording}
          disabled={!recordedData || recordedData.strokes.length === 0}
          style={{
            ...buttonBaseStyle,
            opacity: !recordedData || recordedData.strokes.length === 0 ? 0.5 : 1,
            cursor: !recordedData || recordedData.strokes.length === 0 ? 'not-allowed' : 'pointer',
          }}
          onMouseEnter={(e) => {
            if (recordedData && recordedData.strokes.length > 0) {
              e.currentTarget.style.backgroundColor = buttonHoverStyle.backgroundColor;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = buttonBaseStyle.backgroundColor;
          }}
        >
          ✕ 清除
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
