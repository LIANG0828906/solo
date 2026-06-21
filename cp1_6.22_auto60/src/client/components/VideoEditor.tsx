import React, { useRef, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { CropRange, Transition, TransitionType, VideoMetadata } from '@/types';
import { formatTime, clamp, TRANSITION_LABELS } from '../utils/helpers';
import '../styles/VideoEditor.css';

interface Props {
  videoUrl: string | null;
  metadata: VideoMetadata | null;
  cropRange: CropRange;
  transitions: Transition[];
  onCropChange: (range: CropRange) => void;
  onTransitionsChange: (transitions: Transition[]) => void;
  previewMode: boolean;
  onTimeUpdate?: (time: number) => void;
  onJumpTo?: (time: number) => void;
}

type HandleType = 'start' | 'end' | null;
type TransitionMenuState = { position: number; x: number } | null;

const VideoEditor: React.FC<Props> = ({
  videoUrl,
  metadata,
  cropRange,
  transitions,
  onCropChange,
  onTransitionsChange,
  previewMode,
  onTimeUpdate,
  onJumpTo,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [dragging, setDragging] = useState<HandleType>(null);
  const [dragStartPos, setDragStartPos] = useState(0);
  const [dragStartRange, setDragStartRange] = useState<CropRange>({ start: 0, end: 0 });
  const [transitionMenu, setTransitionMenu] = useState<TransitionMenuState>(null);
  const [videoOpacity, setVideoOpacity] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showUpload, setShowUpload] = useState(false);
  const [activeTransition, setActiveTransition] = useState<string | null>(null);
  const [transitionProgress, setTransitionProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (videoUrl) {
      setVideoOpacity(0);
      const t = setTimeout(() => setVideoOpacity(1), 100);
      return () => clearTimeout(t);
    }
  }, [videoUrl]);

  useEffect(() => {
    if (onJumpTo) {
      (onJumpTo as unknown as { _bound: (t: number) => void })._bound = (t: number) => {
        if (videoRef.current) {
          videoRef.current.currentTime = t;
        }
      };
    }
  }, [onJumpTo]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      if (cropRange.end === 0) {
        onCropChange({ start: 0, end: videoRef.current.duration });
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    setCurrentTime(t);
    onTimeUpdate?.(t);

    if (cropRange.end > 0 && t >= cropRange.end) {
      videoRef.current.currentTime = cropRange.start;
    }

    const now = Date.now();
    let active: string | null = null;
    let progress = 0;
    for (const tr of transitions) {
      const diffMs = (t - tr.position) * 1000;
      if (diffMs >= 0 && diffMs <= 800) {
        active = tr.id;
        progress = diffMs / 800;
        break;
      }
    }
    setActiveTransition(active);
    setTransitionProgress(progress);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      if (currentTime < cropRange.start || currentTime >= cropRange.end) {
        videoRef.current.currentTime = cropRange.start;
      }
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const getTimelineRect = () => timelineRef.current?.getBoundingClientRect();

  const handleMouseDown = (e: React.MouseEvent, type: HandleType) => {
    if (previewMode || !duration) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
    setDragStartPos(e.clientX);
    setDragStartRange({ ...cropRange });
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || !duration) return;
      const rect = getTimelineRect();
      if (!rect) return;
      const deltaX = e.clientX - dragStartPos;
      const deltaTime = (deltaX / rect.width) * duration;

      let { start, end } = dragStartRange;
      if (dragging === 'start') {
        start = clamp(dragStartRange.start + deltaTime, 0, end - 0.5);
      } else if (dragging === 'end') {
        end = clamp(dragStartRange.end + deltaTime, start + 0.5, duration);
      }
      onCropChange({ start, end });
    },
    [dragging, dragStartPos, dragStartRange, duration, onCropChange],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (previewMode || !duration) return;
    const rect = getTimelineRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const time = clamp((x / rect.width) * duration, 0, duration);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  };

  const openTransitionMenu = (e: React.MouseEvent, position: number) => {
    if (previewMode) return;
    e.stopPropagation();
    const rect = getTimelineRect();
    if (!rect) return;
    setTransitionMenu({
      position,
      x: (position / duration) * rect.width,
    });
  };

  const addTransition = (type: TransitionType) => {
    if (!transitionMenu) return;
    const newTransition: Transition = {
      id: uuidv4(),
      position: transitionMenu.position,
      type,
    };
    const existing = transitions.filter((t) => Math.abs(t.position - transitionMenu.position) > 0.1);
    onTransitionsChange([...existing, newTransition]);
    setTransitionMenu(null);
  };

  const removeTransition = (id: string) => {
    onTransitionsChange(transitions.filter((t) => t.id !== id));
  };

  const renderWaveform = () => {
    const bars = 120;
    return (
      <div className="waveform">
        {Array.from({ length: bars }).map((_, i) => {
          const seed = Math.sin(i * 12.9898) * 43758.5453;
          const h = 20 + Math.abs(seed - Math.floor(seed)) * 40;
          const isInRange = duration > 0 && (i / bars) * duration >= cropRange.start && (i / bars) * duration <= cropRange.end;
          return (
            <div
              key={i}
              className={`wave-bar ${isInRange ? 'in-range' : ''}`}
              style={{ height: `${h}%` }}
            />
          );
        })}
      </div>
    );
  };

  const getTransitionStyle = (): React.CSSProperties => {
    if (!activeTransition) return {};
    const tr = transitions.find((t) => t.id === activeTransition);
    if (!tr) return {};
    const p = transitionProgress;
    switch (tr.type) {
      case 'fade':
        return { opacity: 1 - Math.sin(p * Math.PI) * 0.6 };
      case 'flip':
        return { transform: `perspective(1000px) rotateY(${p * 360}deg)` };
      case 'zoom':
        return { transform: `scale(${1 + Math.sin(p * Math.PI) * 0.15})` };
      default:
        return {};
    }
  };

  return (
    <div className={`video-editor ${previewMode ? 'preview-mode' : ''}`}>
      {!videoUrl && (
        <div className="upload-placeholder">
          <div className="upload-icon">🎬</div>
          <p className="upload-text">上传视频开始编辑</p>
          <p className="upload-sub">支持 MP4 / WebM 格式</p>
          {showUpload && (
            <div className="progress-wrapper">
              <div
                className="progress-bar"
                style={{
                  width: `${uploadProgress}%`,
                  background: `linear-gradient(90deg, #0f3460 ${100 - uploadProgress}%, #4ade80 ${100}%)`,
                }}
              />
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm"
            style={{ display: 'none' }}
          />
        </div>
      )}

      {videoUrl && (
        <>
          <div className="video-container">
            <video
              ref={videoRef}
              src={videoUrl}
              className="video-player"
              style={{
                opacity: videoOpacity,
                transition: 'opacity 0.6s ease',
                ...getTransitionStyle(),
              }}
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
              playsInline
            />
            {cropRange.start > 0 && (
              <div className="crop-overlay crop-left" style={{ width: `${(cropRange.start / Math.max(duration, 0.001)) * 100}%` }} />
            )}
            {cropRange.end < duration && (
              <div className="crop-overlay crop-right" style={{ width: `${((duration - cropRange.end) / Math.max(duration, 0.001)) * 100}%` }} />
            )}
            {!isPlaying && !previewMode && (
              <button className="play-overlay" onClick={togglePlay}>
                {isPlaying ? '⏸' : '▶'}
              </button>
            )}
          </div>

          {!previewMode && (
            <div className="video-info">
              <span className="file-name">{metadata?.fileName || ''}</span>
              <span className="duration">时长: {formatTime(duration)}</span>
            </div>
          )}
        </>
      )}

      {videoUrl && !previewMode && (
        <div className="timeline-wrapper" ref={timelineRef} onClick={handleTimelineClick}>
          {renderWaveform()}

          {duration > 0 && (
            <>
              <div
                className="crop-range"
                style={{
                  left: `${(cropRange.start / duration) * 100}%`,
                  width: `${((cropRange.end - cropRange.start) / duration) * 100}%`,
                  transition: dragging ? 'none' : 'all 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                }}
              />

              <div
                className={`playhead ${dragging ? 'dragging' : ''}`}
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />

              <div
                className={`handle handle-start ${dragging === 'start' ? 'active' : ''}`}
                style={{ left: `${(cropRange.start / duration) * 100}%` }}
                onMouseDown={(e) => handleMouseDown(e, 'start')}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="handle-grip" />
                <span className="handle-label">{formatTime(cropRange.start)}</span>
              </div>

              <div
                className={`handle handle-end ${dragging === 'end' ? 'active' : ''}`}
                style={{ left: `${(cropRange.end / duration) * 100}%` }}
                onMouseDown={(e) => handleMouseDown(e, 'end')}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="handle-grip" />
                <span className="handle-label">{formatTime(cropRange.end)}</span>
              </div>

              <div
                className="transition-hotspot transition-start"
                style={{ left: `${(cropRange.start / duration) * 100}%` }}
                onClick={(e) => openTransitionMenu(e, cropRange.start)}
              >
                <span className="hotspot-dot" />
              </div>
              <div
                className="transition-hotspot transition-end"
                style={{ left: `${(cropRange.end / duration) * 100}%` }}
                onClick={(e) => openTransitionMenu(e, cropRange.end)}
              >
                <span className="hotspot-dot" />
              </div>

              {transitions.map((tr) => (
                <div
                  key={tr.id}
                  className="transition-marker"
                  style={{ left: `${(tr.position / duration) * 100}%` }}
                  title={TRANSITION_LABELS[tr.type]}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!previewMode) removeTransition(tr.id);
                  }}
                >
                  <div className={`transition-icon transition-${tr.type}`}>
                    {tr.type === 'fade' && '◐'}
                    {tr.type === 'flip' && '⇄'}
                    {tr.type === 'zoom' && '⊡'}
                  </div>
                  <span className="transition-label">{TRANSITION_LABELS[tr.type]}</span>
                </div>
              ))}

              {transitionMenu && (
                <div className="transition-menu" style={{ left: transitionMenu.x }} onClick={(e) => e.stopPropagation()}>
                  <button className="transition-option" onClick={() => addTransition('fade')}>
                    <span className="option-icon">◐</span>
                    <span className="option-label">淡入淡出</span>
                  </button>
                  <button className="transition-option" onClick={() => addTransition('flip')}>
                    <span className="option-icon">⇄</span>
                    <span className="option-label">翻页</span>
                  </button>
                  <button className="transition-option" onClick={() => addTransition('zoom')}>
                    <span className="option-icon">⊡</span>
                    <span className="option-label">缩放</span>
                  </button>
                  <button className="transition-menu-close" onClick={() => setTransitionMenu(null)}>
                    ✕
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {!previewMode && videoUrl && (
        <div className="editor-controls">
          <button className="control-btn" onClick={togglePlay}>
            {isPlaying ? '⏸ 暂停' : '▶ 播放'}
          </button>
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(cropRange.end)}
          </span>
        </div>
      )}
    </div>
  );
};

export default VideoEditor;
