import { useState, useEffect, useRef, useCallback } from 'react';
import type { Shot } from '../api';
import '../styles/shotboard.css';

interface PreviewPlayerProps {
  shots: Shot[];
}

function PreviewPlayer({ shots }: PreviewPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const pausedProgressRef = useRef<number>(0);

  const totalDuration = shots.reduce((sum, shot) => sum + shot.duration, 0);

  const getCurrentShotIndex = (progressValue: number): number => {
    let elapsed = progressValue * totalDuration;
    for (let i = 0; i < shots.length; i++) {
      if (elapsed < shots[i].duration) {
        return i;
      }
      elapsed -= shots[i].duration;
    }
    return Math.max(0, shots.length - 1);
  };

  const animate = useCallback((timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp - pausedProgressRef.current * totalDuration * 1000;
    }

    const elapsed = (timestamp - startTimeRef.current) / 1000;
    const newProgress = Math.min(1, elapsed / totalDuration);

    setProgress(newProgress);
    setCurrentIndex(getCurrentShotIndex(newProgress));

    if (newProgress >= 1) {
      setIsPlaying(false);
      setProgress(1);
      setCurrentIndex(shots.length - 1);
      startTimeRef.current = 0;
      pausedProgressRef.current = 0;
      return;
    }

    animationRef.current = requestAnimationFrame(animate);
  }, [shots, totalDuration]);

  useEffect(() => {
    if (isPlaying && shots.length > 0) {
      animationRef.current = requestAnimationFrame(animate);
    } else if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, animate, shots.length]);

  useEffect(() => {
    setCurrentIndex(0);
    setProgress(0);
    setIsPlaying(false);
    startTimeRef.current = 0;
    pausedProgressRef.current = 0;
  }, [shots]);

  const handlePlayPause = () => {
    if (shots.length === 0) return;

    if (isPlaying) {
      setIsPlaying(false);
      pausedProgressRef.current = progress;
      startTimeRef.current = 0;
    } else {
      if (progress >= 1) {
        setProgress(0);
        setCurrentIndex(0);
        pausedProgressRef.current = 0;
      }
      setIsPlaying(true);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentIndex(0);
    startTimeRef.current = 0;
    pausedProgressRef.current = 0;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shots.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newProgress = Math.max(0, Math.min(1, clickX / rect.width));
    setProgress(newProgress);
    setCurrentIndex(getCurrentShotIndex(newProgress));
    pausedProgressRef.current = newProgress;
    startTimeRef.current = 0;
    if (isPlaying) {
      setIsPlaying(false);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const currentShot = shots[currentIndex];
  const isEnded = progress >= 1 && shots.length > 0;

  const getDurationGradient = (duration: number) => {
    const minDuration = 0.5;
    const maxDuration = 5;
    const t = Math.min(1, Math.max(0, (duration - minDuration) / (maxDuration - minDuration)));
    const hue = 200 - t * 40;
    const saturation = 60 + t * 20;
    const lightness = 35 + t * 10;
    return `linear-gradient(135deg, hsl(${hue}, ${saturation}%, ${lightness}%) 0%, hsl(${hue - 15}, ${saturation + 10}%, ${lightness - 8}%) 100%)`;
  };

  return (
    <div className={`preview-player ${isFullscreen ? 'fullscreen' : ''}`} ref={containerRef}>
      <div className="preview-display">
        {shots.length === 0 ? (
          <div className="preview-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9l6 3-6 3V9z" fill="currentColor" />
            </svg>
            <p>添加镜头开始预览</p>
          </div>
        ) : (
          <>
            <div
              className="preview-frame"
              style={{
                background: currentShot ? getDurationGradient(currentShot.duration) : '#2c3e50',
              }}
            >
              {currentShot?.imageUrl ? (
                <img src={currentShot.imageUrl} alt="" className="preview-image" />
              ) : (
                <div className="preview-shot-number">
                  镜头 {currentIndex + 1} / {shots.length}
                </div>
              )}
            </div>
            <div className="preview-description">
              <p>{currentShot?.description || '暂无描述'}</p>
            </div>

            {isEnded && (
              <div className="preview-ended-overlay">
                <div className="ended-content">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <p>播放结束</p>
                  <button className="replay-btn" onClick={handleReset}>
                    重新播放
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="preview-controls">
        <div className="progress-bar-container" onClick={handleProgressClick}>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <div
            className="progress-thumb"
            style={{ left: `${progress * 100}%` }}
          />
        </div>

        <div className="controls-row">
          <button
            className="control-btn play-btn"
            onClick={handlePlayPause}
            disabled={shots.length === 0}
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            )}
          </button>

          <button
            className="control-btn"
            onClick={handleReset}
            disabled={shots.length === 0}
            title="重新播放"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </button>

          <div className="time-display">
            <span className="current-time">
              {(progress * totalDuration).toFixed(1)}s
            </span>
            <span className="time-separator">/</span>
            <span className="total-time">{totalDuration.toFixed(1)}s</span>
          </div>

          <div className="shot-indicator">
            {shots.length > 0 ? `${currentIndex + 1} / ${shots.length}` : '-'}
          </div>

          <button
            className="control-btn"
            onClick={toggleFullscreen}
            title="全屏"
          >
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PreviewPlayer;
