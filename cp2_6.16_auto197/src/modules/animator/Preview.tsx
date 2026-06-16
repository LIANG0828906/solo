import React, { useRef, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Maximize2 } from 'lucide-react';
import { useSpriteStore } from '@/store/spriteStore';
import { drawImageDataToCanvas } from '@/utils/canvasUtils';
import './Preview.css';

const PREVIEW_SIZE = 256;

export const Preview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameAccumulatorRef = useRef<number>(0);

  const {
    frames,
    timeline,
    setPlaying,
    setCurrentFrameIndex,
  } = useSpriteStore();

  const currentFrameId = timeline.frameIds[timeline.currentFrameIndex];
  const currentFrame = frames.find((f) => f.id === currentFrameId) || null;

  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentFrame) {
      const scale = Math.min(
        PREVIEW_SIZE / currentFrame.width,
        PREVIEW_SIZE / currentFrame.height,
        8
      );
      const x = (PREVIEW_SIZE - currentFrame.width * scale) / 2;
      const y = (PREVIEW_SIZE - currentFrame.height * scale) / 2;
      drawImageDataToCanvas(ctx, currentFrame.imageData, x, y, scale);
    }

    ctx.strokeStyle = '#EF4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(1, 1, PREVIEW_SIZE - 2, PREVIEW_SIZE - 2);
    ctx.setLineDash([]);
  }, [currentFrame]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  useEffect(() => {
    if (!timeline.isPlaying || timeline.frameIds.length === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = (timestamp: number) => {
      if (lastFrameTimeRef.current === 0) {
        lastFrameTimeRef.current = timestamp;
      }

      const delta = timestamp - lastFrameTimeRef.current;
      lastFrameTimeRef.current = timestamp;
      frameAccumulatorRef.current += delta;

      const frameInterval = 1000 / timeline.fps;

      while (frameAccumulatorRef.current >= frameInterval) {
        frameAccumulatorRef.current -= frameInterval;

        setCurrentFrameIndex((prev) => {
          let next = prev + 1;
          if (next >= timeline.frameIds.length) {
            if (timeline.loop) {
              next = 0;
            } else {
              setPlaying(false);
              return prev;
            }
          }
          return next;
        });
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    lastFrameTimeRef.current = 0;
    frameAccumulatorRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [timeline.isPlaying, timeline.fps, timeline.frameIds.length, timeline.loop, setCurrentFrameIndex, setPlaying]);

  const handlePlayPause = () => {
    if (timeline.frameIds.length === 0) return;
    if (timeline.isPlaying) {
      setPlaying(false);
    } else {
      if (timeline.currentFrameIndex >= timeline.frameIds.length - 1) {
        setCurrentFrameIndex(0);
      }
      setPlaying(true);
    }
  };

  const handleReset = () => {
    setPlaying(false);
    setCurrentFrameIndex(0);
  };

  return (
    <div className="preview-panel">
      <div className="panel-header">
        <Maximize2 size={16} />
        <span>动画预览</span>
      </div>
      <div className="preview-content">
        <div className="preview-canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={PREVIEW_SIZE}
            height={PREVIEW_SIZE}
            className="preview-canvas"
          />
        </div>

        <div className="preview-info">
          <span className="frame-counter">
            Frame {timeline.frameIds.length > 0 ? timeline.currentFrameIndex + 1 : 0}/{timeline.frameIds.length}
          </span>
          {currentFrame && (
            <span className="frame-size">
              {currentFrame.width} x {currentFrame.height}
            </span>
          )}
        </div>

        <div className="preview-controls">
          <button
            className="control-btn play-btn"
            onClick={handlePlayPause}
            disabled={timeline.frameIds.length === 0}
          >
            {timeline.isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="control-btn"
            onClick={handleReset}
            disabled={timeline.frameIds.length === 0}
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
