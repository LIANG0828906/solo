import { useEffect, useRef } from 'react';
import type { ParticleSnapshot } from '@/types';
import { formatTime, lerp, lerpArray } from '@/utils/helpers';

interface TimelineBarProps {
  isRecording: boolean;
  isPlaying: boolean;
  snapshots: ParticleSnapshot[];
  currentFrame: number;
  onRecordToggle: () => void;
  onPlayToggle: () => void;
  onFrameChange: (frame: number, positions: Float32Array, colors: Float32Array) => void;
}

export function TimelineBar({
  isRecording,
  isPlaying,
  snapshots,
  currentFrame,
  onRecordToggle,
  onPlayToggle,
  onFrameChange,
}: TimelineBarProps) {
  const playIntervalRef = useRef<number | null>(null);
  const tempPositions = useRef<Float32Array | null>(null);
  const tempColors = useRef<Float32Array | null>(null);

  const maxFrame = Math.max(0, snapshots.length - 1);
  const totalDuration = snapshots.length > 1 ? snapshots[snapshots.length - 1].timestamp - snapshots[0].timestamp : 0;
  const currentTime = snapshots[currentFrame]
    ? snapshots[currentFrame].timestamp - (snapshots[0]?.timestamp || 0)
    : 0;

  useEffect(() => {
    if (isPlaying && snapshots.length > 1) {
      playIntervalRef.current = window.setInterval(() => {
        if (currentFrame >= maxFrame) {
          onPlayToggle();
          return;
        }
        handleSliderChange(currentFrame + 1);
      }, 100);
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
      }
    };
  }, [isPlaying, currentFrame, maxFrame, snapshots.length]);

  const handleSliderChange = (value: number) => {
    const frame = Math.floor(value);
    if (snapshots.length < 2 || frame < 0 || frame >= snapshots.length) return;

    const nextFrame = Math.min(frame + 1, snapshots.length - 1);
    const t = value - frame;

    const snapA = snapshots[frame];
    const snapB = snapshots[nextFrame];

    if (!tempPositions.current || tempPositions.current.length !== snapA.positions.length) {
      tempPositions.current = new Float32Array(snapA.positions.length);
      tempColors.current = new Float32Array(snapA.colors.length);
    }

    if (t === 0 || frame === nextFrame) {
      tempPositions.current!.set(snapA.positions);
      tempColors.current!.set(snapA.colors);
    } else {
      lerpArray(snapA.positions, snapB.positions, t, tempPositions.current!);
      lerpArray(snapA.colors, snapB.colors, t, tempColors.current!);
    }

    onFrameChange(frame, tempPositions.current!, tempColors.current!);
  };

  return (
    <div className="timeline-bar">
      <div className="timeline-controls">
        <button
          className={`control-btn ${isRecording ? 'recording' : ''}`}
          onClick={onRecordToggle}
          title={isRecording ? '停止录制' : '开始录制'}
        >
          {isRecording ? '■' : '●'}
        </button>

        <button
          className={`control-btn ${isPlaying ? 'active' : ''}`}
          onClick={onPlayToggle}
          disabled={snapshots.length < 2}
          title={isPlaying ? '暂停' : '播放'}
          style={{ opacity: snapshots.length < 2 ? 0.4 : 1, cursor: snapshots.length < 2 ? 'not-allowed' : 'pointer' }}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
      </div>

      <div className="timeline-slider-container">
        <input
          type="range"
          className="timeline-slider"
          min="0"
          max={maxFrame}
          step="0.1"
          value={currentFrame}
          onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
          disabled={snapshots.length < 2}
          style={{ opacity: snapshots.length < 2 ? 0.5 : 1 }}
        />
        <div className="timeline-labels">
          <span>帧 {currentFrame} / {maxFrame}</span>
          <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
        </div>
      </div>

      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', minWidth: '120px', textAlign: 'right' }}>
        {isRecording ? (
          <span style={{ color: '#ff4757', fontWeight: 600 }}>● 录制中</span>
        ) : snapshots.length > 0 ? (
          <span>{snapshots.length} 个快照</span>
        ) : (
          <span>点击录制开始创作</span>
        )}
      </div>
    </div>
  );
}
