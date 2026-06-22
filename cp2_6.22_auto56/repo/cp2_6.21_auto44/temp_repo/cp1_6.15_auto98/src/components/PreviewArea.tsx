import { useRef, useEffect, useCallback, useState } from 'react';
import { useMediaContext } from '@/context/MediaContext';
import { useVideoExporter } from '@/hooks/useVideoExporter';
import { Play, Pause, Maximize2 } from 'lucide-react';

export default function PreviewArea() {
  const { state } = useMediaContext();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformAnimRef = useRef<number>(0);
  const { playPreview, stopPreview, drawWaveform, isPreviewPlaying } = useVideoExporter();
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 450 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        const height = width * (9 / 16);
        setCanvasSize({ width: Math.floor(width), height: Math.floor(height) });
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || state.photos.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (state.photos.length > 0 && !isPreviewPlaying) {
      const img = new Image();
      img.onload = () => {
        const w = canvas.width;
        const h = canvas.height;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        const canvasRatio = w / h;
        let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
        if (imgRatio > canvasRatio) {
          sw = img.naturalHeight * canvasRatio;
          sx = (img.naturalWidth - sw) / 2;
        } else {
          sh = img.naturalWidth / canvasRatio;
          sy = (img.naturalHeight - sh) / 2;
        }
        ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
        if (state.overlayColor) {
          ctx.save();
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = state.overlayColor;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      };
      img.src = state.photos[0].url;
    }
  }, [state.photos, state.overlayColor, isPreviewPlaying, canvasSize]);

  useEffect(() => {
    if (!isPreviewPlaying) {
      if (waveformAnimRef.current) {
        cancelAnimationFrame(waveformAnimRef.current);
        waveformAnimRef.current = 0;
      }
      const canvas = waveformRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      return;
    }

    let lastWaveformTime = 0;
    const WAVEFORM_INTERVAL = 1000 / 30;

    function animateWaveform(now: number) {
      if (now - lastWaveformTime >= WAVEFORM_INTERVAL) {
        const canvas = waveformRef.current;
        if (canvas) drawWaveform(canvas);
        lastWaveformTime = now;
      }
      waveformAnimRef.current = requestAnimationFrame(animateWaveform);
    }

    waveformAnimRef.current = requestAnimationFrame(animateWaveform);
    return () => {
      if (waveformAnimRef.current) {
        cancelAnimationFrame(waveformAnimRef.current);
        waveformAnimRef.current = 0;
      }
    };
  }, [isPreviewPlaying, drawWaveform]);

  const handlePlayPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isPreviewPlaying) {
      stopPreview();
      return;
    }

    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
    playPreview(canvas);
  }, [isPreviewPlaying, playPreview, stopPreview, canvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvasSize.width;
    canvas.height = canvasSize.height;
  }, [canvasSize]);

  return (
    <div className="preview-area" ref={containerRef}>
      <div className="preview-canvas-wrapper">
        <canvas
          ref={canvasRef}
          className="preview-canvas"
          width={canvasSize.width}
          height={canvasSize.height}
        />

        <canvas
          ref={waveformRef}
          className="waveform-canvas"
          width={180}
          height={60}
        />

        {state.photos.length === 0 && (
          <div className="preview-placeholder">
            <Maximize2 size={48} strokeWidth={1} />
            <p>上传照片后预览动态拼贴</p>
          </div>
        )}

        <button
          className="preview-play-btn"
          onClick={handlePlayPreview}
          disabled={state.photos.length < 2}
        >
          {isPreviewPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
      </div>
    </div>
  );
}
