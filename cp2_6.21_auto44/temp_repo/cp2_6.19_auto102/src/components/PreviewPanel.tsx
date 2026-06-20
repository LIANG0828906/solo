import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { VideoClip, Sticker, EditorAction, StickerType } from '../types';
import {
  renderClipToCanvas,
  renderTitleToCanvas,
  getStickerSVG,
  isClipActiveAtTime,
  isStickerActiveAtTime,
  getClipEffectiveDuration,
  getTotalDuration,
  formatTime,
} from '../utils/mediaUtils';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 500;

interface PreviewPanelProps {
  clips: VideoClip[];
  stickers: Sticker[];
  currentTime: number;
  selectedStickerId: string | null;
  dispatch: React.Dispatch<EditorAction>;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  clips,
  stickers,
  currentTime,
  selectedStickerId,
  dispatch,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const stickerImagesRef = useRef<Map<string, HTMLImageElement>>(new Map());

  useEffect(() => {
    const types: StickerType[] = ['star', 'heart', 'arrow', 'explosion', 'cloud'];
    types.forEach((type) => {
      if (!stickerImagesRef.current.has(type)) {
        const img = new Image();
        const svgStr = getStickerSVG(type);
        const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
        img.src = URL.createObjectURL(blob);
        stickerImagesRef.current.set(type, img);
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const activeClip = clips.find((c) => isClipActiveAtTime(c, currentTime));
    if (activeClip) {
      renderClipToCanvas(ctx, activeClip, CANVAS_WIDTH, CANVAS_HEIGHT);
      if (activeClip.title) {
        renderTitleToCanvas(ctx, activeClip.title, CANVAS_WIDTH, CANVAS_HEIGHT);
      }
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('将视频片段拖入时间线开始预览', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    }

    stickers.forEach((sticker) => {
      if (!isStickerActiveAtTime(sticker, currentTime)) return;
      const img = stickerImagesRef.current.get(sticker.type);
      if (!img) return;
      ctx.save();
      ctx.translate(sticker.x, sticker.y);
      ctx.rotate((sticker.rotation * Math.PI) / 180);
      ctx.scale(sticker.scale, sticker.scale);
      const size = 50;
      if (img.complete) {
        ctx.drawImage(img, -size / 2, -size / 2, size, size);
      }
      ctx.restore();
    });
  }, [clips, stickers, currentTime]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const totalDur = getTotalDuration(clips);
    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      dispatch({ type: 'SET_CURRENT_TIME', payload: currentTime + delta });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, currentTime, clips, dispatch]);

  useEffect(() => {
    const totalDur = Math.max(1, getTotalDuration(clips));
    if (currentTime >= totalDur) {
      setIsPlaying(false);
      dispatch({ type: 'SET_CURRENT_TIME', payload: 0 });
    }
  }, [currentTime, clips, dispatch]);

  const togglePlay = useCallback(() => {
    setIsPlaying((p) => !p);
    lastTimeRef.current = 0;
  }, []);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const totalDur = Math.max(1, getTotalDuration(clips));
    const val = parseFloat(e.target.value);
    dispatch({ type: 'SET_CURRENT_TIME', payload: Math.min(val, totalDur) });
  };

  const handleStickerMouseDown = (stickerId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dispatch({ type: 'SELECT_STICKER', payload: stickerId });
    const sticker = stickers.find((s) => s.id === stickerId);
    if (!sticker || !containerRef.current) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startStickerX = sticker.x;
    const startStickerY = sticker.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      dispatch({
        type: 'UPDATE_STICKER',
        payload: {
          ...sticker,
          x: Math.max(25, Math.min(CANVAS_WIDTH - 25, startStickerX + dx)),
          y: Math.max(25, Math.min(CANVAS_HEIGHT - 25, startStickerY + dy)),
        },
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleRotateMouseDown = (stickerId: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sticker = stickers.find((s) => s.id === stickerId);
    if (!sticker || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + sticker.x;
    const centerY = rect.top + sticker.y;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const startRotation = sticker.rotation;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      const deltaDeg = ((angle - startAngle) * 180) / Math.PI;
      dispatch({
        type: 'UPDATE_STICKER',
        payload: { ...sticker, rotation: startRotation + deltaDeg },
      });
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleStickerWheel = (stickerId: string) => (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sticker = stickers.find((s) => s.id === stickerId);
    if (!sticker) return;
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    dispatch({
      type: 'UPDATE_STICKER',
      payload: { ...sticker, scale: Math.max(0.3, Math.min(3, sticker.scale + delta)) },
    });
  };

  const handleCanvasClick = () => {
    dispatch({ type: 'SELECT_STICKER', payload: null });
    dispatch({ type: 'SELECT_CLIP', payload: null });
  };

  const totalDuration = Math.max(1, getTotalDuration(clips));

  return (
    <div className="preview-wrapper">
      <div className="preview-panel-container" ref={containerRef} onClick={handleCanvasClick}>
        <canvas
          ref={canvasRef}
          className="preview-canvas"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
        />
        <div className="sticker-layer">
          {stickers.map((sticker) => {
            if (!isStickerActiveAtTime(sticker, currentTime)) return null;
            const size = 50 * sticker.scale;
            return (
              <div
                key={sticker.id}
                className={`sticker-element ${selectedStickerId === sticker.id ? 'selected' : ''}`}
                style={{
                  left: sticker.x - size / 2,
                  top: sticker.y - size / 2,
                  width: size,
                  height: size,
                  transform: `rotate(${sticker.rotation}deg)`,
                }}
                onMouseDown={handleStickerMouseDown(sticker.id)}
                onWheel={handleStickerWheel(sticker.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  dispatch({ type: 'SELECT_STICKER', payload: sticker.id });
                }}
                dangerouslySetInnerHTML={{ __html: getStickerSVG(sticker.type) }}
              >
                {selectedStickerId === sticker.id && (
                  <div className="rotate-handle" onMouseDown={handleRotateMouseDown(sticker.id)}>
                    ↻
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <div className="controls-bar" onClick={(e) => e.stopPropagation()}>
          <button
            className={`play-btn ${isPlaying ? 'playing' : ''}`}
            onClick={togglePlay}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6,4 20,12 6,20" />
              </svg>
            )}
          </button>
          <span className="time-display">
            {formatTime(currentTime)} / {formatTime(totalDuration)}
          </span>
          <input
            type="range"
            className="playhead-slider"
            min={0}
            max={totalDuration}
            step={0.01}
            value={Math.min(currentTime, totalDuration)}
            onChange={handleSliderChange}
          />
        </div>
      </div>
    </div>
  );
};

export default PreviewPanel;
