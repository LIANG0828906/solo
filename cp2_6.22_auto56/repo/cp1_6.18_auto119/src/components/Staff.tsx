import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useAppStore } from '../stores/appStore';
import { snapToStaff, yToNoteName, playNote } from '../engine/theoryEngine';
import { NOTE_DURATIONS, NoteDuration } from '../data/noteData';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 200;
const LINE_SPACING = 16;
const TOP_PADDING = 40;
const LINE_COLOR = '#6B7280';
const LINE_WIDTH = 2;
const STAFF_LINES = 5;

export const Staff: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { selectedDuration, placedNotes, setNoteAction, removePlacedNote, setSelectedDuration } = useAppStore();
  const [dragOver, setDragOver] = useState<{ x: number; y: number } | null>(null);
  const [animNotes, setAnimNotes] = useState<Record<string, number>>({});

  const drawStaff = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      for (let i = 0; i < STAFF_LINES; i++) {
        const y = TOP_PADDING + i * LINE_SPACING;
        ctx.beginPath();
        ctx.strokeStyle = LINE_COLOR;
        ctx.lineWidth = LINE_WIDTH;
        ctx.moveTo(20, y);
        ctx.lineTo(CANVAS_WIDTH - 20, y);
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.strokeStyle = LINE_COLOR;
      ctx.lineWidth = 3;
      ctx.moveTo(20, TOP_PADDING);
      ctx.lineTo(20, TOP_PADDING + (STAFF_LINES - 1) * LINE_SPACING);
      ctx.stroke();

      const trebleX = 30;
      const topY = TOP_PADDING - 5;
      const bottomY = TOP_PADDING + (STAFF_LINES - 1) * LINE_SPACING + 5;
      ctx.beginPath();
      ctx.strokeStyle = '#9CA3AF';
      ctx.lineWidth = 2;
      ctx.moveTo(trebleX + 8, topY);
      ctx.lineTo(trebleX + 8, bottomY);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(trebleX + 8, topY, 4, 0, Math.PI * 2);
      ctx.fillStyle = '#9CA3AF';
      ctx.fill();

      if (dragOver) {
        const snappedY = snapToStaff(dragOver.y, LINE_SPACING, TOP_PADDING);
        ctx.beginPath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
        ctx.arc(dragOver.x, snappedY, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      placedNotes.forEach((note) => {
        const scale = animNotes[note.id] ?? 1;
        ctx.save();
        ctx.translate(note.x, note.y);
        ctx.scale(scale, scale);

        ctx.beginPath();
        ctx.fillStyle = '#F9FAFB';
        ctx.strokeStyle = '#F9FAFB';
        ctx.lineWidth = 2;

        ctx.ellipse(0, 0, 7, 5, -0.2, 0, Math.PI * 2);
        ctx.fill();

        if (note.duration !== 'whole') {
          ctx.beginPath();
          ctx.strokeStyle = '#F9FAFB';
          ctx.lineWidth = 2;
          ctx.moveTo(7, 0);
          ctx.lineTo(7, -30);
          ctx.stroke();
        }

        if (note.duration === 'eighth') {
          ctx.beginPath();
          ctx.strokeStyle = '#F9FAFB';
          ctx.lineWidth = 2;
          ctx.moveTo(7, -30);
          ctx.quadraticCurveTo(14, -22, 10, -14);
          ctx.stroke();
        }

        if (note.duration === 'whole') {
          ctx.beginPath();
          ctx.strokeStyle = '#F9FAFB';
          ctx.lineWidth = 1.5;
          ctx.ellipse(-2, 0, 9, 3, 0, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.restore();
      });
    },
    [placedNotes, dragOver, animNotes]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrame: number;
    const render = () => {
      drawStaff(ctx);
      animFrame = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(animFrame);
  }, [drawStaff]);

  useEffect(() => {
    const newAnims: Record<string, number> = {};
    placedNotes.forEach((note) => {
      if (!(note.id in animNotes)) {
        newAnims[note.id] = 0.3;
      }
    });
    if (Object.keys(newAnims).length > 0) {
      setAnimNotes((prev) => ({ ...prev, ...newAnims }));
      Object.keys(newAnims).forEach((id) => {
        let frame = 0;
        const animate = () => {
          frame++;
          const progress = Math.min(frame / 10, 1);
          const scale = 0.3 + 0.7 * progress + (progress < 1 ? Math.sin(progress * Math.PI) * 0.15 : 0);
          setAnimNotes((prev) => ({ ...prev, [id]: scale }));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      });
    }
  }, [placedNotes.length]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const snappedY = snapToStaff(y, LINE_SPACING, TOP_PADDING);
    const noteName = yToNoteName(snappedY, LINE_SPACING, TOP_PADDING);
    setNoteAction(noteName, x, snappedY);
  };

  const handleCanvasDragOver = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    setDragOver({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleCanvasDrop = (e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const snappedY = snapToStaff(y, LINE_SPACING, TOP_PADDING);
    const noteName = yToNoteName(snappedY, LINE_SPACING, TOP_PADDING);
    setNoteAction(noteName, x, snappedY);
    setDragOver(null);
  };

  const handleCanvasDragLeave = () => setDragOver(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <h2 style={{ color: '#F9FAFB', fontSize: '18px', fontWeight: 600, letterSpacing: '0.5px' }}>
        🎼 五线谱练习区
      </h2>
      <div
        style={{
          background: '#1F2937',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onClick={handleCanvasClick}
          onDragOver={handleCanvasDragOver}
          onDrop={handleCanvasDrop}
          onDragLeave={handleCanvasDragLeave}
          style={{
            cursor: 'crosshair',
            borderRadius: '8px',
            display: 'block',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {NOTE_DURATIONS.map((nd) => (
          <button
            key={nd.type}
            onClick={() => setSelectedDuration(nd.type as NoteDuration)}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              border: 'none',
              background: selectedDuration === nd.type ? '#3B82F6' : '#E5E7EB',
              color: selectedDuration === nd.type ? '#FFFFFF' : '#111827',
              fontSize: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: 'scale(1)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            title={nd.label}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('noteType', nd.type);
              e.dataTransfer.setData('duration', nd.type);
            }}
          >
            {nd.symbol}
          </button>
        ))}
        <button
          onClick={() => useAppStore.getState().clearPlacedNotes()}
          style={{
            marginLeft: '12px',
            padding: '6px 14px',
            borderRadius: '8px',
            border: '1px solid #4B5563',
            background: '#374151',
            color: '#9CA3AF',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#4B5563')}
          onMouseLeave={(e) => (e.currentTarget.style.background = '#374151')}
        >
          清空
        </button>
      </div>
      <p style={{ color: '#6B7280', fontSize: '12px' }}>
        选择音符时值后点击五线谱放置，或拖拽音符图标到谱面上
      </p>
    </div>
  );
};
