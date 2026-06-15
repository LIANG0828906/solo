import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PixelArray,
  CANVAS_SIZE,
  deepClonePixels,
  createEmptyPixelArray,
  renderPixelsToCanvas,
} from '../../utils/pixelUtils';

interface TimelineProps {
  frames: PixelArray[];
  currentFrameIndex: number;
  frameInterval: number;
  isPlaying: boolean;
  onFramesChange: (frames: PixelArray[]) => void;
  onCurrentFrameChange: (index: number) => void;
  onFrameIntervalChange: (interval: number) => void;
  onIsPlayingChange: (playing: boolean) => void;
}

const THUMBNAIL_SIZE = 64;
const THUMB_CELL = THUMBNAIL_SIZE / CANVAS_SIZE;

const Timeline: React.FC<TimelineProps> = ({
  frames,
  currentFrameIndex,
  frameInterval,
  isPlaying,
  onFramesChange,
  onCurrentFrameChange,
  onFrameIntervalChange,
  onIsPlayingChange,
}) => {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [fadeOpacity, setFadeOpacity] = useState(1);
  const playStartTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const [progress, setProgress] = useState(0);

  const playLoop = useCallback(() => {
    if (!isPlaying || frames.length === 0) return;
    const now = performance.now();
    const elapsed = now - playStartTimeRef.current;
    const totalDuration = frames.length * frameInterval;
    const p = (elapsed % totalDuration) / totalDuration;
    setProgress(p);

    const frameIdx = Math.min(
      Math.floor((elapsed % totalDuration) / frameInterval),
      frames.length - 1
    );

    if (frameIdx !== currentFrameIndex) {
      setFadeOpacity(0);
      requestAnimationFrame(() => {
        onCurrentFrameChange(frameIdx);
        setTimeout(() => setFadeOpacity(1), 10);
      });
    }

    rafRef.current = requestAnimationFrame(playLoop);
  }, [isPlaying, frames.length, frameInterval, currentFrameIndex, onCurrentFrameChange]);

  useEffect(() => {
    if (isPlaying) {
      playStartTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(playLoop);
    } else {
      cancelAnimationFrame(rafRef.current);
      setProgress(0);
      setFadeOpacity(1);
    }
    return () => cancelAnimationFrame(rafRef.current);
  }, [isPlaying, playLoop]);

  const addFrame = () => {
    const newFrames = [...frames, createEmptyPixelArray()];
    onFramesChange(newFrames);
    onCurrentFrameChange(newFrames.length - 1);
  };

  const duplicateFrame = (index: number) => {
    const newFrames = [
      ...frames.slice(0, index + 1),
      deepClonePixels(frames[index]),
      ...frames.slice(index + 1),
    ];
    onFramesChange(newFrames);
  };

  const deleteFrame = (index: number) => {
    if (frames.length <= 1) return;
    const newFrames = frames.filter((_, i) => i !== index);
    onFramesChange(newFrames);
    if (currentFrameIndex >= newFrames.length) {
      onCurrentFrameChange(newFrames.length - 1);
    } else if (currentFrameIndex === index) {
      onCurrentFrameChange(Math.max(0, index - 1));
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const newFrames = [...frames];
    const [moved] = newFrames.splice(dragIndex, 1);
    newFrames.splice(index, 0, moved);
    onFramesChange(newFrames);
    setDragIndex(null);
    setDragOverIndex(null);
  };



  return (
    <div style={styles.timelinePanel}>
      <div style={styles.controlsRow}>
        <div style={styles.playControls}>
          <button
            style={styles.playBtn}
            onClick={() => onIsPlayingChange(!isPlaying)}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            style={styles.stepBtn}
            onClick={() => {
              if (frames.length === 0) return;
              const next = (currentFrameIndex + 1) % frames.length;
              onCurrentFrameChange(next);
            }}
            title="下一帧"
          >
            ⏭
          </button>
          <button
            style={styles.stepBtn}
            onClick={() => {
              if (frames.length === 0) return;
              const prev = (currentFrameIndex - 1 + frames.length) % frames.length;
              onCurrentFrameChange(prev);
            }}
            title="上一帧"
          >
            ⏮
          </button>
        </div>

        <div style={styles.intervalControl}>
          <label style={styles.intervalLabel}>帧间隔</label>
          <input
            type="range"
            min={100}
            max={500}
            step={10}
            value={frameInterval}
            onChange={(e) => onFrameIntervalChange(Number(e.target.value))}
            style={styles.intervalSlider}
          />
          <span style={styles.intervalValue}>{frameInterval}ms</span>
        </div>

        <div style={{ flex: 1 }} />

        <button style={styles.addFrameBtn} onClick={addFrame}>
          ＋ 添加帧
        </button>
      </div>

      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressLine,
            left: `${progress * 100}%`,
            opacity: isPlaying ? 1 : 0,
          }}
        />
        <div style={styles.framesContainer}>
          {frames.map((frame, idx) => (
            <FrameThumbnail
              key={idx}
              index={idx}
              pixels={frame}
              isSelected={idx === currentFrameIndex}
              isPlaying={isPlaying && idx === currentFrameIndex}
              isDragging={dragIndex === idx}
              isDragOver={dragOverIndex === idx && dragIndex !== idx}
              onSelect={() => {
                if (!isPlaying) onCurrentFrameChange(idx);
              }}
              onDuplicate={() => duplicateFrame(idx)}
              onDelete={() => deleteFrame(idx)}
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={(e) => handleDrop(e, idx)}
              onDragEnd={() => {
                setDragIndex(null);
                setDragOverIndex(null);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface FrameThumbnailProps {
  index: number;
  pixels: PixelArray;
  isSelected: boolean;
  isPlaying: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
}

const FrameThumbnail: React.FC<FrameThumbnailProps> = ({
  index,
  pixels,
  isSelected,
  isPlaying,
  isDragging,
  isDragOver,
  onSelect,
  onDuplicate,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    ctx.fillStyle = '#1a1a20';
    ctx.fillRect(0, 0, THUMBNAIL_SIZE, THUMBNAIL_SIZE);
    renderPixelsToCanvas(ctx, pixels, THUMB_CELL);
  }, [pixels]);

  return (
    <div
      style={{
        ...styles.frameItem,
        ...(isSelected ? styles.frameItemSelected : {}),
        ...(isPlaying ? styles.frameItemPlaying : {}),
        ...(isDragging ? styles.frameItemDragging : {}),
        ...(isDragOver ? styles.frameItemDragOver : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        style={{
          ...styles.frameLabel,
          ...(isSelected ? styles.frameLabelSelected : {}),
        }}
        className={isSelected ? 'frame-selected-anim' : ''}
        draggable
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={onSelect}
      >
        <div style={{
          ...styles.frameIndex,
          ...(isSelected ? styles.frameIndexSelected : {}),
        }}>帧 {index + 1}</div>
        <canvas
          ref={canvasRef}
          width={THUMBNAIL_SIZE}
          height={THUMBNAIL_SIZE}
          style={styles.thumbCanvas}
        />
      </div>
      {hover && (
        <div style={styles.frameActions}>
          <button style={styles.frameActionBtn} onClick={onDuplicate} title="复制帧">
            ⎘
          </button>
          <button style={{ ...styles.frameActionBtn, color: '#ff6b6b' }} onClick={onDelete} title="删除帧">
            ✕
          </button>
        </div>
      )}
      {isPlaying && <div style={styles.playingGlow} />}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  timelinePanel: {
    background:
      'linear-gradient(180deg, rgba(35, 35, 42, 0.85) 0%, rgba(25, 25, 32, 0.9) 100%)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    borderTop: '1px solid rgba(0, 212, 255, 0.3)',
    padding: '14px 20px 18px',
    position: 'relative',
    boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.4)',
  },
  controlsRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginBottom: 14,
  },
  playControls: {
    display: 'flex',
    gap: 8,
  },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: '2px solid #00d4ff',
    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(0, 212, 255, 0.05))',
    color: '#00d4ff',
    fontSize: 18,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 0 15px rgba(0, 212, 255, 0.3)',
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    border: '1px solid rgba(0, 212, 255, 0.4)',
    background: 'rgba(40, 40, 50, 0.6)',
    color: '#c0c0c0',
    fontSize: 14,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    transition: 'all 0.2s ease',
  },
  intervalControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 14px',
    background: 'rgba(30, 30, 38, 0.6)',
    borderRadius: 8,
    border: '1px solid rgba(0, 212, 255, 0.2)',
  },
  intervalLabel: {
    fontSize: 12,
    color: '#888',
    fontFamily: "'JetBrains Mono', monospace",
  },
  intervalSlider: {
    width: 140,
    accentColor: '#00d4ff',
    cursor: 'pointer',
  },
  intervalValue: {
    fontSize: 12,
    color: '#00d4ff',
    fontFamily: "'JetBrains Mono', monospace",
    minWidth: 55,
    textAlign: 'right',
  },
  addFrameBtn: {
    padding: '9px 18px',
    borderRadius: 6,
    border: '1px dashed rgba(0, 212, 255, 0.5)',
    background: 'rgba(0, 212, 255, 0.08)',
    color: '#00d4ff',
    fontSize: 13,
    cursor: 'pointer',
    fontFamily: "'JetBrains Mono', monospace",
    transition: 'all 0.2s ease',
  },
  progressTrack: {
    position: 'relative',
    height: THUMBNAIL_SIZE + 32,
    background: 'rgba(15, 15, 20, 0.4)',
    borderRadius: 8,
    padding: '8px 12px',
    border: '1px solid rgba(0, 212, 255, 0.15)',
    overflow: 'hidden',
  },
  progressLine: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: 2,
    background: 'linear-gradient(180deg, transparent, #ffff00, #ffff00, transparent)',
    boxShadow: '0 0 8px rgba(255, 255, 0, 0.8)',
    zIndex: 10,
    transition: 'left linear',
    pointerEvents: 'none',
  },
  framesContainer: {
    display: 'flex',
    gap: 12,
    height: '100%',
    alignItems: 'center',
    padding: '4px 0',
  },
  frameItem: {
    position: 'relative',
    flexShrink: 0,
    transition: 'all 0.2s ease',
  },
  frameItemSelected: {
    transform: 'translateY(-2px)',
  },
  frameItemPlaying: {},
  frameItemDragging: {
    opacity: 0.4,
  },
  frameItemDragOver: {
    transform: 'translateX(8px) scale(1.02)',
  },
  frameLabel: {
    cursor: 'pointer',
    borderRadius: 10,
    border: '2px solid rgba(255, 255, 255, 0.1)',
    padding: '6px 6px 4px',
    background: 'rgba(20, 20, 26, 0.8)',
    transition: 'all 0.2s ease',
  },
  frameLabelSelected: {
    border: '2px solid #00d4ff',
    background: 'rgba(0, 212, 255, 0.05)',
    boxShadow:
      '0 0 10px rgba(0, 212, 255, 0.6), inset 0 0 8px rgba(0, 212, 255, 0.1)',
  },
  frameIndex: {
    fontSize: 10,
    color: '#777',
    textAlign: 'center',
    marginBottom: 4,
    fontFamily: "'JetBrains Mono', monospace",
  },
  frameIndexSelected: {
    color: '#00d4ff',
    textShadow: '0 0 6px rgba(0, 212, 255, 0.8)',
  },
  thumbCanvas: {
    display: 'block',
    borderRadius: 4,
    // @ts-ignore - cross-browser pixel rendering
    imageRendering: 'pixelated',
  },
  frameActions: {
    position: 'absolute',
    top: -4,
    right: -4,
    display: 'flex',
    gap: 2,
    zIndex: 20,
  },
  frameActionBtn: {
    width: 22,
    height: 22,
    borderRadius: 4,
    border: '1px solid rgba(0, 212, 255, 0.5)',
    background: 'rgba(20, 20, 30, 0.95)',
    color: '#00d4ff',
    fontSize: 11,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    lineHeight: 1,
  },
  playingGlow: {
    position: 'absolute',
    inset: -4,
    borderRadius: 14,
    background:
      'radial-gradient(circle, rgba(255,235,59,0.25) 0%, transparent 70%)',
    pointerEvents: 'none',
    animation: 'pulse 1.2s ease-in-out infinite',
  },
};

export default Timeline;
