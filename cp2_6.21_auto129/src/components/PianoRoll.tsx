import { useRef, useEffect, useState, useCallback } from 'react';
import { useStore, Note } from '@/store';
import './PianoRoll.css';

const GRID_COLS = 16;
const GRID_ROWS = 8;
const CELL_WIDTH = 48;
const CELL_HEIGHT = 36;
const PADDING_X = 60;
const PADDING_TOP = 30;
const TRACK_GAP = 20;
const NOTE_COLOR = '#90caf9';

export default function PianoRoll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentProject = useStore((s) => s.currentProject);
  const selectedTrackId = useStore((s) => s.selectedTrackId);
  const playhead = useStore((s) => s.playhead);
  const addNote = useStore((s) => s.addNote);
  const removeNote = useStore((s) => s.removeNote);
  const addToast = useStore((s) => s.addToast);

  const [, forceUpdate] = useState(0);
  const animationRef = useRef<number>(0);

  const tracks = currentProject?.tracks || [];
  const notes = currentProject?.notes || [];

  const getTrackOffset = useCallback(
    (trackIndex: number) => {
      return PADDING_TOP + trackIndex * (GRID_ROWS * CELL_HEIGHT + TRACK_GAP);
    },
    []
  );

  const getTotalHeight = useCallback(() => {
    return PADDING_TOP + tracks.length * (GRID_ROWS * CELL_HEIGHT + TRACK_GAP) + 20;
  }, [tracks.length]);

  const getTotalWidth = useCallback(() => {
    return PADDING_X + GRID_COLS * CELL_WIDTH + 20;
  }, []);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!selectedTrackId || !currentProject) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      const trackIndex = tracks.findIndex((t) => t.id === selectedTrackId);
      if (trackIndex < 0) return;

      const trackTop = getTrackOffset(trackIndex);
      const trackBottom = trackTop + GRID_ROWS * CELL_HEIGHT;

      if (y >= trackTop && y <= trackBottom && x >= PADDING_X) {
        const col = Math.floor((x - PADDING_X) / CELL_WIDTH);
        const row = Math.floor((y - trackTop) / CELL_HEIGHT);

        if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
          const existingNote = notes.find(
            (n) =>
              n.trackId === selectedTrackId && n.row === row && n.col === col
          );

          if (existingNote) {
            removeNote(existingNote.id);
          } else {
            const newNote: Note = {
              id: Date.now().toString() + Math.random().toString(36).slice(2),
              trackId: selectedTrackId,
              row,
              col,
              createdAt: Date.now(),
            };
            addNote(newNote);
            addToast(`你添加了音符到 ${tracks[trackIndex].name}`);
          }
          forceUpdate((n) => n + 1);
        }
      }
    },
    [selectedTrackId, currentProject, tracks, notes, getTrackOffset, addNote, removeNote, addToast]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const totalWidth = getTotalWidth();
      const totalHeight = getTotalHeight();

      canvas.width = totalWidth * dpr;
      canvas.height = totalHeight * dpr;
      canvas.style.width = totalWidth + 'px';
      canvas.style.height = totalHeight + 'px';
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#16213e';
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      tracks.forEach((track, trackIndex) => {
        const trackTop = getTrackOffset(trackIndex);
        const isSelected = track.id === selectedTrackId;

        if (isSelected) {
          ctx.strokeStyle = '#e94560';
          ctx.lineWidth = 2;
          ctx.strokeRect(
            PADDING_X - 2,
            trackTop - 2,
            GRID_COLS * CELL_WIDTH + 4,
            GRID_ROWS * CELL_HEIGHT + 4
          );
        }

        for (let r = 0; r <= GRID_ROWS; r++) {
          ctx.beginPath();
          ctx.strokeStyle = r === 0 || r === GRID_ROWS ? '#3a3a5e' : '#2a2a4e';
          ctx.lineWidth = r === 0 || r === GRID_ROWS ? 1 : 0.5;
          ctx.moveTo(PADDING_X, trackTop + r * CELL_HEIGHT);
          ctx.lineTo(PADDING_X + GRID_COLS * CELL_WIDTH, trackTop + r * CELL_HEIGHT);
          ctx.stroke();
        }

        for (let c = 0; c <= GRID_COLS; c++) {
          ctx.beginPath();
          ctx.strokeStyle = c === 0 || c === GRID_COLS ? '#3a3a5e' : c % 4 === 0 ? '#3a3a5e' : '#2a2a4e';
          ctx.lineWidth = c === 0 || c === GRID_COLS || c % 4 === 0 ? 1 : 0.5;
          ctx.moveTo(PADDING_X + c * CELL_WIDTH, trackTop);
          ctx.lineTo(PADDING_X + c * CELL_WIDTH, trackTop + GRID_ROWS * CELL_HEIGHT);
          ctx.stroke();
        }

        for (let r = 0; r < GRID_ROWS; r++) {
          ctx.fillStyle = '#888';
          ctx.font = '10px sans-serif';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            (GRID_ROWS - r).toString(),
            PADDING_X - 8,
            trackTop + r * CELL_HEIGHT + CELL_HEIGHT / 2
          );
        }

        const trackNotes = notes.filter((n) => n.trackId === track.id);
        const now = Date.now();

        trackNotes.forEach((note) => {
          const age = now - note.createdAt;
          const scale = age < 200 ? age / 200 : 1;
          const animProgress = Math.min(1, scale);
          const easeScale = 1 - Math.pow(1 - animProgress, 3);
          const sizeScale = 0.2 + 0.8 * easeScale;

          const cx = PADDING_X + note.col * CELL_WIDTH + CELL_WIDTH / 2;
          const cy = trackTop + note.row * CELL_HEIGHT + CELL_HEIGHT / 2;
          const w = (CELL_WIDTH - 4) * sizeScale;
          const h = (CELL_HEIGHT - 4) * sizeScale;
          const rx = cx - w / 2;
          const ry = cy - h / 2;
          const radius = 6;

          ctx.fillStyle = NOTE_COLOR;
          ctx.beginPath();
          if (w > 2 * radius && h > 2 * radius) {
            ctx.moveTo(rx + radius, ry);
            ctx.lineTo(rx + w - radius, ry);
            ctx.quadraticCurveTo(rx + w, ry, rx + w, ry + radius);
            ctx.lineTo(rx + w, ry + h - radius);
            ctx.quadraticCurveTo(rx + w, ry + h, rx + w - radius, ry + h);
            ctx.lineTo(rx + radius, ry + h);
            ctx.quadraticCurveTo(rx, ry + h, rx, ry + h - radius);
            ctx.lineTo(rx, ry + radius);
            ctx.quadraticCurveTo(rx, ry, rx + radius, ry);
          } else {
            ctx.rect(rx, ry, w, h);
          }
          ctx.closePath();
          ctx.fill();

          ctx.shadowColor = 'rgba(0,0,0,0.4)';
          ctx.shadowBlur = 4;
          ctx.shadowOffsetX = 1;
          ctx.shadowOffsetY = 1;
          ctx.fill();
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
        });
      });

      const playheadX = PADDING_X + playhead * GRID_COLS * CELL_WIDTH;
      ctx.fillStyle = 'rgba(233, 69, 96, 0.3)';
      ctx.fillRect(playheadX, 0, 2, getTotalHeight());
      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(playheadX, 0);
      ctx.lineTo(playheadX, getTotalHeight());
      ctx.stroke();

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [tracks, notes, selectedTrackId, playhead, getTrackOffset, getTotalWidth, getTotalHeight]);

  return (
    <div className="piano-roll-wrapper">
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="piano-roll-canvas"
      />
    </div>
  );
}
