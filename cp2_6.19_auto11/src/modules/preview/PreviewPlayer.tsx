import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipBack, SkipForward } from 'lucide-react';
import type { Clip, Transition, Material } from '../../types';
import { formatTime, clamp } from '../../utils/time';
import { usePlayerControls } from '../../hooks/usePlayerControls';
import './PreviewPlayer.css';

interface PreviewPlayerProps {
  clips: Clip[];
  transitions: Transition[];
  materials: Material[];
  currentTime: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onTimeChange: (time: number) => void;
}

const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  clips,
  transitions,
  materials,
  currentTime,
  isPlaying,
  onPlay,
  onPause,
  onTimeChange,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    getTotalDuration,
    getClipAtTime,
    getTransitionAtTime,
    getCurrentVideoElement,
    getVideoElement,
    preloadVideo,
    cleanup,
  } = usePlayerControls({
    clips,
    transitions,
    materials,
    currentTime,
    isPlaying,
    onTimeChange,
    onPlay,
    onPause,
  });

  useEffect(() => {
    clips.forEach(clip => {
      preloadVideo(clip.materialId);
    });
  }, [clips, preloadVideo]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const renderFrame = () => {
      const video = getCurrentVideoElement();
      const transition = getTransitionAtTime(currentTime);

      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (video && video.readyState >= 2) {
        const clip = getClipAtTime(currentTime);
        if (clip) {
          const displayWidth = canvas.width;
          const displayHeight = canvas.height;
          const videoRatio = video.videoWidth / video.videoHeight;
          const canvasRatio = displayWidth / displayHeight;

          let drawWidth, drawHeight, drawX, drawY;
          if (videoRatio > canvasRatio) {
            drawHeight = displayHeight;
            drawWidth = drawHeight * videoRatio;
            drawX = (displayWidth - drawWidth) / 2;
            drawY = 0;
          } else {
            drawWidth = displayWidth;
            drawHeight = drawWidth / videoRatio;
            drawX = 0;
            drawY = (displayHeight - drawHeight) / 2;
          }

          if (transition) {
            const fromClip = clips.find(c => c.id === transition.fromClipId);
            const toClip = clips.find(c => c.id === transition.toClipId);
            if (fromClip && toClip) {
              const transitionStart = fromClip.endTime - transition.duration;
              const progress = (currentTime - transitionStart) / transition.duration;
              const easedProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress);

              ctx.globalAlpha = 1 - easedProgress;
              ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);

              const nextVideo = getVideoElement(toClip.materialId);
              if (nextVideo && nextVideo.readyState >= 2) {
                ctx.globalAlpha = easedProgress;

                if (transition.type === 'slide') {
                  const offset = displayWidth * (1 - easedProgress);
                  ctx.drawImage(nextVideo, drawX - offset, drawY, drawWidth, drawHeight);
                } else if (transition.type === 'zoom') {
                  const scale = 1 + (1 - easedProgress) * 0.3;
                  const scaledWidth = drawWidth * scale;
                  const scaledHeight = drawHeight * scale;
                  const scaledX = drawX - (scaledWidth - drawWidth) / 2;
                  const scaledY = drawY - (scaledHeight - drawHeight) / 2;
                  ctx.drawImage(nextVideo, scaledX, scaledY, scaledWidth, scaledHeight);
                } else {
                  ctx.drawImage(nextVideo, drawX, drawY, drawWidth, drawHeight);
                }
              }
              ctx.globalAlpha = 1;
            }
          } else {
            ctx.drawImage(video, drawX, drawY, drawWidth, drawHeight);
          }
        }
      }

      animationId = requestAnimationFrame(renderFrame);
    };

    renderFrame();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [currentTime, getCurrentVideoElement, getClipAtTime, getTransitionAtTime, clips]);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
      }
    }, 3000);
  }, [isPlaying]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const newTime = progress * getTotalDuration();
    onTimeChange(clamp(newTime, 0, getTotalDuration()));
  }, [getTotalDuration, onTimeChange]);

  const handleSkipBack = useCallback(() => {
    const newTime = clamp(currentTime - 5, 0, getTotalDuration());
    onTimeChange(newTime);
  }, [currentTime, getTotalDuration, onTimeChange]);

  const handleSkipForward = useCallback(() => {
    const newTime = clamp(currentTime + 5, 0, getTotalDuration());
    onTimeChange(newTime);
  }, [currentTime, getTotalDuration, onTimeChange]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const totalDuration = getTotalDuration();
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div 
      className="preview-player"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="preview-canvas"
      />

      {clips.length === 0 && (
        <div className="preview-placeholder">
          <Play size={64} opacity={0.3} />
          <p>拖拽素材到时间线开始预览</p>
        </div>
      )}

      <div className={`player-controls ${showControls ? 'visible' : ''}`}>
        <div className="progress-container">
          <div
            className="progress-bar"
            onClick={handleProgressClick}
          >
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
            <div
              className="progress-handle"
              style={{ left: `${progress}%` }}
            />
          </div>
        </div>

        <div className="controls-row">
          <div className="controls-left">
            <button
              className="control-btn"
              onClick={handleSkipBack}
              title="后退5秒"
            >
              <SkipBack size={20} />
            </button>

            <button
              className="control-btn play-btn"
              onClick={isPlaying ? onPause : onPlay}
              disabled={clips.length === 0}
              title={isPlaying ? '暂停' : '播放'}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </button>

            <button
              className="control-btn"
              onClick={handleSkipForward}
              title="前进5秒"
            >
              <SkipForward size={20} />
            </button>

            <div className="volume-control">
              <button
                className="control-btn"
                onClick={() => setIsMuted(!isMuted)}
                title={isMuted ? '取消静音' : '静音'}
              >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  setVolume(Number(e.target.value));
                  if (Number(e.target.value) > 0) setIsMuted(false);
                }}
                className="volume-slider"
              />
            </div>

            <span className="time-display">
              {formatTime(currentTime)} / {formatTime(totalDuration)}
            </span>
          </div>

          <div className="controls-right">
            <button
              className="control-btn"
              onClick={toggleFullscreen}
              title="全屏"
            >
              <Maximize2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PreviewPlayer);
