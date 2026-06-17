import { useEffect, useRef, useState, useCallback } from 'react';
import { useAppStore, getCurrentSprite, getCurrentAnimation } from './store';
import { spriteManager } from './SpriteManager';

const CHECKER_SIZE = 16;
const CHECKER_COLOR_1 = '#404040';
const CHECKER_COLOR_2 = '#505050';
const GRID_COLOR = 'rgba(51, 51, 51, 0.5)';

export function Previewer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const frameTimerRef = useRef<number>(0);

  const [canvasSize, setCanvasSize] = useState(384);
  const [showShortcuts, setShowShortcuts] = useState(true);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentSprite = useAppStore(getCurrentSprite);
  const currentAnimation = useAppStore(getCurrentAnimation);
  const currentFrameIndex = useAppStore((state) => state.currentFrameIndex);
  const isPlaying = useAppStore((state) => state.isPlaying);
  const playSpeed = useAppStore((state) => state.playSpeed);
  const zoom = useAppStore((state) => state.zoom);
  const isLoading = useAppStore((state) => state.isLoading);
  const setCurrentFrameIndex = useAppStore((state) => state.setCurrentFrameIndex);
  const setIsPlaying = useAppStore((state) => state.setIsPlaying);
  const nextFrame = useAppStore((state) => state.nextFrame);
  const prevFrame = useAppStore((state) => state.prevFrame);
  const setPlaySpeed = useAppStore((state) => state.setPlaySpeed);
  const setZoom = useAppStore((state) => state.setZoom);

  const resetFadeTimer = useCallback(() => {
    setShowShortcuts(true);
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
    }
    fadeTimerRef.current = setTimeout(() => {
      setShowShortcuts(false);
    }, 5000);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      resetFadeTimer();
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(!isPlaying);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextFrame();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevFrame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    resetFadeTimer();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [isPlaying, setIsPlaying, nextFrame, prevFrame, resetFadeTimer]);

  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height - 120, 600);
      setCanvasSize(Math.max(256, Math.floor(size / 32) * 32));
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!canvasRef.current || !currentSprite || !currentAnimation) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const frameSize = 32 * zoom;
      const offsetX = (canvas.width - frameSize) / 2;
      const offsetY = (canvas.height - frameSize) / 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let y = 0; y < canvas.height; y += CHECKER_SIZE) {
        for (let x = 0; x < canvas.width; x += CHECKER_SIZE) {
          const isAlternate = (Math.floor(y / CHECKER_SIZE) + Math.floor(x / CHECKER_SIZE)) % 2 === 0;
          ctx.fillStyle = isAlternate ? CHECKER_COLOR_1 : CHECKER_COLOR_2;
          ctx.fillRect(x, y, CHECKER_SIZE, CHECKER_SIZE);
        }
      }

      ctx.strokeStyle = GRID_COLOR;
      ctx.lineWidth = 1;
      for (let x = 0; x <= canvas.width; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y <= canvas.height; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
      }

      const animFrame = currentAnimation.frames[currentFrameIndex];
      if (animFrame) {
        spriteManager.drawFrame(ctx, currentSprite, animFrame.frameIndex, offsetX, offsetY, zoom);
      }
    };

    const animate = (time: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = time;
      }

      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      if (isPlaying && currentAnimation && currentAnimation.frames.length > 0) {
        frameTimerRef.current += deltaTime * playSpeed;
        const currentDuration = currentAnimation.frames[currentFrameIndex]?.duration || 100;

        if (frameTimerRef.current >= currentDuration) {
          frameTimerRef.current -= currentDuration;
          const nextIndex = (currentFrameIndex + 1) % currentAnimation.frames.length;
          setCurrentFrameIndex(nextIndex);
        }
      }

      draw();
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentSprite, currentAnimation, currentFrameIndex, isPlaying, playSpeed, zoom, setCurrentFrameIndex]);

  const handlePlayPause = () => {
    resetFadeTimer();
    setIsPlaying(!isPlaying);
  };

  const handlePrevFrame = () => {
    resetFadeTimer();
    setIsPlaying(false);
    prevFrame();
  };

  const handleNextFrame = () => {
    resetFadeTimer();
    setIsPlaying(false);
    nextFrame();
  };

  const totalFrames = currentAnimation?.frames.length || 0;
  const totalDuration = currentAnimation?.frames.reduce((sum, f) => sum + f.duration, 0) || 0;

  return (
    <div className="preview-container" ref={containerRef}>
      <div className="preview-toolbar">
        <div className="zoom-control">
          <span className="zoom-label">缩放</span>
          <input
            type="range"
            min="2"
            max="4"
            step="1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="zoom-slider"
          />
          <span className="zoom-value">{zoom}x</span>
        </div>
      </div>

      <div className="canvas-wrapper">
        {isLoading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            width={canvasSize}
            height={canvasSize}
            className="preview-canvas"
          />
        )}

        <div className={`shortcut-hint ${showShortcuts ? 'visible' : 'hidden'}`}>
          <span>空格：播放/暂停</span>
          <span>← →：单步前进/后退</span>
        </div>
      </div>

      <div className="playback-controls">
        <button
          className="btn-step"
          onClick={handlePrevFrame}
          title="上一帧"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="8,2 8,14 0,8" />
            <rect x="10" y="2" width="2" height="12" />
          </svg>
        </button>

        <button
          className={`btn-play ${isPlaying ? 'playing' : ''}`}
          onClick={handlePlayPause}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="2" width="3" height="12" />
              <rect x="10" y="2" width="3" height="12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <polygon points="3,2 14,8 3,14" />
            </svg>
          )}
        </button>

        <button
          className="btn-step"
          onClick={handleNextFrame}
          title="下一帧"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <polygon points="8,2 16,8 8,14" />
            <rect x="4" y="2" width="2" height="12" />
          </svg>
        </button>

        <div className="frame-info">
          <span className="frame-number">
            {totalFrames > 0 ? currentFrameIndex + 1 : 0} / {totalFrames}
          </span>
          <span className="total-duration">
            {(totalDuration / 1000).toFixed(2)}s
          </span>
        </div>

        <div className="speed-selector">
          <select
            value={playSpeed}
            onChange={(e) => setPlaySpeed(Number(e.target.value))}
            className="speed-select"
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
        </div>
      </div>
    </div>
  );
}
