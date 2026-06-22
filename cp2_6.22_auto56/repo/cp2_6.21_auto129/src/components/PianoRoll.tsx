import { useRef, useEffect, useState, useCallback } from 'react';
import { useStore, Note } from '@/store';
import './PianoRoll.css';

const GRID_COLS = 16;
const GRID_ROWS = 8;
const CELL_WIDTH = 48;
const CELL_HEIGHT = 36;
const PADDING_X = 70;
const PADDING_TOP = 30;
const TRACK_GAP = 20;
const NOTE_COLOR = '#90caf9';
const NOTE_PULSE_COLOR = '#bbdefb';

const PITCH_NAMES = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];

function lerpColor(color1: string, color2: string, t: number): string {
  const hex = (c: string) => parseInt(c, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export default function PianoRoll() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const currentProject = useStore((s) => s.currentProject);
  const selectedTrackId = useStore((s) => s.selectedTrackId);
  const playhead = useStore((s) => s.playhead);
  const pulseCells = useStore((s) => s.pulseCells);
  const addNote = useStore((s) => s.addNote);
  const removeNote = useStore((s) => s.removeNote);
  const addToast = useStore((s) => s.addToast);
  const addPulseCell = useStore((s) => s.addPulseCell);

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
            addPulseCell({ trackId: selectedTrackId, row, col, isAdding: false });
            addToast(`你从 ${tracks[trackIndex].name} 删除了音符`);
          } else {
            const newNote: Note = {
              id: Date.now().toString() + Math.random().toString(36).slice(2),
              trackId: selectedTrackId,
              row,
              col,
              createdAt: Date.now(),
            };
            addNote(newNote);
            addPulseCell({ trackId: selectedTrackId, row, col, isAdding: true });
            addToast(`你添加了音符到 ${tracks[trackIndex].name}`);
          }
          forceUpdate((n) => n + 1);
        }
      }
    },
    [selectedTrackId, currentProject, tracks, notes, getTrackOffset, addNote, removeNote, addToast, addPulseCell]
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
          ctx.fillStyle = '#6b7280';
          ctx.font = '11px "JetBrains Mono", monospace';
          ctx.textAlign = 'right';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            PITCH_NAMES[r],
            PADDING_X - 10,
            trackTop + r * CELL_HEIGHT + CELL_HEIGHT / 2
          );
        }

        const trackNotes = notes.filter((n) => n.trackId === track.id);
        const trackPulses = pulseCells.filter((p) => p.trackId === track.id);
        const now = Date.now();

        trackNotes.forEach((note) => {
          const age = now - note.createdAt;
          const scale = age < 200 ? age / 200 : 1;
          const animProgress = Math.min(1, scale);
          const easeScale = 1 - Math.pow(1 - animProgress, 3);
          const sizeScale = 0.2 + 0.8 * easeScale;

          const pulse = trackPulses.find(
            (p) => p.row === note.row && p.col === note.col
          );
          let noteColor = NOTE_COLOR;
          let extraScale = 1;
          if (pulse) {
            const pulseAge = now - pulse.clickedAt;
            const pulseProgress = Math.min(1, pulseAge / 200);
            if (pulse.isAdding) {
              noteColor = lerpColor(NOTE_PULSE_COLOR, NOTE_COLOR, pulseProgress);
              extraScale = 1 + 0.1 * (1 - pulseProgress);
            } else {
              noteColor = lerpColor(NOTE_PULSE_COLOR, NOTE_COLOR, pulseProgress);
              extraScale = 1 - 0.3 * pulseProgress;
            }
          }

          const cx = PADDING_X + note.col * CELL_WIDTH + CELL_WIDTH / 2;
          const cy = trackTop + note.row * CELL_HEIGHT + CELL_HEIGHT / 2;
          const w = (CELL_WIDTH - 4) * sizeScale * extraScale;
          const h = (CELL_HEIGHT - 4) * sizeScale * extraScale;
          const rx = cx - w / 2;
          const ry = cy - h / 2;
          const radius = 6;

          ctx.fillStyle = noteColor;
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

        trackPulses.forEach((pulse) => {
          const hasNote = trackNotes.some(
            (n) => n.row === pulse.row && n.col === pulse.col
          );
          if (!hasNote && !pulse.isAdding) {
            const pulseAge = now - pulse.clickedAt;
            const pulseProgress = Math.min(1, pulseAge / 200);
            const fadeAlpha = 1 - pulseProgress;
            const shrinkScale = 1 - 0.5 * pulseProgress;

            const cx = PADDING_X + pulse.col * CELL_WIDTH + CELL_WIDTH / 2;
            const cy = trackTop + pulse.row * CELL_HEIGHT + CELL_HEIGHT / 2;
            const w = (CELL_WIDTH - 4) * shrinkScale;
            const h = (CELL_HEIGHT - 4) * shrinkScale;
            const rx = cx - w / 2;
            const ry = cy - h / 2;
            const radius = 6;

            ctx.fillStyle = `rgba(187, 222, 251, ${fadeAlpha * 0.6})`;
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
          }
        });
      });

      const playheadX = PADDING_X + playhead * GRID_COLS * CELL_WIDTH;
      const playheadBgWidth = CELL_WIDTH * 0.9;
      const playheadBgX = playheadX - playheadBgWidth / 2;

      ctx.fillStyle = 'rgba(233, 69, 96, 0.08)';
      ctx.fillRect(playheadBgX, PADDING_TOP, playheadBgWidth, getTotalHeight() - PADDING_TOP);

      ctx.fillStyle = 'rgba(233, 69, 96, 0.4)';
      ctx.fillRect(playheadX - 1, PADDING_TOP, 3, getTotalHeight() - PADDING_TOP);

      ctx.strokeStyle = '#e94560';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(233, 69, 96, 0.6)';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(playheadX, PADDING_TOP);
      ctx.lineTo(playheadX, getTotalHeight());
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.shadowColor = 'transparent';

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [tracks, notes, selectedTrackId, playhead, pulseCells, getTrackOffset, getTotalWidth, getTotalHeight]);

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
