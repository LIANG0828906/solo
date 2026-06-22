import React, { useRef, useState, useCallback } from 'react';

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
  onSeek?: (progress: number) => void;
  onClearRecording: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
}

function validateRecordingData(data: unknown): data is RecordingData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.strokes)) return false;
  if (typeof d.startTime !== 'number') return false;
  if (typeof d.endTime !== 'number') return false;
  for (const stroke of d.strokes) {
    if (typeof stroke !== 'object' || stroke === null) return false;
    const s = stroke as Record<string, unknown>;
    if (typeof s.strokeId !== 'string') return false;
    if (typeof s.userId !== 'string') return false;
    if (!Array.isArray(s.points)) return false;
    for (const pt of s.points) {
      if (typeof pt !== 'object' || pt === null) return false;
      const p = pt as Record<string, unknown>;
      if (typeof p.x !== 'number') return false;
      if (typeof p.y !== 'number') return false;
      if (typeof p.color !== 'string') return false;
      if (typeof p.size !== 'number') return false;
      if (typeof p.timestamp !== 'number') return false;
    }
  }
  return true;
}

export default function PlaybackController({
  isRecording,
  onToggleRecording,
  recordedData,
  onExport,
  onImport,
  isPlaying,
  onTogglePlayback,
  playbackProgress,
  onSeek,
  onClearRecording,
  playbackSpeed,
  onSpeedChange,
}: PlaybackControllerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const hasData = recordedData !== null && recordedData.strokes.length > 0;
  const clampedProgress = Math.min(1, Math.max(0, playbackProgress));

  const handleSeek = useCallback(
    (clientX: number) => {
      if (!trackRef.current || !onSeek) return;
      const rect = trackRef.current.getBoundingClientRect();
      const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
      onSeek(ratio);
    },
    [onSeek]
  );

  const handleTrackMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek) return;
    setIsDragging(true);
    handleSeek(e.clientX);
  };

  React.useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      handleSeek(e.clientX);
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleSeek]);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        if (validateRecordingData(raw)) {
          onImport(raw);
        } else {
          console.error('Invalid recording data format');
        }
      } catch (err) {
        console.error('Failed to import recording:', err);
      }
    };
    reader.readAsText(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const progressColor = isRecording ? 'var(--progress-recording)' : 'var(--progress-playing)';

  const SPEED_OPTIONS = [1, 2, 5, 10];

  return (
    <div className="playback-controller">
      <div className="progress-container">
        <div
          ref={trackRef}
          className={`progress-track ${onSeek ? 'interactive' : ''}`}
          onMouseDown={handleTrackMouseDown}
        >
          <div
            className="progress-fill"
            style={{
              width: `${clampedProgress * 100}%`,
              backgroundColor: progressColor,
            }}
          />
          {onSeek && (
            <div
              className="progress-handle"
              style={{
                left: `${clampedProgress * 100}%`,
                backgroundColor: progressColor,
              }}
            />
          )}
        </div>
        <span className="progress-text">{Math.round(clampedProgress * 100)}%</span>
      </div>

      <div className="playback-buttons">
        <button
          className={`pb-btn pb-btn-record ${isRecording ? 'recording' : ''}`}
          onClick={onToggleRecording}
        >
          <span className="record-dot" />
          {isRecording ? '停止录制' : '开始录制'}
        </button>

        <button
          className="pb-btn"
          onClick={onTogglePlayback}
          disabled={!hasData}
        >
          {isPlaying ? '⏸ 暂停' : `▶ 回放 (${playbackSpeed}x)`}
        </button>

        <div className="speed-selector">
          {SPEED_OPTIONS.map((speed) => (
            <button
              key={speed}
              className={`speed-btn ${playbackSpeed === speed ? 'active' : ''}`}
              onClick={() => onSpeedChange(speed)}
              disabled={isPlaying}
            >
              {speed}x
            </button>
          ))}
        </div>

        <button className="pb-btn" onClick={onExport} disabled={!hasData}>
          ⬇ 导出 JSON
        </button>

        <button className="pb-btn" onClick={handleImportClick}>
          ⬆ 导入 JSON
        </button>

        <button className="pb-btn" onClick={onClearRecording} disabled={!hasData}>
          ✕ 清除录制
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden-file-input"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
