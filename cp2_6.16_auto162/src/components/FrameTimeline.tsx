import { useEffect, useRef } from 'react';
import { useAppStore } from '@/store';

const THUMB_WIDTH = 80;
const THUMB_HEIGHT = 45;
const THUMB_GAP = 8;

export function FrameTimeline() {
  const { frames, currentFrameIndex, setCurrentFrameIndex } = useAppStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollLeftRef = useRef(0);
  const rafRef = useRef<number>(0);

  const render = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    render.current = () => {
      if (frames.length === 0) return;

      const containerWidth = container.clientWidth;
      const totalWidth = frames.length * (THUMB_WIDTH + THUMB_GAP);
      canvas.width = containerWidth;
      canvas.height = THUMB_HEIGHT + 20;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const startX = -scrollLeftRef.current;
      const startIdx = Math.max(0, Math.floor(scrollLeftRef.current / (THUMB_WIDTH + THUMB_GAP)) - 1);
      const endIdx = Math.min(
        frames.length,
        startIdx + Math.ceil(containerWidth / (THUMB_WIDTH + THUMB_GAP)) + 3,
      );

      for (let i = startIdx; i < endIdx; i++) {
        const frame = frames[i];
        const x = startX + i * (THUMB_WIDTH + THUMB_GAP);

        if (frame) {
          const offCanvas = document.createElement('canvas');
          offCanvas.width = frame.imageData.width;
          offCanvas.height = frame.imageData.height;
          const offCtx = offCanvas.getContext('2d');
          if (offCtx) {
            offCtx.putImageData(frame.imageData, 0, 0);
            ctx.drawImage(offCanvas, x, 0, THUMB_WIDTH, THUMB_HEIGHT);
          }
        } else {
          ctx.fillStyle = '#1E1E1E';
          ctx.fillRect(x, 0, THUMB_WIDTH, THUMB_HEIGHT);
        }

        if (i === currentFrameIndex) {
          ctx.strokeStyle = '#00BCD4';
          ctx.lineWidth = 3;
          ctx.strokeRect(x - 1.5, -1.5, THUMB_WIDTH + 3, THUMB_HEIGHT + 3);
        } else {
          ctx.strokeStyle = '#333333';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 0.5, 0.5, THUMB_WIDTH - 1, THUMB_HEIGHT - 1);
        }

        ctx.fillStyle = i === currentFrameIndex ? '#00BCD4' : '#666666';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(i + 1), x + THUMB_WIDTH / 2, THUMB_HEIGHT + 14);
      }
    };

    render.current();
  }, [frames, currentFrameIndex]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onScroll = () => {
      scrollLeftRef.current = container.scrollLeft;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(render.current);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || frames.length === 0) return;

    const targetX = currentFrameIndex * (THUMB_WIDTH + THUMB_GAP);
    const containerWidth = container.clientWidth;

    if (targetX < container.scrollLeft || targetX + THUMB_WIDTH > container.scrollLeft + containerWidth) {
      container.scrollTo({
        left: Math.max(0, targetX - containerWidth / 2 + THUMB_WIDTH / 2),
        behavior: 'smooth',
      });
    }
  }, [currentFrameIndex, frames.length]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 1 : -1;
    setCurrentFrameIndex(currentFrameIndex + delta);
  };

  const handleClick = (e: React.MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + container.scrollLeft;
    const idx = Math.floor(x / (THUMB_WIDTH + THUMB_GAP));
    if (idx >= 0 && idx < frames.length) {
      setCurrentFrameIndex(idx);
    }
  };

  if (frames.length === 0) return null;

  return (
    <div
      className="glass rounded-2xl p-4"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
          帧轨道
        </span>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {currentFrameIndex + 1} / {frames.length}
        </span>
      </div>
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-hidden"
        style={{ height: THUMB_HEIGHT + 28 }}
        onWheel={handleWheel}
        onClick={handleClick}
      >
        <canvas
          ref={canvasRef}
          className="block"
          style={{
            width: frames.length * (THUMB_WIDTH + THUMB_GAP),
            height: THUMB_HEIGHT + 20,
            cursor: 'pointer',
          }}
        />
      </div>
    </div>
  );
}
