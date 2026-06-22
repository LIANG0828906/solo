import { useRef, useEffect, useCallback } from 'react';
import type { Note } from './types';
import { getNoteName } from './types';

interface ScoreDisplayProps {
  notes: Note[];
}

const NOTE_SPACING = 12;
const PIXELS_PER_MS = 0.15;
const WAVE_COLOR = '#10B981';
const BG_COLOR = '#0F172A';
const GRID_COLOR = '#334155';
const TEXT_COLOR = '#E2E8F0';

export default function ScoreDisplay({ notes }: ScoreDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const scrollOffsetRef = useRef<number>(0);
  const lastNotesLengthRef = useRef<number>(0);
  const staticCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const getYForPitch = useCallback((pitch: number, height: number) => {
    const padding = NOTE_SPACING * 1.5;
    const totalHeight = height - padding * 2;
    return height - padding - (pitch * NOTE_SPACING);
    void totalHeight;
  }, []);

  const drawStaticElements = useCallback((width: number, height: number) => {
    if (!staticCanvasRef.current) {
      staticCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = staticCanvasRef.current;
    offscreen.width = width;
    offscreen.height = height;
    const ctx = offscreen.getContext('2d')!;

    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = GRID_COLOR;
    ctx.lineWidth = 1;
    for (let i = 0; i < 12; i++) {
      const y = getYForPitch(i, height);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillStyle = 'rgba(226, 232, 240, 0.4)';
      ctx.font = '10px sans-serif';
      ctx.fillText(getNoteName(i), 8, y + 3);
    }
  }, [getYForPitch]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width;
    const height = rect.height;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      drawStaticElements(width, height);
    }

    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (staticCanvasRef.current) {
      ctx.drawImage(staticCanvasRef.current, 0, 0);
    }

    if (notes.length === 0) {
      animationFrameRef.current = requestAnimationFrame(draw);
      return;
    }

    const startTime = notes[0].timestamp;
    const endTime = notes[notes.length - 1].timestamp;
    const totalDuration = endTime - startTime;
    const contentWidth = totalDuration * PIXELS_PER_MS + 100;

    if (contentWidth > width - 60) {
      const targetOffset = contentWidth - (width - 60);
      scrollOffsetRef.current += (targetOffset - scrollOffsetRef.current) * 0.1;
    } else {
      scrollOffsetRef.current = 0;
    }

    const offset = scrollOffsetRef.current;

    if (notes.length > 1) {
      ctx.strokeStyle = WAVE_COLOR;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();

      let started = false;
      for (let i = 0; i < notes.length; i++) {
        const note = notes[i];
        const x = 50 + (note.timestamp - startTime) * PIXELS_PER_MS - offset;
        const y = getYForPitch(note.pitch, height);

        if (x < -20) continue;
        if (x > width + 20) break;

        if (!started) {
          ctx.moveTo(x, y);
          started = true;
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
    }

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const x = 50 + (note.timestamp - startTime) * PIXELS_PER_MS - offset;

      if (x < -20) continue;
      if (x > width + 20) break;

      const y = getYForPitch(note.pitch, height);
      const isNew = i >= lastNotesLengthRef.current;
      const alpha = isNew ? Math.min(1, (performance.now() - note.timestamp) / 200) : 1;

      ctx.strokeStyle = `rgba(16, 185, 129, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x, y - 6);
      ctx.lineTo(x, y + 6);
      ctx.stroke();

      ctx.fillStyle = `rgba(16, 185, 129, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      if (isNew) {
        const translateY = Math.max(0, (1 - (performance.now() - note.timestamp) / 300) * 20);
        ctx.fillStyle = `rgba(226, 232, 240, ${Math.min(1, (performance.now() - note.timestamp) / 200)})`;
        ctx.font = '10px sans-serif';
        ctx.fillText(getNoteName(note.pitch), x + 6, y - 10 - translateY);
      }
    }

    lastNotesLengthRef.current = notes.length;

    animationFrameRef.current = requestAnimationFrame(draw);
  }, [notes, getYForPitch, drawStaticElements]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [draw]);

  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        canvasRef.current.width = rect.width * dpr;
        canvasRef.current.height = rect.height * dpr;
        drawStaticElements(rect.width, rect.height);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawStaticElements]);

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: BG_COLOR,
        borderRadius: '12px',
        margin: '16px',
        marginTop: '8px',
        minHeight: 0,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          color: TEXT_COLOR,
          fontSize: '14px',
          padding: '12px 16px',
          borderBottom: `1px solid ${GRID_COLOR}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ opacity: 0.8 }}>乐谱波形</span>
        <span style={{ fontSize: '12px', opacity: 0.6 }}>
          已记录 {notes.length} 个音符
        </span>
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
        {notes.length === 0 && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              color: TEXT_COLOR,
              opacity: 0.5,
              fontSize: '14px',
              pointerEvents: 'none'
            }}
          >
            开始演奏以记录乐谱
          </div>
        )}
      </div>
    </div>
  );
}
